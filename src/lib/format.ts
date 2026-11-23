const GROUPED_LOCALE = "de-DE";

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat(GROUPED_LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDate(value: string | Date, opts?: { withYear?: boolean }): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    ...(opts?.withYear === false ? {} : { year: "numeric" }),
  }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start, { withYear: false })} – ${formatDate(end)}`;
}

export function relativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const minutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("it", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  const months = Math.round(days / 30);
  return rtf.format(months, "month");
}

export function daysUntil(value: string): number {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export function toDateInput(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function todayInput(): string {
  return toDateInput(new Date());
}

export function addDaysInput(days: number): string {
  return toDateInput(new Date(Date.now() + days * 86_400_000));
}
