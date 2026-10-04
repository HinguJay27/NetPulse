import { useEffect, useState } from 'react';

interface SectionLoaderProps {
  message?: string;
}

export function SectionLoader({ message = 'Running test...' }: SectionLoaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500 dark:border-slate-600 dark:border-t-cyan-400" />
      <span>{message}{dots}</span>
    </div>
  );
}

interface ScanLineProps {
  active: boolean;
}

export function ScanLine({ active }: ScanLineProps) {
  if (!active) return null;
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 dark:via-cyan-400 to-transparent animate-scan" />
    </div>
  );
}

interface PulseDotProps {
  active?: boolean;
  color?: string;
}

export function PulseDot({ active = true, color = 'bg-cyan-500' }: PulseDotProps) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`} />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}
