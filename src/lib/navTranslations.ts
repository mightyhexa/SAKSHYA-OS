import { NavItemKey } from '../types';

export const NAV_LABELS: Record<NavItemKey, { en: string; hi: string }> = {
  dashboard: {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
  },
  cases: {
    en: 'Cases',
    hi: 'मुकदमे',
  },
  upload: {
    en: 'Upload Evidence',
    hi: 'साक्ष्य अपलोड',
  },
  documents: {
    en: 'Sealed Vault',
    hi: 'सील दस्तावेज़',
  },
  search: {
    en: 'Smart Search',
    hi: 'स्मार्ट खोज',
  },
  verify: {
    en: 'Public Verify',
    hi: 'जन सत्यापन',
  },
  integrity: {
    en: 'Node Integrity',
    hi: 'अखंडता जांच',
  },
  audit: {
    en: 'Audit Ledger',
    hi: 'लेखा बही',
  },
  settings: {
    en: 'System Settings',
    hi: 'सिस्टम सेटिंग्स',
  },
  roadmap: {
    en: 'Prototype vs Roadmap',
    hi: 'प्रोटोटाइप और रोडमैप',
  },
};
