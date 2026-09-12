import React, { useEffect, useState } from 'react';
import { MarkGithubIcon, SunIcon, MoonIcon, SyncIcon, DeviceDesktopIcon } from '@primer/octicons-react';
import { useAppStore } from '../../store/appStore';
import { clearOctoClashStorage } from '../../utils/storage';

export function Header() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);
    const handler = (e) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    if (theme === 'system') {
      if (systemIsDark) root.classList.add('dark');
      else root.classList.remove('dark');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, systemIsDark]);

  return (
    <header className="bg-canvas-subtle border-b border-border-default py-2 px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2.5">
        <MarkGithubIcon size={24} className="text-fg-default shrink-0" />
        <h1 className="text-base sm:text-lg font-semibold text-fg-default tracking-tight">OctoClash</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            clearOctoClashStorage();
            window.location.reload();
          }}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md border border-btn-border bg-btn-bg hover:bg-btn-hoverBg active:bg-btn-hoverBg text-fg-default shadow-xs transition-colors cursor-pointer select-none"
          title="Clear cache and reload application"
          aria-label="Reset cache and reload"
        >
          <SyncIcon size={12} className="text-fg-muted" />
          <span className="hidden sm:inline">Reset & Reload</span>
        </button>

        <div role="group" aria-label="Theme selection" className="inline-flex items-center h-7 rounded-md border border-border-default bg-canvas-subtle p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setTheme('system')}
            title="System theme"
            aria-label="System theme"
            aria-pressed={theme === 'system'}
            className={`inline-flex items-center gap-1.5 h-full px-2.5 text-xs rounded-[4px] transition-colors cursor-pointer select-none ${
              theme === 'system'
                ? 'bg-canvas-default text-fg-default shadow-xs font-semibold'
                : 'text-fg-muted hover:text-fg-default font-medium'
            }`}
          >
            <DeviceDesktopIcon size={13} />
            <span className="hidden md:inline">System</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            title="Light theme"
            aria-label="Light theme"
            aria-pressed={theme === 'light'}
            className={`inline-flex items-center gap-1.5 h-full px-2.5 text-xs rounded-[4px] transition-colors cursor-pointer select-none ${
              theme === 'light'
                ? 'bg-canvas-default text-fg-default shadow-xs font-semibold'
                : 'text-fg-muted hover:text-fg-default font-medium'
            }`}
          >
            <SunIcon size={13} />
            <span className="hidden md:inline">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            title="Dark theme"
            aria-label="Dark theme"
            aria-pressed={theme === 'dark'}
            className={`inline-flex items-center gap-1.5 h-full px-2.5 text-xs rounded-[4px] transition-colors cursor-pointer select-none ${
              theme === 'dark'
                ? 'bg-canvas-default text-fg-default shadow-xs font-semibold'
                : 'text-fg-muted hover:text-fg-default font-medium'
            }`}
          >
            <MoonIcon size={13} />
            <span className="hidden md:inline">Dark</span>
          </button>
        </div>
      </div>
    </header>
  );
}
