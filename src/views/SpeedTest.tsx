import { useState, useCallback, useRef } from 'react';
import { ArrowDown, ArrowUp, Gauge, Zap, Server } from 'lucide-react';
import type { DownloadResult, UploadResult } from '@/types';
import { runDownload, runUpload, SPEED_SERVERS } from '@/lib/network';
import { formatBytes, getSpeedRating } from '@/lib/utils';
import { Button, CircularProgress, AnimatedNumber } from '@/components/ui';
import { SectionLoader, ScanLine } from '@/components/Loaders';

type Phase = 'idle' | 'download' | 'upload' | 'done';

export function SpeedTest() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [download, setDownload] = useState<DownloadResult | null>(null);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [serverIndex, setServerIndex] = useState(0);
  const rafRef = useRef<number>(0);

  const runTest = useCallback(async () => {
    const server = SPEED_SERVERS[serverIndex] || SPEED_SERVERS[0];
    setPhase('download');
    setDownload(null);
    setUpload(null);
    setLiveSpeed(0);

    let dlStart = 0;
    const animateDl = (ts: number) => {
      if (dlStart === 0) dlStart = ts;
      const elapsed = (ts - dlStart) / 1000;
      const ramp = Math.min(elapsed / 2, 1);
      const simulated = ramp * (download?.speedMbps ?? 50) * (0.8 + Math.random() * 0.4);
      setLiveSpeed(simulated);
      rafRef.current = requestAnimationFrame(animateDl);
    };
    rafRef.current = requestAnimationFrame(animateDl);

    const dl = await runDownload(server.downloadUrl);
    cancelAnimationFrame(rafRef.current);
    setDownload(dl);
    setLiveSpeed(dl.speedMbps);

    setPhase('upload');
    let ulStart = 0;
    const animateUl = (ts: number) => {
      if (ulStart === 0) ulStart = ts;
      const elapsed = (ts - ulStart) / 1000;
      const ramp = Math.min(elapsed / 2, 1);
      const simulated = ramp * (dl.speedMbps * 0.3) * (0.8 + Math.random() * 0.4);
      setLiveSpeed(simulated);
      rafRef.current = requestAnimationFrame(animateUl);
    };
    rafRef.current = requestAnimationFrame(animateUl);

    const ul = await runUpload(server.uploadUrl);
    cancelAnimationFrame(rafRef.current);
    setUpload(ul);
    setLiveSpeed(ul.speedMbps);
    setPhase('done');
  }, [download?.speedMbps, serverIndex]);

  const isRunning = phase === 'download' || phase === 'upload';
  const displaySpeed = isRunning ? liveSpeed : phase === 'done' && download ? download.speedMbps : 0;
  const progress =
    phase === 'download' ? 50 : phase === 'upload' ? 75 : phase === 'done' ? 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Speed Test</h2>
        <p className="mt-1 text-sm text-slate-400">Measure your download and upload throughput</p>
      </div>

      {/* Server selection */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <Server size={16} className="text-cyan-400" />
        <span className="text-xs font-medium text-slate-500">Test Server:</span>
        <div className="flex gap-2">
          {SPEED_SERVERS.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setServerIndex(i)}
              disabled={isRunning}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                serverIndex === i
                  ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20'
                  : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gauge */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8">
          <div className="mb-2 flex items-center gap-2">
            <Gauge size={18} className="text-cyan-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {phase === 'idle' ? 'Ready' : phase === 'download' ? 'Downloading' : phase === 'upload' ? 'Uploading' : 'Complete'}
            </span>
          </div>
          <CircularProgress progress={progress} size={240} strokeWidth={10}>
            <span className="text-5xl font-bold text-white tabular-nums">
              <AnimatedNumber value={displaySpeed} decimals={1} />
            </span>
            <span className="mt-1 text-sm text-slate-500">Mbps</span>
          </CircularProgress>
          <div className="mt-6">
            <Button onClick={runTest} disabled={isRunning} size="lg">
              <Zap size={16} className={isRunning ? 'animate-pulse' : ''} />
              {isRunning ? 'Testing...' : 'Start Speed Test'}
            </Button>
          </div>
          <ScanLine active={isRunning} />
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Download */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                  <ArrowDown size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Download</p>
                  <p className="text-xs text-slate-500">
                    {download ? getSpeedRating(download.speedMbps).label : 'Not tested yet'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-400 tabular-nums">
                  {download ? download.speedMbps.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-slate-500">Mbps</p>
              </div>
            </div>
            {download && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                  <span className="text-slate-500">Data</span>
                  <span className="text-slate-300 tabular-nums">{formatBytes(download.bytesDownloaded)}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                  <span className="text-slate-500">Time</span>
                  <span className="text-slate-300 tabular-nums">{(download.durationMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            )}
            {phase === 'download' && !download && <SectionLoader message="Measuring download speed" />}
          </div>

          {/* Upload */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <ArrowUp size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Upload</p>
                  <p className="text-xs text-slate-500">
                    {upload ? getSpeedRating(upload.speedMbps).label : 'Not tested yet'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400 tabular-nums">
                  {upload ? upload.speedMbps.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-slate-500">Mbps</p>
              </div>
            </div>
            {upload && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                  <span className="text-slate-500">Data</span>
                  <span className="text-slate-300 tabular-nums">{formatBytes(upload.bytesUploaded)}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-800/30 px-3 py-2">
                  <span className="text-slate-500">Time</span>
                  <span className="text-slate-300 tabular-nums">{(upload.durationMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            )}
            {phase === 'upload' && !upload && <SectionLoader message="Measuring upload speed" />}
          </div>

          {/* Summary */}
          {download && upload && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 animate-fade-in">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Ratio (Up/Down)</span>
                <span className="text-cyan-400 font-medium tabular-nums">
                  1 : {(download.speedMbps / Math.max(upload.speedMbps, 0.1)).toFixed(1)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-400">Overall Rating</span>
                <span className="text-white font-medium">
                  {getSpeedRating((download.speedMbps + upload.speedMbps) / 2).label}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
