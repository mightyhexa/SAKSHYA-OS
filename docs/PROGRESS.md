# SAKSHYA OS: Implementation Progress

Checklist tracking development through Stages 1 to 8.

- [x] **Stage 1: Core Foundation & Security Architecture**
  - Architecture setup (React 19 + TypeScript + Tailwind client, Express full-stack server running with Vite middleware)
  - Firestore integration enabled with `firebase-blueprint.json` and deployed security rules
  - Server health check (`GET /api/health`) reporting Firestore connectivity and secrets presence (names only, never values)
  - Design system per PRD section 7 (Command Center Navy #14213D, SIH Orange #E87722, Green #2E8B57, SVG shield logo, top bar, left sidebar, sticky prototype ribbon)
  - Role-based login with 5 personas, mock officer ID + 6-digit OTP, signed HMAC session cookie
  - Server-enforced RBAC auth middleware and `requireRole()` helper with access-denied logging
  - Client route guards and Access-Denied screen with lock icon
  - Firestore seeded with 5 fictional legal cases and 5 personas (`/api/admin/seed`), and "Reset Demo Data" button in Settings
  - Dashboard skeleton reading real Firestore stats and active cases
  - "Prototype vs Roadmap" transparency page (PRD Section 8 honesty rules)

- [x] **Stage 2: Vault Core (Crypto, Upload Pipeline, Storage, Demo Pack)**
  - Server module `crypto.ts`: `sha256(buffer)`, `chunkAndHash(buffer, chunkSize)` with Merkle root & odd-leaf duplication rule, AES-256-GCM envelope encryption (per-file random DEK wrapped by `VAULT_MASTER_KEY`, 12-byte IV, 16-byte authTag), authenticated decryption with tamper detection
  - Self-test endpoint `GET /api/selftest/crypto` validating SHA-256, Merkle odd-leaf handling, envelope round-trip, and bit-flip rejection
  - StorageAdapter interface & `FirestoreChunkStorage` storing encrypted chunks of <=500KB into Firestore `blobs`
  - 7-Step Evidence Upload Pipeline (`POST /api/documents/upload`): Scan (type/size/magic byte check), Read, Tag, Seal (SHA-256 + Merkle root), Lock (AES-256-GCM), Store (blobs), Record (Stage 2 placeholder)
  - SSE real-time event streaming for animated 7-step stepper with real timing feedback
  - Upload UI: drag-and-drop, case/type/confidentiality selectors, 7-step animated stepper, Merkle tree diagram visualizer
  - Sealed Documents Vault (`/documents`) list and detail view with full fingerprint, copy buttons, chunk table
  - Download endpoint (`GET /api/documents/:id/download`) decrypting ciphertext from blobs, checking auth tag, verifying SHA-256, and streaming payload
  - Demo Pack generator (`POST /api/admin/demo-pack`) building synthetic legal PDFs with `pdf-lib` (FIR with fictional victim "Meera Kulkarni", witness statement, forensic report, charge sheet) and a 3MB placeholder evidence video
  - Chunk size toggle in Settings: 16 MB default vs 1 MB demo chunks (FR2)
  - Verified upload/download roundtrip: Downloaded SHA-256 matches sealed SHA-256 with 100% byte fidelity

- [ ] **Stage 3: Custody Ledger & Append-Only Hash Chain**
  - Append-only hash chain model (index, prevHash, timestamp, actorId, actorRole, action, docId, docVersion, payloadHash, ip, hash, seal)
  - Genesis block at index 0 and Firestore transaction append on `ledgerHead`
  - HMAC-SHA256 block seal using `LEDGER_SEAL_SECRET`
  - Full chain verification ("Verify entire chain" recomputing every block and reporting first broken index)
  - Pipeline "Record" step fully wired to append immutable block to custody ledger
  - Simulated multi-node witnesses (Police, Forensic Lab, Court)

- [ ] **Stage 4: Permanent Redaction Engine & Watermarking**
  - Protected name detection and management per case (auto-detected + manually added)
  - Permanent PDF text stripping & sanitization (not just visual overlay black boxes)
  - Mandatory copy test assertion (automated verification of 0 leaked text instances)
  - Redacted copy derivation linked to parent document in ledger
  - Redaction report generation (counts per name, pages affected, test result)
  - Diagonal viewer watermark (Officer ID, role, IP, timestamp) & server-stamped download

- [ ] **Stage 5: Court-Ready Section 63 BSA 2023 Dossier Generator**
  - Dossier cover & document schedule with cryptographic hashes
  - Custody timeline from immutable ledger trail
  - Schedule to BSA 2023 certificate (Part A & Part B compliance, hash & device info)
  - Public verification QR code embedding
  - Disclaimer footer compliance

- [ ] **Stage 6: Search, Access Control & Sharing**
  - Smart search with MiniSearch (case, type, date, confidentiality, tags, snippets)
  - Time-limited share grants with mock OTP and ledger logging
  - Audit trail viewer with filtering, visual chain explorer, and CSV export

- [ ] **Stage 7: Tamper Simulator & Verification Suite**
  - Public document verification page (MATCH / NO MATCH)
  - Admin tamper simulator (bit-flip in stored file, hash mismatch, ledger tampering)
  - Real-time tamper detection, alerts, and one-click restore
  - Automated self-test suite (crypto roundtrips, RBAC, Merkle, copy-test)

- [ ] **Stage 8: Final Acceptance, Polishing & Demo Pack Verification**
  - End-to-end 10-step demo acceptance verification
  - Command Center styling polish & transparency documentation
