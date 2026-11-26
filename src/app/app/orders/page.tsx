"use client";

import { useI18n } from "@/lib/i18n";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Clock,
  FileText,
  Inbox,
  Search,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { localized } from "@/components/app/offcut-ux-copy";
import { PageHeader } from "@/components/app/page-header";
import {
  PipelineRail,
  SectionPanel,
  StatusCallout,
} from "@/components/app/offcut-ux-primitives";
import { dateText, money, relativeText } from "@/components/app/offcut-ux-text";
import { CategoryIcon } from "@/components/material/category-icon";
import { OrderStatusBadge } from "@/components/material/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_MAP, ORDER_STATUS_META, ORDER_STEPS } from "@/lib/constants";
import { daysUntil } from "@/lib/format";
import { useCurrentOrg, useOrgOrders } from "@/lib/hooks";
import { formatKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const TABS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "matched", label: "Abbinato" },
  { value: "quote_issued", label: "Preventivo inviato" },
  { value: "quote_accepted", label: "Accettato" },
  { value: "collection_scheduled", label: "Ritiro" },
  { value: "completed", label: "Completato" },
];

const COPY = {
  it: {
    listTitle: "Elenco ordini",
    listCount: (count: number) => `${count} ordini in questa vista`,
    awaitingHint: "Apri l'ordine per rivedere il preventivo consegnato e la relativa scadenza.",
  },
  en: {
    listTitle: "Order list",
    listCount: (count: number) => `${count} orders in this view`,
    awaitingHint: "Open the order to review the delivered quote and its expiry.",
  },
};

export default function OrdersPage() {
  const { t, lang } = useI18n();
  const c = localized(COPY, lang);
  const org = useCurrentOrg();
  const orders = useOrgOrders();
  const quotes = useAppStore((s) => s.quotes);
  const listings = useAppStore((s) => s.listings);
  const organizations = useAppStore((s) => s.organizations);
  const locations = useAppStore((s) => s.locations);

  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("all");
  const [role, setRole] = useState<"all" | "buy" | "sell">("all");

  const quoteMap = useMemo(() => new Map(quotes.map((q) => [q.orderId, q])), [quotes]);
  const listingMap = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);
  const orgMap = useMemo(() => new Map(organizations.map((o) => [o.id, o])), [organizations]);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);

  const filtered = useMemo(() => {
    return [...orders]
      .filter((order) => (tab === "all" ? true : order.status === tab))
      .filter((order) => {
        if (role === "all") return true;
        const isBuyer = order.buyerOrgId === org?.id;
        return role === "buy" ? isBuyer : !isBuyer;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [orders, tab, role, org?.id]);

  const openOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const committed = orders
    .filter((o) => ["quote_accepted", "collection_scheduled", "completed"].includes(o.status))
    .reduce((sum, o) => sum + (quoteMap.get(o.id)?.breakdown.total ?? 0), 0);
  const awaiting = orders.filter((o) => o.status === "quote_issued").length;
  const commission = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (quoteMap.get(o.id)?.breakdown.commissionAmount ?? 0), 0);

  const nextAction = orders
    .filter((o) => o.status === "quote_issued" || o.status === "quote_accepted")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const summary = [
    { label: t("Ordini aperti"), value: String(openOrders.length), sub: t("attivo nella pipeline") },
    {
      label: t("Valore impegnato"),
      value: money(committed, lang, { compact: true }),
      sub: t("accettato + programmato + completato"),
    },
    { label: t("Preventivi in attesa"), value: String(awaiting), sub: t("decisione richiesta") },
    {
      label: t("Commissione maturata"),
      value: money(commission, lang, { compact: true }),
      sub: t("solo ordini completati"),
    },
  ];

  const pipelineRail = ORDER_STEPS.map((step) => {
    const stageOrders = orders.filter((o) => o.status === step.status);
    const value = stageOrders.reduce(
      (sum, o) => sum + (quoteMap.get(o.id)?.breakdown.total ?? 0),
      0,
    );
    return {
      label: t(step.label),
      count: stageOrders.length,
      value: value > 0 ? money(value, lang, { compact: true }) : undefined,
    };
  });

  const helpCards = [
    {
      icon: FileText,
      title: t("Un preventivo, cinque voci"),
      body: t(
        "Materiale, commissione 6%, lavorazione, trasporto e IVA. Nessun margine nascosto di intermediazione.",
      ),
    },
    {
      icon: CalendarClock,
      title: t("Fasce di ritiro"),
      body: t(
        "Trasportatore, lavoratore e partner QC vengono prenotati insieme quando il preventivo viene accettato.",
      ),
    },
    {
      icon: Wallet,
      title: t("Saldo"),
      body: t(
        "Le fatture vengono saldate a 30 giorni dopo il superamento del QC. Offcut fattura la commissione.",
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Ordini e preventivi · flusso gestito")}
        title={t("Dall'abbinamento alla consegna.")}
        description={t(
          `${org?.name ?? t("La tua organizzazione")} · ${openOrders.length} ordini attivi. Ogni preventivo è dettagliato: materiale, commissione 6%, lavorazione, trasporto e IVA.`,
        )}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/matches">
                <Sparkles className="size-3.5" /> {t("Rivedi abbinamenti")}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app/marketplace">
                <Truck className="size-3.5" /> {t("Materiale di origine")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-2xl border border-line bg-white px-4 py-3.5">
            <p className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-[24px] leading-none tabular-nums">{stat.value}</p>
            <p className="mt-1 truncate text-[11.5px] text-muted">{stat.sub}</p>
          </div>
        ))}
      </div>

      <SectionPanel
        title={t("Pipeline ordini")}
        note={t("Bozza → abbinato → preventivo → accettato → ritiro → completato.")}
        bodyClassName="overflow-x-auto"
      >
        <PipelineRail items={pipelineRail} />
        {nextAction ? (
          <Link
            href={`/app/orders/${nextAction.id}`}
            className="flex flex-wrap items-center justify-between gap-2 border-t border-line/80 bg-lime/10 px-4 py-3 text-[12px] transition-colors hover:bg-lime/20"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Clock className="size-3.5 shrink-0 text-moss" />
              <span className="font-medium text-ink">
                {nextAction.status === "quote_issued"
                  ? t(`Preventivo ${nextAction.reference} in attesa di accettazione`)
                  : t(`Programma il ritiro per ${nextAction.reference}`)}
              </span>
              <span className="shrink-0 font-mono text-muted">
                {money(quoteMap.get(nextAction.id)?.breakdown.total ?? 0, lang, { cents: true })}
              </span>
            </span>
            <span className="flex items-center gap-1 text-forest">
              {t("Apri ordine")} <ArrowRight className="size-3" />
            </span>
          </Link>
        ) : null}
      </SectionPanel>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tabItem) => {
            const count = tabItem.value === "all" ? orders.length : orders.filter((o) => o.status === tabItem.value).length;
            return (
              <button
                key={tabItem.value}
                onClick={() => setTab(tabItem.value)}
                aria-pressed={tab === tabItem.value}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  tab === tabItem.value
                    ? "border-forest bg-forest text-paper"
                    : "border-line bg-white/60 text-muted hover:border-sage hover:text-ink",
                )}
              >
                {t(tabItem.label)}
                <span className={cn("font-mono text-[11px] tabular-nums", tab === tabItem.value ? "text-lime" : "text-muted")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="h-9 min-w-0 text-[12px] sm:w-[180px]"
            aria-label={t("Filtra per ruolo")}
          >
            <option value="all">{t("Entrambe le parti")}</option>
            <option value="buy">{t("Sto acquistando")}</option>
            <option value="sell">{t("Sto vendendo")}</option>
          </Select>
        </div>
      </div>

      <SectionPanel
        title={c.listTitle}
        note={c.listCount(filtered.length)}
        bodyClassName="overflow-x-auto"
      >
        {filtered.length > 0 ? (
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("Ordine")}</TableHead>
                <TableHead>{t("Materiale")}</TableHead>
                <TableHead>{t("Controparte")}</TableHead>
                <TableHead>{t("Volume")}</TableHead>
                <TableHead>{t("Consegnato")}</TableHead>
                <TableHead>{t("Stato")}</TableHead>
                <TableHead>{t("Prossimo passo")}</TableHead>
                <TableHead className="w-8" aria-label={t("Apri ordine")} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const listing = listingMap.get(order.listingId);
                const quote = quoteMap.get(order.id);
                const isBuy = order.buyerOrgId === org?.id;
                const counterparty = orgMap.get(isBuy ? order.supplierOrgId : order.buyerOrgId);
                const location = listing ? locMap.get(listing.locationId) : null;
                const expiry = quote ? daysUntil(quote.validUntil) : null;
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/app/orders/${order.id}`} className="block">
                        <span className="font-mono text-[11.5px] hover:underline">{order.reference}</span>
                        <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                          {isBuy ? t("Acquisto") : t("Vendita")} · {relativeText(order.updatedAt, lang)}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <Link href={`/app/orders/${order.id}`} className="flex items-center gap-2">
                        {listing ? <CategoryIcon category={listing.category} size="sm" /> : null}
                        <span className="min-w-0">
                          <span className="block truncate text-[12px]">{t(listing?.title ?? "—")}</span>
                          <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                            {listing ? t(CATEGORY_MAP[listing.category].short) : "—"}
                            {location ? ` · ${location.city}` : ""}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-[11.5px] text-muted">
                      {counterparty?.name ?? "—"}
                      <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-[0.08em]">
                        {isBuy ? t("Fornitore") : t("Cliente")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[12px]">
                      {formatKg(order.quantityKg)}
                    </TableCell>
                    <TableCell className="font-mono text-[12px]">
                      {quote ? money(quote.breakdown.total, lang, { cents: true }) : "—"}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-[12px]">
                      {order.status === "quote_issued" && expiry !== null ? (
                        <span className={expiry <= 3 ? "text-clay" : "text-muted"}>
                          {expiry <= 0
                            ? t("Preventivo scaduto")
                            : t(`Accetta entro ${expiry} ${expiry === 1 ? t("giorno") : t("giorni")}`)}
                        </span>
                      ) : order.status === "quote_accepted" ? (
                        <span className="text-muted">{t("Programma ritiro")}</span>
                      ) : order.status === "collection_scheduled" && order.collection ? (
                        <span className="text-muted">
                          {t(`Fascia ${dateText(order.collection.windowStart, lang, { withYear: false })}`)}
                        </span>
                      ) : order.status === "completed" ? (
                        <span className="text-moss">{t("QC superato · fatturato")}</span>
                      ) : (
                        <span className="text-muted">{t(ORDER_STATUS_META[order.status].description)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/app/orders/${order.id}`} aria-label={t("Apri ordine")}>
                        <ArrowUpRight className="size-3.5 text-muted" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={orders.length === 0 ? Inbox : Search}
              title={orders.length === 0 ? t("Nessun ordine") : t("Nessun ordine in questa vista")}
              description={
                orders.length === 0
                  ? t(
                      "Gli ordini nascono da un abbinamento AI o direttamente da un annuncio del marketplace. Poi rivedi ed emetti il preventivo consegnato.",
                    )
                  : t("Prova un'altra scheda di stato o cambia il filtro acquisto/vendita.")
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" asChild>
                    <Link href="/app/matches">
                      <Sparkles className="size-3.5" /> {t("Rivedi abbinamenti")}
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/app/marketplace">{t("Esplora il mercato")}</Link>
                  </Button>
                </div>
              }
            />
          </div>
        )}
      </SectionPanel>

      <div className="grid gap-4 sm:grid-cols-3">
        {helpCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-line bg-white p-4">
              <Icon className="size-4 text-moss" />
              <p className="mt-2.5 text-[12px] font-medium">{item.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.body}</p>
            </div>
          );
        })}
      </div>

      {awaiting > 0 ? (
        <StatusCallout
          icon={Clock}
          tone="warning"
          title={t(`${awaiting} preventivo in attesa di decisione`)}
          description={c.awaitingHint}
        />
      ) : null}
    </div>
  );
}
