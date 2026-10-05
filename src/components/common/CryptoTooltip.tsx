import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface CryptoTooltipProps {
  term: 'SHA-256' | 'Merkle Root' | 'Custody Ledger' | 'BSA 2023' | 'Redaction Copy-Test';
  children?: React.ReactNode;
}

const GLOSSARY: Record<string, { title: string; explanation: string }> = {
  'SHA-256': {
    title: 'SHA-256 Cryptographic Hash',
    explanation:
      'A deterministic 256-bit digital fingerprint. If even a single byte or pixel in the evidence file is altered, the hash changes completely (avalanche effect), proving tampering.',
  },
  'Merkle Root': {
    title: 'Merkle Tree Root Hash',
    explanation:
      'Large evidence files are partitioned into secure chunks. Each chunk is hashed, and pairs are combined into a binary hash tree. The root uniquely fingerprints all chunks simultaneously.',
  },
  'Custody Ledger': {
    title: 'Append-Only Hash Chain',
    explanation:
      'An immutable chain of blocks where block N includes the cryptographic hash of block N-1 plus an HMAC seal. History cannot be rewritten without invalidating every subsequent block.',
  },
  'BSA 2023': {
    title: 'Section 63 Bharatiya Sakshya Adhiniyam',
    explanation:
      'Replaced Section 65B of the Indian Evidence Act. Mandates Part A & Part B electronic record certificates specifying cryptographic hash, algorithm, and device identifiers.',
  },
  'Redaction Copy-Test': {
    title: 'Automated Redaction Verification',
    explanation:
      'Unlike visual black boxes that can be stripped, SAKSHYA permanently purges victim text from the PDF stream and runs an automated text re-extraction assertion to guarantee 0 leaks.',
  },
};

export const CryptoTooltip: React.FC<CryptoTooltipProps> = ({ term, children }) => {
  const [open, setOpen] = useState(false);
  const info = GLOSSARY[term];

  return (
    <span className="relative inline-flex items-center group cursor-help">
      <span className="border-b border-dotted border-slate-400 group-hover:border-slate-700">
        {children || term}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="ml-1 text-slate-400 hover:text-amber-600 focus:outline-none"
        aria-label={`Explain ${term}`}
      >
        <HelpCircle size={14} />
      </button>

      {/* Floating Tooltip popover */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-[#14213D] text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none transition-all duration-200 border border-slate-700 ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:pointer-events-auto'
        }`}
      >
        <p className="font-semibold text-amber-400 mb-1 flex items-center justify-between">
          <span>{info?.title || term}</span>
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
            Security Core
          </span>
        </p>
        <p className="text-slate-200 text-[11px] leading-relaxed">{info?.explanation}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#14213D]" />
      </div>
    </span>
  );
};
