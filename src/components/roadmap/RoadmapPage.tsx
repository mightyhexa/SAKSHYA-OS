import React from 'react';
import {
  Compass,
  CheckCircle2,
  Cpu,
  Clock,
  ShieldAlert,
  FileCheck,
  Building,
  Radio,
  ExternalLink,
} from 'lucide-react';

export const RoadmapPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
          <Compass size={16} />
          <span>PRD Section 8 • Transparency & Honesty Policy</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Prototype vs. Production Roadmap
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          In strict compliance with PRD Section 8, this page explicitly classifies every system capability as{' '}
          <strong className="text-emerald-700">IMPLEMENTED</strong>,{' '}
          <strong className="text-amber-700">SIMULATED</strong>, or{' '}
          <strong className="text-blue-700">PLANNED</strong>.
        </p>
      </div>

      {/* Grid of Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Real / Working */}
        <div className="bg-white rounded-2xl p-5 border-2 border-emerald-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                1. Working Core
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                REAL
              </span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start space-x-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Full-Stack Architecture:</strong> React 19 + Express server with cookie-based signed HMAC sessions.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Real Cloud Database:</strong> Google Cloud Firestore provisioned for persistent cases and records.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Server-Enforced RBAC:</strong> Strict role checks with access-denied logging.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Environment Secrets Check:</strong> Server health endpoint reporting secret readiness without leakage.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-3 border-t border-emerald-100 text-[11px] text-emerald-800 font-medium">
            Active in Stage 1
          </div>
        </div>

        {/* Tier 2: Simulated */}
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                2. Simulated Models
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                SIMULATED
              </span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start space-x-2">
                <Radio size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Distributed Witness Nodes:</strong> Police, Forensic Lab, and Court multi-node head-hash consensus runs in isolated Firestore documents simulating distributed validation.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Radio size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Mock Officer OTPs:</strong> Demo login accepts any 6-digit numeric OTP for frictionless prototype evaluation.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Radio size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tamper Simulator:</strong> Injects controlled bit-flips and hash corruptions to demonstrate tamper alerts.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-3 border-t border-amber-100 text-[11px] text-amber-800 font-medium">
            Transparently marked in UI
          </div>
        </div>

        {/* Tier 3: Planned */}
        <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                3. Enterprise Future
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                PLANNED
              </span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start space-x-2">
                <Building size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>CCTNS & ICJS Integration:</strong> Direct API sync with Crime and Criminal Tracking Network & Inter-Operable Criminal Justice System.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Building size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aadhaar eSign & DSC:</strong> Legal digital signature certificates embedded in PDF signatures.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Building size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Hyperledger Anchoring:</strong> Anchoring daily ledger roots to national permissioned blockchain networks.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Building size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Offline Field Capture:</strong> Hardware secure enclave integration for field bodycam and audio logs.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-3 border-t border-blue-100 text-[11px] text-blue-800 font-medium">
            Phase 2 Post-SIH
          </div>
        </div>
      </div>
    </div>
  );
};
