import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '../../setup.js';
import { ErrorBoundary } from '../../../src/components/ui/ErrorBoundary.jsx';
import * as storageModule from '../../../src/utils/storage.js';

function BombComponent({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Explosive runtime render error');
  }
  return <div data-testid="healthy-child">All systems operational</div>;
}

describe('ErrorBoundary component tests', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress expected React boundary error output in test logs
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
  });

  it('renders children properly when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    const child = screen.getByTestId('healthy-child');
    expect(child).not.toBeNull();
    expect(child.textContent).toBe('All systems operational');
    expect(screen.queryByText(/app crashed/i)).toBeNull();
  });

  it('catches thrown render errors and displays fallback crash UI', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('App Crashed');
    expect(screen.getByText(/a critical error occurred while rendering the application/i)).not.toBeNull();
    expect(screen.getByText(/explosive runtime render error/i)).not.toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('invokes storage clear utilities and reloads window when recovery button is clicked', () => {
    const clearStorageSpy = vi.spyOn(storageModule, 'clearOctoClashStorage').mockImplementation(() => {});
    const clearSessionSpy = vi.spyOn(storageModule, 'clearOctoClashSession').mockImplementation(() => {});

    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, reload: vi.fn() };

    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadBtn = screen.getByRole('button', { name: /clear cache & reload/i });
    expect(reloadBtn).not.toBeNull();

    fireEvent.click(reloadBtn);

    expect(clearStorageSpy).toHaveBeenCalledTimes(1);
    expect(clearSessionSpy).toHaveBeenCalledTimes(1);
    expect(window.location.reload).toHaveBeenCalledTimes(1);

    clearStorageSpy.mockRestore();
    clearSessionSpy.mockRestore();
    window.location = originalLocation;
  });
});
