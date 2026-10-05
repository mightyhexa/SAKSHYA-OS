import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

dotenv.config();

import { serverDb, checkFirestoreConnection } from './server/firebaseServer';
import {
  COOKIE_NAME,
  signSession,
  authMiddleware,
  requireAuth,
  requireRole,
} from './server/auth';
import {
  DEMO_PERSONAS,
  DEMO_CASES,
  seedFirestoreDatabase,
} from './server/seedData';
import { postCurrentLedgerHead } from './server/witnessService';
import { runCryptoSelfTest, decryptEnvelope, sha256 } from './server/crypto';
import { defaultStorageAdapter } from './server/storageAdapter';
import { executeUploadPipeline, PipelineStepEvent } from './server/uploadPipeline';
import { generateDemoPackItems } from './server/demoPack';
import multer from 'multer';
import { z } from 'zod';
import { CaseRecord, Role } from './src/types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB cap per PRD Section 6
});

const uploadSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  type: z.string().min(1, 'Document type is required'),
  confidentiality: z.enum(['PUBLIC', 'RESTRICTED', 'CONFIDENTIAL', 'SECRET']),
  title: z.string().optional(),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware);

// --- API Endpoints ---

// 1. Health check & Env Secret Verification (never returns secret values)
app.get('/api/health', async (req, res) => {
  const fsStatus = await checkFirestoreConnection();

  const presentSecrets = {
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
    VAULT_MASTER_KEY: Boolean(process.env.VAULT_MASTER_KEY && process.env.VAULT_MASTER_KEY.trim().length > 0),
    SESSION_SECRET: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length > 0),
    LEDGER_SEAL_SECRET: Boolean(process.env.LEDGER_SEAL_SECRET && process.env.LEDGER_SEAL_SECRET.trim().length > 0),
    GITHUB_TOKEN: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim().length > 0),
    WITNESS_REPO: Boolean(process.env.WITNESS_REPO && process.env.WITNESS_REPO.trim().length > 0),
  };

  res.json({
    status: fsStatus.connected ? 'ok' : 'degraded',
    app: 'SAKSHYA OS',
    version: '1.0.0-SIH26190',
    firestore: fsStatus.connected ? 'connected' : 'error',
    firestoreDetails: fsStatus.error ? fsStatus.error : undefined,
    secrets: presentSecrets,
    timestamp: new Date().toISOString(),
  });
});

// 2. Demo Personas
app.get('/api/personas', (req, res) => {
  res.json({ personas: DEMO_PERSONAS });
});

// 3. Authentication (Mock Officer ID + 6-digit OTP -> Signed Session Cookie)
app.post('/api/auth/login', async (req, res) => {
  const { personaId, officerId, otp } = req.body;

  if (!officerId) {
    return res.status(400).json({ error: 'Officer ID is required.' });
  }

  // PRD Stage 1: accept any 6 digits for OTP
  if (!otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'Valid 6-digit OTP code is required (e.g. 123456).' });
  }

  const normalizedId = officerId.trim().toUpperCase();
  const persona = DEMO_PERSONAS.find(
    (p) => p.officerId.toUpperCase() === normalizedId || (personaId && p.id === personaId)
  );

  if (!persona) {
    return res.status(404).json({
      error: 'Officer persona not recognized in SAKSHYA registry. Select one of the 5 demo roles.',
    });
  }

  const sessionUser = {
    id: persona.id,
    name: persona.name,
    officerId: persona.officerId,
    role: persona.role,
    roleTitle: persona.roleTitle,
    station: persona.station,
    jurisdiction: persona.jurisdiction,
    avatar: persona.avatar,
  };

  const token = signSession(sessionUser);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  return res.json({
    success: true,
    user: sessionUser,
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.user) {
    const fullPersona = DEMO_PERSONAS.find((p) => p.id === req.user?.id);
    return res.json({
      authenticated: true,
      user: {
        ...req.user,
        allowedActions: fullPersona?.allowedActions || [],
        description: fullPersona?.description || '',
      },
    });
  }
  return res.json({ authenticated: false, user: null });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ success: true });
});

// 4. Admin Seed Endpoint (Idempotent)
app.post('/api/admin/seed', async (req, res) => {
  try {
    const result = await seedFirestoreDatabase(req.body.force === true);
    res.json({ success: true, message: 'Firestore demo database seeded successfully.', ...result });
  } catch (error: any) {
    console.error('Database seed error:', error);
    res.status(500).json({ error: 'Seed failed', details: error?.message || String(error) });
  }
});

// 5. Cases List (Reads from Firestore)
app.get('/api/cases', async (req, res) => {
  try {
    const snapshot = await getDocs(collection(serverDb, 'cases'));
    if (snapshot.empty) {
      // Auto-seed if empty
      await seedFirestoreDatabase();
      return res.json({ cases: DEMO_CASES });
    }
    const cases: CaseRecord[] = [];
    snapshot.forEach((docSnap) => {
      cases.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    // Sort by registration date descending
    cases.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
    res.json({ cases });
  } catch (err: any) {
    console.warn('Failed reading cases from Firestore, fallback to memory:', err?.message);
    res.json({ cases: DEMO_CASES });
  }
});

// 6. Dashboard Stats (Reads real Firestore data)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const casesSnap = await getDocs(collection(serverDb, 'cases'));
    let docCount = 0;
    try {
      const docsSnap = await getDocs(collection(serverDb, 'documents'));
      docCount = docsSnap.size;
    } catch {
      docCount = 0;
    }

    let ledgerCount = 0;
    try {
      const ledgerSnap = await getDocs(collection(serverDb, 'ledger'));
      ledgerCount = ledgerSnap.size;
    } catch {
      ledgerCount = 0;
    }

    res.json({
      totalCases: casesSnap.size || DEMO_CASES.length,
      totalDocuments: docCount,
      ledgerBlocks: ledgerCount,
      integrityStatus: 'VERIFIED',
      lastBlockIndex: ledgerCount > 0 ? ledgerCount - 1 : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({
      totalCases: DEMO_CASES.length,
      totalDocuments: 0,
      ledgerBlocks: 0,
      integrityStatus: 'VERIFIED',
      lastBlockIndex: 0,
      timestamp: new Date().toISOString(),
    });
  }
});

// 7. System Settings
app.get('/api/settings', async (req, res) => {
  try {
    const docRef = doc(serverDb, 'settings', 'system_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return res.json(snap.data());
    }
  } catch {}
  res.json({
    chunkSizeMb: 16,
    enableDemoChunks: false,
    environment: 'SIH26190-PROTOTYPE',
  });
});

app.post('/api/settings', async (req, res) => {
  const { chunkSizeMb, enableDemoChunks } = req.body;
  try {
    const docRef = doc(serverDb, 'settings', 'system_config');
    await updateDoc(docRef, {
      chunkSizeMb: chunkSizeMb ?? 16,
      enableDemoChunks: Boolean(enableDemoChunks),
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, chunkSizeMb, enableDemoChunks });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings', details: err?.message });
  }
});

// 8. Protected test route to verify requireRole middleware
app.get('/api/admin/audit-only-check', requireRole(['AUDITOR_ADMIN']), (req, res) => {
  res.json({
    message: 'Authorized: You have accessed the privileged Auditor/Admin inspection channel.',
    actor: req.user,
  });
});

// 9. Witness Nodes & External Witness Repository (PRD FR9 & Section 8)
app.post('/api/witness/post-head', async (req, res) => {
  try {
    const result = await postCurrentLedgerHead();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Witness operation failed',
      details: err?.message || String(err),
    });
  }
});

// 10. Cryptographic Self-Test Endpoint (PRD FR14 & Stage 2)
app.get('/api/selftest/crypto', (req, res) => {
  const result = runCryptoSelfTest();
  res.json(result);
});

// 11. Document Upload (7-Step Pipeline with real timings & SSE / JSON support)
app.post(
  '/api/documents/upload',
  upload.single('file'),
  requireRole(['IO', 'FORENSIC_ANALYST']),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No evidence file payload uploaded.' });
    }

    const validation = uploadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: validation.error.format(),
      });
    }

    const { caseId, type, confidentiality, title } = validation.data;
    const isSse = req.headers.accept?.includes('text/event-stream');

    if (isSse) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write('\n');
    }

    try {
      const result = await executeUploadPipeline({
        filename: req.file.originalname,
        buffer: req.file.buffer,
        caseId,
        type,
        confidentiality,
        title,
        user: req.user!,
        onStepProgress: (event) => {
          if (isSse) {
            res.write(`event: step\ndata: ${JSON.stringify(event)}\n\n`);
          }
        },
      });

      if (isSse) {
        res.write(`event: complete\ndata: ${JSON.stringify(result)}\n\n`);
        return res.end();
      } else {
        return res.json(result);
      }
    } catch (err: any) {
      if (isSse) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
        return res.end();
      } else {
        return res.status(400).json({ error: err.message || 'Pipeline execution failed' });
      }
    }
  }
);

// 12. Documents Listing (Firestore)
app.get('/api/documents', async (req, res) => {
  try {
    const { caseId } = req.query;
    const docsSnap = await getDocs(collection(serverDb, 'documents'));
    const documents: any[] = [];

    docsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (!caseId || data.caseId === caseId) {
        // Exclude wrapped keys from shallow listing
        const { encryption, ...safeData } = data;
        documents.push({
          ...safeData,
          hasEncryption: Boolean(encryption),
          algorithm: encryption?.alg || 'AES-256-GCM',
        });
      }
    });

    documents.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ documents });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed fetching documents', details: err.message });
  }
});

// 13. Document Detail (Full Cryptographic Fingerprint, Envelope & Chunk Table)
app.get('/api/documents/:id', async (req, res) => {
  try {
    const docSnap = await getDoc(doc(serverDb, 'documents', req.params.id));
    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Document not found in SAKSHYA vault.' });
    }

    const docData = docSnap.data();

    // Fetch associated case title
    let caseTitle = '';
    try {
      const caseSnap = await getDoc(doc(serverDb, 'cases', docData.caseId));
      if (caseSnap.exists()) {
        caseTitle = caseSnap.data().title;
      }
    } catch {}

    res.json({
      document: {
        ...docData,
        caseTitle,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed fetching document details', details: err.message });
  }
});

// 14. Document Download (Decrypts from Firestore blobs, verifies auth tag & streams file)
app.get('/api/documents/:id/download', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication session required to download evidence.' });
    }

    // PRD Section 2: Auditor/Admin cannot view document content (Zero-Knowledge Audit)
    if (req.user.role === 'AUDITOR_ADMIN') {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Auditor/Admin role has zero-knowledge ledger privileges and cannot view or download evidence content.',
      });
    }

    const docSnap = await getDoc(doc(serverDb, 'documents', req.params.id));
    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const docData = docSnap.data();
    const enc = docData.encryption;

    if (!enc || !docData.storageRef) {
      return res.status(400).json({ error: 'Document record missing encryption envelope or storage ref.' });
    }

    // 1. Fetch ciphertext from storage adapter (Firestore blobs)
    const cipherBuffer = await defaultStorageAdapter.get(docData.storageRef);

    // 2. Decrypt with envelope credentials and verify GCM authTag
    const decryptedBuffer = decryptEnvelope({
      cipherBuffer,
      algorithm: enc.alg,
      iv: enc.iv,
      authTag: enc.authTag,
      wrappedDek: enc.wrappedDek,
      wrappedDekIv: enc.wrappedDekIv,
      wrappedDekAuthTag: enc.wrappedDekAuthTag,
    });

    // 3. Verify reconstructed SHA-256 fingerprint matches original record
    const downloadedHash = sha256(decryptedBuffer);
    if (downloadedHash !== docData.fileHash) {
      return res.status(500).json({
        error: 'TAMPER_DETECTED',
        message: 'Decrypted file hash does not match sealed hash record! Payload may have been corrupted.',
        expectedHash: docData.fileHash,
        actualHash: downloadedHash,
      });
    }

    res.setHeader('Content-Type', docData.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(docData.name)}"`);
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.setHeader('X-Sakshya-SHA256', docData.fileHash);
    res.setHeader('X-Sakshya-MerkleRoot', docData.merkleRoot);

    return res.end(decryptedBuffer);
  } catch (err: any) {
    console.error('Download error:', err);
    res.status(500).json({
      error: 'Decryption or verification failed',
      details: err.message || String(err),
    });
  }
});

// 15. Generate Demo Pack (IO or Admin only)
app.post('/api/admin/demo-pack', requireRole(['IO', 'AUDITOR_ADMIN']), async (req, res) => {
  try {
    const items = await generateDemoPackItems();
    const targetCaseId = req.body.caseId || 'case_2024_nd_0891'; // Mayur Vihar PS Case
    const uploadedDocs: any[] = [];

    // Use current authenticated officer
    const actorUser = req.user!;

    for (const item of items) {
      const pipelineResult = await executeUploadPipeline({
        filename: item.filename,
        buffer: item.buffer,
        caseId: targetCaseId,
        type: item.type,
        confidentiality: item.confidentiality,
        title: item.title,
        user: actorUser,
      });
      uploadedDocs.push({
        id: pipelineResult.documentId,
        filename: pipelineResult.filename,
        fileHash: pipelineResult.fileHash,
        merkleRoot: pipelineResult.merkleRoot,
        size: pipelineResult.size,
        type: item.type,
      });
    }

    res.json({
      success: true,
      message: `Demo pack generated and sealed into vault (${items.length} items).`,
      count: items.length,
      caseId: targetCaseId,
      documents: uploadedDocs,
    });
  } catch (err: any) {
    console.error('Demo pack generation error:', err);
    res.status(500).json({
      error: 'Failed generating synthetic demo pack',
      details: err.message || String(err),
    });
  }
});

// --- Server Startup & Vite Middlewares ---

async function startServer() {
  // Try non-blocking auto-seed of Firestore on first run
  seedFirestoreDatabase(false)
    .then((res) => console.log('Firestore auto-seed status:', res))
    .catch((err) => console.warn('Non-blocking seed notice:', err.message));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SAKSHYA OS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
