import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  GitCommit,
  Calendar,
  Layers,
  FileText,
  User,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { DocumentRecord, NavItemKey } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CryptoTooltip } from '../common/CryptoTooltip';
import { MerkleTreeDiagram } from '../common/MerkleTreeDiagram';

interface DocumentDetailPageProps {
  documentId: string;
  onBack: () => void;
  onNavigate: (key: NavItemKey) => void;
}

export const DocumentDetailPage: React.FC<DocumentDetailPageProps> = ({
  documentId,
  onBack,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${documentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.document) {
          setDoc(data.document);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/download`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || errJson.error || 'Download failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc?.name || 'evidence_download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setDownloadError(err.message || 'Error occurred while decrypting evidence file.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-2 border-[#14213D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Decrypting metadata from vault...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-bold text-slate-800">Document record not found.</p>
        <button
          onClick={onBack}
          className="mt-3 px-4 py-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
        >
          Return to Vault
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          <span>Back to Vault Records</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center px-4 py-2 bg-[#14213D] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <Download size={14} className={`mr-1.5 text-amber-400 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Decrypting on Server...' : 'Download Original File'}</span>
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Main Metadata Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-xs font-bold text-[#E87722]">
                {doc.caseId}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                {doc.type}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {doc.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{doc.title || doc.name}</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Original Payload: {doc.name} ({(doc.size / 1024).toFixed(1)} KB, {doc.mime})
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Sealed In Vault
            </span>
            <span className="font-semibold text-slate-800">
              {new Date(doc.createdAt).toLocaleString()}
            </span>
            <span className="block text-[11px] text-slate-500">
              Officer: {doc.uploadedBy}
            </span>
          </div>
        </div>

        {/* Cryptographic Fingerprints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SHA-256 File Hash */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  <CryptoTooltip term="SHA-256">SHA-256 Fingerprint</CryptoTooltip>
                </span>
              </div>
              <button
                onClick={() => handleCopy(doc.fileHash, 'sha256')}
                className="text-[10px] text-[#E87722] font-semibold hover:underline flex items-center space-x-1"
              >
                {copiedKey === 'sha256' ? <Check size={12} /> : <Copy size={12} />}
                <span>Copy</span>
              </button>
            </div>
            <code className="block bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] break-all text-slate-900 font-bold select-all">
              {doc.fileHash}
            </code>
            <p className="text-[10px] text-slate-500">
              Unique deterministic digest of the untouched file bytes.
            </p>
          </div>

          {/* Merkle Root Hash */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <GitCommit size={16} className="text-[#E87722]" />
                <span className="text-xs font-bold text-slate-900">
                  <CryptoTooltip term="Merkle Root">Merkle Root Hash</CryptoTooltip>
                </span>
              </div>
              <button
                onClick={() => handleCopy(doc.merkleRoot, 'merkle')}
                className="text-[10px] text-[#E87722] font-semibold hover:underline flex items-center space-x-1"
              >
                {copiedKey === 'merkle' ? <Check size={12} /> : <Copy size={12} />}
                <span>Copy</span>
              </button>
            </div>
            <code className="block bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] break-all text-slate-900 font-bold select-all">
              {doc.merkleRoot}
            </code>
            <p className="text-[10px] text-slate-500">
              Unified tree root fingerprinting all {doc.chunkCount} partitioned chunk leaves.
            </p>
          </div>
        </div>

        {/* Envelope Encryption Architecture */}
        {doc.encryption && (
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Lock size={15} className="text-amber-400" />
                <span className="font-bold text-amber-300">
                  AES-256-GCM Envelope Encryption Architecture
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                DEK + KEK Sealed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Algorithm:</span>
                <span className="text-slate-200 font-bold">{doc.encryption.alg}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Payload IV:</span>
                <span className="text-slate-200 truncate block">{doc.encryption.iv}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">GCM Auth Tag:</span>
                <span className="text-emerald-300 font-bold">{doc.encryption.authTag}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-mono mb-1">
                Wrapped DEK (Encrypted under Vault Master Key):
              </span>
              <code className="block bg-slate-950 p-2 rounded border border-slate-800 text-[10px] break-all font-mono text-slate-300">
                {doc.encryption.wrappedDek}
              </code>
            </div>
          </div>
        )}

        {/* Chunk Hashes Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chunk Partition Table ({doc.chunkCount} Leaf Chunks)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Storage Ref: {doc.storageRef}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Leaf Index</th>
                  <th className="py-2.5 px-3">SHA-256 Chunk Hash</th>
                  <th className="py-2.5 px-3">Partition Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {doc.chunkHashes.map((chunkHash, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 font-bold">
                      Chunk #{i + 1}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 break-all select-all font-semibold">
                      {chunkHash}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 whitespace-nowrap">
                      Sealed &le; 500KB
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
