import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional CSS class names using clsx and resolves Tailwind conflicts via tailwind-merge.
 * @param {...any} inputs - Class values, objects, or arrays.
 * @returns {string} Merged class string.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a raw byte count into human-readable binary units (Bytes, KB, MB, GB, TB).
 * @param {number|string} bytes - Number of bytes to format.
 * @param {number} [decimals=2] - Decimal places to round to.
 * @returns {string} Formatted string with unit suffix.
 */
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Returns three-letter English month abbreviations for date formatting.
 * @returns {string[]} Array of month abbreviations.
 */
export function getMonthNames() {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}
