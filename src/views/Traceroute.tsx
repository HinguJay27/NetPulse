import { useState, useCallback } from 'react';
import { Route, Play, MapPin, ArrowRight } from 'lucide-react';
import type { TracerouteResult, TracerouteHop } from '@/types';
import { runTraceroute } from '@/lib/network';
import { Button, Input } from '@/components/ui';
import { SectionLoader } from '@/components/Loaders';

const COMMON_TARGETS = ['google.com', 'cloudflare.com', 'github.com', '1.1.1.1'];

export function Traceroute() {
  const [target, setTarget] = useState('google.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TracerouteResult | null>(null);
  const [currentHop, setCurrentHop] = useState(0);
  const [totalHops, setTotalHops] = useState(0);
  const [completedHops, setCompletedHops] = useState<TracerouteHop[]>([]);

  const run = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setCurrentHop(0);
    setCompletedHops([]);

    const res = await runTraceroute(target, (hop, total) => {
      setCurrentHop(hop);
      setTotalHops(total);
    });

    setResult(res);
    setLoading(false);
    setCurrentHop(0);
  }, [target]);

  // Show completed hops live during tracing
  const displayHops = result ? result.hops : completedHops;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Traceroute</h2>
        <p className="mt-1 text-sm text-slate-400">
          Trace the network path from your device to a destination
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Target Host</label>
          <Input
            value={target}
            onChange={setTarget}
            placeholder="google.com"
            disabled={loading}
            onEnter={run}
          />
        </div>
        <Button onClick={run} disabled={loading}>
          <Play size={16} />
          {loading ? 'Tracing...' : 'Start Trace'}
        </Button>
      </div>

      {/* Quick targets */}
      <div className="flex flex-wrap gap-2">
        {COMMON_TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            disabled={loading}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              target === t
                ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20'
                : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Loading state + live hops */}
      {loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <SectionLoader message={`Tracing route to ${target} — hop ${currentHop} of ${totalHops}`} />
          <div className="mt-4 space-y-1">
            {Array.from({ length: currentHop }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm animate-fade-in"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-medium text-cyan-400">
                  {i + 1}
                </span>
                <span className="text-slate-400">
                  {i < currentHop - 1 ? `Hop ${i + 1} complete` : `Probing hop ${i + 1}...`}
                </span>
                {i === currentHop - 1 && (
                  <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Route size={16} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Route to {result.target}</h3>
          </div>
          <div className="space-y-1">
            {result.hops.map((hop, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-slate-800/30 animate-slide-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Hop number */}
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-400">
                  {hop.hop}
                </span>

                {/* Host */}
                <div className="flex items-center gap-2 flex-1">
                  <MapPin size={14} className={hop.success ? 'text-cyan-400' : 'text-slate-600'} />
                  <span className="text-sm font-medium text-slate-200">{hop.host}</span>
                </div>

                {/* Latency */}
                <div className="flex items-center gap-2">
                  {hop.success ? (
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        hop.latency < 50
                          ? 'text-emerald-400'
                          : hop.latency < 150
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {hop.latency} ms
                    </span>
                  ) : (
                    <span className="text-sm text-slate-600">* * *</span>
                  )}
                  <span
                    className={`h-2 w-2 rounded-full ${hop.success ? 'bg-emerald-400' : 'bg-red-400'}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-800/20 px-4 py-3 text-xs text-slate-500">
            <ArrowRight size={14} className="text-cyan-400" />
            <span>
              {result.hops.length} hops to {result.target} —{' '}
              {result.hops.filter((h) => h.success).length} reached,{' '}
              {result.hops.filter((h) => !h.success).length} timed out
            </span>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-12 text-center">
          <Route size={40} className="text-slate-700" />
          <p className="mt-4 text-sm text-slate-500">
            Enter a target and click Start Trace to begin
          </p>
        </div>
      )}
    </div>
  );
}
