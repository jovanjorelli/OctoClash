import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { GearIcon, KeyIcon, TrashIcon, CheckIcon, LinkExternalIcon } from '@primer/octicons-react';

export function Footer() {
  const token = useAppStore((state) => state.token);
  const setToken = useAppStore((state) => state.setToken);
  const rateLimit = useAppStore((state) => state.rateLimit);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);

  const [inputToken, setInputToken] = useState(token);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setInputToken(token);
  }, [token]);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    const cleanToken = inputToken.trim();
    setToken(cleanToken);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setInputToken('');
    setToken('');
    setIsEditing(false);
  };

  const minutesUntilReset = rateLimit?.reset
    ? Math.max(0, Math.ceil((rateLimit.reset * 1000 - Date.now()) / (1000 * 60)))
    : null;

  const isAuthed = Boolean(token.trim());

  return (
    <footer className="border-t border-border-default py-2 bg-canvas-default text-xs text-fg-muted shrink-0">
      <div className="max-w-[1850px] mx-auto px-3 sm:px-6 w-full flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-fg-muted justify-center md:justify-start">
          <span className="font-semibold text-fg-default">OctoClash</span>
          <span>&copy; {new Date().getFullYear()}</span>
          <span>•</span>
          <span>Open Source No-Backend Engine</span>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-3">
          {rateLimit && (
            <div className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-mono rounded-md border border-border-default bg-canvas-subtle text-fg-muted whitespace-nowrap shadow-xs">
              <span className={`w-2 h-2 rounded-full shrink-0 ${rateLimit.remaining <= 5 ? 'bg-fg-danger animate-pulse' : rateLimit.remaining <= 15 ? 'bg-fg-warning' : 'bg-fg-success'}`} />
              <span className="text-fg-default font-medium">API Quota: {rateLimit.remaining.toLocaleString()} / {rateLimit.limit.toLocaleString()}</span>
              {minutesUntilReset !== null && (
                <span className="text-fg-muted font-sans text-[11px]">({minutesUntilReset}m left)</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {isAuthed && !isEditing ? (
              <div className="inline-flex items-center gap-2 h-7 px-2.5 text-xs font-mono rounded-md border border-border-default bg-canvas-subtle shadow-xs">
                <div className="flex items-center gap-1.5 text-fg-success font-medium">
                  <KeyIcon size={12} className="shrink-0" />
                  <span>PAT Active</span>
                </div>
                <div className="w-px h-3.5 bg-border-default" />
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-sans text-fg-muted hover:text-fg-default transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  title="Remove Personal Access Token"
                  className="text-fg-muted hover:text-fg-danger p-0.5 cursor-pointer transition-colors"
                  aria-label="Remove PAT"
                >
                  <TrashIcon size={12} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="flex items-center gap-1.5">
                <div className="inline-flex items-center shadow-xs">
                  <div className="relative flex items-center">
                    <KeyIcon size={12} className="absolute left-2.5 text-fg-muted pointer-events-none" />
                    <input
                      type="password"
                      placeholder="GitHub PAT (5,000 req/hr)..."
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value)}
                      className="h-7 pl-7 pr-2.5 text-xs font-mono rounded-l-md bg-canvas-subtle border border-border-default text-fg-default placeholder:text-fg-muted focus:border-fg-accent focus:bg-canvas-default focus:ring-1 focus:ring-fg-accent focus:z-10 outline-none w-44 sm:w-56 transition-colors"
                      aria-label="GitHub Personal Access Token"
                    />
                  </div>
                  <button
                    type="submit"
                    className={`inline-flex items-center justify-center gap-1 h-7 px-2.5 text-xs font-medium rounded-r-md border border-l-0 border-border-default transition-colors cursor-pointer select-none -ml-px ${
                      saved
                        ? 'bg-btn-primaryBg text-white border-btn-primaryBg'
                        : 'bg-btn-bg hover:bg-btn-hoverBg text-fg-default active:bg-btn-hoverBg'
                    }`}
                  >
                    {saved ? (
                      <>
                        <CheckIcon size={12} />
                        <span>Saved</span>
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="h-7 px-1.5 text-xs font-medium text-fg-muted hover:text-fg-default cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <a
                  href="https://github.com/settings/tokens/new?description=OctoClash&scopes=public_repo"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md border border-btn-border bg-btn-bg hover:bg-btn-hoverBg text-fg-default transition-colors shadow-xs cursor-pointer select-none whitespace-nowrap"
                  title="Create a personal access token on GitHub"
                >
                  <span>Get PAT</span>
                  <LinkExternalIcon size={11} className="text-fg-muted" />
                </a>
              </form>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md border border-btn-border bg-btn-bg hover:bg-btn-hoverBg text-fg-default transition-colors shadow-xs cursor-pointer select-none"
            aria-label="Open settings"
          >
            <GearIcon size={13} className="text-fg-muted" />
            <span>Columns</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
