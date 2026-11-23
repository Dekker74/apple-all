"use client";

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
import { PageHeader } from "@/components/app/page-header";
import { CategoryIcon } from "@/components/material/category-icon";
import { OrderStatusBadge } from "@/components/material/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_MAP, ORDER_STATUS_META, ORDER_STEPS } from "@/lib/constants";
import { daysUntil, relativeTime } from "@/lib/format";
import { useCurrentOrg, useOrgOrders } from "@/lib/hooks";
import { formatCurrency, formatKg } from "@/lib/pricing";
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

export default function OrdersPage() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ordini e preventivi · flusso gestito"
        title="Dall'abbinamento alla consegna."
        description={
          <>
            {org?.name ?? "La tua organizzazione"} · {openOrders.length} ordini attivi. Ogni preventivo è
            dettagliato: materiale, commissione 6%, lavorazione, trasporto e IVA.
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/matches">
                <Sparkles className="size-3.5" /> Rivedi abbinamenti
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app/marketplace">
                <Truck className="size-3.5" /> Materiale di origine
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {[
          { label: "Ordini aperti", value: String(openOrders.length), sub: "attivo nella pipeline" },
          {
            label: "Valore impegnato",
            value: formatCurrency(committed, { compact: true }),
            sub: "accettato + programmato + completato",
          },
          { label: "Preventivi in attesa", value: String(awaiting), sub: "decisione richiesta" },
          {
            label: "Commissione maturata",
            value: formatCurrency(commission, { compact: true }),
            sub: "solo ordini completati",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white px-4 py-3.5">
            <p className="font-mono text-[12px] uppercase tracking-[0.13em] text-muted">{stat.label}</p>
            <p className="mt-1.5 font-display text-[24px] leading-none">{stat.value}</p>
            <p className="mt-1 text-[11.5px] text-muted">{stat.sub}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid grid-cols-2 gap-px bg-line/60 sm:grid-cols-3 lg:grid-cols-6">
          {ORDER_STEPS.map((step) => {
            const stageOrders = orders.filter((o) => o.status === step.status);
            return (
              <div key={step.status} className="bg-white px-4 py-3">
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
                <p className="mt-1.5 font-display text-[22px] leading-none">{stageOrders.length}</p>
              </div>
            );
          })}
        </div>
        {nextAction ? (
          <Link
            href={`/app/orders/${nextAction.id}`}
            className="flex flex-wrap items-center justify-between gap-2 border-t border-line/80 bg-lime/10 px-4 py-2.5 text-[12px] transition-colors hover:bg-lime/20"
          >
            <span className="flex items-center gap-2">
              <Clock className="size-3.5 text-moss" />
              <span className="font-medium text-ink">
                {nextAction.status === "quote_issued"
                  ? `Preventivo ${nextAction.reference} in attesa di accettazione`
                  : `Programma il ritiro per ${nextAction.reference}`}
              </span>
              <span className="text-muted">
                {formatCurrency(quoteMap.get(nextAction.id)?.breakdown.total ?? 0, { cents: true })}
              </span>
            </span>
            <span className="flex items-center gap-1 text-forest">
              Apri ordine <ArrowRight className="size-3" />
            </span>
          </Link>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => {
            const count = t.value === "all" ? orders.length : orders.filter((o) => o.status === t.value).length;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  tab === t.value
                    ? "border-forest bg-forest text-paper"
                    : "border-line bg-white/60 text-muted hover:border-sage hover:text-ink",
                )}
              >
                {t.label}
                <span className={cn("font-mono text-[12px]", tab === t.value ? "text-lime" : "text-muted")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="h-9 w-[170px] text-[12px]"
            aria-label="Filtra per ruolo"
          >
            <option value="all">Entrambe le parti</option>
            <option value="buy">Sto acquistando</option>
            <option value="sell">Sto vendendo</option>
          </Select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordine</TableHead>
                <TableHead>Materiale</TableHead>
                <TableHead className="hidden md:table-cell">Controparte</TableHead>
                <TableHead className="hidden sm:table-cell">Volume</TableHead>
                <TableHead className="hidden lg:table-cell">Consegnato</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="hidden xl:table-cell">Prossimo passo</TableHead>
                <TableHead className="w-8" />
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
                  <TableRow key={order.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/app/orders/${order.id}`} className="block">
                        <span className="font-mono text-[11.5px] hover:underline">{order.reference}</span>
                        <span className="mt-0.5 block font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
                          {isBuy ? "Acquisto" : "Vendita"} · {relativeTime(order.updatedAt)}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <Link href={`/app/orders/${order.id}`} className="flex items-center gap-2">
                        {listing ? (
                          <CategoryIcon category={listing.category} size="sm" />
                        ) : null}
                        <span className="min-w-0">
                          <span className="block truncate text-[12px]">{listing?.title ?? "—"}</span>
                          <span className="mt-0.5 block font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
                            {listing ? CATEGORY_MAP[listing.category].short : "—"}
                            {location ? ` · ${location.city}` : ""}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[11.5px] text-muted">
                      {counterparty?.name ?? "—"}
                      <span className="mt-0.5 block font-mono text-[12px] uppercase tracking-[0.08em]">
                        {isBuy ? "Fornitore" : "Cliente"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-[12px]">
                      {formatKg(order.quantityKg)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-[12px]">
                      {quote ? formatCurrency(quote.breakdown.total, { cents: true }) : "—"}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-[12px]">
                      {order.status === "quote_issued" && expiry !== null ? (
                        <span className={expiry <= 3 ? "text-clay" : "text-muted"}>
                          {expiry <= 0 ? "Preventivo scaduto" : `Accetta entro ${expiry}g`}
                        </span>
                      ) : order.status === "quote_accepted" ? (
                        <span className="text-muted">Programma ritiro</span>
                      ) : order.status === "collection_scheduled" && order.collection ? (
                        <span className="text-muted">
                          Fascia {new Date(order.collection.windowStart).toLocaleDateString("it-IT", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : order.status === "completed" ? (
                        <span className="text-moss">QC superato · fatturato</span>
                      ) : (
                        <span className="text-muted">{ORDER_STATUS_META[order.status].description}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/app/orders/${order.id}`} aria-label="Apri ordine">
                        <ArrowUpRight className="size-3.5 text-muted" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={orders.length === 0 ? Inbox : Search}
          title={orders.length === 0 ? "Nessun ordine" : "Nessun ordine in questa vista"}
          description={
            orders.length === 0
              ? "Gli ordini nascono da un abbinamento AI o direttamente da un annuncio del marketplace. Poi rivedi ed emetti il preventivo consegnato."
              : "Prova un'altra scheda di stato, cancella la ricerca o cambia il filtro acquisto/vendita."
          }
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/app/matches">
                  <Sparkles className="size-3.5" /> Rivedi abbinamenti
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/marketplace">Esplora il mercato</Link>
              </Button>
            </div>
          }
        />
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: FileText,
            title: "Un preventivo, cinque voci",
            body: "Materiale, commissione 6%, lavorazione, trasporto e IVA. Nessun margine nascosto di intermediazione.",
          },
          {
            icon: CalendarClock,
            title: "Fasce di ritiro",
            body: "Trasportatore, lavoratore e partner QC vengono prenotati insieme quando il preventivo viene accettato.",
          },
          {
            icon: Wallet,
            title: "Saldo",
            body: "Le fatture vengono saldate a 30 giorni dopo il superamento del QC. Offcut fattura la commissione.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-line bg-white p-4">
              <Icon className="size-4 text-moss" />
              <p className="mt-2.5 text-[12px] font-medium">{item.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.body}</p>
            </div>
          );
        })}
      </section>

      {awaiting > 0 ? (
        <div className="flex items-center justify-center gap-1.5 pb-1 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-muted/70">
          <Badge variant="review">{awaiting} preventivo in attesa di decisione</Badge>
        </div>
      ) : null}
    </div>
  );
}
