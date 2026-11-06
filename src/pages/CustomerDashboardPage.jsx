import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { resolveMetadata } from '../utils/metadata';
import { formatSlotDateTime, formatDuration, shortenAddress, getComputedStatus, SLOT_STATUS_COLORS } from '../utils/format';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  Building2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  Compass,
  AlertTriangle
} from 'lucide-react';

export default function CustomerDashboardPage({ setActivePage, setSelectedSlotId, setSelectedBusiness }) {
  const {
    account,
    contract,
    readContract,
    executeTransaction,
    connectWallet,
  } = useWeb3();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'CONFIRMED' | 'PAST' | 'CANCELLED'

  const loadCustomerBookings = useCallback(async () => {
    if (!account || !readContract) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch customer slot IDs
      const slotIds = await readContract.getCustomerSlotIds(account);

      if (slotIds.length === 0) {
        setBookings([]);
        setIsLoading(false);
        return;
      }

      // 2. Batch fetch slot structs
      const rawBatch = await readContract.getSlotsBatch(slotIds);

      // 3. Resolve business metadata for each
      const parsedBookings = await Promise.all(
        slotIds.map(async (idBig, idx) => {
          const raw = rawBatch[idx];
          const slotId = Number(idBig);
          const rawStatus = Number(raw.status);
          const startTime = Number(raw.startTime);
          const duration = Number(raw.duration);
          const businessAddr = raw.business;
          const computedStatus = getComputedStatus(rawStatus, startTime);

          let businessMeta = null;
          try {
            const bInfo = await readContract.businesses(businessAddr);
            businessMeta = await resolveMetadata(businessAddr, bInfo.metadataURI);
          } catch (e) {
            businessMeta = { name: shortenAddress(businessAddr) };
          }

          return {
            slotId,
            rawStatus,
            computedStatus,
            startTime,
            duration,
            businessAddr,
            businessMeta,
            dateInfo: formatSlotDateTime(startTime),
          };
        })
      );

      // Sort newest start time first
      parsedBookings.sort((a, b) => b.startTime - a.startTime);
      setBookings(parsedBookings);
    } catch (err) {
      console.warn('Failed to load customer bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [account, readContract]);

  useEffect(() => {
    loadCustomerBookings();
  }, [loadCustomerBookings]);

  // Customer cancellation
  const handleCancelBooking = async (slotId) => {
    if (!window.confirm(`Are you sure you want to cancel your booking for Slot #${slotId}?`)) {
      return;
    }

    try {
      await executeTransaction(`Cancel Booking #${slotId}`, async () => {
        return await contract.cancelBooking(slotId);
      });
      await loadCustomerBookings();
    } catch (err) {
      console.error('Cancellation failed:', err);
    }
  };

  // Metrics
  const totalBookings = bookings.length;
  const upcomingCount = bookings.filter(
    (b) => (b.computedStatus === 'Booked' || b.computedStatus === 'Confirmed') && !b.dateInfo.isPast
  ).length;
  const confirmedCount = bookings.filter((b) => b.computedStatus === 'Confirmed').length;
  const pastCount = bookings.filter((b) => b.dateInfo.isPast && b.computedStatus !== 'Cancelled').length;
  const cancelledCount = bookings.filter((b) => b.computedStatus === 'Cancelled').length;

  // Filter
  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    if (filter === 'UPCOMING') return (b.computedStatus === 'Booked' || b.computedStatus === 'Confirmed') && !b.dateInfo.isPast;
    if (filter === 'CONFIRMED') return b.computedStatus === 'Confirmed';
    if (filter === 'PAST') return b.dateInfo.isPast && b.computedStatus !== 'Cancelled';
    if (filter === 'CANCELLED') return b.computedStatus === 'Cancelled';
    return true;
  });

  if (!account) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
          <UserCheck className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-slate-400 mb-6">
            Please connect your wallet to view your reserved appointments and booking history.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <UserCheck className="w-4 h-4" />
            <span>Customer Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Booked Appointments</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your reserved appointments across all BOT Chain service providers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('businesses')}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Browse More Providers</span>
          </button>
          <button
            onClick={loadCustomerBookings}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Bookings"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Bookings</div>
          <div className="text-2xl font-bold text-white mt-1">{totalBookings}</div>
        </div>
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <div className="text-xs text-blue-400 font-medium">Upcoming</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{upcomingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="text-xs text-emerald-400 font-medium">Confirmed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{confirmedCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Cancelled</div>
          <div className="text-2xl font-bold text-slate-400 mt-1">{cancelledCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'ALL', label: `All (${totalBookings})` },
          { id: 'UPCOMING', label: `Upcoming (${upcomingCount})` },
          { id: 'CONFIRMED', label: `Confirmed (${confirmedCount})` },
          { id: 'PAST', label: `Past (${pastCount})` },
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

      {/* Bookings List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
          Loading your reservations from BOT Chain...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No bookings found</h3>
          <p className="text-xs text-slate-400 mb-6">
            {filter === 'ALL'
              ? 'You have not booked any appointments yet.'
              : `No appointments match the "${filter}" filter.`}
          </p>
          <button
            onClick={() => setActivePage('businesses')}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white"
          >
            Find a Service Provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((b) => {
            const statusStyle = SLOT_STATUS_COLORS[b.computedStatus] || SLOT_STATUS_COLORS.Expired;
            const canCancel =
              (b.computedStatus === 'Booked' || b.computedStatus === 'Confirmed') && !b.dateInfo.isPast;

            return (
              <div
                key={b.slotId}
                className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-slate-400 font-bold">
                      Slot #{b.slotId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {b.computedStatus}
                    </span>
                  </div>

                  {/* Business snippet */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 mb-4">
                    <img
                      src={b.businessMeta?.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${b.businessAddr}`}
                      alt={b.businessMeta?.name || 'Business'}
                      className="w-10 h-10 rounded-xl bg-slate-800 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">
                        {b.businessMeta?.name || shortenAddress(b.businessAddr)}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {b.businessMeta?.category || 'Provider'}
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>{b.dateInfo.localTimeOnly}</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({formatDuration(b.duration)})
                      </span>
                    </div>
                    <div className="text-slate-300 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{b.dateInfo.localDateOnly}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      UTC: {b.dateInfo.utc}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSlotId(b.slotId);
                      setActivePage('booking-details');
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  {canCancel && (
                    <button
                      onClick={() => handleCancelBooking(b.slotId)}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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

