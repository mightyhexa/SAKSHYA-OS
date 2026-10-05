# SAKSHYA OS: Product Requirements Document v1.0
Tagline: "Evidence that proves itself." Problem statement SIH26190: Secure Digital Document Management System for Legal and Investigation Documents (Ministry of Home Affairs, NCRB). Team: Deez Chain.

## 1. Goals
G1 Prove a document is untouched (SHA-256 + Merkle root + hash-chained custody ledger).
G2 Protect victim identity: shared copies are redacted permanently, the original is never altered (derived copy with its own hash, linked to the original).
G3 One-click court-ready dossier modelled on the Section 63 BSA 2023 certificate format.
G4 Fast, secure search and role-based collaboration across police, forensic lab, prosecution, court.
G5 Every action is logged and verifiable. A tampering attempt is detected and shown instantly.

## 2. Roles (server-enforced RBAC)
- Investigating Officer (IO): upload, view originals of own cases, create redacted copies, generate dossier.
- Forensic Analyst: upload evidence/forensic reports, view originals of linked cases only. No redaction.
- Public Prosecutor: view originals of court-stage cases, view redacted copies, generate dossier. No upload.
- Court Officer: view redacted copies only, verify files. Original only with an active share grant.
- Auditor/Admin: view ledger and audit, run integrity checks and the tamper simulator. Cannot view document content.
Every denied attempt writes an ACCESS_DENIED ledger block.

## 3. Functional requirements
FR1 Upload pipeline (7 visible steps): Scan (type/size/signature check) > Read (text extraction; Gemini for scans) > Tag (AI tags, case number, parties, protected names) > Seal (SHA-256 of file, SHA-256 per chunk, Merkle root) > Lock (AES-256-GCM, per-file key wrapped by master key) > Store (encrypted chunks in Firestore) > Record (ledger block).
FR2 Chunking: default 16 MB chunks (settings toggle for 1 MB demo chunks so small files show multiple leaves). Show the Merkle tree.
FR3 Verify: (a) verify stored document (decrypt, re-hash, compare); (b) verify an uploaded copy against the ledger (public page, shows only MATCH / NO MATCH, no content).
FR4 Ledger: append-only hash chain. Block = {index, prevHash, timestamp, actorId, actorRole, action, docId, docVersion, payloadHash, ip, hash, seal}. hash = SHA-256(canonical JSON of all fields except hash and seal). seal = HMAC-SHA256(hash, LEDGER_SEAL_SECRET). Genesis block at index 0. Appends use a Firestore transaction on a ledger-head document. "Verify entire chain" recomputes every block and reports the first broken index.
FR5 Redaction: protected names per case (auto-detected + manually added). Engine removes the text from the PDF (not just a black box), strips metadata, then runs a COPY TEST (extract text from the output, assert zero matches) and shows the result. Redacted copy = new document (derivation REDACTED, parentDocId, own hash). Both hashes in the ledger. Redaction report lists counts per name, pages affected, and test result.
FR6 Watermark: the viewer overlays officer ID, role, IP, timestamp diagonally; downloads are server-stamped the same way. (Deters leaks; does not prevent screenshots.)
FR7 Section 63 dossier (PDF): cover, document list with hashes, chain-of-custody timeline, ledger proof (block range + head hash), certificate page modelled on the Schedule to BSA 2023 (Part A / Part B, hash value, algorithm, device/source, signature placeholders), QR to the public verify page. Footer: "Template for demonstration. Legal review needed before court use."
FR8 Smart search: keyword + filters (case, type, date, confidentiality, tags) with highlighted snippets (MiniSearch, in-memory, over decrypted text).
FR9 Witness nodes (simulated): Police, Forensic Lab, Court each store the ledger head hash on every new block. The Integrity page compares them. A mismatch shows a red banner. Optional: also post the head hash to a public GitHub repo as an external witness.
FR10 Tamper simulator (Admin only): (1) flip a byte in a stored file, (2) edit a document's recorded hash, (3) edit a ledger block. Each must be caught and shown with red alerts and the exact failing item. "Restore" resets.
FR11 Sharing: time-limited share grants (24h/7d/30d) with a mock OTP, logged.
FR12 Audit page with filters, chain visual, CSV export.
FR13 Demo Pack generator: creates synthetic PDFs (FIR with a fictional victim name, witness statement, forensic report, charge sheet) plus a 3 MB placeholder "evidence video" file, so no manual file prep.
FR14 Self-test page: runs automated checks for hashing, Merkle, encryption round-trip, ledger verify, redaction copy-test, RBAC, and shows pass/fail.

## 4. Architecture
React + TypeScript + Tailwind (client). Node + Express (server) holds ALL crypto, redaction, PDF generation, Gemini calls and secrets. Firestore for data. Storage adapter interface (FirestoreChunkStorage now; Supabase later). Libraries: pdf-lib, pdfjs-dist, mupdf (preferred for true redaction; fallback = render pages to images with black boxes and rebuild the PDF), multer, zod, helmet, express-rate-limit, minisearch, qrcode, @google/genai. Secrets only via environment variables: GEMINI_API_KEY, VAULT_MASTER_KEY, SESSION_SECRET, LEDGER_SEAL_SECRET, optional GITHUB_TOKEN, WITNESS_REPO. Never send secrets to the client.

## 5. Data model (Firestore)
users (demo personas), cases, documents {id, caseId, name, type, version, derivation, parentDocId, fileHash, merkleRoot, chunkHashes, chunkCount, size, mime, confidentiality, tags, aiSummary, protectedNames, encryption{alg, wrappedDek, iv, authTag}, storageRef, status}, blobs (chunk docs <=500KB each), ledger, ledgerHead, witnesses_police, witnesses_forensic, witnesses_court, shares, settings.

## 6. Non-functional
Server-side validation (zod), file allowlist (pdf, png, jpg, txt, mp4, bin) and 25 MB limit, rate limiting, helmet, no secrets or file contents in logs, graceful errors, loading/empty states, responsive, accessible contrast.

## 7. Design
"Command Center" look: navy #14213D, SIH orange #E87722 and green #2E8B57 as accents, warm off-white background, Inter/Poppins, rounded cards, plain-language labels, tooltips explaining SHA-256, Merkle root, ledger. No national emblem, no flags. Persistent ribbon: "Prototype. Synthetic data only."

## 8. Honesty rules
Label as SIMULATED or PLANNED anything not truly implemented (witness nodes are simulated; eSign, Hyperledger anchoring, CCTNS/ICJS adapters, offline capture are PLANNED). Include a "Prototype vs Roadmap" page.

## 9. Demo acceptance (must all pass)
1 Login as IO. 2 Generate Demo Pack. 3 Upload FIR: 7-step pipeline, fingerprint shown. 4 Smart search finds it. 5 Create redacted copy: copy-test passes, two linked hashes. 6 View with watermark. 7 Generate Section 63 dossier. 8 Verify a copy publicly (MATCH) and a modified copy (NO MATCH). 9 Admin simulates tamper: red alert names the exact failing item. 10 Verify chain and witnesses agree after restore.
