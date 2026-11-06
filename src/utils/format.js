/**
 * Timezone and Formatting Utilities
 * Handles Unix timestamps (seconds) and ensures correct local & UTC timezone conversion.
 */

export const SLOT_STATUS = {
  0: 'Available',
  1: 'Booked',
  2: 'Confirmed',
  3: 'Cancelled',
};

export const SLOT_STATUS_COLORS = {
  Available: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  Booked: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  Confirmed: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  Cancelled: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
  Expired: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
  },
};

/**
 * Truncate Ethereum address
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  if (address === '0x0000000000000000000000000000000000000000') return 'None';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Format timestamp into local and UTC representation
 */
export function formatSlotDateTime(unixTimestampSec) {
  if (!unixTimestampSec) return { local: 'N/A', utc: 'N/A', date: 'N/A', time: 'N/A' };
  const date = new Date(Number(unixTimestampSec) * 1000);

  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const local = date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const localDateOnly = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const localTimeOnly = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const utc = date.toUTCString();

  return {
    local,
    localDateOnly,
    localTimeOnly,
    utc,
    timezone: localTimezone,
    isPast: date.getTime() < Date.now(),
  };
}

/**
 * Format duration seconds into human readable (e.g. 30m, 1h)
 */
export function formatDuration(durationSec) {
  const mins = Math.floor(Number(durationSec) / 60);
  if (mins < 60) return `${mins} mins`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hr${hours > 1 ? 's' : ''}`;
}

/**
 * Computes status taking expiration into account
 */
export function getComputedStatus(rawStatus, startTimeSec) {
  const statusName = SLOT_STATUS[rawStatus] || 'Unknown';
  const isPast = Number(startTimeSec) * 1000 < Date.now();
  if (statusName === 'Available' && isPast) {
    return 'Expired';
  }
  return statusName;
}

