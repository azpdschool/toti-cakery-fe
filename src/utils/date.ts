// src/utils/date.ts

/**
 * Formats a Date object, ISO string, timestamp, or YYYY-MM-DD string into 'YYYY-MM-DD'
 * based on Asia/Jakarta timezone (WIB, UTC+7) to prevent 1-day date shifting.
 */
export function formatDateToLocalYYYYMMDD(date?: Date | string | number | null): string {
  if (!date) return '';

  // If it's already a clean YYYY-MM-DD string without time component, return trimmed
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return date.trim();
  }

  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  // Use Intl.DateTimeFormat with Asia/Jakarta timezone and en-CA locale (outputs YYYY-MM-DD)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(d);
}

/**
 * Helper to extract year, month, day numbers in Asia/Jakarta timezone.
 */
export function getJakartaDateParts(date: Date = new Date()): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1970', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
  return { year, month, day };
}

/**
 * Get today's date formatted as YYYY-MM-DD in Asia/Jakarta timezone.
 */
export function getTodayLocal(): string {
  return formatDateToLocalYYYYMMDD(new Date());
}

/**
 * Get the start date of the current month formatted as YYYY-MM-DD in Asia/Jakarta timezone.
 */
export function getStartOfMonthLocal(date: Date = new Date()): string {
  const parts = getJakartaDateParts(date);
  const mm = String(parts.month).padStart(2, '0');
  return `${parts.year}-${mm}-01`;
}

/**
 * Get the end date of the current month formatted as YYYY-MM-DD in Asia/Jakarta timezone.
 */
export function getEndOfMonthLocal(date: Date = new Date()): string {
  const parts = getJakartaDateParts(date);
  const lastDay = new Date(parts.year, parts.month, 0).getDate();
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(lastDay).padStart(2, '0');
  return `${parts.year}-${mm}-${dd}`;
}
