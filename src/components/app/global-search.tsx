"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * The app has a single search field. Submitting it always opens the marketplace
 * with the query applied, so there are no stacked search bars on page bodies.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/app/marketplace?q=${encodeURIComponent(q)}` : "/app/marketplace");
  }

  return (
    <form className="offcut-app-search" onSubmit={submit} role="search">
      <Search className="size-3.5 shrink-0 text-muted" aria-hidden />
      <input
        aria-label="Cerca materiali"
        placeholder="Cerca materiali…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </form>
  );
}
