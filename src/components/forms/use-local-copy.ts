"use client";

import { useI18n } from "@/lib/i18n";

export type Bilingual<T> = { it: T; en: T };

/** Legge la lingua dal provider globale senza modificarlo.
 *  Tutta la copy di questi form è definita localmente, mai in i18n.tsx. */
export function useLocalCopy<T extends { it: unknown; en: unknown }>(copy: T): T["it"] | T["en"] {
  const { lang } = useI18n();
  return copy[lang] as T["it"] | T["en"];
}
