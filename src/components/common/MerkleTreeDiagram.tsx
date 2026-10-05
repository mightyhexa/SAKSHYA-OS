import React, { useState } from 'react';
import { GitCommit, Copy, Check, Info } from 'lucide-react';

interface MerkleTreeDiagramProps {
  merkleTree?: string[][]; // Levels from leaves [0] to root [n]
  merkleRoot: string;
  chunkHashes: string[];
}

export const MerkleTreeDiagram: React.FC<MerkleTreeDiagramProps> = ({
  merkleTree,
  merkleRoot,
  chunkHashes,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  // If full tree levels are provided, render level by level from root down to leaves
  const levels = merkleTree && merkleTree.length > 0
    ? [...merkleTree].reverse() // [Root, branches..., leaves]
    : [[merkleRoot], chunkHashes];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <GitCommit size={18} className="text-[#E87722]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Cryptographic Merkle Tree Structure
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
          Odd-Leaf Duplication Rule
        </span>
      </div>

      <div className="space-y-4 overflow-x-auto py-2">
        {levels.map((levelNodes, levelIndex) => {
          const isRootLevel = levelIndex === 0;
          const isLeafLevel = levelIndex === levels.length - 1;
          const levelName = isRootLevel
            ? 'Merkle Root'
            : isLeafLevel
            ? `Chunk Leaves (${levelNodes.length})`
            : `Branch Level ${levels.length - 1 - levelIndex}`;

          return (
            <div key={levelIndex} className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {levelName}
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {levelNodes.map((hash, nodeIdx) => {
                  const isCopied = copiedHash === hash;
                  return (
                    <div
                      key={nodeIdx}
                      onClick={() => handleCopy(hash)}
                      title={`Click to copy: ${hash}`}
                      className={`group relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                        isRootLevel
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50'
                          : isLeafLevel
                          ? 'bg-slate-800/80 border-slate-700 text-emerald-300 hover:bg-slate-700'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400">
                        {isRootLevel ? 'ROOT' : isLeafLevel ? `L${nodeIdx}` : `B${nodeIdx}`}:
                      </span>
                      <span className="font-semibold">{hash.slice(0, 8)}...{hash.slice(-4)}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center space-x-1">
          <Info size={12} />
          <span>Click any node hash to copy 64-character SHA-256 fingerprint</span>
        </span>
        <span className="text-slate-500 font-mono">Algorithm: SHA-256 binary concat</span>
      </div>
    </div>
  );
};
