import type { Lang } from "@/lib/i18n";

/**
 * Locale-aware display helpers for the app surfaces owned by this redesign.
 * They only format values produced by the existing pricing/store logic:
 * no value is calculated, estimated or changed here.
 */
const CURRENCY_LOCALE: Record<Lang, string> = { it: "de-DE", en: "en-IE" };
const DATE_LOCALE: Record<Lang, string> = { it: "it-IT", en: "en-GB" };

export function money(
  value: number,
  lang: Lang,
  opts?: { cents?: boolean; compact?: boolean },
): string {
  if (opts?.compact) {
    return new Intl.NumberFormat(CURRENCY_LOCALE[lang], {
      style: "currency",
      currency: "EUR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat(CURRENCY_LOCALE[lang], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  }).format(value);
}

export function perKg(value: number, lang: Lang, digits = 2): string {
  return `${new Intl.NumberFormat(CURRENCY_LOCALE[lang], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}/kg`;
}

export function kgText(value: number, lang: Lang): string {
  if (value >= 1000) {
    return `${new Intl.NumberFormat(CURRENCY_LOCALE[lang], {
      maximumFractionDigits: value % 1000 === 0 ? 0 : 1,
    }).format(value / 1000)} t`;
  }
  return `${new Intl.NumberFormat(CURRENCY_LOCALE[lang]).format(value)} kg`;
}

export function dateText(
  value: string | Date,
  lang: Lang,
  opts?: { withYear?: boolean },
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], {
    day: "numeric",
    month: "short",
    ...(opts?.withYear === false ? {} : { year: "numeric" }),
  }).format(date);
}

export function dateTimeText(value: string | Date, lang: Lang): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function timeText(value: string | Date, lang: Lang): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function relativeText(value: string | Date, lang: Lang): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const minutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const rtf = new Intl.RelativeTimeFormat(DATE_LOCALE[lang], { numeric: "auto" });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  return rtf.format(Math.round(days / 30), "month");
}

export function daysText(days: number, lang: Lang): string {
  if (lang === "it") return `${days} ${days === 1 ? "giorno" : "giorni"}`;
  return `${days} ${days === 1 ? "day" : "days"}`;
}
