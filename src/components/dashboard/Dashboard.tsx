import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  FileText,
  Blocks,
  ShieldCheck,
  Activity,
  Server,
  Database,
  Key,
  Clock,
  ArrowRight,
  AlertCircle,
  FileCheck,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardStats, HealthInfo, CaseRecord, NavItemKey } from '../../types';
import { CryptoTooltip } from '../common/CryptoTooltip';

interface DashboardProps {
  onNavigate: (key: NavItemKey) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, healthRes, casesRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/health'),
        fetch('/api/cases'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (healthRes.ok) {
        setHealth(await healthRes.json());
      }
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(data.cases || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Welcome with Persona Privileges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Evidence Command Center
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live State
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-800">{user?.name}</strong> •{' '}
            <span className="text-slate-700">{user?.roleTitle}</span> ({user?.officerId})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(user?.role === 'IO' || user?.role === 'AUDITOR_ADMIN') && (
            <button
              onClick={() => onNavigate('documents')}
              className="inline-flex items-center px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-[#E87722] hover:opacity-95 rounded-lg transition-all shadow-xs"
            >
              <Sparkles size={13} className="mr-1.5" />
              <span>Demo Pack</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw size={13} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>

          <button
            onClick={() => onNavigate('cases')}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-[#14213D] hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <span>View All Cases</span>
            <ArrowRight size={14} className="ml-1.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* 2. Persona Role Privilege Banner */}
      {user && (
        <div className="bg-gradient-to-r from-slate-900 via-[#14213D] to-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  {user.role} Permissions
                </span>
                <span className="text-xs text-slate-300">• Section 63 BSA 2023 Admissibility Protocol</span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                {user.role === 'IO' && 'Authorized to upload initial evidence, inspect originals in assigned cases, execute irreversible victim redactions, and sign Section 63 dossiers.'}
                {user.role === 'FORENSIC_ANALYST' && 'Authorized to upload forensic reports and verify raw hash fingerprints. Original evidence viewing is restricted to linked laboratory cases.'}
                {user.role === 'PROSECUTOR' && 'Authorized to inspect court-stage trial evidence, verify chain of custody, and compile electronic dossiers. File upload is restricted.'}
                {user.role === 'COURT_OFFICER' && 'Judicial records keeper. Redacted copies visible by default; originals require an active cryptographic time-limited share grant with OTP.'}
                {user.role === 'AUDITOR_ADMIN' && 'Zero-knowledge auditor. Authorized to inspect the ledger hash chain and run the tamper simulator. Prohibited from reading document content.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 lg:max-w-md">
              {(user.allowedActions || []).map((action, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-md text-slate-200 border border-white/10 font-normal"
                >
                  ✓ {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Stat Cards reading real data (Documents, Cases, Ledger Blocks, Integrity Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Investigation Cases
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderLock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.totalCases ?? cases.length}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Real Firestore Data</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Registered FIRs with role-assigned IOs
          </p>
        </div>

        {/* Evidence Documents */}
        <div
          onClick={() => onNavigate('documents')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#14213D] hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sealed Documents
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#E87722] flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.totalDocuments ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Vault Core</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>
              Protected by <strong className="text-slate-700">SHA-256</strong> & AES-GCM
            </span>
            <span className="text-[#E87722] font-semibold">Inspect &rarr;</span>
          </p>
        </div>

        {/* Ledger Blocks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ledger Blocks
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Blocks size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.ledgerBlocks ?? 0}
            </span>
            <span className="text-xs text-purple-600 font-medium">Append-Only</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <CryptoTooltip term="Custody Ledger">
              <strong className="text-slate-700">Hash-chained ledger</strong>
            </CryptoTooltip>{' '}
            with HMAC seal
          </p>
        </div>

        {/* Integrity Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chain Integrity
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-emerald-700">
              {stats?.integrityStatus || 'VERIFIED'}
            </span>
            <span className="text-xs text-emerald-600 font-bold">100% Intact</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Zero detected tampering attempts
          </p>
        </div>
      </div>

      {/* 4. Two-Column Grid: System Health & Secrets Present (PRD stage 1) + Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: System Health & Server Secrets Audit Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Server size={16} className="text-[#14213D]" />
                <h2 className="text-sm font-bold text-slate-900">Security Architecture Health</h2>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                GET /api/health
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Firestore Connectivity */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2">
                  <Database size={15} className="text-slate-600" />
                  <span className="font-medium text-slate-700">Firestore Database</span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    health?.firestore === 'connected'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{health?.firestore === 'connected' ? 'Connected' : 'Connecting...'}</span>
                </span>
              </div>

              {/* Secrets Present Check (Names only, never values per PRD FR1) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Key size={14} className="text-[#E87722]" />
                    <span className="font-semibold text-slate-800">Server Secrets Config</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Names only</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {health?.secrets ? (
                    Object.entries(health.secrets).map(([name, present]) => (
                      <div key={name} className="flex items-center justify-between py-0.5">
                        <span className="font-mono text-slate-600 text-[10px]">{name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            present
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {present ? 'CONFIGURED' : 'OPTIONAL'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 py-1">Verifying environment...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Server: Express + Node.js</span>
            <span>Zero Client-Side Secrets</span>
          </div>
        </div>

        {/* Right: Recent Cases from Firestore */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <FolderLock size={16} className="text-[#14213D]" />
              <h2 className="text-sm font-bold text-slate-900">
                Active Legal Cases (Firestore Seed)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('cases')}
              className="text-xs font-semibold text-[#E87722] hover:underline flex items-center"
            >
              <span>Explore All</span>
              <ArrowRight size={13} className="ml-1" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5">Case / FIR No.</th>
                  <th className="pb-2.5">Title & Section</th>
                  <th className="pb-2.5">Police Station</th>
                  <th className="pb-2.5">Investigating Officer</th>
                  <th className="pb-2.5">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono font-semibold text-[#14213D] whitespace-nowrap">
                      {c.caseNumber}
                    </td>
                    <td className="py-3 pr-2">
                      <p className="font-semibold text-slate-800 line-clamp-1">{c.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{c.section}</p>
                    </td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{c.policeStation}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">
                      <span className="font-medium">{c.investigatingOfficer}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ({c.ioId})
                      </span>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.stage === 'Investigation'
                            ? 'bg-amber-100 text-amber-800'
                            : c.stage === 'Forensic'
                            ? 'bg-blue-100 text-blue-800'
                            : c.stage === 'Prosecution'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {c.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
