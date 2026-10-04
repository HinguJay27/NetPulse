export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} Gbps`;
  return `${mbps.toFixed(1)} Mbps`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export function getSpeedRating(mbps: number): { label: string; color: string } {
  if (mbps >= 100) return { label: 'Excellent', color: 'text-emerald-400' };
  if (mbps >= 50) return { label: 'Very Good', color: 'text-green-400' };
  if (mbps >= 25) return { label: 'Good', color: 'text-lime-400' };
  if (mbps >= 10) return { label: 'Fair', color: 'text-amber-400' };
  if (mbps >= 1) return { label: 'Slow', color: 'text-orange-400' };
  return { label: 'Very Slow', color: 'text-red-400' };
}

export function getPingRating(ms: number): { label: string; color: string } {
  if (ms < 20) return { label: 'Excellent', color: 'text-emerald-400' };
  if (ms < 50) return { label: 'Good', color: 'text-green-400' };
  if (ms < 100) return { label: 'Fair', color: 'text-amber-400' };
  if (ms < 200) return { label: 'Poor', color: 'text-orange-400' };
  return { label: 'Bad', color: 'text-red-400' };
}

export function getPacketLossRating(pct: number): { label: string; color: string } {
  if (pct === 0) return { label: 'Perfect', color: 'text-emerald-400' };
  if (pct < 2) return { label: 'Good', color: 'text-green-400' };
  if (pct < 5) return { label: 'Fair', color: 'text-amber-400' };
  if (pct < 10) return { label: 'Poor', color: 'text-orange-400' };
  return { label: 'Bad', color: 'text-red-400' };
}
