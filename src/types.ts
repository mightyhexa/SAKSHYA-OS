export type Role =
  | 'IO'
  | 'FORENSIC_ANALYST'
  | 'PROSECUTOR'
  | 'COURT_OFFICER'
  | 'AUDITOR_ADMIN';

export interface Persona {
  id: string;
  name: string;
  officerId: string;
  role: Role;
  roleTitle: string;
  station: string;
  jurisdiction: string;
  avatar: string;
  description: string;
  allowedActions: string[];
}

export interface CaseRecord {
  id: string;
  caseNumber: string;
  title: string;
  policeStation: string;
  investigatingOfficer: string;
  ioId: string;
  section: string;
  status: 'Under Investigation' | 'Forensic Analysis' | 'Charge-sheet Filed' | 'Trial Ongoing' | 'Closed';
  stage: 'Investigation' | 'Forensic' | 'Prosecution' | 'Court' | 'Archive';
  incidentDate: string;
  registeredAt: string;
  protectedNames: string[];
}

export interface DocumentRecord {
  id: string;
  caseId: string;
  caseTitle?: string;
  name: string;
  title: string;
  type: string;
  version: number;
  derivation: 'ORIGINAL' | 'REDACTED';
  parentDocId?: string | null;
  fileHash: string;
  merkleRoot: string;
  chunkHashes: string[];
  chunkCount: number;
  size: number;
  mime: string;
  confidentiality: 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET';
  tags: string[];
  aiSummary?: string;
  protectedNames?: string[];
  encryption?: {
    alg: string;
    wrappedDek: string;
    wrappedDekIv: string;
    wrappedDekAuthTag: string;
    iv: string;
    authTag: string;
  };
  storageRef: string;
  uploadedBy: string;
  uploaderName?: string;
  uploaderRole?: string;
  createdAt: string;
  status: string;
}

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

export interface HealthInfo {
  status: 'ok' | 'degraded';
  firestore: 'connected' | 'disconnected' | 'error';
  secrets: {
    GEMINI_API_KEY: boolean;
    VAULT_MASTER_KEY: boolean;
    SESSION_SECRET: boolean;
    LEDGER_SEAL_SECRET: boolean;
    GITHUB_TOKEN: boolean;
    WITNESS_REPO: boolean;
  };
  timestamp: string;
}

export interface DashboardStats {
  totalDocuments: number;
  totalCases: number;
  ledgerBlocks: number;
  integrityStatus: 'VERIFIED' | 'TAMPERED' | 'INITIALIZING';
  lastBlockIndex: number;
  lastBlockTime?: string;
}

export type Language = 'en' | 'hi';

export type NavItemKey =
  | 'dashboard'
  | 'cases'
  | 'upload'
  | 'documents'
  | 'search'
  | 'verify'
  | 'integrity'
  | 'audit'
  | 'settings'
  | 'roadmap';
