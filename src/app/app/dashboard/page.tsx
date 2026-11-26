"use client";

import { useI18n } from "@/lib/i18n";

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
  Inbox,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { localized } from "@/components/app/offcut-ux-copy";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/stat-card";
import {
  PipelineRail,
  QuickActionTile,
  SectionPanel,
  StatusCallout,
  WorkSkeleton,
} from "@/components/app/offcut-ux-primitives";
import { dateText, money, relativeText } from "@/components/app/offcut-ux-text";
import { MatchCard } from "@/components/material/match-card";
import { OrderStatusBadge } from "@/components/material/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORIES, CATEGORY_MAP, ORDER_STEPS } from "@/lib/constants";
import {
  useCurrentOrg,
  useCurrentUser,
  useMatchViews,
  useOrgListings,
  useOrgOrders,
  useOrgRequests,
} from "@/lib/hooks";
import { formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const QUALITY_LABELS: Record<string, string> = {
  pending: "in attesa",
  scheduled: "programmato",
  passed: "superato",
  failed: "non superato",
};

const COPY = {
  it: {
    refreshing: "Aggiornamento…",
    refreshingMatches: "Aggiornamento abbinamenti",
    refreshShort: "Aggiorna",
    nextActions: "Prossime azioni",
    nextActionsNote: "Scorciatoie per le attività più frequenti.",
    listingHint: "Aggiungi eccedenza al mercato",
    requestHint: "Definisci la qualità che ti serve",
    matchesHint: (strong: number, total: number) => `${strong} solidi · ${total} totali`,
    ordersHint: (count: number) => `${count} ordini attivi`,
  },
  en: {
    refreshing: "Refreshing…",
    refreshingMatches: "Refreshing matches",
    refreshShort: "Refresh",
    nextActions: "Next actions",
    nextActionsNote: "Shortcuts for the most frequent tasks.",
    listingHint: "Add surplus to the marketplace",
    requestHint: "Define the quality you need",
    matchesHint: (strong: number, total: number) => `${strong} strong · ${total} total`,
    ordersHint: (count: number) => `${count} active orders`,
  },
};

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const c = localized(COPY, lang);
  const user = useCurrentUser();
  const org = useCurrentOrg();
  const views = useMatchViews();
  const orders = useOrgOrders();
  const listings = useOrgListings();
  const requests = useOrgRequests();
  const organizations = useAppStore((s) => s.organizations);
  const locations = useAppStore((s) => s.locations);
  const quotes = useAppStore((s) => s.quotes);
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
      icon: typeof Clock;
    }[] = [];
    orders
      .filter((o) => o.status === "quote_issued")
      .slice(0, 2)
      .forEach((o) =>
        items.push({
          title: t(`Preventivo ${o.reference} in attesa di accettazione`),
          meta: t(
            `${money(quoteByOrder.get(o.id)?.breakdown.total ?? 0, lang, { cents: true })} · scade ${relativeText(quoteByOrder.get(o.id)?.validUntil ?? new Date().toISOString(), lang)}`,
          ),
          href: `/app/orders/${o.id}`,
          icon: Clock,
        }),
      );
    orders
      .filter((o) => o.status === "quote_accepted")
      .slice(0, 1)
      .forEach((o) =>
        items.push({
          title: t(`Programma il ritiro per ${o.reference}`),
          meta: t(`${formatKg(o.quantityKg)} · preventivo accettato`),
          href: `/app/orders/${o.id}`,
          icon: CalendarClock,
        }),
      );
    orders
      .filter((o) => o.status === "collection_scheduled")
      .slice(0, 1)
      .forEach((o) =>
        items.push({
          title: t(`Ritiro prenotato · ${o.reference}`),
          meta: o.collection
            ? `${dateText(o.collection.windowStart, lang, { withYear: false })} · QC ${t(QUALITY_LABELS[o.collection.qcStatus] ?? o.collection.qcStatus)}`
            : t("In attesa di conferma del trasportatore"),
          href: `/app/orders/${o.id}`,
          icon: Truck,
        }),
      );
    if (strongMatches.length > 0) {
      items.push({
        title: t(
          `${strongMatches.length} ${strongMatches.length === 1 ? "abbinamento solido" : "abbinamenti solidi"} da verificare`,
        ),
        meta: t("Composizione e budget già verificati"),
        href: "/app/matches",
        icon: Sparkles,
      });
    }
    return items.slice(0, 4);
  }, [orders, quoteByOrder, strongMatches.length, lang]);

  const marketPulse = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = allListings.filter(
        (l) => l.category === cat.value && l.status === "active",
      );
      const avg =
        items.length > 0
          ? items.reduce((sum, l) => sum + l.pricePerKg, 0) / items.length
          : 0;
      return { ...cat, avg, count: items.length };
    });
  }, [allListings]);

  const greeting =
    new Date().getHours() < 12
      ? t("Buongiorno")
      : new Date().getHours() < 18
        ? t("Buon pomeriggio")
        : t("Buonasera");

  const orderValue = (order: Order) => quoteByOrder.get(order.id)?.breakdown.total ?? null;

  async function handleRefresh() {
    setRefreshing(true);
    const count = generateMatches();
    await new Promise((resolve) => setTimeout(resolve, 550));
    setRefreshing(false);
    toast.success(t("Motore di abbinamento aggiornato"), {
      description: t(`${count} collegamenti offerta–domanda valutati sul mercato.`),
    });
  }

  if (!user || !org) return null;

  const pipelineRail = ORDER_STEPS.map((step) => {
    const stageOrders = orders.filter((o) => o.status === step.status);
    const value = stageOrders.reduce(
      (sum, o) => sum + (quoteByOrder.get(o.id)?.breakdown.total ?? 0),
      0,
    );
    return {
      label: t(step.label),
      count: stageOrders.length,
      value: value > 0 ? money(value, lang, { compact: true }) : undefined,
    };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t(
          `Panoramica · ${dateText(new Date(), lang, { withYear: false })}`,
        )}
        title={`${greeting}, ${user.fullName.split(" ")[0]}.`}
        description={
          <>
            {t(
              `${org.name} · ${openRequests.length} richieste aperte · ${activeListings.length} annunci attivi.`,
            )}{" "}
            {strongMatches.length > 0 ? (
              <span className="text-forest">
                {t(
                  `${strongMatches.length} ${strongMatches.length === 1 ? "abbinamento richiede" : "abbinamenti richiedono"} una decisione.`,
                )}
              </span>
            ) : (
              t("Aggiorna il motore per analizzare di nuovo il mercato.")
            )}
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin motion-reduce:animate-none")} />{" "}
              {refreshing ? c.refreshing : t("Aggiorna abbinamenti")}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/listings/new">
                <Plus className="size-3.5" /> {t("Pubblica materiale")}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app/requests/new">
                <Plus className="size-3.5" /> {t("Nuova richiesta")}
              </Link>
            </Button>
          </>
        }
      />

      {listings.length === 0 && requests.length === 0 ? (
        <StatusCallout
          icon={Package}
          tone="focus"
          title={t("Spazio di lavoro pronto")}
          description={t(
            "Pubblica l'eccedenza che hai già o la specifica che ti serve. Il motore farà una prima analisi nelle categorie di lancio: carta, legno e plastica.",
          )}
          action={
            <>
              <Button size="sm" asChild>
                <Link href="/app/listings/new">
                  <Package className="size-3.5" /> {t("Pubblica eccedenza")}
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/requests/new">
                  <ClipboardList className="size-3.5" /> {t("Pubblica una richiesta")}
                </Link>
              </Button>
            </>
          }
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Pipeline aperta")}
          value={money(pipelineValue, lang, { compact: true })}
          sub={c.ordersHint(openOrders.length)}
          icon={Wallet}
        />
        <KpiCard
          label={t("Abbinamenti AI")}
          value={String(views.length)}
          sub={t(`${strongMatches.length} solidi · ${views.length - strongMatches.length} da verificare`)}
          icon={Sparkles}
        />
        <KpiCard
          label={t("Richieste aperte")}
          value={String(openRequests.length)}
          sub={t(`${formatKg(openRequests.reduce((sum, r) => sum + r.quantityKg, 0))} domanda mensile`)}
          icon={ClipboardList}
        />
        <KpiCard
          label={t("Annunci attivi")}
          value={String(activeListings.length)}
          sub={t(`${formatKg(activeListings.reduce((sum, l) => sum + l.quantityKg, 0))} disponibili`)}
          icon={Package}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr] [&>*]:min-w-0">
        <SectionPanel
          title={t("Feed abbinamenti AI")}
          note={t("Classificati per composizione, volume, condizioni, distanza e budget consegnato.")}
          action={
            <div className="flex items-center gap-1 rounded-full border border-line bg-paper/60 p-1">
              <button
                onClick={() => setDirection("demand")}
                disabled={!hasDemand}
                aria-pressed={direction === "demand"}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40",
                  direction === "demand" ? "bg-forest text-paper" : "text-muted hover:text-ink",
                )}
              >
                {t("Per la mia domanda")}
              </button>
              <button
                onClick={() => setDirection("supply")}
                disabled={!hasSupply}
                aria-pressed={direction === "supply"}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40",
                  direction === "supply" ? "bg-forest text-paper" : "text-muted hover:text-ink",
                )}
              >
                {t("Per la mia offerta")}
              </button>
            </div>
          }
          bodyClassName="space-y-3 p-4"
        >
          {refreshing ? (
            <WorkSkeleton rows={2} label={c.refreshingMatches} />
          ) : feed.length > 0 ? (
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
                  supplierName={supplier?.name ?? t("Fornitore")}
                  supplierCity={location?.city ?? "—"}
                  compact
                />
              );
            })
          ) : (
            <EmptyState
              icon={Sparkles}
              title={t("Nessun abbinamento in questa vista")}
              description={t(
                "Il motore confronta l'offerta attiva con le richieste aperte. Aggiungi una richiesta o aggiorna il mercato.",
              )}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" asChild>
                    <Link href="/app/requests/new">{t("Pubblica una richiesta")}</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRefresh}>
                    {c.refreshShort}
                  </Button>
                </div>
              }
            />
          )}
        </SectionPanel>

        <div className="space-y-4">
          <SectionPanel
            title={
              <span className="flex items-center gap-1.5">
                <BellRing className="size-3 text-clay" /> {t("Richiedono attenzione")}
              </span>
            }
            action={<Badge variant="muted">{attention.length}</Badge>}
          >
            <div className="divide-y divide-line/60">
              {attention.length > 0 ? (
                attention.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${item.title}-${item.href}`}
                      href={item.href}
                      className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-paper/60"
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-paper text-forest">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-medium leading-[1.5] text-ink">
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
                  <CircleAlert className="mx-auto size-4 text-muted" />
                  <p className="mt-2 text-[11.5px] text-muted">{t("Nessun blocco. Il flusso è regolare.")}</p>
                </div>
              )}
            </div>
          </SectionPanel>

          <SectionPanel
            title={t("Polso del mercato")}
            note={t(
              "Prezzo medio degli annunci al kg, solo offerta attiva. I preventivi consegnati includono lavorazione, trasporto, commissione e IVA.",
            )}
            action={
              <Link href="/app/marketplace" className="inline-flex min-h-6 items-center text-[11.5px] text-muted hover:text-forest">
                {t("Esplora")}
              </Link>
            }
            bodyClassName="space-y-3.5 px-5 py-4"
          >
            {marketPulse.map((cat) => (
              <div key={cat.value}>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="truncate text-ink">
                    {t(cat.short)} <span className="text-muted">({cat.count})</span>
                  </span>
                  <span className="shrink-0 font-mono text-[12px] tabular-nums">
                    {cat.avg > 0 ? formatPerKg(cat.avg) : "—"}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-moss/60"
                    style={{ width: `${cat.avg > 0 ? Math.min(100, (cat.avg / 0.8) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </SectionPanel>

          <SectionPanel title={t("Riepilogo finanziario")} bodyClassName="px-5 py-4">
            <div className="space-y-2.5 text-[11.5px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">{t("Impegnato (accettato)")}</span>
                <span className="shrink-0 font-mono tabular-nums">{money(committedValue, lang, { cents: true })}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">{t("Commissione maturata")}</span>
                <span className="shrink-0 font-mono tabular-nums">{money(commission, lang, { cents: true })}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">{t("Fatturato completato")}</span>
                <span className="shrink-0 font-mono tabular-nums">{money(completedGmv, lang, { cents: true })}</span>
              </div>
            </div>
          </SectionPanel>
        </div>
      </div>

      <SectionPanel
        title={t("Pipeline ordini")}
        note={t("Bozza → abbinato → preventivo → accettato → ritiro → completato.")}
        action={
          <Link href="/app/orders" className="flex min-h-6 items-center gap-1 text-[12px] text-muted hover:text-forest">
            {t("Tutti gli ordini")} <ArrowUpRight className="size-3" />
          </Link>
        }
        bodyClassName="overflow-x-auto"
      >
        <PipelineRail items={pipelineRail} />
      </SectionPanel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr] [&>*]:min-w-0">
        <SectionPanel title={c.nextActions} note={c.nextActionsNote}>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <QuickActionTile
              href="/app/listings/new"
              icon={Package}
              label={t("Pubblica materiale")}
              hint={c.listingHint}
            />
            <QuickActionTile
              href="/app/requests/new"
              icon={ClipboardList}
              label={t("Nuova richiesta")}
              hint={c.requestHint}
            />
            <QuickActionTile
              href="/app/matches"
              icon={Sparkles}
              label={t("Rivedi abbinamenti")}
              hint={c.matchesHint(strongMatches.length, views.length)}
            />
            <QuickActionTile
              href="/app/orders"
              icon={Truck}
              label={t("Tutti gli ordini")}
              hint={c.ordersHint(openOrders.length)}
            />
          </div>
        </SectionPanel>

        <SectionPanel
          title={t("Ordini recenti")}
          action={
            <Link href="/app/orders" className="inline-flex min-h-6 items-center text-[12px] text-muted hover:text-forest">
              {t("Vedi tutti")}
            </Link>
          }
          bodyClassName="overflow-x-auto"
        >
          {recentOrders.length > 0 ? (
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Ordine")}</TableHead>
                  <TableHead>{t("Materiale")}</TableHead>
                  <TableHead>{t("Volume")}</TableHead>
                  <TableHead>{t("Consegnato")}</TableHead>
                  <TableHead>{t("Stato")}</TableHead>
                  <TableHead>{t("Aggiornato")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => {
                  const listing = listingMap.get(order.listingId);
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/app/orders/${order.id}`} className="inline-flex min-h-6 items-center font-mono text-[11.5px] hover:underline">
                          {order.reference}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <Link href={`/app/orders/${order.id}`} className="inline-flex min-h-6 max-w-full items-center truncate text-[12px]">
                          {t(listing?.title ?? "—")}
                        </Link>
                        <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                          {listing ? t(CATEGORY_MAP[listing.category].short) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {formatKg(order.quantityKg)}
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {(() => {
                          const value = orderValue(order);
                          return value !== null ? money(value, lang, { cents: true }) : "—";
                        })()}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-[12px] text-muted">
                        {relativeText(order.updatedAt, lang)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={Inbox}
                title={t("Nessun ordine")}
                description={t(
                  "Crea un ordine da un abbinamento per generare un preventivo trasparente e avviare la logistica.",
                )}
                action={
                  <Button size="sm" asChild>
                    <Link href="/app/matches">{t("Rivedi abbinamenti")}</Link>
                  </Button>
                }
              />
            </div>
          )}
        </SectionPanel>
      </div>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        {t("Mercato MVP: carta e cartone · legno · plastica — Emilia-Romagna, area di Bologna")}
      </p>
    </div>
  );
}
