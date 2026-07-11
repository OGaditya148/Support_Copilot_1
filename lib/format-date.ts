/**
 * Date formatting utilities with a fixed locale + timezone so that
 * server-side rendering and client-side hydration always produce
 * identical strings — preventing React hydration mismatch warnings.
 *
 * All dates are rendered in UTC so the output is deterministic
 * regardless of where the server or browser is located.
 */

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATETIME_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "Jul 11, 2026" */
export function fmtDate(value: string | Date): string {
  return DATE_FMT.format(new Date(value));
}

/** "Jul 11, 2026, 9:05 AM" */
export function fmtDatetime(value: string | Date): string {
  return DATETIME_FMT.format(new Date(value));
}
