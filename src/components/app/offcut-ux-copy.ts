import type { Lang } from "@/lib/i18n";

/**
 * Pick a page-local `COPY = { it, en }` block with the active language.
 * New copy lives beside the code that uses it, so both locales stay in sync
 * without touching the shared dictionary.
 */
export function localized<T>(copy: { it: T; en: T }, lang: Lang): T {
  return copy[lang];
}
