import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, X } from 'lucide-react';

export default function TransactionModal() {
  const { txStatus, clearTxStatus } = useWeb3();

  if (txStatus.state === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <button
          onClick={clearTxStatus}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Status Icon */}
          {txStatus.state === 'pending' && (
            <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {txStatus.state === 'confirming' && (
            <div className="w-16 h-16 mb-4 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {txStatus.state === 'success' && (
            <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          {txStatus.state === 'error' && (
            <div className="w-16 h-16 mb-4 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">
            {txStatus.state === 'pending' && 'Signature Required'}
            {txStatus.state === 'confirming' && 'Transaction Broadcasted'}
            {txStatus.state === 'success' && 'Transaction Successful!'}
            {txStatus.state === 'error' && 'Transaction Error'}
          </h3>

          {/* Message */}
          <p className="text-sm text-slate-400 mb-6 max-h-32 overflow-y-auto px-2">
            {txStatus.message}
          </p>

          {/* Block Explorer Link */}
          {txStatus.hash && (
            <a
              href={`${BOT_CHAIN_CONFIG.blockExplorerUrl}/tx/${txStatus.hash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
            >
              <span>View on BOTScan Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Action button */}
          {(txStatus.state === 'success' || txStatus.state === 'error') && (
            <button
              onClick={clearTxStatus}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-colors bg-slate-800 hover:bg-slate-700 text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

