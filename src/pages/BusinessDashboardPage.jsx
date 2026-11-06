import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { resolveMetadata } from '../utils/metadata';
import { formatSlotDateTime, formatDuration, shortenAddress, getComputedStatus, SLOT_STATUS_COLORS } from '../utils/format';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  RefreshCw, 
  ExternalLink, 
  Filter, 
  AlertCircle,
  Eye
} from 'lucide-react';

export default function BusinessDashboardPage({ setActivePage, setSelectedSlotId }) {
  const {
    account,
    contract,
    readContract,
    executeTransaction,
    isRegisteredBusiness,
    connectWallet,
  } = useWeb3();

  const [businessMeta, setBusinessMeta] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'BOOKED' | 'CONFIRMED' | 'AVAILABLE' | 'CANCELLED'

  // Load business slots
  const loadDashboardData = useCallback(async () => {
    if (!account || !readContract) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Load business metadata
      const bInfo = await readContract.businesses(account);
      const meta = await resolveMetadata(account, bInfo.metadataURI);
      setBusinessMeta(meta);

      // 2. Load slot IDs
      const slotIds = await readContract.getBusinessSlotIds(account);

      if (slotIds.length === 0) {
        setSlots([]);
        setIsLoading(false);
        return;
      }

      // 3. Batch load slot data using contract.getSlotsBatch
      const rawBatch = await readContract.getSlotsBatch(slotIds);

      const parsedSlots = slotIds.map((idBig, idx) => {
        const raw = rawBatch[idx];
        const slotId = Number(idBig);
        const rawStatus = Number(raw.status);
        const startTime = Number(raw.startTime);
        const duration = Number(raw.duration);
        const customer = raw.customer;
        const computedStatus = getComputedStatus(rawStatus, startTime);

        return {
          slotId,
          rawStatus,
          computedStatus,
          customer,
          startTime,
          duration,
          dateInfo: formatSlotDateTime(startTime),
        };
      });

      // Sort newest / upcoming first
      parsedSlots.sort((a, b) => b.startTime - a.startTime);
      setSlots(parsedSlots);
    } catch (err) {
      console.warn('Failed to load business dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [account, readContract]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Actions
  const handleConfirmBooking = async (slotId) => {
    try {
      await executeTransaction(`Confirm Appointment #${slotId}`, async () => {
        return await contract.confirmBooking(slotId);
      });
      await loadDashboardData();
    } catch (err) {
      console.error('Confirmation failed:', err);
    }
  };

  const handleCancelSlot = async (slotId) => {
    if (!window.confirm(`Are you sure you want to cancel open slot #${slotId}?`)) {
      return;
    }
    try {
      await executeTransaction(`Cancel Slot #${slotId}`, async () => {
        return await contract.cancelSlot(slotId);
      });
      await loadDashboardData();
    } catch (err) {
      console.error('Cancellation failed:', err);
    }
  };

  // Metrics
  const totalSlots = slots.length;
  const bookedPending = slots.filter((s) => s.computedStatus === 'Booked').length;
  const confirmedCount = slots.filter((s) => s.computedStatus === 'Confirmed').length;
  const availableCount = slots.filter((s) => s.computedStatus === 'Available').length;
  const cancelledCount = slots.filter((s) => s.computedStatus === 'Cancelled').length;

  // Filtered slots
  const filteredSlots = slots.filter((slot) => {
    if (filter === 'ALL') return true;
    if (filter === 'BOOKED') return slot.computedStatus === 'Booked';
    if (filter === 'CONFIRMED') return slot.computedStatus === 'Confirmed';
    if (filter === 'AVAILABLE') return slot.computedStatus === 'Available';
    if (filter === 'CANCELLED') return slot.computedStatus === 'Cancelled';
    return true;
  });

  if (!account) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
          <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-slate-400 mb-6">
            Please connect your wallet to access your business appointment dashboard.
          </p>
          <button
            onClick={connectWallet}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isRegisteredBusiness) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
          <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Not Registered Yet</h2>
          <p className="text-sm text-slate-400 mb-6">
            This wallet is not yet registered as a business on BOT Chain. Register your business profile to start publishing slots.
          </p>
          <button
            onClick={() => setActivePage('register')}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white"
          >
            Register Business
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Top Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <img
            src={businessMeta?.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${account}`}
            alt={businessMeta?.name || 'Business'}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border border-slate-700 object-cover shadow"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {businessMeta?.name || 'My Business'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {businessMeta?.category || 'Provider'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl line-clamp-2">
              {businessMeta?.description || 'Registered on-chain provider on BOT Chain'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-mono">
              <span>{shortenAddress(account, 6)}</span>
              <a
                href={`${BOT_CHAIN_CONFIG.blockExplorerUrl}/address/${account}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-sans"
              >
                <span>View on BOTScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('create-slot')}
            className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Slots</span>
          </button>
          <button
            onClick={loadDashboardData}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Published</div>
          <div className="text-2xl font-bold text-white mt-1">{totalSlots}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="text-xs text-amber-400 font-medium">Pending Confirmation</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{bookedPending}</div>
        </div>
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <div className="text-xs text-blue-400 font-medium">Confirmed</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{confirmedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="text-xs text-emerald-400 font-medium">Available Open</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{availableCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-400 font-medium">Cancelled</div>
          <div className="text-2xl font-bold text-slate-400 mt-1">{cancelledCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ALL', label: `All (${totalSlots})` },
            { id: 'BOOKED', label: `Pending (${bookedPending})` },
            { id: 'CONFIRMED', label: `Confirmed (${confirmedCount})` },
            { id: 'AVAILABLE', label: `Available (${availableCount})` },
            { id: 'CANCELLED', label: `Cancelled (${cancelledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slot List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
          Fetching slots from BOT Chain Testnet...
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/30 border border-slate-800">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No appointment slots found</h3>
          <p className="text-xs text-slate-400 mb-5">
            {filter === 'ALL'
              ? 'You have not created any appointment slots yet.'
              : `No slots found matching the "${filter}" filter.`}
          </p>
          <button
            onClick={() => setActivePage('create-slot')}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white"
          >
            Create Your First Slot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlots.map((slot) => {
            const statusStyle = SLOT_STATUS_COLORS[slot.computedStatus] || SLOT_STATUS_COLORS.Expired;
            return (
              <div
                key={slot.slotId}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Slot ID & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      Slot #{slot.slotId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {slot.computedStatus}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-1.5">
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{slot.dateInfo.localTimeOnly}</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({formatDuration(slot.duration)})
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{slot.dateInfo.localDateOnly}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      UTC: {slot.dateInfo.utc}
                    </div>
                  </div>

                  {/* Customer info if booked */}
                  {slot.customer && slot.customer !== '0x0000000000000000000000000000000000000000' && (
                    <div className="mt-4 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">
                        Reserved Customer:
                      </div>
                      <div className="font-mono text-slate-200 mt-0.5 flex items-center justify-between">
                        <span>{shortenAddress(slot.customer, 6)}</span>
                        <a
                          href={`${BOT_CHAIN_CONFIG.blockExplorerUrl}/address/${slot.customer}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSlotId(slot.slotId);
                      setActivePage('booking-details');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  {/* If Booked: Confirm Booking */}
                  {slot.computedStatus === 'Booked' && (
                    <button
                      onClick={() => handleConfirmBooking(slot.slotId)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </button>
                  )}

                  {/* If Available: Cancel unbooked slot */}
                  {slot.computedStatus === 'Available' && (
                    <button
                      onClick={() => handleCancelSlot(slot.slotId)}
                      className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

