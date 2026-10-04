import { useState, useCallback } from 'react';
import { Globe, Play, Server, CheckCircle2, XCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DnsResult } from '@/types';
import { runDnsBatch } from '@/lib/network';
import { Button, Input } from '@/components/ui';
import { SectionLoader } from '@/components/Loaders';

const COMMON_DOMAINS = ['google.com', 'cloudflare.com', 'github.com', 'amazon.com', 'youtube.com'];

export function DnsLookup() {
  const [domain, setDomain] = useState('google.com');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DnsResult[]>([]);

  const run = useCallback(async () => {
    setLoading(true);
    setResults([]);
    const res = await runDnsBatch(domain);
    setResults(res);
    setLoading(false);
  }, [domain]);

  const chartData = results.map((r) => ({
    name: r.server.split(' ')[0],
    time: r.responseTime,
    success: r.success,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">DNS Lookup</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Compare DNS resolution times across multiple providers</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-500">Domain Name</label>
          <Input value={domain} onChange={setDomain} placeholder="google.com" disabled={loading} onEnter={run} />
        </div>
        <Button onClick={run} disabled={loading}>
          <Play size={16} />
          {loading ? 'Resolving...' : 'Resolve DNS'}
        </Button>
      </div>

      {/* Quick domains */}
      <div className="flex flex-wrap gap-2">
        {COMMON_DOMAINS.map((d) => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            disabled={loading}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              domain === d
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20'
                : 'bg-slate-200/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-8">
          <SectionLoader message="Querying DNS servers" />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <>
          {/* Chart */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">DNS Response Time Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} unit=" ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--chart-bg)',
                    border: '1px solid var(--chart-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'var(--chart-label)' }}
                  itemStyle={{ color: '#a78bfa' }}
                  cursor={{ fill: '#1e293b40' }}
                />
                <Bar dataKey="time" radius={[6, 6, 0, 0]} animationDuration={500}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.success ? '#a78bfa' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed results */}
          <div className="space-y-3">
            {results.map((r, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    r.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                    {r.success ? (
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle size={20} className="text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{r.server}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-500">
                      <Server size={12} />
                      <span className="tabular-nums">{r.address ?? 'No answer'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold tabular-nums ${
                    r.responseTime < 50 ? 'text-emerald-600 dark:text-emerald-400' : r.responseTime < 100 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {r.responseTime}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-500">ms</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Globe size={40} className="text-slate-300 dark:text-slate-700" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-500">Enter a domain and click Resolve DNS to begin</p>
        </div>
      )}
    </div>
  );
}
