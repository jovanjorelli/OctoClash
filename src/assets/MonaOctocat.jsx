import React from 'react';
import { MarkGithubIcon } from '@primer/octicons-react';

/**
 * Placeholder GitHub Mark Octocat graphic component.
 * @param {{ className?: string }} props - Container styling classes.
 */
export function MonaOctocat({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <MarkGithubIcon size={64} className="text-fg-muted" />
    </div>
  );
}
