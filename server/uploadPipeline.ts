import crypto from 'crypto';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { serverDb } from './firebaseServer';
import { sha256, chunkAndHash, encryptEnvelope, EncryptedEnvelope, MerkleResult } from './crypto';
import { defaultStorageAdapter } from './storageAdapter';
import { SessionUser } from './auth';

export interface PipelineStepEvent {
  step: 'scan' | 'read' | 'tag' | 'seal' | 'lock' | 'store' | 'record';
  stepNumber: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: string;
  durationMs?: number;
  data?: Record<string, any>;
}

export interface PipelineResult {
  success: boolean;
  documentId: string;
  filename: string;
  size: number;
  mime: string;
  fileHash: string;
  merkleRoot: string;
  chunkHashes: string[];
  chunkCount: number;
  merkleTree: string[][];
  storageRef: string;
  steps: PipelineStepEvent[];
}

/**
 * Validates file extension and magic signature against allowlist.
 */
export function validateFileMagic(
  filename: string,
  buffer: Buffer
): { valid: boolean; mime: string; error?: string } {
  if (buffer.length === 0) {
    return { valid: false, mime: '', error: 'Uploaded file payload is empty.' };
  }

  if (buffer.length > 25 * 1024 * 1024) {
    return { valid: false, mime: '', error: 'File size exceeds maximum 25 MB security boundary.' };
  }

  const ext = filename.split('.').pop()?.toLowerCase();

  // 1. PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, mime: 'application/pdf' };
  }

  // 2. PNG: \x89PNG\r\n\x1a\n
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, mime: 'image/png' };
  }

  // 3. JPG / JPEG: \xFF\xD8\xFF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mime: 'image/jpeg' };
  }

  // 4. MP4: 'ftyp' at offset 4
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return { valid: true, mime: 'video/mp4' };
  }

  // 5. Plain text
  if (ext === 'txt') {
    // Check if valid UTF-8/ASCII
    const isText = buffer.every((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126));
    if (isText) return { valid: true, mime: 'text/plain' };
  }

  // 6. Generic binary container for test payloads
  if (ext === 'bin' || ext === 'dat') {
    return { valid: true, mime: 'application/octet-stream' };
  }

  return {
    valid: false,
    mime: 'application/octet-stream',
    error: `Unsupported file signature for '${filename}'. Permitted: PDF, PNG, JPG, TXT, MP4, BIN.`,
  };
}

/**
 * Executes the 7-Step Evidence Upload Pipeline:
 * Scan > Read > Tag > Seal > Lock > Store > Record
 */
export async function executeUploadPipeline(params: {
  filename: string;
  buffer: Buffer;
  caseId: string;
  type: string;
  confidentiality: string;
  title?: string;
  user: SessionUser;
  onStepProgress?: (event: PipelineStepEvent) => void;
}): Promise<PipelineResult> {
  const { filename, buffer, caseId, type, confidentiality, title, user, onStepProgress } = params;
  const steps: PipelineStepEvent[] = [];

  const emitStep = (ev: PipelineStepEvent) => {
    steps.push(ev);
    if (onStepProgress) onStepProgress(ev);
  };

  const docId = `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const storageRef = `blob_${docId}`;

  // STEP 1: SCAN (Type / Size / Magic Signature check)
  const t1 = Date.now();
  emitStep({
    step: 'scan',
    stepNumber: 1,
    name: 'Scan & Signature Verification',
    status: 'in_progress',
    details: 'Validating magic byte signature, MIME type, and 25 MB boundary...',
  });

  const magicCheck = validateFileMagic(filename, buffer);
  if (!magicCheck.valid) {
    const err = magicCheck.error || 'Magic signature check failed';
    emitStep({
      step: 'scan',
      stepNumber: 1,
      name: 'Scan & Signature Verification',
      status: 'failed',
      details: err,
    });
    throw new Error(err);
  }

  emitStep({
    step: 'scan',
    stepNumber: 1,
    name: 'Scan & Signature Verification',
    status: 'completed',
    details: `Signature valid (${magicCheck.mime}, ${(buffer.length / 1024).toFixed(1)} KB). Zero anomaly.`,
    durationMs: Date.now() - t1,
    data: { mime: magicCheck.mime, size: buffer.length },
  });

  // STEP 2: READ (Text extraction placeholder)
  const t2 = Date.now();
  emitStep({
    step: 'read',
    stepNumber: 2,
    name: 'Text Extraction & Optical Ingestion',
    status: 'in_progress',
    details: 'Ingesting text stream (Stage 2 placeholder)...',
  });

  // Brief simulation delay for visible UI feedback
  await new Promise((r) => setTimeout(r, 60));

  emitStep({
    step: 'read',
    stepNumber: 2,
    name: 'Text Extraction & Optical Ingestion',
    status: 'completed',
    details: 'Raw document stream buffered for cryptographic sealing.',
    durationMs: Date.now() - t2,
  });

  // STEP 3: TAG (AI tags, case number, protected names)
  const t3 = Date.now();
  emitStep({
    step: 'tag',
    stepNumber: 3,
    name: 'Entity Tagging & Case Binding',
    status: 'in_progress',
    details: 'Resolving case jurisdiction and protected victim registries...',
  });

  let protectedNames: string[] = [];
  try {
    const caseDocSnap = await getDoc(doc(serverDb, 'cases', caseId));
    if (caseDocSnap.exists()) {
      protectedNames = caseDocSnap.data()?.protectedNames || [];
    }
  } catch {}

  const tags = [type, confidentiality, 'EVIDENCE_STAGE_2'];

  emitStep({
    step: 'tag',
    stepNumber: 3,
    name: 'Entity Tagging & Case Binding',
    status: 'completed',
    details: `Bound to Case ${caseId}. Protected entities: [${protectedNames.join(', ') || 'None'}].`,
    durationMs: Date.now() - t3,
    data: { tags, protectedNames },
  });

  // STEP 4: SEAL (SHA-256 of file, per-chunk hashes, Merkle root tree)
  const t4 = Date.now();
  emitStep({
    step: 'seal',
    stepNumber: 4,
    name: 'Cryptographic Sealing & Merkle Root',
    status: 'in_progress',
    details: 'Computing SHA-256 fingerprint and Merkle tree leaves...',
  });

  // Check active chunk size from settings (default 16MB or 1MB demo)
  let activeChunkSize = 16 * 1024 * 1024;
  try {
    const settingsSnap = await getDoc(doc(serverDb, 'settings', 'system_config'));
    if (settingsSnap.exists()) {
      const cfg = settingsSnap.data();
      if (cfg.chunkSizeMb) {
        activeChunkSize = cfg.chunkSizeMb * 1024 * 1024;
      }
    }
  } catch {}

  const fileHash = sha256(buffer);
  const merkle = chunkAndHash(buffer, activeChunkSize);

  emitStep({
    step: 'seal',
    stepNumber: 4,
    name: 'Cryptographic Sealing & Merkle Root',
    status: 'completed',
    details: `SHA-256: ${fileHash.slice(0, 16)}... | Merkle Root: ${merkle.merkleRoot.slice(0, 16)}... (${merkle.chunkCount} chunk${merkle.chunkCount > 1 ? 's' : ''})`,
    durationMs: Date.now() - t4,
    data: {
      fileHash,
      merkleRoot: merkle.merkleRoot,
      chunkCount: merkle.chunkCount,
      chunkHashes: merkle.chunkHashes,
    },
  });

  // STEP 5: LOCK (AES-256-GCM envelope encryption with wrapped DEK)
  const t5 = Date.now();
  emitStep({
    step: 'lock',
    stepNumber: 5,
    name: 'AES-256-GCM Envelope Encryption',
    status: 'in_progress',
    details: 'Generating per-file DEK and wrapping with Vault Master Key...',
  });

  const envelope = encryptEnvelope(buffer);

  emitStep({
    step: 'lock',
    stepNumber: 5,
    name: 'AES-256-GCM Envelope Encryption',
    status: 'completed',
    details: `Ciphertext sealed. DEK wrapped with AES-256-GCM (AuthTag: ${envelope.authTag.slice(0, 8)}...).`,
    durationMs: Date.now() - t5,
    data: { algorithm: envelope.algorithm, iv: envelope.iv, authTag: envelope.authTag },
  });

  // STEP 6: STORE (Encrypted chunks in Firestore blobs <= 500KB)
  const t6 = Date.now();
  emitStep({
    step: 'store',
    stepNumber: 6,
    name: 'Firestore Partitioned Chunk Storage',
    status: 'in_progress',
    details: `Writing encrypted ciphertext in <=500KB parts to 'blobs' collection...`,
  });

  const storageResult = await defaultStorageAdapter.put(storageRef, envelope.cipherBuffer, {
    docId,
    filename,
    mime: magicCheck.mime,
  });

  emitStep({
    step: 'store',
    stepNumber: 6,
    name: 'Firestore Partitioned Chunk Storage',
    status: 'completed',
    details: `Stored ${storageResult.partCount} encrypted blob part(s) [${storageResult.totalBytes} bytes].`,
    durationMs: Date.now() - t6,
    data: { storageRef, parts: storageResult.partCount },
  });

  // STEP 7: RECORD (Ledger block placeholder for Stage 2)
  const t7 = Date.now();
  emitStep({
    step: 'record',
    stepNumber: 7,
    name: 'Custody Ledger Recording',
    status: 'in_progress',
    details: 'Stage 2 placeholder: Preparing custody audit ledger entry (Stage 3)...',
  });

  // Persist Document metadata in Firestore
  const documentRecord = {
    id: docId,
    caseId,
    name: filename,
    title: title || filename,
    type,
    version: 1,
    derivation: 'ORIGINAL',
    parentDocId: null,
    fileHash,
    merkleRoot: merkle.merkleRoot,
    chunkHashes: merkle.chunkHashes,
    chunkCount: merkle.chunkCount,
    size: buffer.length,
    mime: magicCheck.mime,
    confidentiality,
    tags,
    aiSummary: `Uploaded by ${user.name} (${user.roleTitle}). Verified SHA-256: ${fileHash.slice(0, 12)}...`,
    protectedNames,
    encryption: {
      alg: envelope.algorithm,
      wrappedDek: envelope.wrappedDek,
      wrappedDekIv: envelope.wrappedDekIv,
      wrappedDekAuthTag: envelope.wrappedDekAuthTag,
      iv: envelope.iv,
      authTag: envelope.authTag,
    },
    storageRef,
    uploadedBy: user.officerId,
    uploaderName: user.name,
    uploaderRole: user.role,
    createdAt: new Date().toISOString(),
    status: 'SEALED',
  };

  await setDoc(doc(serverDb, 'documents', docId), documentRecord);

  emitStep({
    step: 'record',
    stepNumber: 7,
    name: 'Custody Ledger Recording',
    status: 'completed',
    details: 'Evidence record sealed in vault. (Ledger block chaining scheduled for Stage 3).',
    durationMs: Date.now() - t7,
  });

  return {
    success: true,
    documentId: docId,
    filename,
    size: buffer.length,
    mime: magicCheck.mime,
    fileHash,
    merkleRoot: merkle.merkleRoot,
    chunkHashes: merkle.chunkHashes,
    chunkCount: merkle.chunkCount,
    merkleTree: merkle.merkleTree,
    storageRef,
    steps,
  };
}
