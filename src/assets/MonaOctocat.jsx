import React from 'react';
import { MarkGithubIcon } from '@primer/octicons-react';

export function MonaOctocat({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <MarkGithubIcon size={64} className="text-fg-muted" />
    </div>
  );
}
