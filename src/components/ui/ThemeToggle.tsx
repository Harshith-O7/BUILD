import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { theme, setTheme } = useStore();
  const isDark = theme === 'dark';

  return (
    <div
      role="group"
      aria-label="Theme appearance"
      className="inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-zinc-800 dark:bg-black"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={!isDark}
        aria-label="Switch to White theme"
        className={`inline-flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
          !isDark
            ? 'bg-white text-black shadow-xs'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Sun className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-400" />
        {!compact && <span>White</span>}
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={isDark}
        aria-label="Switch to Dark theme"
        className={`inline-flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
          isDark
            ? 'bg-zinc-900 text-white ring-1 ring-zinc-700 shadow-xs'
            : 'text-zinc-600 hover:text-black'
        }`}
      >
        <Moon className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-200" />
        {!compact && <span>Dark</span>}
      </button>
    </div>
  );
};
