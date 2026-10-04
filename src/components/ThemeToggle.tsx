import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="group relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/60 text-slate-600 transition-all hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? (
        <Sun size={18} className="transition-transform duration-300 group-hover:rotate-12" />
      ) : (
        <Moon size={18} className="transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}
