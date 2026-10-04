import { useState, useCallback } from 'react';
import { Network as NetworkIcon, Globe, Router, Wifi, RefreshCw, Copy, Check } from 'lucide-react';
import type { NetworkInfo } from '@/types';
import { getNetworkInfo } from '@/lib/network';
import { Button } from '@/components/ui';
import { SectionLoader } from '@/components/Loaders';

export function NetworkInfoView() {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<NetworkInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setInfo(null);
    const res = await getNetworkInfo();
    setInfo(res);
    setLoading(false);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const cards = info
    ? [
        {
          label: 'Public IP Address',
          value: info.publicIp,
          icon: <Globe size={20} />,
          accent: 'cyan',
          desc: 'Your address on the internet',
        },
        {
          label: 'Local IP Address',
          value: info.localIp,
          icon: <Wifi size={20} />,
          accent: 'blue',
          desc: 'Your address on the local network',
        },
        {
          label: 'Default Gateway',
          value: info.gateway,
          icon: <Router size={20} />,
          accent: 'violet',
          desc: 'Router that forwards your traffic',
        },
      ]
    : [];

  const accentMap: Record<string, string> = {
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    violet: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Network Info</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View your local and public network details</p>
        </div>
        <Button onClick={run} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Detecting...' : 'Detect Network'}
        </Button>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-8">
          <SectionLoader message="Detecting network information" />
        </div>
      )}

      {info && !loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5 animate-slide-up"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentMap[card.accent]}`}>
                  {card.icon}
                </div>
                <button
                  onClick={() => copyToClipboard(card.value, card.label)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                  title="Copy"
                >
                  {copied === card.label ? (
                    <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-500">
                {card.label}
              </p>
              <p className="mt-1 break-all text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-600">{card.desc}</p>
            </div>
          ))}
        </div>
      )}

      {info && !loading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Connection Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-200/30 dark:bg-slate-800/30 px-4 py-2.5">
              <span className="text-slate-500 dark:text-slate-400">Protocol</span>
              <span className="text-slate-800 dark:text-slate-200">IPv4 / IPv6</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-200/30 dark:bg-slate-800/30 px-4 py-2.5">
              <span className="text-slate-500 dark:text-slate-400">Connection Type</span>
              <span className="text-slate-800 dark:text-slate-200">WebRTC / HTTP</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-200/30 dark:bg-slate-800/30 px-4 py-2.5">
              <span className="text-slate-500 dark:text-slate-400">Detected At</span>
              <span className="text-slate-800 dark:text-slate-200 tabular-nums">{new Date(info.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {!info && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <NetworkIcon size={40} className="text-slate-300 dark:text-slate-700" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-500">Click Detect Network to view your network details</p>
        </div>
      )}
    </div>
  );
}
