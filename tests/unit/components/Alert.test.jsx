import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '../../setup.js';
import { Alert } from '../../../src/components/ui/Alert.jsx';

describe('Alert component tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when message is null or empty', () => {
    const { container: c1 } = render(<Alert message={null} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<Alert message="" />);
    expect(c2.firstChild).toBeNull();
  });

  it('renders default error alert when type is not specified', () => {
    const { container } = render(<Alert message="Something went wrong" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Something went wrong');
    expect(alert.className).toContain('border-fg-danger/20');
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('text-fg-danger');
  });

  it('renders error variant explicitly', () => {
    const { container } = render(<Alert message="Critical error occurred" type="error" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Critical error occurred');
    expect(alert.className).toContain('border-fg-danger/20');
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('text-fg-danger');
  });

  it('renders success variant with appropriate classes', () => {
    const { container } = render(<Alert message="Repository saved successfully" type="success" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Repository saved successfully');
    expect(alert.className).toContain('border-fg-success/20');
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('text-fg-success');
  });

  it('renders info variant with appropriate classes', () => {
    const { container } = render(<Alert message="Rate limit status updated" type="info" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Rate limit status updated');
    expect(alert.className).toContain('border-fg-accent/20');
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('text-fg-accent');
  });

  it('renders warning variant with appropriate classes', () => {
    const { container } = render(<Alert message="Approaching hourly rate limit" type="warning" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Approaching hourly rate limit');
    expect(alert.className).toContain('border-fg-warning/20');
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('text-fg-warning');
  });

  it('falls back to default neutral styling when an unknown variant type is provided', () => {
    const { container } = render(<Alert message="Custom neutral notification" type="unknown-type" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Custom neutral notification');
    expect(alert.className).toContain('bg-canvas-subtle');
    const icon = container.querySelector('svg');
    expect(icon.getAttribute('class')).toContain('text-fg-default');
  });

  it('renders close button and triggers onClose callback on click', () => {
    const handleClose = vi.fn();
    render(<Alert message="Dismissible warning" type="warning" onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /close alert/i });
    expect(closeBtn).not.toBeNull();

    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is omitted', () => {
    render(<Alert message="Persistent notice" type="info" />);
    expect(screen.queryByRole('button', { name: /close alert/i })).toBeNull();
  });
});
