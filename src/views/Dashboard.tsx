import { useEffect, useState, useCallback } from 'react';
import {
  Gauge,
  Activity,
  Globe,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

import type {
  ViewKey,
  PingResult,
  DownloadResult,
  UploadResult,
  DnsResult,
} from '@/types';

import {
  runPing,
  runDownload,
  runUpload,
  runDnsTest,
} from '@/lib/network';

import {
  saveHistoryRecord,
  loadHistory,
} from '@/lib/storage';

import {
  formatSpeed,
  getPingRating,
  getPacketLossRating,
  getSpeedRating,
  formatDateTime,
} from '@/lib/utils';

import {
  MetricCard,
  Button,
  AnimatedNumber,
  CircularProgress,
} from '@/components/ui';

import { SectionLoader } from '@/components/Loaders';

interface DashboardProps {
  onNavigate: (view: ViewKey) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState(false);

  const [ping, setPing] = useState<PingResult | null>(null);
  const [download, setDownload] = useState<DownloadResult | null>(null);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [dns, setDns] = useState<DnsResult | null>(null);

  // History is now loaded asynchronously
  const [history, setHistory] = useState<Awaited<ReturnType<typeof loadHistory>>>([]);

  const [progress, setProgress] = useState(0);

  /*
   * Load the currently logged-in user's history
   * when Dashboard opens.
   */
  useEffect(() => {
    const loadUserHistory = async () => {
      try {
        const records = await loadHistory();
        setHistory(records);
      } catch (error) {
        console.error('Dashboard history load failed:', error);
        setHistory([]);
      }
    };

    loadUserHistory();
  }, []);

  /*
   * Run complete network diagnostic
   */
  const runAll = useCallback(async () => {
    try {
      setLoading(true);
      setProgress(5);

      // -------------------------
      // PING
      // -------------------------
      const pingResult = await runPing('1.1.1.1', 10);

      setPing(pingResult);
      setProgress(30);

      // -------------------------
      // DOWNLOAD
      // -------------------------
      const dl = await runDownload();

      setDownload(dl);
      setProgress(55);

      // -------------------------
      // UPLOAD
      // -------------------------
      const ul = await runUpload();

      setUpload(ul);
      setProgress(75);

      // -------------------------
      // DNS
      // -------------------------
      const dnsResult = await runDnsTest(
        'Google',
        'cloudflare.com'
      );

      setDns(dnsResult);
      setProgress(100);

      // -------------------------
      // SAVE HISTORY
      // -------------------------
      await saveHistoryRecord(
        pingResult,
        dnsResult,
        {
          download: dl,
          upload: ul,
          timestamp: Date.now(),
        }
      );

      // Reload user-specific history
      const updatedHistory = await loadHistory();

      setHistory(updatedHistory);

      setLoading(false);
    } catch (error) {
      console.error(
        'Network diagnostic failed:',
        error
      );

      setLoading(false);
    }
  }, []);

  /*
   * Ratings
   */
  const pingRating = ping
    ? getPingRating(ping.avg)
    : null;

  const dlRating = download
    ? getSpeedRating(download.speedMbps)
    : null;

  const lossRating = ping
    ? getPacketLossRating(ping.packetLoss)
    : null;

  /*
   * Network Health Score
   *
   * Calculated from the user's latest
   * network history.
   */
  const recentScore =
    history.length > 0
      ? Math.round(
          history
            .slice(0, 5)
            .reduce((acc, h) => {
              let score = 100;

              // Ping penalty
              score -= Math.min(
                h.pingMs / 2,
                30
              );

              // Packet loss penalty
              score -= Math.min(
                h.packetLossPct * 3,
                20
              );

              // Jitter penalty
              score -= Math.min(
                h.jitterMs / 2,
                15
              );

              // Download speed bonus
              score += Math.min(
                h.downloadMbps / 5,
                25
              );

              return (
                acc +
                Math.max(
                  0,
                  Math.min(100, score)
                )
              );
            }, 0) /
            Math.min(history.length, 5)
        )
      : null;

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time network performance overview
          </p>
        </div>

        <Button
          onClick={runAll}
          disabled={loading}
          size="lg"
        >
          <Zap
            size={16}
            className={
              loading
                ? 'animate-pulse'
                : ''
            }
          />

          {loading
            ? 'Testing...'
            : 'Run Full Diagnostic'}
        </Button>

      </div>

      {/* =====================================================
          PROGRESS BAR
      ====================================================== */}

      {loading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">

          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>
      )}

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ===================================================
            NETWORK HEALTH SCORE
        ==================================================== */}

        <div className="lg:col-span-1">

          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-white/80 to-white/60 p-6 dark:border-slate-800 dark:from-slate-900/80 dark:to-slate-900/40">

            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">
              Network Health Score
            </p>

            <CircularProgress
              progress={recentScore ?? 0}
              size={180}
            >

              <span className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums">
                <AnimatedNumber
                  value={recentScore ?? 0}
                />
              </span>

              <span className="mt-1 text-xs text-slate-600 dark:text-slate-500">
                out of 100
              </span>

            </CircularProgress>

            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">

              {recentScore === null
                ? 'Run a diagnostic to see your score'
                : recentScore >= 80
                ? 'Your network is performing great'
                : recentScore >= 60
                ? 'Your network is performing adequately'
                : 'Your network may need attention'}

            </p>

          </div>

        </div>

        {/* ===================================================
            QUICK METRICS
        ==================================================== */}

        <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-2">

          <MetricCard
            label="Download Speed"
            value={
              download
                ? download.speedMbps.toFixed(1)
                : '—'
            }
            unit="Mbps"
            icon={<TrendingDown size={20} />}
            accent="cyan"
            sublabel={dlRating?.label}
          />

          <MetricCard
            label="Upload Speed"
            value={
              upload
                ? upload.speedMbps.toFixed(1)
                : '—'
            }
            unit="Mbps"
            icon={<TrendingUp size={20} />}
            accent="blue"
            sublabel={
              upload
                ? getSpeedRating(
                    upload.speedMbps
                  ).label
                : undefined
            }
          />

          <MetricCard
            label="Ping / Latency"
            value={
              ping
                ? ping.avg
                : '—'
            }
            unit="ms"
            icon={<Activity size={20} />}
            accent="emerald"
            sublabel={pingRating?.label}
          />

          <MetricCard
            label="Packet Loss"
            value={
              ping
                ? ping.packetLoss
                : '—'
            }
            unit="%"
            icon={
              <AlertTriangle size={20} />
            }
            accent={
              ping &&
              ping.packetLoss > 0
                ? 'rose'
                : 'emerald'
            }
            sublabel={
              lossRating?.label
            }
          />

          <MetricCard
            label="Jitter"
            value={
              ping
                ? ping.jitter
                : '—'
            }
            unit="ms"
            icon={
              <Activity size={20} />
            }
            accent="amber"
            sublabel={
              ping
                ? ping.jitter < 5
                  ? 'Stable'
                  : ping.jitter < 15
                  ? 'Moderate'
                  : 'Unstable'
                : undefined
            }
          />

          <MetricCard
            label="DNS Response"
            value={
              dns
                ? dns.responseTime
                : '—'
            }
            unit="ms"
            icon={
              <Globe size={20} />
            }
            accent="violet"
            sublabel={
              dns
                ? dns.responseTime < 50
                  ? 'Fast'
                  : dns.responseTime < 100
                  ? 'Average'
                  : 'Slow'
                : undefined
            }
          />

        </div>

      </div>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        {[
          {
            key: 'speed' as ViewKey,
            label: 'Speed Test',
            icon: <Gauge size={16} />,
          },
          {
            key: 'ping' as ViewKey,
            label: 'Ping Test',
            icon: <Activity size={16} />,
          },
          {
            key: 'dns' as ViewKey,
            label: 'DNS Lookup',
            icon: <Globe size={16} />,
          },
          {
            key: 'traceroute' as ViewKey,
            label: 'Traceroute',
            icon: <ArrowRight size={16} />,
          },
        ].map((action) => (

          <button
            key={action.key}
            onClick={() =>
              onNavigate(action.key)
            }
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white/60 p-4 text-left transition-all hover:border-cyan-500/30 hover:bg-slate-200/40 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
          >

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-cyan-600 transition-colors group-hover:bg-cyan-500/10 dark:bg-slate-800 dark:text-cyan-400">

              {action.icon}

            </span>

            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
              {action.label}
            </span>

            <ArrowRight
              size={14}
              className="ml-auto text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-cyan-600 dark:text-slate-600 dark:group-hover:text-cyan-400"
            />

          </button>

        ))}

      </div>

      {/* =====================================================
          RECENT HISTORY
      ====================================================== */}

      {history.length > 0 && (

        <div className="rounded-xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/40">

          <div className="mb-4 flex items-center justify-between">

            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Tests
            </h3>

            <button
              onClick={() =>
                onNavigate('history')
              }
              className="text-xs text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              View all →
            </button>

          </div>

          <div className="space-y-2">

            {history
              .slice(0, 5)
              .map((rec) => (

                <div
                  key={rec.id}
                  className="flex items-center justify-between rounded-lg bg-slate-200/30 px-4 py-2.5 text-sm dark:bg-slate-800/30"
                >

                  <span className="text-slate-500 dark:text-slate-400">
                    {formatDateTime(
                      rec.timestamp
                    )}
                  </span>

                  <div className="flex items-center gap-6">

                    <span className="text-cyan-600 tabular-nums dark:text-cyan-400">
                      {formatSpeed(
                        rec.downloadMbps
                      )}
                    </span>

                    <span className="text-blue-600 tabular-nums dark:text-blue-400">
                      {formatSpeed(
                        rec.uploadMbps
                      )}
                    </span>

                    <span className="text-emerald-600 tabular-nums dark:text-emerald-400">
                      {rec.pingMs} ms
                    </span>

                    <span
                      className={`tabular-nums ${
                        rec.packetLossPct > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-500'
                      }`}
                    >
                      {rec.packetLossPct}% loss
                    </span>

                  </div>

                </div>

              ))}

          </div>

        </div>

      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && !ping && (

        <div className="rounded-xl border border-slate-200 bg-white/60 p-8 dark:border-slate-800 dark:bg-slate-900/40">

          <SectionLoader
            message="Running comprehensive network diagnostic"
          />

        </div>

      )}

    </div>
  );
}