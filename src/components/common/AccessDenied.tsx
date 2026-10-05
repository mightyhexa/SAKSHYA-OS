import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface AccessDeniedProps {
  requiredRoles?: Role[];
  attemptedAction?: string;
  onBackToDashboard: () => void;
  onSwitchPersona?: () => void;
}

const ROLE_NAMES: Record<Role, string> = {
  IO: 'Investigating Officer (IO)',
  FORENSIC_ANALYST: 'Forensic Analyst',
  PROSECUTOR: 'Public Prosecutor',
  COURT_OFFICER: 'Court Officer',
  AUDITOR_ADMIN: 'Auditor / System Admin',
};

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRoles = [],
  attemptedAction = 'Access Protected Evidence Module',
  onBackToDashboard,
  onSwitchPersona,
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl border-2 border-red-200 shadow-xl overflow-hidden text-center">
        {/* Header Ribbon */}
        <div className="bg-red-50 border-b border-red-100 py-3 px-6 flex items-center justify-center space-x-2 text-red-800 text-xs font-semibold tracking-wide uppercase">
          <ShieldAlert size={16} className="text-red-600" />
          <span>Server-Enforced RBAC Protocol (Section 2 PRD)</span>
        </div>

        <div className="p-8">
          {/* Animated Lock Shield */}
          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-25" />
            <div className="relative w-18 h-18 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-200">
              <Lock size={34} strokeWidth={2.2} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Access Denied: Restricted Persona
          </h2>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your current assigned role cannot perform{' '}
            <span className="font-semibold text-slate-800">"{attemptedAction}"</span> under the zero-trust
            admissibility guidelines.
          </p>

          {/* Role Status Grid */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Current Officer Persona:</span>
              <span className="font-semibold text-slate-800">
                {user ? `${user.name} (${user.role})` : 'Unauthenticated'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Authorized Roles:</span>
              <span className="font-semibold text-emerald-700">
                {requiredRoles.length > 0
                  ? requiredRoles.map((r) => ROLE_NAMES[r] || r).join(', ')
                  : 'Restricted to System Administrators'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Security Action:</span>
              <span className="font-mono text-[11px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                ACCESS_DENIED logged to Ledger
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic mb-6">
            "Every denied attempt writes an ACCESS_DENIED ledger block." — PRD Section 2
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Return to Dashboard
            </button>

            {onSwitchPersona && (
              <button
                onClick={onSwitchPersona}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#14213D] hover:bg-slate-800 transition-colors shadow-sm"
              >
                <UserCheck size={16} className="mr-1.5 text-amber-400" />
                Switch Officer Role
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
