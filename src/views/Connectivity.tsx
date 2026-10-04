import { useState, useCallback } from 'react';
import { Plug, Play, Globe, Zap, CheckCircle2, XCircle, Clock, Info } from 'lucide-react';
import type { ConnectivityResult } from '@/types';
import { runConnectivity } from '@/lib/network';
import { Button, Input, StatusBadge } from '@/components/ui';
import { SectionLoader } from '@/components/Loaders';

const COMMON_TARGETS = [
  { host: 'google.com', port: 443 },
  { host: 'github.com', port: 443 },
  { host: 'cloudflare.com', port: 443 },
  { host: '1.1.1.1', port: 443 },
];

export function Connectivity() {
  const [host, setHost] = useState('google.com');
  const [port, setPort] = useState(443);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConnectivityResult | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setResult(null);
    const res = await runConnectivity(host, port);
    setResult(res);
    setLoading(false);
  }, [host, port]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Connectivity Test</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Check TCP connection and HTTP/HTTPS response times
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 px-4 py-3">
        <Info size={16} className="mt-0.5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          TCP reachability is measured by timing a TLS connection to the host. HTTP
          response uses no-cors mode — if the request succeeds, the server is reachable
          and responding with valid HTTP. Browsers cannot read status codes in no-cors
          mode, so a successful response is shown as status 200.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-500">Host</label>
          <Input
            value={host}
            onChange={setHost}
            placeholder="google.com"
            disabled={loading}
            onEnter={run}
          />
        </div>
        <div className="w-28">
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-500">Port</label>
          <Input
            value={String(port)}
            onChange={(v) => setPort(Math.max(1, Math.min(65535, parseInt(v) || 443)))}
            type="number"
            disabled={loading}
            onEnter={run}
          />
        </div>
        <Button onClick={run} disabled={loading}>
          <Play size={16} />
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      {/* Quick targets */}
      <div className="flex flex-wrap gap-2">
        {COMMON_TARGETS.map((t) => (
          <button
            key={`${t.host}:${t.port}`}
            onClick={() => {
              setHost(t.host);
              setPort(t.port);
            }}
            disabled={loading}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              host === t.host && port === t.port
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20'
                : 'bg-slate-200/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.host}:{t.port}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-8">
          <SectionLoader message={`Testing connectivity to ${host}:${port}`} />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* TCP Results */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    result.tcpSuccess ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <Zap
                    size={20}
                    className={result.tcpSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">TCP / TLS Connection</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500">
                    {result.host}:{result.port}
                  </p>
                </div>
              </div>
              <StatusBadge
                success={result.tcpSuccess}
                label={result.tcpSuccess ? 'Connected' : 'Failed'}
              />
            </div>
            {result.tcpConnectTime !== null && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-200/30 dark:bg-slate-800/30 px-4 py-2.5 text-sm">
                <Clock size={14} className="text-slate-600 dark:text-slate-500" />
                <span className="text-slate-500 dark:text-slate-400">Connect time:</span>
                <span
                  className={`font-medium tabular-nums ${
                    result.tcpConnectTime < 100
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : result.tcpConnectTime < 300
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {result.tcpConnectTime} ms
                </span>
              </div>
            )}
            {result.tcpConnectTime === null && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/5 px-4 py-2.5 text-sm">
                <XCircle size={14} className="text-red-600 dark:text-red-400" />
                <span className="text-slate-500 dark:text-slate-400">
                  Could not establish a TCP/TLS connection to this host
                </span>
              </div>
            )}
          </div>

          {/* HTTP Results */}
          <div
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5 animate-slide-up"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    result.httpSuccess ? 'bg-cyan-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <Globe
                    size={20}
                    className={result.httpSuccess ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">HTTP/HTTPS Response</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500">
                    https://{result.host}
                  </p>
                </div>
              </div>
              <StatusBadge
                success={result.httpSuccess}
                label={result.httpSuccess ? 'OK' : 'Failed'}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-slate-200/30 dark:bg-slate-800/30 px-4 py-2.5 text-sm">
                <Clock size={14} className="text-slate-600 dark:text-slate-500" />
                <span className="text-slate-500 dark:text-slate-400">Response:</span>
                <span
                  className={`font-medium tabular-nums ${
                    result.httpResponseTime === null
                      ? 'text-slate-400 dark:text-slate-600'
                      : result.httpResponseTime < 200
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : result.httpResponseTime < 500
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {result.httpResponseTime !== null ? `${result.httpResponseTime} ms` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-200/30 dark:bg-slate-800/30 px-4 py-2.5 text-sm">
                {result.httpStatusCode !== null ? (
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle size={14} className="text-red-600 dark:text-red-400" />
                )}
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <span
                  className={`font-medium tabular-nums ${
                    result.httpStatusCode !== null
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {result.httpStatusCode ?? 'N/A'}
                </span>
              </div>
            </div>
            {!result.httpSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/5 px-4 py-2.5 text-sm">
                <XCircle size={14} className="text-red-600 dark:text-red-400" />
                <span className="text-slate-500 dark:text-slate-400">
                  No HTTP response received. The server may be unreachable, block
                  cross-origin requests, or not serve HTTP content.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Plug size={40} className="text-slate-300 dark:text-slate-700" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-500">
            Enter a host and port, then click Test Connection
          </p>
        </div>
      )}
    </div>
  );
}
