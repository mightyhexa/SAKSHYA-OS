import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderLock,
  UploadCloud,
  Search,
  FileCheck,
  Cpu,
  ScrollText,
  Settings,
  Compass,
  LogOut,
  AlertTriangle,
  Menu,
  X,
  ChevronDown,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavItemKey, Role } from '../../types';
import { SakshyaLogo } from '../common/Logo';
import { NAV_LABELS } from '../../lib/navTranslations';
import { CryptoTooltip } from '../common/CryptoTooltip';

interface AppShellProps {
  currentNav: NavItemKey;
  onNavigate: (key: NavItemKey) => void;
  children: React.ReactNode;
}

const ROLE_CONFIG: Record<
  Role,
  { label: string; bg: string; text: string; border: string }
> = {
  IO: {
    label: 'Investigating Officer (IO)',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-300',
  },
  FORENSIC_ANALYST: {
    label: 'Forensic Analyst',
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    border: 'border-blue-300',
  },
  PROSECUTOR: {
    label: 'Public Prosecutor',
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
  },
  COURT_OFFICER: {
    label: 'Court Officer',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-300',
  },
  AUDITOR_ADMIN: {
    label: 'Auditor / Admin',
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-300',
  },
};

export const AppShell: React.FC<AppShellProps> = ({
  currentNav,
  onNavigate,
  children,
}) => {
  const { user, logout, language, setLanguage } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems: { key: NavItemKey; icon: React.ReactNode; badge?: string }[] = [
    { key: 'dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'cases', icon: <FolderLock size={18} /> },
    { key: 'upload', icon: <UploadCloud size={18} /> },
    { key: 'documents', icon: <Layers size={18} /> },
    { key: 'search', icon: <Search size={18} />, badge: 'Stage 6' },
    { key: 'verify', icon: <FileCheck size={18} />, badge: 'Stage 7' },
    { key: 'integrity', icon: <Cpu size={18} />, badge: 'Stage 7' },
    { key: 'audit', icon: <ScrollText size={18} />, badge: 'Stage 3' },
    { key: 'settings', icon: <Settings size={18} /> },
    { key: 'roadmap', icon: <Compass size={18} /> },
  ];

  const roleStyle = user
    ? ROLE_CONFIG[user.role] || {
        label: user.role,
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
      }
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 flex flex-col font-sans">
      {/* 1. Persistent Sticky Ribbon (PRD Section 7) */}
      <div className="sticky top-0 z-50 bg-[#14213D] text-amber-300 border-b border-amber-500/30 px-4 py-1.5 text-xs font-medium flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <AlertTriangle size={14} className="text-[#E87722] shrink-0" />
          <span className="font-semibold tracking-wide text-amber-200">
            Prototype. Synthetic data only.
          </span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            — SIH26190: Digital Document Management for Legal & Investigation Documents
          </span>
        </div>

        {/* Cryptographic Core Quick Explanations */}
        <div className="hidden lg:flex items-center space-x-4 text-[11px] text-slate-300">
          <span>
            Proof standard:{' '}
            <CryptoTooltip term="SHA-256">
              <strong className="text-white hover:text-amber-300">SHA-256</strong>
            </CryptoTooltip>
          </span>
          <span className="text-slate-500">|</span>
          <span>
            Multi-chunk:{' '}
            <CryptoTooltip term="Merkle Root">
              <strong className="text-white hover:text-amber-300">Merkle Tree</strong>
            </CryptoTooltip>
          </span>
          <span className="text-slate-500">|</span>
          <span>
            Chain:{' '}
            <CryptoTooltip term="Custody Ledger">
              <strong className="text-white hover:text-amber-300">Custody Ledger</strong>
            </CryptoTooltip>
          </span>
        </div>
      </div>

      {/* 2. Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-7 z-40 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xs">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            {/* SVG Logo: Shield with Keyhole */}
            <SakshyaLogo size={36} className="transition-transform group-hover:scale-105" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-[#14213D]">
                  SAKSHYA OS
                </span>
                <span className="text-[10px] font-bold bg-[#E87722]/10 text-[#E87722] px-1.5 py-0.5 rounded border border-[#E87722]/20">
                  SIH26190
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                साक्ष्य प्रणाली • "Evidence that proves itself"
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role Badge, Language Toggle EN/हिं, User Menu */}
        <div className="flex items-center space-x-3">
          {/* Language Toggle EN / हिं (Nav only per PRD) */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'en'
                  ? 'bg-white text-[#14213D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="English interface labels"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'hi'
                  ? 'bg-white text-[#14213D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="हिंदी नेविगेशन लेबल्स"
            >
              हिं
            </button>
          </div>

          {/* Role Badge */}
          {user && roleStyle && (
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
            >
              <Shield size={12} className="shrink-0" />
              <span>{user.role}</span>
              <span className="opacity-60 text-[10px]">({user.officerId})</span>
            </div>
          )}

          {/* User Profile / Logout Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-[#14213D] text-amber-400 font-bold text-xs flex items-center justify-center border border-slate-300">
                  {user.avatar || 'SO'}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {user.station}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.roleTitle}</p>
                    <p className="text-[10px] font-mono text-emerald-700 mt-1">ID: {user.officerId}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{user.station}</p>
                  </div>

                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center space-x-2"
                    >
                      <Settings size={14} />
                      <span>System Settings & Demo Reset</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('roadmap');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center space-x-2"
                    >
                      <Compass size={14} />
                      <span>Prototype vs Roadmap</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 px-2 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-2 font-medium"
                    >
                      <LogOut size={14} />
                      <span>Switch Officer / Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 3. Main Workspace with Left Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 select-none">
          <div className="p-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              {language === 'en' ? 'Core Workspace' : 'कार्यक्षेत्र'}
            </div>

            {navItems.map((item) => {
              const active = currentNav === item.key;
              const label = NAV_LABELS[item.key][language];

              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-[#14213D] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={active ? 'text-amber-400' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                        active
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Authority info box */}
          {user && (
            <div className="mt-auto m-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-700 font-semibold mb-1">
                <Layers size={14} className="text-[#E87722]" />
                <span className="text-[11px]">Section 63 BSA Status</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Electronic Certificate engine initialized. Hash algorithm: SHA-256.
              </p>
            </div>
          )}
        </aside>

        {/* Mobile Slide-in Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40 flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-64 bg-white h-full shadow-2xl p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center space-x-2">
                  <SakshyaLogo size={28} />
                  <span className="font-bold text-[#14213D] text-sm">SAKSHYA OS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const active = currentNav === item.key;
                  const label = NAV_LABELS[item.key][language];

                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onNavigate(item.key);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                        active
                          ? 'bg-[#14213D] text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className={active ? 'text-amber-400' : 'text-slate-500'}>
                          {item.icon}
                        </span>
                        <span>{label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Workspace Content Canvas */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
