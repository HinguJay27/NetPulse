import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Database,
  Download,
  Gauge,
  Trash2,
  TrendingUp,
  Upload,
  Wifi,
} from 'lucide-react';

import { loadHistory, clearHistory } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

import type { HistoryRecord } from '@/types';

export function HistoryView() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    'all' | '7d' | '30d'
  >('all');

  // Load only the currently logged-in user's history
  useEffect(() => {
    const loadUserHistory = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRecords([]);
          return;
        }

        // Load local history for this specific user
        const localRecords = await loadHistory();

        // Load only this user's records from Supabase
        const { data, error } = await supabase
          .from('network_tests')
          .select('result')
          .eq('test_type', 'network-summary')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Supabase history load failed:', error);
          setRecords(localRecords.reverse());
          return;
        }

        const cloudRecords =
          data
            ?.map((row) => row.result as HistoryRecord)
            .filter(Boolean) ?? [];

        setRecords(cloudRecords);
      } catch (error) {
        console.error('History loading error:', error);
        setRecords([]);
      }
    };

    loadUserHistory();
  }, []);

  // Clear history
  const handleClear = async () => {
    await clearHistory();
    setRecords([]);
  };

  // Filter records by selected period
  const filteredRecords = useMemo(() => {
    if (selectedPeriod === 'all') {
      return records;
    }

    const now = Date.now();
    const days = selectedPeriod === '7d' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return records.filter((record) => record.timestamp >= cutoff);
  }, [records, selectedPeriod]);

  // Statistics
  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        avgDownload: 0,
        avgUpload: 0,
        avgPing: 0,
        avgJitter: 0,
        avgPacketLoss: 0,
        avgDns: 0,
      };
    }

    const total = filteredRecords.length;

    return {
      avgDownload:
        filteredRecords.reduce(
          (sum, record) => sum + record.downloadMbps,
          0
        ) / total,

      avgUpload:
        filteredRecords.reduce(
          (sum, record) => sum + record.uploadMbps,
          0
        ) / total,

      avgPing:
        filteredRecords.reduce(
          (sum, record) => sum + record.pingMs,
          0
        ) / total,

      avgJitter:
        filteredRecords.reduce(
          (sum, record) => sum + record.jitterMs,
          0
        ) / total,

      avgPacketLoss:
        filteredRecords.reduce(
          (sum, record) => sum + record.packetLossPct,
          0
        ) / total,

      avgDns:
        filteredRecords.reduce(
          (sum, record) => sum + record.dnsMs,
          0
        ) / total,
    };
  }, [filteredRecords]);

  // Format date/time
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-500" />
              <span className="text-sm font-medium uppercase tracking-wider text-cyan-500">
                Network History
              </span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Test History
            </h1>

            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Review your previous network performance tests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) =>
                setSelectedPeriod(
                  e.target.value as 'all' | '7d' | '30d'
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {records.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-950/30">
                <Download className="h-5 w-5 text-cyan-500" />
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Avg Download
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.avgDownload.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-slate-400">
                Mbps
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                <Upload className="h-5 w-5 text-emerald-500" />
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Avg Upload
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.avgUpload.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-slate-400">
                Mbps
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-violet-50 p-2 dark:bg-violet-950/30">
                <Wifi className="h-5 w-5 text-violet-500" />
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Avg Ping
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.avgPing.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-slate-400">
                ms
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Avg Jitter
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.avgJitter.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-slate-400">
                ms
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/30">
                <TrendingUp className="h-5 w-5 text-rose-500" />
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Packet Loss
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.avgPacketLoss.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-slate-400">
                %
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
                <Gauge className="h-5 w-5 text-blue-500" />
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Avg DNS
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.avgDns.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-slate-400">
                ms
              </span>
            </p>
          </div>
        </div>

        {/* Performance Overview */}
        {filteredRecords.length > 0 && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <BarChart3 className="h-5 w-5 text-cyan-500" />
                  Performance Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Your network performance over time
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Clock className="h-4 w-4" />
                {filteredRecords.length} test
                {filteredRecords.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Download / Upload */}
              <div>
                <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Speed
                </h3>

                <div className="space-y-3">
                  {filteredRecords
                    .slice(-8)
                    .map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center gap-4"
                      >
                        <div className="w-24 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          {formatTime(record.timestamp)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                              Download
                            </span>

                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {record.downloadMbps.toFixed(1)} Mbps
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-cyan-500"
                              style={{
                                width: `${Math.min(
                                  (record.downloadMbps / 1000) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Ping */}
              <div>
                <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Latency
                </h3>

                <div className="space-y-3">
                  {filteredRecords
                    .slice(-8)
                    .map((record) => (
                      <div
                        key={`ping-${record.id}`}
                        className="flex items-center gap-4"
                      >
                        <div className="w-24 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          {formatTime(record.timestamp)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                              Ping
                            </span>

                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {record.pingMs.toFixed(1)} ms
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{
                                width: `${Math.min(
                                  (record.pingMs / 200) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Test Records
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Detailed results from your network tests
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                {filteredRecords.length} record
                {filteredRecords.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                <Database className="h-8 w-8 text-slate-400" />
              </div>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                No history yet
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Run a network test and your results will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Date & Time
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Download
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Upload
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Ping
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Jitter
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Packet Loss
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      DNS
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...filteredRecords]
                    .reverse()
                    .map((record) => (
                      <tr
                        key={record.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {formatDate(record.timestamp)}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {formatTime(record.timestamp)}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                            {record.downloadMbps.toFixed(1)} Mbps
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {record.uploadMbps.toFixed(1)} Mbps
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                            {record.pingMs.toFixed(1)} ms
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {record.jitterMs.toFixed(1)} ms
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span
                            className={`text-sm font-medium ${
                              record.packetLossPct > 5
                                ? 'text-red-500'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {record.packetLossPct.toFixed(1)}%
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {record.dnsMs.toFixed(1)} ms
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}