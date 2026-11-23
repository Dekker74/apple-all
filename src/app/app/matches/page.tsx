"use client";

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
import { PageHeader } from "@/components/app/page-header";
import { MatchCard } from "@/components/material/match-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { CATEGORY_MAP } from "@/lib/constants";
import { useCurrentOrg, useMatchViews } from "@/lib/hooks";
import { formatCurrency, formatKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Direction = "all" | "demand" | "supply";
type Confidence = "all" | "strong" | "review";
type MatchState = "all" | "suggested" | "shortlisted" | "quoted";

export default function MatchesPage() {
  const org = useCurrentOrg();
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
  const [confidence, setConfidence] = useState<Confidence>("all");
  const [state, setState] = useState<MatchState>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Auto-filter to supply direction when listing parameter is present
  useEffect(() => {
    if (listingIdFilter) {
      setDirection("supply");
    }
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
      // Filter by specific listing if provided in URL
      if (listingIdFilter && match.listingId !== listingIdFilter) return false;
      if (direction !== "all" && view.direction !== direction) return false;
      if (confidence !== "all" && match.confidence !== confidence) return false;
      if (state === "quoted" && !orderedMatchIds.has(match.id)) return false;
      if (state !== "all" && state !== "quoted" && match.status !== state) return false;
      return true;
    });
  }, [views, listingIdFilter, direction, confidence, state, orderedMatchIds]);

  const demandCount = views.filter((v) => v.direction === "demand").length;
  const supplyCount = views.filter((v) => v.direction === "supply").length;
  const strongCount = views.filter((v) => v.match.confidence === "strong").length;
  const reviewCount = views.filter((v) => v.match.confidence === "review").length;
  const shortlisted = views.filter((v) => v.match.status === "shortlisted").length;
  const pipelineValue = views.reduce((sum, v) => sum + v.match.breakdown.total, 0);

  async function handleRefresh() {
    setRefreshing(true);
    const count = generateMatches();
    await new Promise((resolve) => setTimeout(resolve, 550));
    setRefreshing(false);
    toast.success("Motore di abbinamento aggiornato", {
      description: `${count} collegamenti offerta–domanda valutati nelle categorie di lancio.`,
    });
  }

  const FILTERS: { value: Direction; label: string; count: number }[] = [
    { value: "all", label: "Tutti", count: views.length },
    { value: "supply", label: "Per il tuo materiale", count: supplyCount },
    { value: "demand", label: "Materiale che cerchi", count: demandCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Abbinamenti per te"
        title="Chi è interessato al tuo materiale"
        description="Queste persone cercano materiale come il tuo. Puoi contattarle direttamente."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} /> Aggiorna
            </Button>
            <Button size="sm" asChild>
              <Link href="/app/marketplace">
                <Compass className="size-3.5" /> Cerca materiali
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-3">
        {[
          { label: "Persone interessate", value: String(views.length), sub: `${strongCount} molto interessate` },
          { label: "Salvati", value: String(shortlisted), sub: "da ricontattare" },
          {
            label: "Valore totale",
            value: formatCurrency(pipelineValue, { compact: true }),
            sub: `${formatKg(views.reduce((sum, v) => sum + v.match.quantityKg, 0))} di materiale`,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white px-4 py-3.5">
            <p className="font-mono text-[12px] uppercase tracking-[0.13em] text-muted">{stat.label}</p>
            <p className="mt-1.5 font-display text-[24px] leading-none">{stat.value}</p>
            <p className="mt-1 text-[11.5px] text-muted">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDirection(filter.value)}
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
                  "font-mono text-[12px]",
                  direction === filter.value ? "text-lime" : "text-muted",
                )}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Select
              value={state}
              onChange={(e) => setState(e.target.value as MatchState)}
              className="h-9 w-full text-[12px] sm:w-[150px]"
              aria-label="Filtra per stato"
            >
              <option value="all">Tutti</option>
              <option value="suggested">Nuovi</option>
              <option value="shortlisted">Salvati</option>
              <option value="quoted">Ordinati</option>
            </Select>
          </div>
        </div>
      </div>

      {listingIdFilter && (() => {
        const listing = listings.find((l) => l.id === listingIdFilter);
        return listing ? (
          <div className="rounded-2xl border border-moss/30 bg-mint/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-moss">
                  <Sparkles className="inline size-3.5" /> Compratori interessati al tuo annuncio
                </p>
                <p className="mt-1 text-[12px] text-muted">
                  <strong>{listing.title}</strong> · {listing.reference}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/matches">
                  Vedi tutti gli abbinamenti
                </Link>
              </Button>
            </div>
          </div>
        ) : null;
      })()}

      {filtered.length > 0 ? (
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
                supplierName={supplier?.name ?? "Fornitore"}
                supplierCity={location?.city ?? "—"}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title={views.length === 0 ? "Nessuno interessato ancora" : "Nessun risultato"}
          description={
            views.length === 0
              ? "Pubblica materiale in vendita o cerca materiale di cui hai bisogno."
              : "Prova con un altro filtro o cerca qualcosa di diverso."
          }
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/app/listings/new">
                  <Plus className="size-3.5" /> Vendi materiale
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/requests/new">
                  <Target className="size-3.5" /> Cerca materiale
                </Link>
              </Button>
            </div>
          }
        />
      )}

      <div className="rounded-2xl border border-line bg-white/60 p-5">
        <p className="text-[13px] font-medium">💡 Hai trovato qualcuno interessante?</p>
        <p className="mt-1 text-[12px] text-muted">
          Clicca sulla scheda per vedere i dettagli e contattare direttamente la persona.
        </p>
      </div>
    </div>
  );
}
