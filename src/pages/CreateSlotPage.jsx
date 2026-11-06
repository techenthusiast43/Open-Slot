import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { PlusCircle, Calendar, Clock, Sparkles, AlertCircle, CheckCircle, ArrowRight, Layers } from 'lucide-react';
import { formatSlotDateTime, formatDuration } from '../utils/format';

const DURATIONS = [
  { label: '15 Minutes', value: 900 },
  { label: '30 Minutes', value: 1800 },
  { label: '45 Minutes', value: 2700 },
  { label: '1 Hour', value: 3600 },
  { label: '2 Hours', value: 7200 },
];

export default function CreateSlotPage({ setActivePage }) {
  const {
    account,
    contract,
    isBotChain,
    connectWallet,
    switchNetwork,
    executeTransaction,
    isRegisteredBusiness,
  } = useWeb3();

  const [mode, setMode] = useState('single'); // 'single' or 'batch'
  const [date, setDate] = useState(() => {
    // Tomorrow by default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(1800); // 30 min default

  // Batch options
  const [batchStartTime, setBatchStartTime] = useState('09:00');
  const [batchEndTime, setBatchEndTime] = useState('17:00');
  const [batchCountPreview, setBatchCountPreview] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate single slot timestamp
  const calculateSingleTimestamp = () => {
    if (!date || !time) return null;
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const d = new Date(year, month - 1, day, hours, minutes, 0);
    return Math.floor(d.getTime() / 1000);
  };

  const singleUnixSec = calculateSingleTimestamp();
  const singlePreview = singleUnixSec ? formatSlotDateTime(singleUnixSec) : null;
  const isPastSingle = singleUnixSec ? singleUnixSec * 1000 <= Date.now() : false;

  // Calculate batch slot timestamps
  const calculateBatchTimestamps = () => {
    if (!date || !batchStartTime || !batchEndTime) return [];
    const [year, month, day] = date.split('-').map(Number);
    const [startH, startM] = batchStartTime.split(':').map(Number);
    const [endH, endM] = batchEndTime.split(':').map(Number);

    const startMs = new Date(year, month - 1, day, startH, startM, 0).getTime();
    const endMs = new Date(year, month - 1, day, endH, endM, 0).getTime();
    const stepMs = duration * 1000;

    if (startMs >= endMs) return [];

    const timestamps = [];
    for (let current = startMs; current + stepMs <= endMs; current += stepMs) {
      const unixSec = Math.floor(current / 1000);
      if (unixSec * 1000 > Date.now()) {
        timestamps.push(unixSec);
      }
    }
    return timestamps;
  };

  const batchTimestamps = calculateBatchTimestamps();

  const handleCreateSingleSlot = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!account) {
      await connectWallet();
      return;
    }
    if (!isBotChain) {
      await switchNetwork();
      return;
    }

    if (!singleUnixSec || isPastSingle) {
      setErrorMessage('Slot start time must be in the future.');
      return;
    }

    setIsSubmitting(true);
    try {
      await executeTransaction('Create Appointment Slot', async () => {
        return await contract.createSlot(singleUnixSec, duration);
      });
      setActivePage('dashboard');
    } catch (err) {
      console.error('Create slot failed:', err);
      setErrorMessage(err.reason || err.message || 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBatchSlots = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!account) {
      await connectWallet();
      return;
    }
    if (!isBotChain) {
      await switchNetwork();
      return;
    }

    if (batchTimestamps.length === 0) {
      setErrorMessage('No valid future slots found for this time range.');
      return;
    }

    if (batchTimestamps.length > 50) {
      setErrorMessage('Maximum 50 slots per batch transaction to prevent block gas limits.');
      return;
    }

    setIsSubmitting(true);
    try {
      await executeTransaction(`Create Batch (${batchTimestamps.length} Slots)`, async () => {
        return await contract.createBatchSlots(batchTimestamps, duration);
      });
      setActivePage('dashboard');
    } catch (err) {
      console.error('Batch creation failed:', err);
      setErrorMessage(err.reason || err.message || 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isRegisteredBusiness) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Registration Required</h2>
          <p className="text-sm text-slate-400 mb-6">
            You must register your connected wallet as a business before you can publish appointment slots on BOT Chain.
          </p>
          <button
            onClick={() => setActivePage('register')}
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-all"
          >
            Register Business Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create Appointment Slots</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Publish open time slots directly to the BOT Chain smart contract.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'single'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Slot
            </button>
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                mode === 'batch'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Batch Generator
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Duration Selection */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Slot Duration
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                  duration === d.value
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        {mode === 'single' ? (
          <form onSubmit={handleCreateSingleSlot} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Start Time (Local) *
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Timezone & Verification Card */}
            {singlePreview && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Local Time ({singlePreview.timezone}):</span>
                  <span className="font-semibold text-white">{singlePreview.local}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">UTC Representation:</span>
                  <span className="font-mono text-slate-300">{singlePreview.utc}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">On-Chain Unix Seconds:</span>
                  <span className="font-mono text-blue-400">{singleUnixSec}</span>
                </div>
                {isPastSingle && (
                  <div className="pt-1 text-rose-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Start time must be in the future.
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isPastSingle}
              className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing Slot to BOT Chain...' : 'Publish Single Slot'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Batch Creation Form */
          <form onSubmit={handleCreateBatchSlots} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Schedule Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Window Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={batchStartTime}
                  onChange={(e) => setBatchStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Window End Time *
                </label>
                <input
                  type="time"
                  required
                  value={batchEndTime}
                  onChange={(e) => setBatchEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Batch Preview Grid */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-slate-300">
                  Slots to be Generated ({batchTimestamps.length} total)
                </span>
                <span className="text-slate-400">
                  Every {formatDuration(duration)}
                </span>
              </div>

              {batchTimestamps.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">
                  Select a valid future time window to preview slots.
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
                  {batchTimestamps.map((ts, idx) => {
                    const info = formatSlotDateTime(ts);
                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center text-xs"
                      >
                        <div className="font-semibold text-white">{info.localTimeOnly}</div>
                        <div className="text-[10px] text-slate-400">{info.localDateOnly}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || batchTimestamps.length === 0}
              className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Layers className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Broadcasting Batch to BOT Chain...'
                  : `Publish ${batchTimestamps.length} Slots in 1 Transaction`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

