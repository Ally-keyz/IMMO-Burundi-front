/** Format a number with thousands separators. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

/** Compact number, e.g. 1234 → 1.2k (used for view counts). */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Relative time string, e.g. "3 days ago". */
export function timeAgo(input: string | undefined): string {
  if (!input) return '';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/** Render a countdown like "2d 4h 21m" between now and a deadline. */
export function countdown(deadline: string | undefined): string {
  if (!deadline) return '';
  const target = new Date(deadline).getTime();
  if (Number.isNaN(target)) return '';
  let diff = Math.floor((target - Date.now()) / 1000);
  if (diff <= 0) return '0d 0h 0m';
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

/** Human readable date, e.g. "Mon, 12 Jul 2026". */
export function formatDate(input: string | undefined): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}