import { LogOut } from 'lucide-react';
import {
  LayoutDashboard,
  Gauge,
  Activity,
  Globe,
  Route,
  Plug,
  Network as NetworkIcon,
  History,
  Wifi,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ViewKey } from '@/types';
import { PulseDot } from './Loaders';

interface SidebarProps {
  current: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

const NAV_ITEMS: { key: ViewKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, desc: 'Overview' },
  { key: 'speed', label: 'Speed Test', icon: <Gauge size={18} />, desc: 'Download & Upload' },
  { key: 'ping', label: 'Ping & Latency', icon: <Activity size={18} />, desc: 'Latency & Loss' },
  { key: 'dns', label: 'DNS Lookup', icon: <Globe size={18} />, desc: 'DNS Response' },
  { key: 'traceroute', label: 'Traceroute', icon: <Route size={18} />, desc: 'Network Path' },
  { key: 'connectivity', label: 'Connectivity', icon: <Plug size={18} />, desc: 'TCP & HTTP' },
  { key: 'info', label: 'Network Info', icon: <NetworkIcon size={18} />, desc: 'IP & Gateway' },
  { key: 'history', label: 'History', icon: <History size={18} />, desc: 'Past Results' },
];
const handleLogout = async () => {
  await supabase.auth.signOut();
};

export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
          <Wifi size={20} className="text-white" />
          <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">NetPulse</h1>
          <p className="text-[10px] uppercase tracking-widest text-cyan-600/70 dark:text-cyan-400/70">Network Analyzer</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
          Tests
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = current === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavigate(item.key)}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                    active
                      ? 'bg-slate-200/80 text-slate-900 dark:bg-slate-800/80 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                  )}
                  <span className={active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 dark:text-slate-600">{item.desc}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Status footer */}
      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
      <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PulseDot active color="bg-emerald-500" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">System Ready</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">v1.0</span>
        </div>
      </div>
    </aside>
      
  );
}
