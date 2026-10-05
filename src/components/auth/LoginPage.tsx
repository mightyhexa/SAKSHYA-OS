import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  FileCheck2,
  Lock,
  ArrowRight,
  Fingerprint,
  Building2,
  UserCheck,
  CheckCircle2,
  Scale,
  Sparkles,
} from 'lucide-react';
import { SakshyaLogo } from '../common/Logo';
import { Persona, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [officerId, setOfficerId] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'id' | 'otp'>('id');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personas')
      .then((res) => res.json())
      .then((data) => {
        if (data.personas) {
          setPersonas(data.personas);
          // Default to IO for fast testing
          setSelectedPersona(data.personas[0]);
          setOfficerId(data.personas[0].officerId);
        }
      })
      .catch((err) => console.error('Error fetching personas:', err));
  }, []);

  const handleSelectPersona = (p: Persona) => {
    setSelectedPersona(p);
    setOfficerId(p.officerId);
    setError(null);
  };

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerId.trim()) {
      setError('Please provide an authorized Officer ID.');
      return;
    }
    setError(null);
    setOtp('123456'); // Pre-fill 6-digit OTP for demo convenience
    setStep('otp');
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(officerId, otp, selectedPersona?.id);
    if (!res.success) {
      setError(res.error || 'Authentication rejected by security controller.');
      setLoading(false);
    }
  };

  const handleQuickLogin = async (p: Persona) => {
    setSelectedPersona(p);
    setOfficerId(p.officerId);
    setOtp('123456');
    setLoading(true);
    setError(null);
    const res = await login(p.officerId, '123456', p.id);
    if (!res.success) {
      setError(res.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Persisting Ribbon */}
      <div className="max-w-6xl mx-auto w-full mb-4">
        <div className="bg-[#14213D] text-amber-300 text-xs px-4 py-2 rounded-xl flex items-center justify-between border border-amber-500/20 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-amber-200">
              Prototype. Synthetic data only.
            </span>
            <span className="hidden sm:inline text-slate-300 text-[11px]">
              — Ministry of Home Affairs / NCRB (Problem SIH26190)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-300">Team: Deez Chain</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Left Column: Command Center Ethos & Security Guarantees */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#14213D] via-[#0E172A] to-[#0B132B] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background circuit pattern accent */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center space-x-3 mb-6">
              <SakshyaLogo size={44} />
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2">
                  <span>SAKSHYA OS</span>
                  <span className="text-[10px] uppercase font-bold bg-[#E87722] text-white px-2 py-0.5 rounded tracking-wider">
                    v1.0
                  </span>
                </h1>
                <p className="text-xs text-amber-400 font-medium">साक्ष्य प्रणाली • Legal & Forensics</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-amber-300 border border-white/10">
                Tagline: "Evidence that proves itself."
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Secure digital document custody system engineering mathematical admissibility for legal and investigation records under{' '}
                <strong className="text-white">Section 63 BSA 2023</strong>.
              </p>
            </div>

            {/* Core Architectural Pillars */}
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 size={16} className="text-[#2E8B57] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Untouched Evidence Proof (G1)</strong>
                  <span>SHA-256 fingerprinting, Merkle tree chunking, and append-only hash chains.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CheckCircle2 size={16} className="text-[#2E8B57] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Victim Protection Engine (G2)</strong>
                  <span>Permanent PDF text stripping with zero-leak automated copy test assertion.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CheckCircle2 size={16} className="text-[#2E8B57] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Court-Ready BSA Dossier (G3)</strong>
                  <span>One-click Section 63 BSA 2023 certificates with verification QR codes.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CheckCircle2 size={16} className="text-[#2E8B57] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Server-Enforced Zero-Trust RBAC</strong>
                  <span>Police, Forensics, Prosecution, Court, and Auditor roles strictly segregated.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 mt-8 text-[11px] text-slate-400 flex items-center justify-between">
            <span>SIH26190 Prototype</span>
            <span className="font-mono text-amber-400">Team Deez Chain</span>
          </div>
        </div>

        {/* Right Column: Persona Cards & Officer Authentication */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Officer Authentication & Persona Selection
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose a demonstration persona to log in with role-enforced cryptographic boundaries.
              </p>
            </div>

            {/* 5 Persona Selector Cards */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Demonstration Officer Persona:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {personas.map((p) => {
                  const isSelected = selectedPersona?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPersona(p)}
                      className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#14213D] bg-slate-50 ring-2 ring-[#14213D]/10 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#14213D] text-amber-400'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{p.officerId}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            p.role === 'IO'
                              ? 'bg-amber-100 text-amber-800'
                              : p.role === 'FORENSIC_ANALYST'
                              ? 'bg-blue-100 text-blue-800'
                              : p.role === 'PROSECUTOR'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.role === 'COURT_OFFICER'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.role}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 mt-2 truncate">
                        {p.station}
                      </p>

                      {/* 1-Click Fast Login for easy evaluation */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLogin(p);
                        }}
                        className="mt-2 w-full py-1 text-[10px] font-semibold text-slate-600 bg-white hover:bg-[#14213D] hover:text-white rounded border border-slate-200 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Sparkles size={11} className="text-amber-500" />
                        <span>Instant Login as {p.role}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                <Lock size={14} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* 2-Step Login Form */}
            {step === 'id' ? (
              <form onSubmit={handleProceedToOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Officer Identifier / Service Badge
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Fingerprint size={16} />
                    </div>
                    <input
                      type="text"
                      value={officerId}
                      onChange={(e) => setOfficerId(e.target.value.toUpperCase())}
                      placeholder="e.g. IO-7842"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono tracking-wide focus:bg-white focus:ring-2 focus:ring-[#14213D] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#14213D] hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <span>Authenticate & Request OTP</span>
                  <ArrowRight size={16} className="text-amber-400" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndLogin} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Enter 6-Digit Verification OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep('id')}
                      className="text-[11px] text-[#E87722] hover:underline"
                    >
                      Change Officer ({officerId})
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound size={16} />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#14213D] focus:outline-none"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Mock OTP verification active. Enter any 6 digits (pre-filled with{' '}
                    <code className="text-slate-800 font-bold">123456</code>).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#2E8B57] hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span>Issuing Signed HMAC Session...</span>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      <span>Verify & Enter SAKSHYA OS</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Session cookie: HMAC signed (httpOnly)</span>
            <span>Zero-Trust Client</span>
          </div>
        </div>
      </div>
    </div>
  );
};
