import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  Shield,
  Lock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Copy,
  Check,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CaseRecord, PipelineStepEvent, PipelineResult, NavItemKey } from '../../types';
import { MerkleTreeDiagram } from '../common/MerkleTreeDiagram';

interface UploadPageProps {
  onNavigate: (key: NavItemKey) => void;
  onSelectDocument?: (docId: string) => void;
}

const STEP_DEFINITIONS: {
  key: PipelineStepEvent['step'];
  name: string;
  desc: string;
}[] = [
  { key: 'scan', name: '1. Scan', desc: 'Magic bytes, MIME check & 25MB cap' },
  { key: 'read', name: '2. Read', desc: 'Stream buffering & text extraction' },
  { key: 'tag', name: '3. Tag', desc: 'Case binding & victim entity flags' },
  { key: 'seal', name: '4. Seal', desc: 'SHA-256 & Merkle tree calculation' },
  { key: 'lock', name: '5. Lock', desc: 'AES-256-GCM envelope encryption' },
  { key: 'store', name: '6. Store', desc: 'Partitioned blobs in Firestore' },
  { key: 'record', name: '7. Record', desc: 'Ledger block seal (Stage 3 preview)' },
];

export const UploadPage: React.FC<UploadPageProps> = ({ onNavigate, onSelectDocument }) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [docType, setDocType] = useState('FIR');
  const [confidentiality, setConfidentiality] = useState('CONFIDENTIAL');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [stepEvents, setStepEvents] = useState<Record<string, PipelineStepEvent>>({});
  const [uploadResult, setUploadResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/cases')
      .then((res) => res.json())
      .then((data) => {
        if (data.cases && data.cases.length > 0) {
          setCases(data.cases);
          setSelectedCaseId(data.cases[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!title) setTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an evidence file to upload.');
      return;
    }
    if (!selectedCaseId) {
      setError('Please select an active investigation case.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);
    setStepEvents({});
    setActiveStep(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', selectedCaseId);
    formData.append('type', docType);
    formData.append('confidentiality', confidentiality);
    if (title) formData.append('title', title);

    try {
      // Use SSE streaming for real step timings
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || 'Upload failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream unavailable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const [eventPart, dataPart] = line.split('\n');
          const eventType = eventPart?.replace('event: ', '').trim();
          const jsonStr = dataPart?.replace('data: ', '').trim();

          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (eventType === 'step') {
              const stepEv = data as PipelineStepEvent;
              setStepEvents((prev) => ({ ...prev, [stepEv.step]: stepEv }));
              setActiveStep(stepEv.stepNumber);
            } else if (eventType === 'complete') {
              setUploadResult(data as PipelineResult);
              setActiveStep(7);
            } else if (eventType === 'error') {
              throw new Error(data.error || 'Pipeline execution failed');
            }
          } catch (jsonErr) {
            console.warn('Failed parsing SSE payload:', jsonStr);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during cryptographic sealing.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setUploadResult(null);
    setError(null);
    setStepEvents({});
    setActiveStep(-1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              7-Step Evidence Ingestion Pipeline
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#E87722] border border-amber-200">
              PRD FR1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scan &gt; Read &gt; Tag &gt; Seal (SHA-256 + Merkle) &gt; Lock (AES-256-GCM) &gt; Store &gt; Record
          </p>
        </div>

        <button
          onClick={() => onNavigate('documents')}
          className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
        >
          <Layers size={14} className="mr-1.5 text-slate-600" />
          <span>View Sealed Vault</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Form & Configuration */}
        <div className="lg:col-span-6 space-y-5">
          <form onSubmit={handleStartUpload} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Evidence Metadata & Envelope Configuration
            </h2>

            {/* Case Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Investigation Docket (Case)
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                disabled={uploading}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14213D] text-slate-800"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Title & Document Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={uploading}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14213D] text-slate-800"
                >
                  <option value="FIR">FIR (First Information Report)</option>
                  <option value="Witness Statement">Witness Statement (Sec 180)</option>
                  <option value="Forensic Report">Forensic Analysis Report</option>
                  <option value="Charge Sheet">Police Charge Sheet (Sec 193)</option>
                  <option value="Digital Evidence">Digital Media Exhibit</option>
                  <option value="Court Order">Judicial Order / Warrant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confidentiality Level
                </label>
                <select
                  value={confidentiality}
                  onChange={(e) => setConfidentiality(e.target.value)}
                  disabled={uploading}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14213D] text-slate-800"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="RESTRICTED">Restricted</option>
                  <option value="CONFIDENTIAL">Confidential</option>
                  <option value="SECRET">Secret (Victim Protected)</option>
                </select>
              </div>
            </div>

            {/* Custom Label */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Evidence Title / Exhibit Label
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Primary FIR Signed by Informant"
                disabled={uploading}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14213D] text-slate-800"
              />
            </div>

            {/* Drag & Drop File Zone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select File Payload (Allowlist: PDF, PNG, JPG, TXT, MP4, BIN &le; 25MB)
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-slate-300 hover:border-[#14213D] bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.mp4,.bin,.dat"
                />

                {file ? (
                  <div className="space-y-1">
                    <FileCheck size={32} className="mx-auto text-emerald-600 mb-1" />
                    <p className="text-xs font-bold text-slate-900">{file.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || 'Binary Stream'}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold underline block mt-2">
                      Click to choose a different file
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud size={32} className="mx-auto text-[#E87722] mb-1" />
                    <p className="text-xs font-semibold text-slate-800">
                      Drag & Drop legal evidence file here, or{' '}
                      <span className="text-[#E87722] underline">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Maximum 25 MB • SHA-256 computed on stream
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 px-4 bg-[#14213D] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Sealing Evidence Pipeline...</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-amber-400" />
                  <span>Execute 7-Step Pipeline & Seal In Vault</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: 7-Step Animated Stepper & Cryptographic Results */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Pipeline Execution Status
              </h2>
              {uploading && (
                <span className="text-[10px] font-mono text-[#E87722] animate-pulse">
                  Streaming Real-Time Events...
                </span>
              )}
            </div>

            {/* Stepper Steps */}
            <div className="space-y-3">
              {STEP_DEFINITIONS.map((def, idx) => {
                const stepNumber = idx + 1;
                const ev = stepEvents[def.key];
                const isCompleted = ev?.status === 'completed' || (uploadResult && activeStep >= stepNumber);
                const isInProgress = ev?.status === 'in_progress' || (uploading && activeStep === stepNumber);
                const isFailed = ev?.status === 'failed';

                return (
                  <div
                    key={def.key}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                        : isInProgress
                        ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20 text-slate-900'
                        : isFailed
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-slate-50/50 border-slate-200 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : isInProgress ? (
                          <div className="w-4 h-4 border-2 border-[#E87722] border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {stepNumber}
                          </div>
                        )}
                        <span className="font-bold text-xs">{def.name}</span>
                      </div>

                      {ev?.durationMs !== undefined && (
                        <span className="font-mono text-[10px] text-slate-400">
                          {ev.durationMs}ms
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 pl-6">
                      {ev?.details || def.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upload Complete Summary & Merkle Diagram */}
          {uploadResult && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm mb-3">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Evidence Sealed & Authenticated</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Document ID:</span>
                    <span className="font-mono text-slate-900 block font-semibold">
                      {uploadResult.documentId}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">SHA-256 Fingerprint:</span>
                      <button
                        onClick={() => handleCopy(uploadResult.fileHash)}
                        className="text-[10px] text-[#E87722] font-semibold hover:underline flex items-center space-x-1"
                      >
                        {copiedHash === uploadResult.fileHash ? <Check size={11} /> : <Copy size={11} />}
                        <span>Copy SHA-256</span>
                      </button>
                    </div>
                    <code className="block bg-white p-2 rounded border border-emerald-200 font-mono text-[11px] break-all text-emerald-950 font-bold mt-0.5">
                      {uploadResult.fileHash}
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Merkle Root:</span>
                      <button
                        onClick={() => handleCopy(uploadResult.merkleRoot)}
                        className="text-[10px] text-[#E87722] font-semibold hover:underline flex items-center space-x-1"
                      >
                        {copiedHash === uploadResult.merkleRoot ? <Check size={11} /> : <Copy size={11} />}
                        <span>Copy Merkle Root</span>
                      </button>
                    </div>
                    <code className="block bg-white p-2 rounded border border-emerald-200 font-mono text-[11px] break-all text-amber-950 font-bold mt-0.5">
                      {uploadResult.merkleRoot}
                    </code>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center text-xs text-slate-700 font-semibold hover:text-slate-900"
                  >
                    <RotateCcw size={13} className="mr-1" />
                    <span>Upload Another</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onSelectDocument) onSelectDocument(uploadResult.documentId);
                      onNavigate('documents');
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-[#14213D] text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <span>Inspect Document Details</span>
                    <ArrowRight size={13} className="ml-1 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Small Merkle Tree Diagram */}
              <MerkleTreeDiagram
                merkleTree={uploadResult.merkleTree}
                merkleRoot={uploadResult.merkleRoot}
                chunkHashes={uploadResult.chunkHashes}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
