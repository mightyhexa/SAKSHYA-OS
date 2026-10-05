import React from 'react';
import { Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { NavItemKey } from '../../types';

interface PlaceholderViewProps {
  navKey: NavItemKey;
  stageNumber: number;
  stageTitle: string;
  description: string;
  onGoToDashboard: () => void;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  stageNumber,
  stageTitle,
  description,
  onGoToDashboard,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#E87722] mx-auto mb-6 shadow-sm">
          <Clock size={32} />
        </div>

        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-mono text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          Stage {stageNumber} Roadmap Module
        </span>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">{stageTitle}</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-lg mx-auto">
          {description}
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 mb-8">
          <div className="flex items-center text-emerald-700 font-semibold">
            <ShieldCheck size={16} className="mr-1.5 shrink-0" />
            <span>PRD Specification Ready</span>
          </div>
          <p className="text-slate-600">
            Per instructions: <em>"Implement STAGE 1 ONLY. Do not build upload, ledger or AI yet."</em>
          </p>
        </div>

        <button
          onClick={onGoToDashboard}
          className="inline-flex items-center px-5 py-2.5 bg-[#14213D] text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <span>Return to Dashboard</span>
          <ArrowRight size={16} className="ml-1.5 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
