import { describe, it, expect } from 'vitest';
import '../../setup.js';
import { cn, formatBytes, getMonthNames } from '../../../src/utils/helpers.js';

describe('helpers utility tests', () => {
  describe('cn (classNames helper)', () => {
    it('merges multiple plain class names', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
    });

    it('filters out falsy values', () => {
      expect(cn('btn', false, null, undefined, '', 0, 'active')).toBe('btn active');
    });

    it('resolves conflicting Tailwind classes with twMerge precedence', () => {
      expect(cn('p-2 text-sm', 'p-4 text-base')).toBe('p-4 text-base');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('handles objects and array inputs correctly', () => {
      expect(cn(['foo', 'bar'], { baz: true, qux: false })).toBe('foo bar baz');
    });
  });

  describe('formatBytes', () => {
    it('returns "0 Bytes" for zero or falsy or invalid inputs', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes('0')).toBe('0 Bytes');
      expect(formatBytes(null)).toBe('0 Bytes');
      expect(formatBytes(undefined)).toBe('0 Bytes');
      expect(formatBytes('not-a-number')).toBe('0 Bytes');
    });

    it('formats exact byte boundaries and intermediate values', () => {
      expect(formatBytes(1)).toBe('1 Bytes');
      expect(formatBytes(500)).toBe('500 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });

    it('respects the decimals parameter', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 3)).toBe('1.5 KB'); // parseFloat strips trailing zeros
      expect(formatBytes(1234567, 3)).toBe('1.177 MB');
    });

    it('handles negative decimals by defaulting to 0 decimal places', () => {
      expect(formatBytes(1536, -2)).toBe('2 KB');
    });
  });

  describe('getMonthNames', () => {
    it('returns all 12 abbreviated month names in chronological order', () => {
      const months = getMonthNames();
      expect(months).toHaveLength(12);
      expect(months).toEqual([
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]);
    });
  });
});
