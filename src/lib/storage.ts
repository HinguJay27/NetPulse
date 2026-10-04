import type {
  HistoryRecord,
  PingResult,
  DnsResult,
  SpeedTestResult,
} from '@/types';

import { supabase } from './supabase';

const STORAGE_PREFIX = 'netpulse_history_';
const MAX_RECORDS = 100;

/**
 * Creates a separate localStorage key for each user.
 * Example:
 * netpulse_history_<user-id>
 */
function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * Load history for the currently logged-in user.
 */
export async function loadHistory(): Promise<HistoryRecord[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const raw = localStorage.getItem(getStorageKey(user.id));

    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as HistoryRecord[];
  } catch (error) {
    console.error('Local history load failed:', error);
    return [];
  }
}

/**
 * Save a network test summary for the currently logged-in user.
 */
export async function saveHistoryRecord(
  ping: PingResult | null,
  dns: DnsResult | null,
  speed: SpeedTestResult | null
): Promise<HistoryRecord[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('Cannot save history: no logged-in user.');
      return [];
    }

    const history = await loadHistory();

    const record: HistoryRecord = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      timestamp: Date.now(),

      downloadMbps:
        speed?.download.speedMbps ?? 0,

      uploadMbps:
        speed?.upload.speedMbps ?? 0,

      pingMs:
        ping?.avg ?? 0,

      jitterMs:
        ping?.jitter ?? 0,

      packetLossPct:
        ping?.packetLoss ?? 0,

      dnsMs:
        dns?.responseTime ?? 0,
    };

    // Add newest record to the beginning
    history.unshift(record);

    // Keep maximum 100 records locally
    const trimmed = history.slice(0, MAX_RECORDS);

    // Save user-specific local history
    localStorage.setItem(
      getStorageKey(user.id),
      JSON.stringify(trimmed)
    );

    /**
     * Save to Supabase.
     *
     * IMPORTANT:
     * user_id is included so RLS can ensure
     * each user can access only their own records.
     */
    const { error } = await supabase
      .from('network_tests')
      .insert({
        test_type: 'network-summary',
        target: 'local-network',
        result: record,
        user_id: user.id,
      });

    if (error) {
      console.error(
        'Supabase history save failed:',
        error
      );
    }

    return trimmed;
  } catch (error) {
    console.error(
      'History save error:',
      error
    );

    return [];
  }
}

/**
 * Clear local history for the currently logged-in user.
 *
 * Note:
 * This currently clears localStorage only.
 * Supabase cloud history will remain until we
 * add the DELETE RLS policy and cloud delete logic.
 */
export async function clearHistory(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    localStorage.removeItem(
      getStorageKey(user.id)
    );
  } catch (error) {
    console.error(
      'Clear history error:',
      error
    );
  }
}