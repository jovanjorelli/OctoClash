import React from 'react';
import { AlertIcon, XCircleIcon, CheckCircleIcon, InfoIcon } from '@primer/octicons-react';

export function Alert({ message, type = 'error', onClose }) {
  if (!message) return null;

  let bgStyles = 'bg-canvas-subtle border-border-default';
  let textStyles = 'text-fg-default';
  let Icon = AlertIcon;

  if (type === 'error') {
    bgStyles = 'bg-fg-danger/10 border-fg-danger/20';
    textStyles = 'text-fg-danger';
    Icon = XCircleIcon;
  } else if (type === 'success') {
    bgStyles = 'bg-fg-success/10 border-fg-success/20';
    textStyles = 'text-fg-success';
    Icon = CheckCircleIcon;
  } else if (type === 'info') {
    bgStyles = 'bg-fg-accent/10 border-fg-accent/20';
    textStyles = 'text-fg-accent';
    Icon = InfoIcon;
  } else if (type === 'warning') {
    bgStyles = 'bg-fg-warning/10 border-fg-warning/20';
    textStyles = 'text-fg-warning';
    Icon = AlertIcon;
  }

  return (
    <div 
      className={`flex items-start gap-3 p-4 border rounded-md ${bgStyles}`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={`mt-0.5 ${textStyles}`} size={16} aria-hidden="true" />
      <div className="flex-1 text-sm font-semibold">{message}</div>
      {onClose && (
        <button onClick={onClose} className="text-fg-muted hover:text-fg-default" aria-label="Close alert">
          <XCircleIcon size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
