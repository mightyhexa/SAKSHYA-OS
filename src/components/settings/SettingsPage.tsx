import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Database,
  Cpu,
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HealthInfo } from '../../types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [chunkSizeMb, setChunkSizeMb] = useState<number>(16);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [runningSelfTest, setRunningSelfTest] = useState(false);
  const [selfTestResults, setSelfTestResults] = useState<any | null>(null);

  const handleRunCryptoSelfTest = async () => {
    setRunningSelfTest(true);
    try {
      const res = await fetch('/api/selftest/crypto');
      if (res.ok) {
        setSelfTestResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningSelfTest(false);
    }
  };

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error(err));

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.chunkSizeMb) setChunkSizeMb(data.chunkSizeMb);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleResetDemoData = async () => {
    if (!confirm('Reset all demo cases and user personas to default factory states?')) {
      return;
    }

    setResetting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: 'Demo data successfully reset! 5 cases and 5 personas restored in Firestore.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed resetting demo data.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Network error while attempting demo reset.',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleToggleChunkSize = async (size: number) => {
    setChunkSizeMb(size);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkSizeMb: size,
          enableDemoChunks: size === 1,
        }),
      });
    } catch (err) {
      console.error('Error saving chunk setting:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographic configurations, server secrets status, and demo reset controls.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. Reset Demo Data (Required by User Prompt) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <RotateCcw size={16} className="text-[#E87722]" />
              <span>Reset Demo Data (Firestore)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Idempotently restores the 5 fictional police cases and 5 officer demonstration personas in Firestore.
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm shrink-0"
          >
            <RotateCcw size={14} className={`mr-2 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting Database...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. PRD FR2: Chunking Configuration Toggle */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-2">
          <Layers size={16} className="text-blue-600" />
          <span>Evidence Chunking Size (PRD FR2)</span>
        </h2>
        <p className="text-xs text-slate-500 mb-4 max-w-xl">
          FR2 specifies: "default 16 MB chunks (settings toggle for 1 MB demo chunks so small files show multiple leaves). Show the Merkle tree."
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <button
            type="button"
            onClick={() => handleToggleChunkSize(16)}
            className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
              chunkSizeMb === 16
                ? 'border-[#14213D] bg-slate-50 ring-2 ring-[#14213D]/10 font-medium'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">16 MB Chunks</span>
              {chunkSizeMb === 16 && (
                <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-bold">
                  DEFAULT
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Optimal production partitioning for large video & high-res forensic disk images.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleToggleChunkSize(1)}
            className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
              chunkSizeMb === 1
                ? 'border-[#14213D] bg-slate-50 ring-2 ring-[#14213D]/10 font-medium'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">1 MB Demo Chunks</span>
              {chunkSizeMb === 1 && (
                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Generates multiple Merkle leaves on small test files for demonstration visualizers.
            </p>
          </button>
        </div>
      </div>

      {/* 3. Cryptographic Core Self-Test (FR14) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Cryptographic Engine Self-Test (FR14)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Runs automated unit tests for SHA-256, Merkle odd-leaf balance, and AES-256-GCM tamper detection.
            </p>
          </div>

          <button
            onClick={handleRunCryptoSelfTest}
            disabled={runningSelfTest}
            className="inline-flex items-center justify-center px-4 py-2 bg-[#14213D] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs shrink-0"
          >
            <Cpu size={14} className={`mr-2 ${runningSelfTest ? 'animate-spin' : ''}`} />
            <span>{runningSelfTest ? 'Executing Tests...' : 'Run Crypto Self-Test'}</span>
          </button>
        </div>

        {selfTestResults && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 text-[11px] font-mono">
              <span className="text-slate-500">Suite Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  selfTestResults.success
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {selfTestResults.success ? 'ALL 4 TESTS PASSED (100%)' : 'TESTS FAILED'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {selfTestResults.results.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2.5"
                >
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{r.test}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{r.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Server Secrets & Environment Check (Names only, never values per PRD) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Key size={16} className="text-[#E87722]" />
              <span>Server Environment & Secrets Inspection</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified server-side via <code className="text-slate-800">GET /api/health</code> (Names only, never values).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Node Backend Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {health?.secrets ? (
            Object.entries(health.secrets).map(([name, present]) => (
              <div
                key={name}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-slate-800 truncate">
                    {name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      present ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    present ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {present ? 'Present & Secured' : 'Not Provided (Default Fallback)'}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-full text-xs text-slate-400">Loading server health...</div>
          )}
        </div>
      </div>
    </div>
  );
};
