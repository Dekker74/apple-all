"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageButtons({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className={`ctrl-group lang-buttons ${className}`} role="group" aria-label={t("lang.group")}>
      {(["it", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          className={`pill-btn${lang === code ? " on" : ""}`}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          title={code === "it" ? t("lang.it") : t("lang.en")}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
