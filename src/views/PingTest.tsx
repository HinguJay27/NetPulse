import { useState, useCallback } from 'react';
import { Activity, AlertTriangle, Play } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { PingResult } from '@/types';
import { runPing, PING_TARGETS } from '@/lib/network';
import { getPingRating, getPacketLossRating } from '@/lib/utils';
import { Button, Input, MetricCard } from '@/components/ui';
import { SectionLoader } from '@/components/Loaders';

export function PingTest() {
  const [host, setHost] = useState('1.1.1.1');
  const [count, setCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PingResult | null>(null);
  const [liveLatencies, setLiveLatencies] = useState<number[]>([]);
  const [liveLost, setLiveLost] = useState(0);

  const run = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setLiveLatencies([]);
    setLiveLost(0);

    const res = await runPing(host, count, (lats, lost) => {
      setLiveLatencies(lats);
      setLiveLost(lost);
    });

    setResult(res);
    setLoading(false);
  }, [host, count]);

  const chartData = (result?.latencies ?? liveLatencies).map((lat, i) => ({
    ping: i + 1,
    latency: lat,
  }));

  const pingRating = result ? getPingRating(result.avg) : null;
  const lossRating = result ? getPacketLossRating(result.packetLoss) : null;

  const liveAvg = liveLatencies.length
    ? Math.round(liveLatencies.reduce((a, b) => a + b, 0) / liveLatencies.length)
    : 0;
  const liveMin = liveLatencies.length ? Math.min(...liveLatencies) : 0;
  const liveMax = liveLatencies.length ? Math.max(...liveLatencies) : 0;
  const liveJitter =
    liveLatencies.length > 1
      ? Math.round(
          liveLatencies
            .slice(1)
            .reduce((sum, l, idx) => sum + Math.abs(l - liveLatencies[idx]), 0) /
            (liveLatencies.length - 1)
        )
      : 0;
  const liveLossPct = Math.round((liveLost / count) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ping & Latency</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Measure round-trip time and packet loss to a target host
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-500">Target Host</label>
          <Input
            value={host}
            onChange={setHost}
            placeholder="1.1.1.1"
            disabled={loading}
            onEnter={run}
          />
        </div>
        <div className="w-32">
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-500">Ping Count</label>
          <Input
            value={String(count)}
            onChange={(v) => setCount(Math.max(1, Math.min(50, parseInt(v) || 20)))}
            type="number"
            disabled={loading}
          />
        </div>
        <Button onClick={run} disabled={loading}>
          <Play size={16} />
          {loading ? 'Pinging...' : 'Start Ping'}
        </Button>
      </div>

      {/* Quick targets */}
      <div className="flex flex-wrap gap-2">
        {PING_TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => setHost(t)}
            disabled={loading}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              host === t
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20'
                : 'bg-slate-200/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Metrics */}
      {(result || loading) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Avg Latency"
            value={result ? result.avg : loading ? liveAvg : '—'}
            unit="ms"
            icon={<Activity size={18} />}
            accent="cyan"
            sublabel={pingRating?.label}
          />
          <MetricCard
            label="Min / Max"
            value={result ? `${result.min}/${result.max}` : loading ? `${liveMin}/${liveMax}` : '—'}
            unit="ms"
            accent="blue"
          />
          <MetricCard
            label="Jitter"
            value={result ? result.jitter : loading ? liveJitter : '—'}
            unit="ms"
            accent="amber"
            sublabel={
              result
                ? result.jitter < 5
                  ? 'Stable'
                  : result.jitter < 15
                  ? 'Moderate'
                  : 'Unstable'
                : undefined
            }
          />
          <MetricCard
            label="Packet Loss"
            value={result ? result.packetLoss : loading ? liveLossPct : '—'}
            unit="%"
            icon={<AlertTriangle size={18} />}
            accent={
              (result ? result.packetLoss : liveLossPct) > 0 ? 'rose' : 'emerald'
            }
            sublabel={lossRating?.label}
          />
        </div>
      )}

      {/* Chart */}
      {(result || loading) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Latency Over Time{' '}
              {loading && (
                <span className="ml-2 text-xs text-slate-600 dark:text-slate-500">
                  ({liveLatencies.length + liveLost}/{count})
                </span>
              )}
            </h3>
            {loading && <SectionLoader message={`Pinging ${host}`} />}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="ping"
                stroke="var(--chart-text)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                label="Ping #"
              />
              <YAxis
                stroke="var(--chart-text)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                unit=" ms"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--chart-bg)',
                  border: '1px solid var(--chart-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--chart-label)' }}
                itemStyle={{ color: '#22d3ee' }}
              />
              {result && (
                <ReferenceLine y={result.avg} stroke="#64748b" strokeDasharray="5 5" label="Avg" />
              )}
              <Area
                type="monotone"
                dataKey="latency"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#latencyGradient)"
                animationDuration={300}
                isAnimationActive={!loading}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Activity size={40} className="text-slate-300 dark:text-slate-700" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-500">
            Enter a host and click Start Ping to begin
          </p>
        </div>
      )}
    </div>
  );
}
