import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  Compass, 
  Layers, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ setActivePage, setSelectedBusiness }) {
  const { readContract, isRegisteredBusiness, account } = useWeb3();
  const [stats, setStats] = useState({
    businessCount: 0,
    slotCount: 0,
  });

  useEffect(() => {
    async function loadStats() {
      if (!readContract) return;
      try {
        const count = await readContract.getRegisteredBusinessesCount();
        const nextId = await readContract.nextSlotId();
        setStats({
          businessCount: Number(count),
          slotCount: Math.max(0, Number(nextId) - 1),
        });
      } catch (err) {
        console.warn('Could not load landing stats:', err);
      }
    }
    loadStats();
  }, [readContract]);

  return (
    <div className="space-y-16 pb-16 animate-fade-in">
      
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 text-center max-w-4xl mx-auto px-4">
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Next-Generation Appointment Scheduling on BOT Chain</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Decentralized Appointments. <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Trustless, Gas-Optimized, Open.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          OpenSlot allows service providers to publish open calendar slots and enables clients to reserve appointments directly through connected Web3 wallets.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setActivePage('businesses')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Businesses & Book</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActivePage(isRegisteredBusiness ? 'dashboard' : 'register')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all flex items-center justify-center gap-2 hover:border-slate-600"
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>{isRegisteredBusiness ? 'Go to Business Dashboard' : 'List Your Business'}</span>
          </button>
        </div>

        {/* Live Network Metrics Banner */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-left p-3">
            <div className="text-xs text-slate-400 font-medium">Network</div>
            <div className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              BOT Testnet
            </div>
            <div className="text-[11px] text-slate-500">Chain ID: 968</div>
          </div>

          <div className="text-left p-3 border-l border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Registered Providers</div>
            <div className="text-2xl font-bold text-white mt-0.5">{stats.businessCount}</div>
            <div className="text-[11px] text-blue-400 font-medium">On-chain registry</div>
          </div>

          <div className="text-left p-3 border-l border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Published Slots</div>
            <div className="text-2xl font-bold text-white mt-0.5">{stats.slotCount}</div>
            <div className="text-[11px] text-indigo-400 font-medium">Total created</div>
          </div>

          <div className="text-left p-3 border-l border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Block Explorer</div>
            <a
              href={BOT_CHAIN_CONFIG.blockExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1"
            >
              <span>BOTScan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="text-[11px] text-slate-500">rpc.bohr.life</div>
          </div>
        </div>
      </section>

      {/* Core Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Why OpenSlot on BOT Chain?</h2>
          <p className="mt-2 text-sm text-slate-400">
            Engineered with strict smart contract guarantees and frictionless UX.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Double-Booking Guarantee</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Solidity smart contract level protection guarantees that a reserved slot cannot be reserved by another customer under any race condition.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ultra-Gas Optimized (2 Slots)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Storage packing reduces slot footprint to two 32-byte words using uint48 unix timestamps, minimizing transaction fees on BOT Chain.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-sky-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Timezone & Expiry Aware</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unix seconds timestamps are stored strictly on-chain while the frontend seamlessly handles local and UTC timezone conversion.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            How OpenSlot Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Providers */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-blue-400 font-bold mb-4">
                <Building2 className="w-5 h-5" />
                <span>For Businesses & Providers</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <span><strong>Register Profile:</strong> Connect your wallet and publish your business details with off-chain metadata.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <span><strong>Publish Slots:</strong> Create individual or batch appointment slots for upcoming days with custom durations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span><strong>Confirm & Manage:</strong> Confirm appointments booked by customers or cancel unbooked slots anytime.</span>
                </li>
              </ul>
            </div>

            {/* For Customers */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-indigo-400 font-bold mb-4">
                <UserCheck className="w-5 h-5" />
                <span>For Customers & Clients</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <span><strong>Discover Businesses:</strong> Search verified businesses, specialties, and service providers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <span><strong>Select Time Slot:</strong> View interactive calendar availability converted automatically to your local timezone.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span><strong>Reserve with Wallet:</strong> Book the slot instantly without intermediaries. Cancel anytime prior to start.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

