import React, { useEffect, useRef } from 'react';
import { XIcon, ColumnsIcon } from '@primer/octicons-react';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';

const COLUMN_DEFINITIONS = [
  { id: 'language', label: 'Language' },
  { id: 'npm', label: 'NPM Downloads' },
  { id: 'health', label: 'Health Score' },
  { id: 'release', label: 'Latest Release' },
  { id: 'commits', label: 'Commits (1y)' },
  { id: 'stars', label: 'Stars' },
  { id: 'forks', label: 'Forks' },
  { id: 'watchers', label: 'Watchers' },
  { id: 'issues', label: 'Open Issues' },
  { id: 'size', label: 'Size' },
  { id: 'fixTime', label: 'Fix Time' },
  { id: 'license', label: 'License' },
  { id: 'readme', label: 'README' },
  { id: 'contributors', label: 'Contributors' },
];

export function SettingsModal() {
  const settingsOpen = useAppStore((state) => state.settingsOpen);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const visibleColumns = useAppStore((state) => state.visibleColumns);
  const toggleColumn = useAppStore((state) => state.toggleColumn);
  const resetColumns = useAppStore((state) => state.resetColumns);
  const setAllColumns = useAppStore((state) => state.setAllColumns);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    if (settingsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [settingsOpen, setSettingsOpen]);

  if (!settingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-200"
      onClick={() => setSettingsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex="-1"
        className="bg-canvas-default border border-border-default rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-default bg-canvas-subtle">
          <div className="flex items-center gap-2">
            <ColumnsIcon size={18} className="text-fg-default" />
            <h2 id="settings-modal-title" className="text-base font-semibold text-fg-default">
              Configure Visible Columns
            </h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
            className="text-fg-muted hover:text-fg-default p-1 rounded-md hover:bg-canvas-inset transition-colors cursor-pointer"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-fg-muted">
              Select which metrics appear in the comparison matrix table. Preferences are automatically saved.
            </p>
            <div className="flex items-center gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setAllColumns(true)}
                className="text-fg-accent hover:underline cursor-pointer font-medium"
              >
                Select all
              </button>
              <span className="text-border-default">•</span>
              <button
                type="button"
                onClick={resetColumns}
                className="text-fg-muted hover:text-fg-default cursor-pointer font-medium"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {COLUMN_DEFINITIONS.map(({ id, label }) => {
              const isChecked = visibleColumns[id] !== false;
              return (
                <label
                  key={id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'border-border-default bg-canvas-subtle text-fg-default shadow-xs'
                      : 'border-border-muted bg-canvas-default text-fg-muted opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColumn(id)}
                    className="rounded border-border-default text-fg-accent focus:ring-fg-accent"
                  />
                  <span className="font-medium truncate">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-border-default bg-canvas-subtle flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={() => setSettingsOpen(false)}
            className="text-xs px-3"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
