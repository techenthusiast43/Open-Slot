import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { resolveMetadata } from '../utils/metadata';
import { formatSlotDateTime, formatDuration, shortenAddress, getComputedStatus, SLOT_STATUS_COLORS } from '../utils/format';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ArrowLeft,
  X
} from 'lucide-react';

export default function AvailableSlotsPage({ 
  businessAddress, 
  setActivePage, 
  setSelectedSlotId 
}) {
  const {
    account,
    contract,
    readContract,
    connectWallet,
    switchNetwork,
    isBotChain,
    executeTransaction,
  } = useWeb3();

  const [businessMeta, setBusinessMeta] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Modal for booking confirmation
  const [slotToBook, setSlotToBook] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const loadSlots = useCallback(async () => {
    if (!businessAddress || !readContract) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Business Info
      const bInfo = await readContract.businesses(businessAddress);
      const meta = await resolveMetadata(businessAddress, bInfo.metadataURI);
      setBusinessMeta(meta);

      // 2. Slot IDs
      const slotIds = await readContract.getBusinessSlotIds(businessAddress);

      if (slotIds.length === 0) {
        setAllSlots([]);
        setIsLoading(false);
        return;
      }

      // 3. Batch load
      const rawBatch = await readContract.getSlotsBatch(slotIds);

      const parsed = slotIds.map((idBig, idx) => {
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

      // Sort by chronological start time
      parsed.sort((a, b) => a.startTime - b.startTime);
      setAllSlots(parsed);
    } catch (err) {
      console.warn('Failed to load slots for business:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessAddress, readContract]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Handle booking transaction
  const handleConfirmBooking = async () => {
    if (!slotToBook) return;
    setBookingError('');

    if (!account) {
      await connectWallet();
      return;
    }
    if (!isBotChain) {
      await switchNetwork();
      return;
    }

    setIsBooking(true);
    try {
      await executeTransaction(`Book Slot #${slotToBook.slotId}`, async () => {
        return await contract.bookSlot(slotToBook.slotId);
      });
      setSlotToBook(null);
      await loadSlots();
      setActivePage('my-bookings');
    } catch (err) {
      console.error('Booking failed:', err);
      setBookingError(err.reason || err.message || 'Transaction failed.');
    } finally {
      setIsBooking(false);
    }
  };

  // Group slots by date string (YYYY-MM-DD in local time)
  const slotsForSelectedDate = allSlots.filter((s) => {
    const slotLocalDate = new Date(s.startTime * 1000).toISOString().split('T')[0];
    return slotLocalDate === selectedDate;
  });

  // Calculate upcoming days for calendar navigation
  const datesList = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = d.getDate();
    const countForDay = allSlots.filter((s) => {
      const sDate = new Date(s.startTime * 1000).toISOString().split('T')[0];
      return sDate === dateStr && s.computedStatus === 'Available';
    }).length;

    return { dateStr, dayName, dayNum, countForDay };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Back button */}
      <button
        onClick={() => setActivePage('businesses')}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Businesses</span>
      </button>

      {/* Business Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <img
            src={businessMeta?.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${businessAddress}`}
            alt={businessMeta?.name || 'Business'}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border border-slate-700 object-cover shadow"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                {businessMeta?.name || 'Business Schedule'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {businessMeta?.category || 'Provider'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-lg line-clamp-2">
              {businessMeta?.description || 'Registered on-chain appointment provider.'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-500">
              <span>{shortenAddress(businessAddress, 6)}</span>
              <a
                href={`${BOT_CHAIN_CONFIG.blockExplorerUrl}/address/${businessAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-sans"
              >
                <span>BOTScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={loadSlots}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors self-end sm:self-auto"
          title="Refresh Slots"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Timezone Notice Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>
            Displaying slots in your local timezone:{' '}
            <strong className="text-white">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          All slots verified on-chain via Unix UTC timestamps
        </span>
      </div>

      {/* Calendar Strip */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-400" />
          <span>Select Date</span>
        </h2>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {datesList.map((d) => {
            const isSelected = d.dateStr === selectedDate;
            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase">{d.dayName}</span>
                <span className="text-xl font-extrabold my-0.5">{d.dayNum}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : d.countForDay > 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-600'
                  }`}
                >
                  {d.countForDay > 0 ? `${d.countForDay} open` : 'none'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Slots Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            Available Slots for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
          <span className="text-xs text-slate-400">
            {slotsForSelectedDate.length} slot{slotsForSelectedDate.length === 1 ? '' : 's'} on this day
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
            Loading slots...
          </div>
        ) : slotsForSelectedDate.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/30 border border-slate-800 text-center">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">No open slots on this date</h4>
            <p className="text-xs text-slate-400">
              Please choose another date above or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {slotsForSelectedDate.map((slot) => {
              const isAvailable = slot.computedStatus === 'Available';
              const statusStyle = SLOT_STATUS_COLORS[slot.computedStatus] || SLOT_STATUS_COLORS.Expired;

              return (
                <div
                  key={slot.slotId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isAvailable
                      ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-400">
                      Slot #{slot.slotId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {slot.computedStatus}
                    </span>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>{slot.dateInfo.localTimeOnly}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Duration: {formatDuration(slot.duration)}
                    </div>
                  </div>

                  {isAvailable ? (
                    <button
                      onClick={() => {
                        setSlotToBook(slot);
                        setBookingError('');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow shadow-blue-500/20"
                    >
                      Book This Slot
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800/50 text-slate-500 text-xs font-semibold cursor-not-allowed"
                    >
                      Unavailable
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {slotToBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setSlotToBook(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Appointment Booking</h3>
                <p className="text-xs text-slate-400">OpenSlot on BOT Chain</p>
              </div>
            </div>

            {bookingError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Summary Details */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Service Provider:</span>
                <span className="font-semibold text-white">{businessMeta?.name || shortenAddress(businessAddress)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slot ID:</span>
                <span className="font-mono text-blue-400">#{slotToBook.slotId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-semibold text-white">{slotToBook.dateInfo.local}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="font-semibold text-white">{formatDuration(slotToBook.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Connected Wallet:</span>
                <span className="font-mono text-slate-300">{shortenAddress(account, 6)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-500">
                <span>Network Fee:</span>
                <span>Standard BOT Gas</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSlotToBook(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isBooking ? 'Broadcasting...' : 'Confirm & Reserve'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

