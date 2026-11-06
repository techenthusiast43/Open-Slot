import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { resolveMetadata } from '../utils/metadata';
import { formatSlotDateTime, formatDuration, shortenAddress, getComputedStatus, SLOT_STATUS_COLORS } from '../utils/format';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  Globe, 
  Mail, 
  AlertTriangle 
} from 'lucide-react';

export default function BookingDetailsPage({ slotId, setActivePage, setSelectedBusiness }) {
  const {
    account,
    contract,
    readContract,
    executeTransaction,
  } = useWeb3();

  const [slotData, setSlotData] = useState(null);
  const [businessMeta, setBusinessMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const loadDetails = useCallback(async () => {
    if (!slotId || !readContract) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const s = await readContract.getSlot(slotId);
      const businessAddr = s.business;
      const rawStatus = Number(s.status);
      const customerAddr = s.customer;
      const startTime = Number(s.startTime);
      const duration = Number(s.duration);
      const computedStatus = getComputedStatus(rawStatus, startTime);

      const parsedSlot = {
        slotId: Number(slotId),
        businessAddr,
        customerAddr,
        rawStatus,
        computedStatus,
        startTime,
        duration,
        dateInfo: formatSlotDateTime(startTime),
      };
      setSlotData(parsedSlot);

      // Business meta
      const bInfo = await readContract.businesses(businessAddr);
      const meta = await resolveMetadata(businessAddr, bInfo.metadataURI);
      setBusinessMeta(meta);
    } catch (err) {
      console.warn(`Failed to load slot #${slotId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [slotId, readContract]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Actions
  const handleCustomerCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setActionError('');
    try {
      await executeTransaction(`Cancel Booking #${slotId}`, async () => {
        return await contract.cancelBooking(slotId);
      });
      await loadDetails();
    } catch (err) {
      setActionError(err.reason || err.message || 'Cancellation failed.');
    }
  };

  const handleBusinessConfirm = async () => {
    setActionError('');
    try {
      await executeTransaction(`Confirm Booking #${slotId}`, async () => {
        return await contract.confirmBooking(slotId);
      });
      await loadDetails();
    } catch (err) {
      setActionError(err.reason || err.message || 'Confirmation failed.');
    }
  };

  const handleBusinessCancelSlot = async () => {
    if (!window.confirm('Cancel this unbooked slot?')) return;
    setActionError('');
    try {
      await executeTransaction(`Cancel Slot #${slotId}`, async () => {
        return await contract.cancelSlot(slotId);
      });
      await loadDetails();
    } catch (err) {
      setActionError(err.reason || err.message || 'Cancellation failed.');
    }
  };

  if (!slotId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <p className="text-sm text-slate-400 mb-4">No appointment slot specified.</p>
        <button
          onClick={() => setActivePage('businesses')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Browse Businesses
        </button>
      </div>
    );
  }

  const isCustomer = account && slotData && account.toLowerCase() === slotData.customerAddr.toLowerCase();
  const isBusiness = account && slotData && account.toLowerCase() === slotData.businessAddr.toLowerCase();
  const statusStyle = slotData ? (SLOT_STATUS_COLORS[slotData.computedStatus] || SLOT_STATUS_COLORS.Expired) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Back button */}
      <button
        onClick={() => setActivePage(isBusiness ? 'dashboard' : 'my-bookings')}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {isBusiness ? 'Business Dashboard' : 'My Bookings'}</span>
      </button>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
          Loading slot #{slotId} details from BOT Chain...
        </div>
      ) : !slotData ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-2">Slot #{slotId} Not Found</h3>
          <p className="text-xs text-slate-400 mb-4">
            This appointment slot does not exist on the current OpenSlot contract.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {actionError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Main Card */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-8">
            
            {/* Header: Slot ID + Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  #{slotData.slotId}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white">
                    Appointment Slot #{slotData.slotId}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Decentralized on-chain appointment record
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border self-start sm:self-auto ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                <span>{slotData.computedStatus}</span>
              </div>
            </div>

            {/* Time & Schedule Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Date & Time */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Time & Schedule</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-slate-400">Local Time ({slotData.dateInfo.timezone}):</div>
                    <div className="text-lg font-bold text-white">{slotData.dateInfo.local}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Duration:</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {formatDuration(slotData.duration)}
                    </div>
                  </div>
                  <div className="border-t border-slate-800/80 pt-2">
                    <div className="text-[11px] text-slate-400">UTC Representation:</div>
                    <div className="font-mono text-xs text-slate-300">{slotData.dateInfo.utc}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Unix Timestamp (Seconds):</div>
                    <div className="font-mono text-xs text-blue-400">{slotData.startTime}</div>
                  </div>
                </div>
              </div>

              {/* Service Provider Info */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Business Provider</span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={businessMeta?.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${slotData.businessAddr}`}
                    alt={businessMeta?.name || 'Business'}
                    className="w-12 h-12 rounded-xl bg-slate-800 object-cover"
                  />
                  <div>
                    <div className="text-base font-bold text-white">
                      {businessMeta?.name || 'Unnamed Business'}
                    </div>
                    <div className="text-xs text-blue-400 font-medium">
                      {businessMeta?.category || 'Provider'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {businessMeta?.description || 'Registered provider on BOT Chain.'}
                </p>

                <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Address:</span>
                  <a
                    href={`${BOT_CHAIN_CONFIG.blockExplorerUrl}/address/${slotData.businessAddr}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1 font-sans"
                  >
                    <span>{shortenAddress(slotData.businessAddr, 6)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>

            {/* Customer Details */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <span>Customer Reservation</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="font-mono text-sm text-white">
                  {slotData.customerAddr === '0x0000000000000000000000000000000000000000'
                    ? 'No customer has booked this slot yet.'
                    : slotData.customerAddr}
                </div>
                {slotData.customerAddr !== '0x0000000000000000000000000000000000000000' && (
                  <a
                    href={`${BOT_CHAIN_CONFIG.blockExplorerUrl}/address/${slotData.customerAddr}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-sans"
                  >
                    <span>View Customer on BOTScan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Contextual Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4">
              {/* Customer Actions */}
              {isCustomer && (slotData.computedStatus === 'Booked' || slotData.computedStatus === 'Confirmed') && !slotData.dateInfo.isPast && (
                <button
                  onClick={handleCustomerCancel}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel My Booking</span>
                </button>
              )}

              {/* Business Actions */}
              {isBusiness && slotData.computedStatus === 'Booked' && (
                <button
                  onClick={handleBusinessConfirm}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Appointment</span>
                </button>
              )}

              {isBusiness && slotData.computedStatus === 'Available' && (
                <button
                  onClick={handleBusinessCancelSlot}
                  className="px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Unbooked Slot</span>
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedBusiness(slotData.businessAddr);
                  setActivePage('available-slots');
                }}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-2 ml-auto"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>View Full Provider Calendar</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

