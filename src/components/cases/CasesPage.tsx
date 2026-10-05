import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Search,
  Filter,
  Shield,
  User,
  Calendar,
  Building2,
  Tag,
  Eye,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CaseRecord, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const CasesPage: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases')
      .then((res) => res.json())
      .then((data) => {
        if (data.cases) {
          setCases(data.cases);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.policeStation.toLowerCase().includes(search.toLowerCase()) ||
      c.investigatingOfficer.toLowerCase().includes(search.toLowerCase());

    const matchesStage = stageFilter === 'ALL' || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Investigation Dockets</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
              {filteredCases.length} Cases
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fictional criminal and legal cases stored in Firestore for demonstration.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, FIR, station..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14213D] w-full sm:w-60"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14213D] text-slate-700"
          >
            <option value="ALL">All Stages</option>
            <option value="Investigation">Investigation</option>
            <option value="Forensic">Forensic</option>
            <option value="Prosecution">Prosecution</option>
            <option value="Court">Court</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedCase(c)}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#14213D] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#14213D]">
                  {c.caseNumber}
                </span>
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
              </div>

              <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2 leading-snug">
                {c.title}
              </h3>

              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex items-center space-x-1.5">
                  <Building2 size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{c.policeStation}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <User size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    {c.investigatingOfficer} ({c.ioId})
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-500">
                  <Tag size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{c.section}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center space-x-1">
                <Calendar size={12} />
                <span>{c.incidentDate}</span>
              </span>

              <span className="text-[#E87722] font-semibold flex items-center space-x-1">
                <Eye size={12} />
                <span>Inspect Docket</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedCase(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#E87722]">
                  {selectedCase.caseNumber}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedCase.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-500 font-medium">Police Station:</span>
                  <p className="font-semibold text-slate-800">{selectedCase.policeStation}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Investigating Officer:</span>
                  <p className="font-semibold text-slate-800">
                    {selectedCase.investigatingOfficer} ({selectedCase.ioId})
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Legal Provisions:</span>
                  <p className="font-semibold text-slate-800 font-mono">{selectedCase.section}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Procedural Stage:</span>
                  <p className="font-semibold text-emerald-700">{selectedCase.stage}</p>
                </div>
              </div>

              {/* Protected Entities (For Stage 4 Redaction Engine) */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 block mb-1">
                  Protected Names & Entities (FR5 Redaction Target):
                </span>
                <p className="text-[11px] text-amber-800 mb-2">
                  Entities registered for automated redaction under victim protection laws.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCase.protectedNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white text-slate-800 font-mono text-[11px] rounded border border-amber-300 font-medium shadow-2xs"
                    >
                      🔒 {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 bg-[#14213D] text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Docket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
