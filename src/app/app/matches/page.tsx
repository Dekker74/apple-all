"use client";

import { useI18n } from "@/lib/i18n";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Compass,
  RefreshCw,
  Sparkles,
  Target,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { localized } from "@/components/app/offcut-ux-copy";
import { PageHeader } from "@/components/app/page-header";
import { StatusCallout, WorkSkeleton } from "@/components/app/offcut-ux-primitives";
import { money } from "@/components/app/offcut-ux-text";
import { MatchCard } from "@/components/material/match-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { useMatchViews } from "@/lib/hooks";
import { formatKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Direction = "all" | "demand" | "supply";
type MatchState = "all" | "suggested" | "shortlisted" | "quoted";

const COPY = {
  it: {
    refreshing: "Aggiornamento…",
    refreshingMatches: "Aggiornamento abbinamenti",
    allStates: "Tutti gli stati",
    listCount: (count: number) => `${count} abbinamenti nell'elenco`,
    orderNote: "Ordine per affinità dal motore",
    contactHint: "Dettagli e contatto",
    matchedHint: "Hai trovato qualcuno interessante?",
    noResultsHint: "Prova con un altro filtro o cerca qualcosa di diverso.",
  },
  en: {
    refreshing: "Refreshing…",
    refreshingMatches: "Refreshing matches",
    allStates: "All statuses",
    listCount: (count: number) => `${count} matches listed`,
    orderNote: "Ordered by engine affinity",
    contactHint: "Details and contact",
    matchedHint: "Found someone interesting?",
    noResultsHint: "Try another filter or search for something different.",
  },
};

export default function MatchesPage() {
  const { t, lang } = useI18n();
  const c = localized(COPY, lang);
  const views = useMatchViews();
  const listings = useAppStore((s) => s.listings);
  const requests = useAppStore((s) => s.requests);
  const organizations = useAppStore((s) => s.organizations);
  const locations = useAppStore((s) => s.locations);
  const orders = useAppStore((s) => s.orders);
  const generateMatches = useAppStore((s) => s.generateMatches);
  const searchParams = useSearchParams();
  const listingIdFilter = searchParams.get("listing");

  const [direction, setDirection] = useState<Direction>("all");
  const [state, setState] = useState<MatchState>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (listingIdFilter) setDirection("supply");
  }, [listingIdFilter]);

  const listingMap = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);
  const requestMap = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);
  const orgMap = useMemo(() => new Map(organizations.map((o) => [o.id, o])), [organizations]);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);
  const orderedMatchIds = useMemo(
    () => new Set(orders.filter((o) => o.status !== "cancelled").map((o) => o.matchId)),
    [orders],
  );

  const filtered = useMemo(() => {
    return views.filter((view) => {
      const { match } = view;
      if (listingIdFilter && match.listingId !== listingIdFilter) return false;
      if (direction !== "all" && view.direction !== direction) return false;
      if (state === "quoted" && !orderedMatchIds.has(match.id)) return false;
      if (state !== "all" && state !== "quoted" && match.status !== state) return false;
      return true;
    });
  }, [views, listingIdFilter, direction, state, orderedMatchIds]);

  const demandCount = views.filter((v) => v.direction === "demand").length;
  const supplyCount = views.filter((v) => v.direction === "supply").length;
  const strongCount = views.filter((v) => v.match.confidence === "strong").length;
  const shortlisted = views.filter((v) => v.match.status === "shortlisted").length;
  const pipelineValue = views.reduce((sum, v) => sum + v.match.breakdown.total, 0);

  async function handleRefresh() {
    setRefreshing(true);
    const count = generateMatches();
    await new Promise((resolve) => setTimeout(resolve, 550));
    setRefreshing(false);
    toast.success(t("Motore di abbinamento aggiornato"), {
      description: t(`${count} collegamenti offerta–domanda valutati nelle categorie di lancio.`),
    });
  }

  const FILTERS: { value: Direction; label: string; count: number }[] = [
    { value: "all", label: t("Tutti"), count: views.length },
    { value: "supply", label: t("Per il tuo materiale"), count: supplyCount },
    { value: "demand", label: t("Materiale che cerchi"), count: demandCount },
  ];

  const stats = [
    { label: t("Persone interessate"), value: String(views.length), sub: t(`${strongCount} molto interessate`) },
    { label: t("Salvati"), value: String(shortlisted), sub: t("da ricontattare") },
    {
      label: t("Valore totale"),
      value: money(pipelineValue, lang, { compact: true }),
      sub: t(`${formatKg(views.reduce((sum, v) => sum + v.match.quantityKg, 0))} di materiale`),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Abbinamenti per te")}
        title={t("Chi è interessato al tuo materiale")}
        description={t("Queste persone cercano materiale come il tuo. Puoi contattarle direttamente.")}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin motion-reduce:animate-none")} />{" "}
              {refreshing ? c.refreshing : t("Aggiorna")}
            </Button>
            <Button size="sm" asChild>
              <Link href="/app/marketplace">
                <Compass className="size-3.5" /> {t("Cerca materiali")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-2xl border border-line bg-white px-4 py-3.5">
            <p className="truncate font-mono text-[11px] uppercase tracking-[0.13em] text-muted">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-[24px] leading-none tabular-nums">{stat.value}</p>
            <p className="mt-1 truncate text-[11.5px] text-muted">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDirection(filter.value)}
              aria-pressed={direction === filter.value}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                direction === filter.value
                  ? "border-forest bg-forest text-paper"
                  : "border-line bg-white/60 text-muted hover:border-sage hover:text-ink",
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  direction === filter.value ? "text-lime" : "text-muted",
                )}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Select
            value={state}
            onChange={(e) => setState(e.target.value as MatchState)}
            className="h-9 min-w-0 text-[12px] sm:w-[170px]"
            aria-label={t("Filtra per stato")}
          >
            <option value="all">{c.allStates}</option>
            <option value="suggested">{t("Nuovi")}</option>
            <option value="shortlisted">{t("Salvati")}</option>
            <option value="quoted">{t("Ordinati")}</option>
          </Select>
        </div>
      </div>

      {listingIdFilter && (() => {
        const listing = listings.find((l) => l.id === listingIdFilter);
        return listing ? (
          <StatusCallout
            tone="focus"
            icon={Sparkles}
            title={t("Compratori interessati al tuo annuncio")}
            description={t(`${listing.title} · ${listing.reference}`)}
            action={
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/matches">{t("Vedi tutti gli abbinamenti")}</Link>
              </Button>
            }
          />
        ) : null;
      })()}

      {refreshing ? (
        <WorkSkeleton rows={4} label={c.refreshingMatches} />
      ) : filtered.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11.5px] text-muted">
              {c.listCount(filtered.length)}
            </p>
            <p className="hidden text-[11.5px] text-muted sm:block">
              {c.orderNote}
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map(({ match }) => {
              const listing = listingMap.get(match.listingId);
              const request = requestMap.get(match.requestId);
              if (!listing || !request) return null;
              const supplier = orgMap.get(listing.orgId);
              const location = locMap.get(listing.locationId);
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  listing={listing}
                  request={request}
                  supplierName={supplier?.name ?? t("Fornitore")}
                  supplierCity={location?.city ?? "—"}
                />
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Sparkles}
          title={views.length === 0 ? t("Nessuno interessato ancora") : t("Nessun risultato")}
          description={
            views.length === 0
              ? t("Pubblica materiale in vendita o cerca materiale di cui hai bisogno.")
              : c.noResultsHint
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" asChild>
                <Link href="/app/listings/new">
                  <Plus className="size-3.5" /> {t("Vendi materiale")}
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/requests/new">
                  <Target className="size-3.5" /> {t("Cerca materiale")}
                </Link>
              </Button>
            </div>
          }
        />
      )}

      <StatusCallout
        icon={Sparkles}
        title={c.matchedHint}
        description={t("Clicca sulla scheda per vedere i dettagli e contattare direttamente la persona.")}
        action={
          <span className="hidden items-center gap-1 text-[11.5px] text-muted sm:flex">
            {c.contactHint} <ArrowRight className="size-3.5" />
          </span>
        }
      />
    </div>
  );
}
