import type { HistoryRecord, PingResult, DnsResult, SpeedTestResult } from '@/types';

const STORAGE_KEY = 'netpulse_history';
const MAX_RECORDS = 100;

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryRecord[];
  } catch {
    return [];
  }
}

export function saveHistoryRecord(
  ping: PingResult | null,
  dns: DnsResult | null,
  speed: SpeedTestResult | null
): HistoryRecord[] {
  const history = loadHistory();
  const record: HistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    downloadMbps: speed?.download.speedMbps ?? 0,
    uploadMbps: speed?.upload.speedMbps ?? 0,
    pingMs: ping?.avg ?? 0,
    jitterMs: ping?.jitter ?? 0,
    packetLossPct: ping?.packetLoss ?? 0,
    dnsMs: dns?.responseTime ?? 0,
  };
  history.unshift(record);
  const trimmed = history.slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
