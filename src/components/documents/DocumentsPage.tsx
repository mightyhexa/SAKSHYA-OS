import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Sparkles,
  Download,
  Lock,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DocumentRecord, NavItemKey } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DocumentsPageProps {
  onNavigate: (key: NavItemKey) => void;
  onSelectDocument: (docId: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  onNavigate,
  onSelectDocument,
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [generatingDemoPack, setGeneratingDemoPack] = useState(false);
  const [demoPackFeedback, setDemoPackFeedback] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleGenerateDemoPack = async () => {
    setGeneratingDemoPack(true);
    setDemoPackFeedback(null);
    try {
      const res = await fetch('/api/admin/demo-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: 'case_2024_nd_0891' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDemoPackFeedback(`Demo Pack successfully generated: 5 synthetic evidence items sealed!`);
        await fetchDocuments();
      } else {
        setDemoPackFeedback(`Failed: ${data.error || 'Could not generate demo pack'}`);
      }
    } catch (err: any) {
      setDemoPackFeedback(`Error: ${err.message}`);
    } finally {
      setGeneratingDemoPack(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      (doc.title && doc.title.toLowerCase().includes(search.toLowerCase())) ||
      doc.fileHash.toLowerCase().includes(search.toLowerCase()) ||
      doc.caseId.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const canUpload = user?.role === 'IO' || user?.role === 'FORENSIC_ANALYST';
  const canGenerateDemoPack = user?.role === 'IO' || user?.role === 'AUDITOR_ADMIN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sealed Evidence Vault
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
              {documents.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sealed with SHA-256, Merkle root trees, and AES-256-GCM envelope encryption.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Generate Demo Pack Button (IO, Admin per PRD) */}
          {canGenerateDemoPack && (
            <button
              onClick={handleGenerateDemoPack}
              disabled={generatingDemoPack}
              className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-600 to-[#E87722] hover:from-amber-700 hover:to-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Sparkles size={14} className={`mr-1.5 ${generatingDemoPack ? 'animate-spin' : ''}`} />
              <span>{generatingDemoPack ? 'Generating 5 Items...' : 'Generate Demo Pack'}</span>
            </button>
          )}

          {canUpload && (
            <button
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center px-3.5 py-2 bg-[#14213D] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Plus size={14} className="mr-1 text-amber-400" />
              <span>Upload Evidence</span>
            </button>
          )}
        </div>
      </div>

      {demoPackFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{demoPackFeedback}</span>
          </div>
          <button
            onClick={() => setDemoPackFeedback(null)}
            className="text-emerald-700 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, file name, SHA-256, or case..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14213D] text-slate-800"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14213D] text-slate-700"
        >
          <option value="ALL">All Evidence Types</option>
          <option value="FIR">FIR</option>
          <option value="Witness Statement">Witness Statement</option>
          <option value="Forensic Report">Forensic Report</option>
          <option value="Charge Sheet">Charge Sheet</option>
          <option value="Digital Evidence">Digital Evidence</option>
          <option value="Court Order">Court Order</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-[#14213D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading sealed documents from vault...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <FileText size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No documents found in vault.</p>
            <p className="max-w-md mx-auto text-slate-500">
              Click <strong>"Generate Demo Pack"</strong> to automatically create synthetic PDFs (FIR with Meera Kulkarni, witness statement, forensic report, charge sheet, and video) or upload your own file.
            </p>
            {canGenerateDemoPack && (
              <button
                onClick={handleGenerateDemoPack}
                disabled={generatingDemoPack}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-600 to-[#E87722] text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                <Sparkles size={14} className="mr-1.5" />
                <span>Create Instant Demo Pack</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Evidence Document</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Case ID</th>
                  <th className="py-3 px-3">SHA-256 Fingerprint</th>
                  <th className="py-3 px-3">Size / Chunks</th>
                  <th className="py-3 px-3">Sealed By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#E87722] flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">
                            {doc.title || doc.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{doc.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {doc.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {doc.caseId}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-emerald-800 font-bold">
                        {doc.fileHash.slice(0, 8)}...{doc.fileHash.slice(-4)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {(doc.size / 1024).toFixed(1)} KB
                      <span className="text-slate-400 block text-[10px]">
                        {doc.chunkCount} chunk{doc.chunkCount > 1 ? 's' : ''}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      <span className="font-medium text-[11px]">{doc.uploadedBy}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center text-[#E87722] hover:underline font-semibold text-xs">
                        <Eye size={13} className="mr-1" />
                        <span>Inspect</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
