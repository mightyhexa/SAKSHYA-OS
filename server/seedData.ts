import { doc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { serverDb } from './firebaseServer';
import { Persona, CaseRecord } from '../src/types';

export const DEMO_PERSONAS: Persona[] = [
  {
    id: 'user_io_vikram',
    name: 'Inspector Vikram Rathore',
    officerId: 'IO-7842',
    role: 'IO',
    roleTitle: 'Investigating Officer',
    station: 'Mayur Vihar Police Station',
    jurisdiction: 'East District, Delhi Police',
    avatar: 'VR',
    description: 'Senior Cyber & Financial Crimes Investigator. Primary authority for FIR evidence collection & redaction.',
    allowedActions: [
      'Upload evidence documents',
      'View original evidence in assigned cases',
      'Generate permanently redacted copies',
      'Create Section 63 BSA 2023 certified dossiers',
    ],
  },
  {
    id: 'user_fa_ananya',
    name: 'Dr. Ananya Sharma',
    officerId: 'FA-9104',
    role: 'FORENSIC_ANALYST',
    roleTitle: 'Senior Forensic Scientist',
    station: 'Central Forensic Science Laboratory (CFSL)',
    jurisdiction: 'Directorate of Forensic Science Services',
    avatar: 'AS',
    description: 'Digital Forensics & Ballistics Expert. Authorized to upload forensic reports and verify raw file hashes.',
    allowedActions: [
      'Upload forensic examination reports',
      'View original evidence in linked cases only',
      'Verify Merkle root & chunk integrity',
      'Cannot execute redactions or modify case files',
    ],
  },
  {
    id: 'user_pp_rajesh',
    name: 'Adv. Rajesh K. Varma',
    officerId: 'PP-3321',
    role: 'PROSECUTOR',
    roleTitle: 'Chief Public Prosecutor',
    station: 'Patiala House District Courts',
    jurisdiction: 'Directorate of Prosecution, NCT of Delhi',
    avatar: 'RV',
    description: 'State Legal Counsel. Reviews case dockets, inspects court-stage evidence, compiles trial dossiers.',
    allowedActions: [
      'View original evidence for court-stage cases',
      'View redacted victim copies',
      'Generate certified court submission dossiers',
      'Cannot upload files or alter evidence records',
    ],
  },
  {
    id: 'user_co_meenakshi',
    name: 'Registrar Meenakshi Sundaram',
    officerId: 'CO-5510',
    role: 'COURT_OFFICER',
    roleTitle: 'Court Registrar / Judicial Officer',
    station: 'Delhi High Court Bench 4',
    jurisdiction: 'Judiciary of India',
    avatar: 'MS',
    description: 'Judicial record keeper. Verifies authenticity of evidence presented before the bench.',
    allowedActions: [
      'View redacted copies only by default',
      'Verify digital file hashes against ledger',
      'View originals only with active share grant & OTP',
      'Cannot upload or redact files',
    ],
  },
  {
    id: 'user_adm_sanjeev',
    name: 'Joint Director Sanjeev Sen',
    officerId: 'ADM-1001',
    role: 'AUDITOR_ADMIN',
    roleTitle: 'Vigilance Officer & System Auditor',
    station: 'Directorate of Forensic & Vigilance (NCRB)',
    jurisdiction: 'Ministry of Home Affairs',
    avatar: 'SS',
    description: 'Independent oversight officer. Audits hash-chain custody ledgers and tests tamper detection systems.',
    allowedActions: [
      'Inspect append-only audit trail and witness hashes',
      'Run tamper simulator to verify fail-safes',
      'Verify entire ledger chain integrity',
      'Cannot view document text/content (Zero-Knowledge)',
    ],
  },
];

export const DEMO_CASES: CaseRecord[] = [
  {
    id: 'case_2024_nd_0891',
    caseNumber: 'FIR-0891/2024/ND',
    title: 'Cyber Extortion & Unauthorized Surveillance Syndicate',
    policeStation: 'Mayur Vihar Police Station',
    investigatingOfficer: 'Inspector Vikram Rathore',
    ioId: 'IO-7842',
    section: 'BNS Sec 308 (Extortion) / IT Act Sec 66D',
    status: 'Under Investigation',
    stage: 'Investigation',
    incidentDate: '2024-08-14',
    registeredAt: '2024-08-16T10:30:00Z',
    protectedNames: ['Pooja Narang', 'Aakash Narang', 'Target Witness A'],
  },
  {
    id: 'case_2024_sw_1142',
    caseNumber: 'FIR-1142/2024/SW',
    title: 'Tampered Financial Audit & Corporate Forgery in Healthcare Tech',
    policeStation: 'Vasant Kunj South PS',
    investigatingOfficer: 'Inspector Vikram Rathore',
    ioId: 'IO-7842',
    section: 'BNS Sec 318(4) (Cheating) / Sec 336 (Forgery)',
    status: 'Forensic Analysis',
    stage: 'Forensic',
    incidentDate: '2024-09-02',
    registeredAt: '2024-09-05T14:15:00Z',
    protectedNames: ['Deepak Malhotra', 'Shalini Verma'],
  },
  {
    id: 'case_2024_cr_0428',
    caseNumber: 'FIR-0428/2024/CR',
    title: 'Counterfeit Stamp Paper & Digital Stamp Duplication Racket',
    policeStation: 'Connaught Place Police Station',
    investigatingOfficer: 'Inspector Rajesh Meena',
    ioId: 'IO-9912',
    section: 'BNS Sec 345 / 346 (Counterfeit Government Stamps)',
    status: 'Charge-sheet Filed',
    stage: 'Prosecution',
    incidentDate: '2024-07-21',
    registeredAt: '2024-07-25T09:00:00Z',
    protectedNames: ['Sunita Roy', 'Whistleblower M'],
  },
  {
    id: 'case_2024_nw_2309',
    caseNumber: 'FIR-2309/2024/NW',
    title: 'High-Way Cargo Hijacking & Digital GPS Spoofing Conspiracy',
    policeStation: 'Rohini North Police Station',
    investigatingOfficer: 'Inspector Vikram Rathore',
    ioId: 'IO-7842',
    section: 'BNS Sec 310(2) (Dacoity with Weapons)',
    status: 'Trial Ongoing',
    stage: 'Court',
    incidentDate: '2024-06-11',
    registeredAt: '2024-06-12T18:45:00Z',
    protectedNames: ['Kavita Deshmukh', 'Rahul Deshmukh'],
  },
  {
    id: 'case_2024_ed_0077',
    caseNumber: 'FIR-0077/2024/ED',
    title: 'Critical Infrastructure SCADA Log Manipulation Incident',
    policeStation: 'Special Cell Cyber Command Hub',
    investigatingOfficer: 'Inspector Priyadarshini Rao',
    ioId: 'IO-4402',
    section: 'BNS Sec 111 (Organized Crime) / IT Act Sec 70',
    status: 'Under Investigation',
    stage: 'Investigation',
    incidentDate: '2024-09-28',
    registeredAt: '2024-09-30T11:20:00Z',
    protectedNames: ['Dr. K. Srinivas', 'Operator X'],
  },
];

export async function seedFirestoreDatabase(force: boolean = false) {
  const seededCasesCount = 0;
  const seededUsersCount = 0;

  // Seed Users / Personas
  for (const persona of DEMO_PERSONAS) {
    const userRef = doc(serverDb, 'users', persona.id);
    await setDoc(userRef, {
      ...persona,
      updatedAt: new Date().toISOString(),
    }, { merge: !force });
  }

  // Seed Cases
  for (const caseItem of DEMO_CASES) {
    const caseRef = doc(serverDb, 'cases', caseItem.id);
    await setDoc(caseRef, {
      ...caseItem,
      updatedAt: new Date().toISOString(),
    }, { merge: !force });
  }

  // Seed default settings doc
  const settingsRef = doc(serverDb, 'settings', 'system_config');
  await setDoc(settingsRef, {
    chunkSizeMb: 16,
    enableDemoChunks: false,
    environment: 'SIH26190-PROTOTYPE',
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  return {
    casesSeeded: DEMO_CASES.length,
    usersSeeded: DEMO_PERSONAS.length,
    timestamp: new Date().toISOString(),
  };
}
