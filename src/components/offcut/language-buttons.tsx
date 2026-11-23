"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageButtons({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div className={`ctrl-group lang-buttons ${className}`} role="group" aria-label="Language / Lingua">
      {(["it", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          className={`pill-btn${lang === code ? " on" : ""}`}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          title={code === "it" ? "Italiano" : "English"}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
