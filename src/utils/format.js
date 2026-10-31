/**
 * Formatting utilities for weather station dashboard
 */

export function fmt(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  const n = Number(value);
  if (decimals === 0) {
    return Math.round(n).toLocaleString();
  }
  return n.toFixed(decimals);
}

export function timeAgo(timestamp, now = Date.now()) {
  if (!timestamp) return "—";
  const diffSec = Math.max(0, Math.floor((now - Number(timestamp)) / 1000));

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function fmtDateTime(timestamp) {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function fmtClock(timestamp) {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function fmtTick(timestamp, span) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";

  // If time span is longer than 24 hours, include date
  const isMultiDay = span && span > 24 * 3600 * 1000;
  if (isMultiDay) {
    return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fmtDuration(ms) {
  if (!ms || ms <= 0) return "0m";
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;

  const totalMin = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (totalMin < 60) {
    return sec > 0 ? `${totalMin}m ${sec}s` : `${totalMin}m`;
  }

  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (hours < 24) {
    return min > 0 ? `${hours}h ${min}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
}
