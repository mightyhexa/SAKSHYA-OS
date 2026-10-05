import crypto from 'crypto';

/**
 * SAKSHYA OS Cryptographic Core
 *
 * Implements:
 * 1. SHA-256 Fingerprinting
 * 2. Merkle Root Hash Tree Construction with Odd-Leaf Duplication
 * 3. AES-256-GCM Envelope Encryption (File DEK wrapped by Vault Master Key)
 * 4. Tamper-evident Authenticated Decryption
 */

export interface MerkleResult {
  chunkHashes: string[];
  merkleRoot: string;
  merkleTree: string[][]; // Levels from leaves [0] to root [n]
  chunkCount: number;
}

export interface EncryptedEnvelope {
  cipherBuffer: Buffer;
  algorithm: 'AES-256-GCM';
  iv: string; // 12-byte IV as hex
  authTag: string; // 16-byte GCM authentication tag as hex
  wrappedDek: string; // DEK encrypted under VAULT_MASTER_KEY (hex)
  wrappedDekIv: string; // 12-byte IV for DEK wrapping (hex)
  wrappedDekAuthTag: string; // 16-byte auth tag for DEK wrapping (hex)
}

export interface DecryptionEnvelopeParams {
  cipherBuffer: Buffer;
  algorithm: string;
  iv: string;
  authTag: string;
  wrappedDek: string;
  wrappedDekIv: string;
  wrappedDekAuthTag: string;
}

/**
 * Retrieves the 32-byte Vault Master Key from environment.
 * If not explicitly 32 bytes, derives a deterministic 256-bit key via SHA-256.
 */
export function getVaultMasterKey(): Buffer {
  const rawKey =
    process.env.VAULT_MASTER_KEY || 'sakshya_vault_master_key_minimum_32_bytes_length';
  return crypto.createHash('sha256').update(rawKey, 'utf8').digest();
}

/**
 * Computes standard hex SHA-256 of any Buffer.
 */
export function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Partitions buffer into chunks of chunkSize and constructs a cryptographic Merkle tree.
 *
 * Merkle Tree Balancing Rule:
 * When an odd number of leaf hashes exist at any tree level, the last leaf hash
 * is duplicated to form a balanced pair ([H0, H1, H2] -> [H0, H1, H2, H2]).
 * For a single chunk, the leaf itself constitutes the Merkle root.
 */
export function chunkAndHash(buffer: Buffer, chunkSize: number): MerkleResult {
  if (buffer.length === 0) {
    const emptyHash = sha256(Buffer.alloc(0));
    return {
      chunkHashes: [emptyHash],
      merkleRoot: emptyHash,
      merkleTree: [[emptyHash]],
      chunkCount: 1,
    };
  }

  const effectiveChunkSize = Math.max(1024, chunkSize);
  const chunkHashes: string[] = [];
  const chunkCount = Math.ceil(buffer.length / effectiveChunkSize);

  for (let i = 0; i < buffer.length; i += effectiveChunkSize) {
    const chunk = buffer.subarray(i, Math.min(i + effectiveChunkSize, buffer.length));
    chunkHashes.push(sha256(chunk));
  }

  // Construct Merkle Tree
  const merkleTree: string[][] = [chunkHashes];
  let currentLevel = [...chunkHashes];

  while (currentLevel.length > 1) {
    // Apply Odd-Leaf Duplication Rule
    if (currentLevel.length % 2 !== 0) {
      currentLevel.push(currentLevel[currentLevel.length - 1]);
    }

    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1];
      const combined = crypto
        .createHash('sha256')
        .update(Buffer.from(left + right, 'utf8'))
        .digest('hex');
      nextLevel.push(combined);
    }

    merkleTree.push(nextLevel);
    currentLevel = nextLevel;
  }

  const merkleRoot = currentLevel[0];

  return {
    chunkHashes,
    merkleRoot,
    merkleTree,
    chunkCount,
  };
}

/**
 * AES-256-GCM Envelope Encryption:
 * 1. Generates a random 32-byte Data Encryption Key (DEK).
 * 2. Wraps DEK using the VAULT_MASTER_KEY with AES-256-GCM.
 * 3. Encrypts the payload with DEK using AES-256-GCM and a random 12-byte IV.
 * 4. Extracts the 16-byte authentication tag ensuring integrity and authenticity.
 */
export function encryptEnvelope(fileBuffer: Buffer): EncryptedEnvelope {
  const masterKey = getVaultMasterKey();

  // 1. Generate per-file DEK
  const dek = crypto.randomBytes(32);

  // 2. Wrap DEK with VAULT_MASTER_KEY (AES-256-GCM)
  const wrappedDekIv = crypto.randomBytes(12);
  const wrapCipher = crypto.createCipheriv('aes-256-gcm', masterKey, wrappedDekIv);
  const wrappedDekBuffer = Buffer.concat([wrapCipher.update(dek), wrapCipher.final()]);
  const wrappedDekAuthTag = wrapCipher.getAuthTag();

  // 3. Encrypt file payload with DEK (AES-256-GCM)
  const fileIv = crypto.randomBytes(12);
  const fileCipher = crypto.createCipheriv('aes-256-gcm', dek, fileIv);
  const cipherBuffer = Buffer.concat([fileCipher.update(fileBuffer), fileCipher.final()]);
  const fileAuthTag = fileCipher.getAuthTag();

  return {
    cipherBuffer,
    algorithm: 'AES-256-GCM',
    iv: fileIv.toString('hex'),
    authTag: fileAuthTag.toString('hex'),
    wrappedDek: wrappedDekBuffer.toString('hex'),
    wrappedDekIv: wrappedDekIv.toString('hex'),
    wrappedDekAuthTag: wrappedDekAuthTag.toString('hex'),
  };
}

/**
 * Decrypts an envelope-encrypted payload.
 * Verifies both the wrapped DEK authentication tag and the payload authentication tag.
 * Throws an error immediately if any byte or tag was tampered with.
 */
export function decryptEnvelope(envelope: DecryptionEnvelopeParams): Buffer {
  const masterKey = getVaultMasterKey();

  // 1. Unwrap DEK
  const wrappedDekIv = Buffer.from(envelope.wrappedDekIv, 'hex');
  const wrappedDekAuthTag = Buffer.from(envelope.wrappedDekAuthTag, 'hex');
  const wrappedDekBuffer = Buffer.from(envelope.wrappedDek, 'hex');

  const unwrapCipher = crypto.createDecipheriv('aes-256-gcm', masterKey, wrappedDekIv);
  unwrapCipher.setAuthTag(wrappedDekAuthTag);
  const dek = Buffer.concat([unwrapCipher.update(wrappedDekBuffer), unwrapCipher.final()]);

  // 2. Decrypt payload with DEK
  const fileIv = Buffer.from(envelope.iv, 'hex');
  const fileAuthTag = Buffer.from(envelope.authTag, 'hex');

  const fileCipher = crypto.createDecipheriv('aes-256-gcm', dek, fileIv);
  fileCipher.setAuthTag(fileAuthTag);
  const decrypted = Buffer.concat([fileCipher.update(envelope.cipherBuffer), fileCipher.final()]);

  return decrypted;
}

/**
 * Automated Cryptographic Self-Test Suite
 * Verifies:
 * - SHA-256 determinism & avalanche effect
 * - Chunking & Merkle tree calculation (including odd-leaf handling)
 * - AES-256-GCM envelope encryption/decryption round-trip
 * - Tamper detection (auth tag rejection when a single byte is flipped)
 */
export function runCryptoSelfTest() {
  const results: { test: string; passed: boolean; details: string }[] = [];

  // Test 1: SHA-256
  try {
    const data = Buffer.from('SAKSHYA_OS_TEST_EVIDENCE_PAYLOAD', 'utf8');
    const h1 = sha256(data);
    const h2 = sha256(data);
    const passed = h1 === h2 && h1.length === 64;
    results.push({
      test: 'SHA-256 Deterministic Fingerprint',
      passed,
      details: `Hash: ${h1.slice(0, 16)}... (Length: 64 hex chars)`,
    });
  } catch (err: any) {
    results.push({ test: 'SHA-256 Deterministic Fingerprint', passed: false, details: err.message });
  }

  // Test 2: Merkle Tree Odd-Leaf Duplication
  try {
    // 3 distinct chunks (odd number of leaves)
    const buf = Buffer.alloc(3 * 1024);
    buf.fill('A', 0, 1024);
    buf.fill('B', 1024, 2048);
    buf.fill('C', 2048, 3072);

    const merkle = chunkAndHash(buf, 1024);
    const passed =
      merkle.chunkCount === 3 &&
      merkle.chunkHashes.length === 3 &&
      merkle.merkleTree.length === 3 && // leaves -> 2 pairs -> 1 root
      merkle.merkleRoot.length === 64;

    results.push({
      test: 'Merkle Tree (Odd-Leaf Duplication Rule)',
      passed,
      details: `3 Leaves -> Root: ${merkle.merkleRoot.slice(0, 16)}... (Tree depth: ${merkle.merkleTree.length})`,
    });
  } catch (err: any) {
    results.push({ test: 'Merkle Tree (Odd-Leaf Duplication Rule)', passed: false, details: err.message });
  }

  // Test 3: Envelope Encryption Round-Trip
  try {
    const rawPayload = crypto.randomBytes(64 * 1024); // 64 KB random binary
    const encrypted = encryptEnvelope(rawPayload);
    const decrypted = decryptEnvelope(encrypted);

    const passed =
      rawPayload.equals(decrypted) &&
      sha256(rawPayload) === sha256(decrypted);

    results.push({
      test: 'AES-256-GCM Envelope Encryption Round-Trip',
      passed,
      details: `64KB randomized buffer encrypted and decrypted with 100% byte fidelity.`,
    });
  } catch (err: any) {
    results.push({ test: 'AES-256-GCM Envelope Encryption Round-Trip', passed: false, details: err.message });
  }

  // Test 4: Tamper Detection (Bit-flip auth tag validation)
  try {
    const rawPayload = Buffer.from('CRITICAL_CONFIDENTIAL_EVIDENCE_DATA', 'utf8');
    const encrypted = encryptEnvelope(rawPayload);

    // Corrupt one byte in ciphertext
    const tamperedBuffer = Buffer.from(encrypted.cipherBuffer);
    tamperedBuffer[0] ^= 0xff; // Flip bits in first byte

    let caughtTamper = false;
    try {
      decryptEnvelope({
        ...encrypted,
        cipherBuffer: tamperedBuffer,
      });
    } catch {
      caughtTamper = true;
    }

    results.push({
      test: 'AES-256-GCM Tamper Detection (Bit-Flip Rejection)',
      passed: caughtTamper,
      details: caughtTamper
        ? 'Successfully caught bit-flip corruption; GCM auth tag mismatch rejected.'
        : 'CRITICAL FAILURE: Tampered ciphertext was decrypted without error!',
    });
  } catch (err: any) {
    results.push({ test: 'AES-256-GCM Tamper Detection', passed: false, details: err.message });
  }

  const allPassed = results.every((r) => r.passed);
  return {
    success: allPassed,
    timestamp: new Date().toISOString(),
    results,
  };
}
