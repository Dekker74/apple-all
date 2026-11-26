"use client";

import { useI18n } from "@/lib/i18n";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpDown,
  Compass,
  Filter,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { localized } from "@/components/app/offcut-ux-copy";
import { PageHeader } from "@/components/app/page-header";
import { StatusCallout } from "@/components/app/offcut-ux-primitives";
import { ListingCard } from "@/components/material/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { useCurrentOrg, useMatchViews, useOrgLocations, usePrimaryLocation } from "@/lib/hooks";
import { computePriceBreakdown, formatPerKg, haversineKm, resolveProcessing } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MaterialCategory, MaterialCondition } from "@/types";

interface Filters {
  categories: MaterialCategory[];
  minKg: string;
  maxKg: string;
  maxDelivered: string;
  conditions: MaterialCondition[];
  radiusKm: number;
  query: string;
  locationId: string;
}

const SORTS = [
  { value: "fit", label: "Migliore affinità AI" },
  { value: "price", label: "Prezzo consegnato" },
  { value: "distance", label: "Distanza" },
  { value: "volume", label: "Volume" },
  { value: "newest", label: "Più recenti" },
] as const;

const COPY = {
  it: {
    originLabel: "Sede di partenza",
    clearSearch: "Cancella ricerca",
    showResults: (count: number) => `Mostra ${count} risultati`,
    resultSummary: (count: number, radius: number, city: string) =>
      `${count} materiali${radius < 500 ? ` entro ${radius} km da ${city}` : ""}`,
  },
  en: {
    originLabel: "Origin site",
    clearSearch: "Clear search",
    showResults: (count: number) => `Show ${count} results`,
    resultSummary: (count: number, radius: number, city: string) =>
      `${count} materials${radius < 500 ? ` within ${radius} km of ${city}` : ""}`,
  },
};

function FilterSection({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line/70 py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function MarketplacePage() {
  const { t, lang } = useI18n();
  const c = localized(COPY, lang);
  const org = useCurrentOrg();
  const locations = useOrgLocations();
  const primary = usePrimaryLocation();
  const listings = useAppStore((s) => s.listings);
  const organizations = useAppStore((s) => s.organizations);
  const allLocations = useAppStore((s) => s.locations);
  const matches = useAppStore((s) => s.matches);
  const views = useMatchViews();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<Filters>({
    categories: [],
    minKg: "",
    maxKg: "",
    maxDelivered: "",
    conditions: [],
    radiusKm: 500,
    query: queryParam,
    locationId: primary?.id ?? "",
  });
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("fit");
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    if (!primary) return;
    const current = allLocations.find((l) => l.id === filters.locationId);
    if (!current || current.orgId !== org?.id) {
      setFilters((prev) => ({ ...prev, locationId: primary.id }));
    }
  }, [primary, org?.id, filters.locationId, allLocations]);

  useEffect(() => {
    setFilters((prev) => (prev.query === queryParam ? prev : { ...prev, query: queryParam }));
  }, [queryParam]);

  const orgMap = useMemo(() => new Map(organizations.map((o) => [o.id, o])), [organizations]);
  const locationMap = useMemo(() => new Map(allLocations.map((l) => [l.id, l])), [allLocations]);
  const origin = locationMap.get(filters.locationId) ?? primary ?? locations[0] ?? null;

  const enriched = useMemo(() => {
    return listings
      .filter((l) => l.status === "active" || l.status === "matched")
      .filter((l) => l.orgId !== org?.id)
      .map((listing) => {
        const location = locationMap.get(listing.locationId);
        const distanceKm = origin && location ? haversineKm(origin, location) : 0;
        const quantityKg = Math.max(listing.minOrderKg, Math.min(listing.quantityKg, 8000));
        const breakdown = computePriceBreakdown({
          listing,
          quantityKg,
          distanceKm,
          processing: resolveProcessing(listing),
        });
        const match = matches
          .filter((m) => m.listingId === listing.id && m.status !== "dismissed")
          .sort((a, b) => b.score - a.score)[0];
        return { listing, location, distanceKm, breakdown, matchScore: match?.score };
      });
  }, [listings, org?.id, locationMap, origin, matches]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const minKg = Number(filters.minKg) || 0;
    const maxKg = Number(filters.maxKg) || Number.POSITIVE_INFINITY;
    const maxDelivered = Number(filters.maxDelivered) || Number.POSITIVE_INFINITY;

    const result = enriched.filter((item) => {
      const { listing } = item;
      if (filters.categories.length > 0 && !filters.categories.includes(listing.category)) {
        return false;
      }
      if (listing.quantityKg < minKg) return false;
      if (listing.quantityKg > maxKg) return false;
      if (item.breakdown.deliveredPerKg > maxDelivered) return false;
      if (filters.conditions.length > 0) {
        const listingConditions = listing.conditionFlags?.length
          ? listing.conditionFlags
          : [listing.condition];
        if (!filters.conditions.some((value) => listingConditions.includes(value))) return false;
      }
      if (item.distanceKm > filters.radiusKm) return false;
      if (q) {
        const haystack = `${listing.title} ${listing.description} ${listing.reference} ${listing.composition
          .map((c) => c.material)
          .join(" ")} ${orgMap.get(listing.orgId)?.name ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "price":
          return a.breakdown.deliveredPerKg - b.breakdown.deliveredPerKg;
        case "distance":
          return a.distanceKm - b.distanceKm;
        case "volume":
          return b.listing.quantityKg - a.listing.quantityKg;
        case "newest":
          return new Date(b.listing.createdAt).getTime() - new Date(a.listing.createdAt).getTime();
        default:
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      }
    });
    return result;
  }, [enriched, filters, sort, orgMap]);

  const activeFilters =
    filters.categories.length +
    (filters.minKg ? 1 : 0) +
    (filters.maxKg ? 1 : 0) +
    (filters.maxDelivered ? 1 : 0) +
    filters.conditions.length +
    (filters.radiusKm < 500 ? 1 : 0) +
    (filters.query ? 1 : 0);

  const avgDelivered =
    filtered.length > 0
      ? filtered.reduce((sum, item) => sum + item.breakdown.deliveredPerKg, 0) / filtered.length
      : 0;

  function toggleCategory(category: MaterialCategory) {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  }

  function toggleCondition(value: MaterialCondition) {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(value)
        ? prev.conditions.filter((c) => c !== value)
        : [...prev.conditions, value],
    }));
  }

  function clearQuery() {
    setFilters((prev) => ({ ...prev, query: "" }));
    if (queryParam) router.replace("/app/marketplace", { scroll: false });
  }

  function reset() {
    setFilters({
      categories: [],
      minKg: "",
      maxKg: "",
      maxDelivered: "",
      conditions: [],
      radiusKm: 500,
      query: "",
      locationId: primary?.id ?? "",
    });
    if (queryParam) router.replace("/app/marketplace", { scroll: false });
  }

  const panel = (
    <div className="space-y-0">
      <FilterSection
        title={t("Categoria materiale")}
        action={
          filters.categories.length > 0 ? (
            <button
              onClick={() => setFilters((p) => ({ ...p, categories: [] }))}
              className="text-[11.5px] text-muted hover:text-forest"
            >
              {t("Cancella")}
            </button>
          ) : null
        }
      >
        <div className="space-y-2">
          {CATEGORIES.map((cat) => {
            const checked = filters.categories.includes(cat.value);
            return (
              <label
                key={cat.value}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                  checked ? "border-forest bg-mist/40" : "border-line hover:border-sage",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat.value)}
                    className="size-3.5 shrink-0 accent-[#14532d]"
                  />
                  <span className="truncate text-[11.5px]">{t(cat.label)}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted">
                  {enriched.filter((e) => e.listing.category === cat.value).length}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title={t("Quantità disponibile")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100000}
            aria-label={t("Quantità minima in kg")}
            placeholder={t("Kg min")}
            value={filters.minKg}
            onChange={(e) => setFilters((p) => ({ ...p, minKg: e.target.value }))}
            className="h-9 min-w-0 text-[11.5px]"
          />
          <span className="shrink-0 text-muted">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100000}
            aria-label={t("Quantità massima in kg")}
            placeholder={t("Kg max")}
            value={filters.maxKg}
            onChange={(e) => setFilters((p) => ({ ...p, maxKg: e.target.value }))}
            className="h-9 min-w-0 text-[11.5px]"
          />
        </div>
      </FilterSection>

      <FilterSection title={t("Prezzo consegnato massimo")}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-muted">
            €
          </span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={1000}
            step="0.01"
            aria-label={t("Prezzo consegnato massimo per kg")}
            placeholder={t("es. 1,20 / kg")}
            value={filters.maxDelivered}
            onChange={(e) => setFilters((p) => ({ ...p, maxDelivered: e.target.value }))}
            className="h-9 pl-7 text-[11.5px]"
          />
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
          {t("Tutto incluso al kg, con lavorazione, trasporto, commissione e IVA.")}
        </p>
      </FilterSection>

      <FilterSection title={t("Condizioni del materiale")}>
        <p className="mb-2 text-[11.5px] leading-relaxed text-muted">
          {t(
            "Seleziona una o più condizioni. I materiali che corrispondono anche solo a una verranno mostrati.",
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((option) => {
            const active = filters.conditions.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCondition(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11.5px] transition-colors",
                  active
                    ? "border-forest bg-forest text-paper"
                    : "border-line bg-white/60 text-muted hover:border-sage hover:text-ink",
                )}
              >
                {t(option.label)}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title={t("Distanza")}>
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 shrink-0 text-muted" />
          <Select
            value={filters.locationId}
            onChange={(e) => setFilters((p) => ({ ...p, locationId: e.target.value }))}
            className="h-9 min-w-0 text-[11.5px]"
            aria-label={c.originLabel}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {t(`Da ${loc.city}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-muted">{t("Raggio")}</span>
            <span className="font-mono tabular-nums">{filters.radiusKm} km</span>
          </div>
          <input
            type="range"
            min={25}
            max={500}
            step={25}
            value={filters.radiusKm}
            onChange={(e) => setFilters((p) => ({ ...p, radiusKm: Number(e.target.value) }))}
            className="mt-1.5 w-full accent-[#14532d]"
            aria-label={t("Raggio di ricerca in chilometri")}
          />
        </div>
      </FilterSection>

      <div className="pt-4">
        <Button variant="outline" size="sm" className="w-full" onClick={reset}>
          <RotateCcw className="size-3.5" /> {t("Azzera filtri")}
        </Button>
      </div>
    </div>
  );

  const resultSummary = c.resultSummary(
    filtered.length,
    filters.radiusKm,
    origin?.city ?? "—",
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Marketplace · solo categorie di lancio")}
        title={t("Eccedenza, in specifica.")}
        description={t(
          `${listings.filter((l) => l.status === "active").length} annunci attivi nelle categorie carta, legno e plastica. I prezzi indicati si riferiscono al solo materiale; la scheda stima un ordine consegnato da ${origin?.city ?? t("la tua sede")}.`,
        )}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/requests">
                <Compass className="size-3.5" /> {t("La mia domanda")}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app/requests/new">
                <Plus className="size-3.5" /> {t("Pubblica una richiesta")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = filters.categories.includes(cat.value);
            return (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  active
                    ? "border-forest bg-forest text-paper"
                    : "border-line bg-white/60 text-muted hover:border-sage hover:text-ink",
                )}
              >
                {t(cat.short)}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={mobileFilters} onOpenChange={setMobileFilters}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <Filter className="size-3.5" /> {t("Filtri")}
                {activeFilters > 0 ? (
                  <span className="rounded-full bg-forest px-1.5 py-0.5 font-mono text-[11px] text-lime">
                    {activeFilters}
                  </span>
                ) : null}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("Filtra materiali")}</DialogTitle>
                <DialogDescription>
                  {t("Filtri rigorosi: solo le tre categorie MVP sono negoziabili.")}
                </DialogDescription>
              </DialogHeader>
              {panel}
              <Button onClick={() => setMobileFilters(false)}>
                {c.showResults(filtered.length)}
              </Button>
            </DialogContent>
          </Dialog>
          <div className="flex min-w-0 items-center gap-1.5">
            <ArrowUpDown className="size-3.5 shrink-0 text-muted" />
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-9 min-w-0 text-[12px] sm:w-[160px]"
              aria-label={t("Ordina risultati")}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[248px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-app-sticky rounded-2xl border border-line bg-white p-4">
            <div className="mb-3 flex items-center justify-between border-b border-line/70 pb-3">
              <div className="flex items-center gap-1.5 text-[12px] font-medium">
                <SlidersHorizontal className="size-3.5 text-muted" /> {t("Filtri")}
              </div>
              {activeFilters > 0 ? <Badge variant="lime">{activeFilters}</Badge> : null}
            </div>
            {panel}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">
              <span className="font-medium text-ink">{resultSummary}</span>
              {avgDelivered > 0 ? (
                <span className="mt-0.5 block font-mono text-[11px] text-muted sm:mt-0 sm:inline sm:ml-2">
                  {t("prezzo medio consegnato")} {formatPerKg(avgDelivered)}
                </span>
              ) : null}
            </p>
            {views.length > 0 || filters.query ? (
              <div className="flex flex-wrap items-center gap-2">
                {views.length > 0 ? (
                  <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                    <Sparkles className="size-3 text-moss" /> {t("Punteggi AI dalle tue richieste aperte")}
                  </span>
                ) : null}
                {filters.query ? (
                  <button onClick={clearQuery} className="text-[11.5px] text-muted underline hover:text-forest">
                    {c.clearSearch}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <ListingCard
                  key={item.listing.id}
                  listing={item.listing}
                  supplierName={orgMap.get(item.listing.orgId)?.name ?? t("Fornitore")}
                  city={item.location?.city ?? "—"}
                  distanceKm={item.distanceKm}
                  deliveredPerKg={item.breakdown.deliveredPerKg}
                  matchScore={item.matchScore}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title={t("Nessun materiale corrisponde a questi filtri")}
              description={t(
                "Aumenta il raggio, alza il budget consegnato o rimuovi una categoria. L'MVP tratta solo carta, legno e plastica.",
              )}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={reset}>
                    <RotateCcw className="size-3.5" /> {t("Azzera filtri")}
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/app/requests/new">
                      {t("Pubblica una richiesta")} <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              }
            />
          )}

          <StatusCallout
            className="mt-5"
            icon={Compass}
            title={t("Non trovi la qualità giusta?")}
            description={t("Pubblica una specifica di domanda. Il motore continuerà a cercare nuova offerta.")}
            action={
              <Button size="sm" variant="accent" asChild>
                <Link href="/app/requests/new">
                  <Plus className="size-3.5" /> {t("Pubblica una richiesta")}
                </Link>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
