import React from 'react';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { Calendar, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Concept */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white">OpenSlot</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Decentralized, non-custodial appointment-booking infrastructure built natively on BOT Chain.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Zero-fee scheduling, pure on-chain state</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Navigation</div>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => setActivePage('landing')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Home & Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('businesses')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Browse Businesses
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('my-bookings')}
                  className="hover:text-blue-400 transition-colors"
                >
                  My Appointments
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('register')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Register Business
                </button>
              </li>
            </ul>
          </div>

          {/* BOT Chain Testnet Specs */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider">BOT Chain Testnet</div>
            <ul className="space-y-1.5 text-slate-400 font-mono text-[11px]">
              <li>Chain ID: <span className="text-slate-300">968 (0x3c8)</span></li>
              <li>Token: <span className="text-slate-300">BOT (18 decimals)</span></li>
              <li>Total Supply: <span className="text-slate-300">150 Million</span></li>
              <li>RPC: <span className="text-slate-300">rpc.bohr.life</span></li>
            </ul>
          </div>

          {/* Developer Resources */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Ecosystem Resources</div>
            <ul className="space-y-1.5">
              <li>
                <a
                  href={BOT_CHAIN_CONFIG.faucetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                >
                  <span>Testnet Faucet</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href={BOT_CHAIN_CONFIG.blockExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                >
                  <span>BOTScan Explorer</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://dev-docs.botchain.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                >
                  <span>BOT Chain Docs</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} OpenSlot dApp. Fully functional Web3 MVP on BOT Chain.
          </div>
          <div className="flex items-center gap-1">
            <span>Built for decentralized communities on</span>
            <span className="font-semibold text-slate-400">BOT Chain</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

