import React from 'react';
import { AlertIcon, SyncIcon } from '@primer/octicons-react';
import { clearOctoClashSession, clearOctoClashStorage } from '../../utils/storage';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-canvas-default p-6">
          <div className="max-w-2xl w-full bg-canvas-subtle border border-fg-danger rounded-xl p-8 shadow-xl">
            <div className="flex items-center gap-3 text-fg-danger mb-4">
              <AlertIcon size={32} />
              <h1 className="text-2xl font-bold">App Crashed</h1>
            </div>
            <p className="text-fg-default mb-4">
              A critical error occurred while rendering the application. 
              Please copy the error details below and share them with the developer.
            </p>
            <div className="bg-canvas-inset border border-border-default rounded-md p-4 mb-6 overflow-x-auto">
              <pre className="text-fg-danger text-sm font-mono whitespace-pre-wrap">
                {this.state.error?.toString()}
              </pre>
              <pre className="text-fg-muted text-xs font-mono mt-4 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
            <button
              onClick={() => {
                clearOctoClashStorage();
                clearOctoClashSession();
                window.location.reload();
              }}
              className="flex items-center justify-center gap-2 w-full bg-btn-primaryBg hover:bg-btn-primaryHoverBg text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              <SyncIcon />
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
