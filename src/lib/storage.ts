import type {
  HistoryRecord,
  PingResult,
  DnsResult,
  SpeedTestResult,
} from '@/types';

import { supabase } from './supabase';

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

export async function saveHistoryRecord(
  ping: PingResult | null,
  dns: DnsResult | null,
  speed: SpeedTestResult | null
): Promise<HistoryRecord[]> {
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

  // Keep local history working
  history.unshift(record);

  const trimmed = history.slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  // Save a copy to Supabase
  try {
    const { error } = await supabase.from('network_tests').insert({
      test_type: 'network-summary',
      target: 'local-network',
      result: record,
    });

    if (error) {
      console.error('Supabase history save failed:', error);
    }
  } catch (error) {
    console.error('Supabase connection error:', error);
  }

  return trimmed;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}