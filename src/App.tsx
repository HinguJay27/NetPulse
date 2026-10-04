import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { Dashboard } from '@/views/Dashboard';
import { SpeedTest } from '@/views/SpeedTest';
import { PingTest } from '@/views/PingTest';
import { DnsLookup } from '@/views/DnsLookup';
import { Traceroute } from '@/views/Traceroute';
import { Connectivity } from '@/views/Connectivity';
import { NetworkInfoView } from '@/views/NetworkInfoView';
import { HistoryView } from '@/views/HistoryView';
import type { ViewKey } from '@/types';

function App() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem('netpulse_view');
    if (saved) setView(saved as ViewKey);
  }, []);

  const handleNavigate = (v: ViewKey) => {
    setView(v);
    localStorage.setItem('netpulse_view', v);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Background gradient effect */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl dark:bg-cyan-500/5" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-500/5" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 flex-shrink-0">
        <Sidebar current={view} onNavigate={handleNavigate} />
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto scrollbar-thin">
        {/* Top bar with theme toggle */}
        <div className="sticky top-0 z-20 flex items-center justify-end px-6 py-3 backdrop-blur-sm bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/50">
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8 animate-fade-in" key={view}>
          {view === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {view === 'speed' && <SpeedTest />}
          {view === 'ping' && <PingTest />}
          {view === 'dns' && <DnsLookup />}
          {view === 'traceroute' && <Traceroute />}
          {view === 'connectivity' && <Connectivity />}
          {view === 'info' && <NetworkInfoView />}
          {view === 'history' && <HistoryView />}
        </div>
      </main>
    </div>
  );
}

export default App;
