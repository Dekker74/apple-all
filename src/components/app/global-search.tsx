"use client";

import { useI18n } from "@/lib/i18n";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * The app has a single search field. Submitting it always opens the marketplace
 * with the query applied, so there are no stacked search bars on page bodies.
 */
export function GlobalSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/app/marketplace?q=${encodeURIComponent(q)}` : "/app/marketplace");
  }

  return (
    <form className="offcut-app-search" onSubmit={submit} role="search">
      <Search className="search-icon size-3.5 shrink-0 text-muted" aria-hidden />
      <input
        aria-label={t("Cerca materiali")}
        placeholder={t("Cerca materiali…")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button className="search-submit" type="submit" aria-label={t("Apri la ricerca materiali")}>
        <Search className="size-4" aria-hidden />
      </button>
    </form>
  );
}
