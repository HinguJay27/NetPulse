import { useState, useMemo, useEffect } from 'react';
import { History, Trash2, TrendingUp, TrendingDown, Activity, Globe } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import type { HistoryRecord } from '@/types';
import { loadHistory, clearHistory } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { formatSpeed, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui';

type ChartTab = 'speed' | 'latency' | 'loss' | 'dns';

export function HistoryView() {
  const [records, setRecords] = useState<HistoryRecord[]>(() => loadHistory().reverse());

  useEffect(() => {
    const loadCloudHistory = async () => {
      const { data, error } = await supabase
        .from('network_tests')
        .select('result')
        .eq('test_type', 'network-summary')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase history load failed:', error);
        return;
      }

      if (data) {
        const cloudRecords = data
          .map((row) => row.result as HistoryRecord)
          .filter(Boolean);

        setRecords(cloudRecords);
      }
    };

    loadCloudHistory();
  }, []);


  const [tab, setTab] = useState<ChartTab>('speed');

  const sorted = useMemo(() => [...records].sort((a, b) => a.timestamp - b.timestamp), [records]);

  const speedData = sorted.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Download: r.downloadMbps,
    Upload: r.uploadMbps,
  }));

  const latencyData = sorted.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Ping: r.pingMs,
    Jitter: r.jitterMs,
  }));

  const lossData = sorted.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Loss: r.packetLossPct,
  }));

  const dnsData = sorted.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    DNS: r.dnsMs,
  }));

  const avgDownload = records.length ? records.reduce((a, r) => a + r.downloadMbps, 0) / records.length : 0;
  const avgUpload = records.length ? records.reduce((a, r) => a + r.uploadMbps, 0) / records.length : 0;
  const avgPing = records.length ? records.reduce((a, r) => a + r.pingMs, 0) / records.length : 0;
  const avgDns = records.length ? records.reduce((a, r) => a + r.dnsMs, 0) / records.length : 0;

  const handleClear = () => {
    clearHistory();
    setRecords([]);
  };

  const tabs: { key: ChartTab; label: string; icon: React.ReactNode }[] = [
    { key: 'speed', label: 'Speed', icon: <TrendingUp size={14} /> },
    { key: 'latency', label: 'Latency', icon: <Activity size={14} /> },
    { key: 'loss', label: 'Packet Loss', icon: <TrendingDown size={14} /> },
    { key: 'dns', label: 'DNS', icon: <Globe size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">History</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track your network performance over time</p>
        </div>
        {records.length > 0 && (
          <Button onClick={handleClear} variant="secondary" size="sm">
            <Trash2 size={14} />
            Clear History
          </Button>
        )}
      </div>

      {/* Summary stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">Avg Download</p>
            <p className="mt-1 text-xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">{formatSpeed(avgDownload)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">Avg Upload</p>
            <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatSpeed(avgUpload)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">Avg Ping</p>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{avgPing.toFixed(0)} ms</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">Avg DNS</p>
            <p className="mt-1 text-xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">{avgDns.toFixed(0)} ms</p>
          </div>
        </div>
      )}

      {/* Chart with tabs */}
      {records.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <div className="mb-4 flex items-center gap-1 rounded-lg bg-slate-200/30 dark:bg-slate-800/30 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === t.key
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            {tab === 'speed' ? (
              <LineChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="time" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} unit=" Mbps" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-bg)', border: '1px solid var(--chart-border)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--chart-label)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="Download" stroke="#22d3ee" strokeWidth={2} dot={false} animationDuration={500} />
                <Line type="monotone" dataKey="Upload" stroke="#3b82f6" strokeWidth={2} dot={false} animationDuration={500} />
              </LineChart>
            ) : tab === 'latency' ? (
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="time" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} unit=" ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-bg)', border: '1px solid var(--chart-border)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--chart-label)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="Ping" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={500} />
                <Line type="monotone" dataKey="Jitter" stroke="#f59e0b" strokeWidth={2} dot={false} animationDuration={500} />
              </LineChart>
            ) : tab === 'loss' ? (
              <AreaChart data={lossData}>
                <defs>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="time" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} unit=" %" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-bg)', border: '1px solid var(--chart-border)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--chart-label)' }}
                  itemStyle={{ color: '#f43f5e' }}
                />
                <Area type="monotone" dataKey="Loss" stroke="#f43f5e" strokeWidth={2} fill="url(#lossGradient)" animationDuration={500} />
              </AreaChart>
            ) : (
              <AreaChart data={dnsData}>
                <defs>
                  <linearGradient id="dnsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="time" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} unit=" ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-bg)', border: '1px solid var(--chart-border)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--chart-label)' }}
                  itemStyle={{ color: '#a78bfa' }}
                />
                <Area type="monotone" dataKey="DNS" stroke="#a78bfa" strokeWidth={2} fill="url(#dnsGradient)" animationDuration={500} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Records table */}
      {records.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">Date & Time</th>
                  <th className="px-4 py-3 text-right font-medium">Download</th>
                  <th className="px-4 py-3 text-right font-medium">Upload</th>
                  <th className="px-4 py-3 text-right font-medium">Ping</th>
                  <th className="px-4 py-3 text-right font-medium">Jitter</th>
                  <th className="px-4 py-3 text-right font-medium">Loss</th>
                  <th className="px-4 py-3 text-right font-medium">DNS</th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((rec) => (
                  <tr key={rec.id} className="border-b border-slate-200/50 dark:border-slate-800/50 transition-colors hover:bg-slate-200/20 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(rec.timestamp)}</td>
                    <td className="px-4 py-3 text-right text-cyan-600 dark:text-cyan-400 tabular-nums">{formatSpeed(rec.downloadMbps)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400 tabular-nums">{formatSpeed(rec.uploadMbps)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">{rec.pingMs} ms</td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">{rec.jitterMs} ms</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${rec.packetLossPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-500'}`}>
                      {rec.packetLossPct}%
                    </td>
                    <td className="px-4 py-3 text-right text-violet-600 dark:text-violet-400 tabular-nums">{rec.dnsMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <History size={40} className="text-slate-300 dark:text-slate-700" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-500">No test history yet. Run a diagnostic from the Dashboard to start tracking.</p>
        </div>
      )}
    </div>
  );
}
