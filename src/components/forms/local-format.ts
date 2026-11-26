const LOCALES = { it: "it-IT", en: "en-GB" } as const;

export function formatLocalDate(value: string, lang: "it" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatLocalDateShort(value: string, lang: "it" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatLocalTime(value: string, lang: "it" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALES[lang], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
