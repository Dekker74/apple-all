"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarClock,
  CircleAlert,
  ClipboardList,
  Clock,
  Euro,
  Inbox,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/stat-card";
import { MatchCard } from "@/components/material/match-card";
import { OrderStatusBadge } from "@/components/material/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORIES, CATEGORY_MAP, ORDER_STATUS_META, ORDER_STEPS } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import {
  useCurrentOrg,
  useCurrentUser,
  useMatchViews,
  useOrgListings,
  useOrgOrders,
  useOrgRequests,
} from "@/lib/hooks";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const QUALITY_LABELS: Record<string, string> = {
  pending: "in attesa",
  scheduled: "programmato",
  passed: "superato",
  failed: "non superato",
};

export default function DashboardPage() {
  const user = useCurrentUser();
  const org = useCurrentOrg();
  const views = useMatchViews();
  const orders = useOrgOrders();
  const listings = useOrgListings();
  const requests = useOrgRequests();
  const organizations = useAppStore((s) => s.organizations);
  const locations = useAppStore((s) => s.locations);
  const quotes = useAppStore((s) => s.quotes);
  const matches = useAppStore((s) => s.matches);
  const generateMatches = useAppStore((s) => s.generateMatches);
  const [direction, setDirection] = useState<"demand" | "supply">(
    org?.type === "supplier" ? "supply" : "demand",
  );
  const [refreshing, setRefreshing] = useState(false);

  const quoteByOrder = useMemo(
    () => new Map(quotes.map((q) => [q.orderId, q])),
    [quotes],
  );
  const listingById = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);
  const allListings = useAppStore((s) => s.listings);
  const allRequests = useAppStore((s) => s.requests);
  const listingMap = useMemo(() => new Map(allListings.map((l) => [l.id, l])), [allListings]);
  const requestMap = useMemo(() => new Map(allRequests.map((r) => [r.id, r])), [allRequests]);
  const orgMap = useMemo(() => new Map(organizations.map((o) => [o.id, o])), [organizations]);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);

  const openOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const pipelineValue = openOrders.reduce(
    (sum, o) => sum + (quoteByOrder.get(o.id)?.breakdown.total ?? 0),
    0,
  );
  const committedValue = orders
    .filter((o) => ["quote_accepted", "collection_scheduled"].includes(o.status))
    .reduce((sum, o) => sum + (quoteByOrder.get(o.id)?.breakdown.total ?? 0), 0);
  const commission = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (quoteByOrder.get(o.id)?.breakdown.commissionAmount ?? 0), 0);
  const completedGmv = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (quoteByOrder.get(o.id)?.breakdown.total ?? 0), 0);

  const activeListings = listings.filter((l) => l.status === "active" || l.status === "matched");
  const openRequests = requests.filter((r) => r.status === "open" || r.status === "matched");
  const strongMatches = views.filter((v) => v.match.confidence === "strong");
  const feed = views.filter((v) => v.direction === direction).slice(0, 2);
  const hasSupply = views.some((v) => v.direction === "supply");
  const hasDemand = views.some((v) => v.direction === "demand");

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const attention = useMemo(() => {
    const items: {
      title: string;
      meta: string;
      href: string;
      tone: "amber" | "sky" | "moss";
      icon: typeof Clock;
    }[] = [];
    orders
      .filter((o) => o.status === "quote_issued")
      .slice(0, 2)
      .forEach((o) =>
        items.push({
          title: `Preventivo ${o.reference} in attesa di accettazione`,
          meta: `${formatCurrency(quoteByOrder.get(o.id)?.breakdown.total ?? 0, { cents: true })} · scade ${relativeTime(
            quoteByOrder.get(o.id)?.validUntil ?? new Date().toISOString(),
          )}`,
          href: `/app/orders/${o.id}`,
          tone: "amber",
          icon: Clock,
        }),
      );
    orders
      .filter((o) => o.status === "quote_accepted")
      .slice(0, 1)
      .forEach((o) =>
        items.push({
          title: `Programma il ritiro per ${o.reference}`,
          meta: `${formatKg(o.quantityKg)} · preventivo accettato`,
          href: `/app/orders/${o.id}`,
          tone: "sky",
          icon: CalendarClock,
        }),
      );
    orders
      .filter((o) => o.status === "collection_scheduled")
      .slice(0, 1)
      .forEach((o) =>
        items.push({
          title: `Ritiro prenotato · ${o.reference}`,
          meta: o.collection
            ? `${new Date(o.collection.windowStart).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} · QC ${QUALITY_LABELS[o.collection.qcStatus] ?? o.collection.qcStatus}`
            : "In attesa di conferma del trasportatore",
          href: `/app/orders/${o.id}`,
          tone: "moss",
          icon: Truck,
        }),
      );
    if (strongMatches.length > 0) {
      items.push({
        title: `${strongMatches.length} ${strongMatches.length === 1 ? "abbinamento solido" : "abbinamenti solidi"} da verificare`,
        meta: "Composizione e budget già verificati",
        href: "/app/matches",
        tone: "moss",
        icon: Sparkles,
      });
    }
    return items.slice(0, 4);
  }, [orders, quoteByOrder, strongMatches.length]);

  const marketPulse = useMemo(() => {
    const deltas: Record<string, number> = {
      paper_cardboard: 3.2,
      wood: -1.4,
      plastic: 5.8,
    };
    return CATEGORIES.map((cat) => {
      const items = allListings.filter(
        (l) => l.category === cat.value && l.status === "active",
      );
      const avg =
        items.length > 0
          ? items.reduce((sum, l) => sum + l.pricePerKg, 0) / items.length
          : 0;
      return { ...cat, avg, delta: deltas[cat.value] ?? 0, count: items.length };
    });
  }, [allListings]);

  const greeting =
    new Date().getHours() < 12
      ? "Buongiorno"
      : new Date().getHours() < 18
        ? "Buon pomeriggio"
        : "Buonasera";

  const orderValue = (order: Order) => quoteByOrder.get(order.id)?.breakdown.total ?? null;
  const isBuyer = org?.type === "buyer";
  const isSupplier = org?.type === "supplier";

  async function handleRefresh() {
    setRefreshing(true);
    const count = generateMatches();
    await new Promise((resolve) => setTimeout(resolve, 550));
    setRefreshing(false);
    toast.success("Motore di abbinamento aggiornato", {
      description: `${count} collegamenti offerta–domanda valutati sul mercato.`,
    });
  }

  if (!user || !org) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Panoramica · ${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}`}
        title={`${greeting}, ${user.fullName.split(" ")[0]}.`}
        description={
          <>
            {org.name} · {openRequests.length} richieste aperte · {activeListings.length} annunci
            attivi.{" "}
            {strongMatches.length > 0 ? (
              <span className="text-forest">
                {strongMatches.length} {strongMatches.length === 1 ? "abbinamento richiede" : "abbinamenti richiedono"} una decisione.
              </span>
            ) : (
              "Aggiorna il motore per analizzare di nuovo il mercato."
            )}
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} /> Aggiorna abbinamenti
            </Button>
            {!isBuyer ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/listings/new">
                  <Plus className="size-3.5" /> Pubblica materiale
                </Link>
              </Button>
            ) : null}
            {!isSupplier ? (
              <Button size="sm" asChild>
                <Link href="/app/requests/new">
                  <Plus className="size-3.5" /> Nuova richiesta
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/app/listings/new">
                  <Plus className="size-3.5" /> Pubblica materiale
                </Link>
              </Button>
            )}
          </>
        }
      />

      {listings.length === 0 && requests.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 dot-grid opacity-40 sm:block" />
          <div className="relative max-w-[560px]">
            <Badge variant="lime">Spazio di lavoro pronto</Badge>
            <h2 className="mt-3 text-[26px] leading-tight">
              Il tuo mercato è attivo. Inizia da uno dei due lati del ciclo.
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Pubblica l'eccedenza che hai già o la specifica che ti serve. Il motore farà una prima analisi
              nelle categorie di lancio: carta, legno e plastica.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/app/listings/new">
                  <Package className="size-3.5" /> Pubblica eccedenza
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/requests/new">
                  <ClipboardList className="size-3.5" /> Pubblica una richiesta
                </Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/app/marketplace">Esplora il mercato <ArrowRight className="size-3.5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Pipeline aperta"
          value={formatCurrency(pipelineValue, { compact: true })}
          sub={`${openOrders.length} ordini attivi`}
          icon={Wallet}
          trend={{ value: "+12,4% rispetto al mese scorso", direction: "up" }}
          spark={[3, 5, 4, 7, 6, 9, 8, 11]}
          accent="lime"
        />
        <KpiCard
          label="Abbinamenti AI"
          value={String(views.length)}
          sub={`${strongMatches.length} solidi · ${views.length - strongMatches.length} da verificare`}
          icon={Sparkles}
          trend={{ value: "aggiornato 2 ore fa", direction: "up" }}
          spark={[4, 6, 5, 8, 9, 7, 10, 12]}
        />
        <KpiCard
          label="Richieste aperte"
          value={String(openRequests.length)}
          sub={`${formatKg(openRequests.reduce((sum, r) => sum + r.quantityKg, 0))} domanda mensile`}
          icon={ClipboardList}
          trend={{ value: "1 aggiunto questa settimana", direction: "up" }}
          spark={[2, 2, 3, 2, 4, 3, 3, 4]}
        />
        <KpiCard
          label="Annunci attivi"
          value={String(activeListings.length)}
          sub={`${formatKg(activeListings.reduce((sum, l) => sum + l.quantityKg, 0))} disponibili`}
          icon={Package}
          trend={{ value: "offerta di mercato", direction: "up" }}
          spark={[5, 4, 6, 6, 7, 6, 8, 9]}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr] [&>*]:min-w-0">
        <section className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 border-b border-line/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow flex items-center gap-1.5">
                <Sparkles className="size-3 text-moss" /> Feed abbinamenti AI
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Classificati per composizione, volume, purezza, distanza e budget consegnato.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-line bg-paper/60 p-1">
              <button
                onClick={() => setDirection("demand")}
                disabled={!hasDemand}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40",
                  direction === "demand" ? "bg-forest text-paper" : "text-muted hover:text-ink",
                )}
              >
                Per la mia domanda
              </button>
              <button
                onClick={() => setDirection("supply")}
                disabled={!hasSupply}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40",
                  direction === "supply" ? "bg-forest text-paper" : "text-muted hover:text-ink",
                )}
              >
                Per la mia offerta
              </button>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {feed.length > 0 ? (
              feed.map(({ match }) => {
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
                    compact
                  />
                );
              })
            ) : (
              <EmptyState
                icon={Sparkles}
                title="Nessun abbinamento in questa vista"
                description="Il motore confronta l'offerta attiva con le richieste aperte. Aggiungi una richiesta o aggiorna il mercato."
                action={
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <Link href="/app/requests/new">Pubblica una richiesta</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleRefresh}>
                      Refresh
                    </Button>
                  </div>
                }
              />
            )}
          </div>
          <div className="border-t border-line/80 px-5 py-3">
            <Link
              href="/app/matches"
              className="flex items-center justify-between text-[11.5px] text-muted transition-colors hover:text-forest"
            >
              <span>Vedi tutti i {views.length} abbinamenti</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
              <p className="eyebrow flex items-center gap-1.5">
                <BellRing className="size-3 text-clay" /> Richiedono attenzione
              </p>
              <Badge variant="muted">{attention.length}</Badge>
            </div>
            <div className="divide-y divide-line/60">
              {attention.length > 0 ? (
                attention.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${item.title}-${item.href}`}
                      href={item.href}
                      className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-paper/60"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                          item.tone === "amber"
                            ? "bg-amber/10 text-amber"
                            : item.tone === "sky"
                              ? "bg-sky/10 text-sky"
                              : "bg-mist text-moss",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-medium leading-[1.5] text-ink">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] text-muted">{item.meta}</span>
                      </span>
                      <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted" />
                    </Link>
                  );
                })
              ) : (
                <div className="px-5 py-8 text-center">
                  <CircleAlert className="mx-auto size-4 text-muted/60" />
                  <p className="mt-2 text-[11.5px] text-muted">Nessun blocco. Il flusso è regolare.</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
              <p className="eyebrow flex items-center gap-1.5">
                <TrendingUp className="size-3 text-moss" /> Polso del mercato
              </p>
              <Link href="/app/marketplace" className="text-[11.5px] text-muted hover:text-forest">
                Esplora
              </Link>
            </div>
            <div className="space-y-3.5 px-5 py-4">
              {marketPulse.map((cat) => (
                <div key={cat.value}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 text-ink">
                      {cat.short}
                      <span className="text-[11.5px] text-muted">({cat.count})</span>
                    </span>
                    <span className="font-mono text-[12px] tabular-nums">
                      {cat.avg > 0 ? formatPerKg(cat.avg) : "—"}
                      <span
                        className={cn(
                          "ml-2 text-[11.5px]",
                          cat.delta >= 0 ? "text-moss" : "text-clay",
                        )}
                      >
                        {cat.delta >= 0 ? "+" : ""}
                        {cat.delta}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-moss/60"
                      style={{ width: `${Math.min(100, (cat.avg / 0.8) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="pt-1 text-[11.5px] leading-relaxed text-muted">
                Prezzo medio degli annunci al kg, solo offerta attiva. I preventivi consegnati includono
                lavorazione, trasporto, commissione e IVA.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-forest bg-forest p-5 text-paper">
            <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-paper/50">
              Riepilogo finanziario
            </p>
            <div className="mt-3 space-y-2.5 text-[11.5px]">
              <div className="flex justify-between">
                <span className="text-paper/55">Impegnato (accettato)</span>
                <span className="font-mono">{formatCurrency(committedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-paper/55">Commissione maturata</span>
                <span className="font-mono">{formatCurrency(commission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-paper/55">GMV completato</span>
                <span className="font-mono">{formatCurrency(completedGmv)}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-paper/15 pt-3">
              <div className="flex items-end justify-between">
                <span className="text-[11.5px] text-paper/50">Obiettivo trimestrale</span>
                <span className="font-mono text-[11.5px] text-lime">
                  {Math.min(100, Math.round((completedGmv / 50000) * 100))}%
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-paper/15">
                <div
                  className="h-full rounded-full bg-lime"
                  style={{ width: `${Math.min(100, (completedGmv / 50000) * 100)}%` }}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Truck className="size-3 text-muted" /> Pipeline ordini
            </p>
            <p className="mt-1 text-[12px] text-muted">
              Bozza → abbinato → preventivo → accettato → ritiro → completato.
            </p>
          </div>
          <Link href="/app/orders" className="flex items-center gap-1 text-[12px] text-muted hover:text-forest">
            Tutti gli ordini <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line/60 sm:grid-cols-3 lg:grid-cols-6">
          {ORDER_STEPS.map((step) => {
            const stageOrders = orders.filter((o) => o.status === step.status);
            const value = stageOrders.reduce(
              (sum, o) => sum + (quoteByOrder.get(o.id)?.breakdown.total ?? 0),
              0,
            );
            return (
              <div key={step.status} className="bg-white px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      stageOrders.length > 0 ? "bg-moss" : "bg-line",
                    )}
                  />
                </div>
                <p className="mt-2 font-display text-[24px] leading-none">{stageOrders.length}</p>
                <p className="mt-1 font-mono text-[11.5px] text-muted">
                  {value > 0 ? formatCurrency(value, { compact: true }) : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
          <p className="eyebrow flex items-center gap-1.5">
            <Euro className="size-3 text-muted" /> Ordini recenti
          </p>
          <Link href="/app/orders" className="text-[12px] text-muted hover:text-forest">
            Vedi tutti
          </Link>
        </div>
        {recentOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordine</TableHead>
                <TableHead>Materiale</TableHead>
                <TableHead className="hidden md:table-cell">Controparte</TableHead>
                <TableHead className="hidden sm:table-cell">Volume</TableHead>
                <TableHead className="hidden lg:table-cell">Consegnato</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="hidden md:table-cell">Aggiornato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => {
                const listing = listingMap.get(order.listingId);
                const isBuy = order.buyerOrgId === org.id;
                const counterparty = orgMap.get(isBuy ? order.supplierOrgId : order.buyerOrgId);
                return (
                  <TableRow key={order.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/app/orders/${order.id}`} className="font-mono text-[11.5px] hover:underline">
                        {order.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <Link href={`/app/orders/${order.id}`} className="block truncate text-[12px]">
                        {listing?.title ?? "—"}
                      </Link>
                      <span className="mt-0.5 block font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
                        {listing ? CATEGORY_MAP[listing.category].short : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted">
                      {counterparty?.name ?? "—"}
                      <span className="mt-0.5 block font-mono text-[12px] uppercase tracking-[0.08em]">
                        {isBuy ? "Fornitore" : "Cliente"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-[12px]">
                      {formatKg(order.quantityKg)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-[12px]">
                      {orderValue(order) ? formatCurrency(orderValue(order)!, { cents: true }) : "—"}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[12px] text-muted">
                      {relativeTime(order.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="px-5 py-12">
            <EmptyState
              icon={Inbox}
              title="Nessun ordine"
              description="Crea un ordine da un abbinamento per generare un preventivo trasparente e avviare la logistica."
              action={
                <Button size="sm" asChild>
                  <Link href="/app/matches">Rivedi abbinamenti</Link>
                </Button>
              }
            />
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-muted/60">
        <MapPin className="size-3" /> Mercato MVP: carta e cartone · legno · plastica — Nord Italia
      </p>
    </div>
  );
}
