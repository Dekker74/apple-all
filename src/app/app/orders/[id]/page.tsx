"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CircleAlert,
  ClipboardCheck,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Info,
  Loader2,
  MapPin,
  Package,
  Printer,
  Receipt,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  Wallet,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/material/category-icon";
import { MaterialThumb } from "@/components/material/material-thumb";
import { PriceBreakdownPanel, ProcessingChips } from "@/components/material/price-breakdown";
import { OrderStatusBadge } from "@/components/material/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_MAP, CONDITION_MAP, ORDER_STATUS_META, ORDER_STEPS, PROCESSING_MAP } from "@/lib/constants";
import { daysUntil, formatDate, formatDateTime, relativeTime, todayInput } from "@/lib/format";
import { useCurrentOrg, useCurrentUser } from "@/lib/hooks";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { OrderEvent, OrderStatus } from "@/types";

const QUALITY_LABELS: Record<string, string> = {
  pending: "in attesa",
  scheduled: "programmato",
  passed: "superato",
  failed: "non superato",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  issued: "inviato",
  accepted: "accettato",
  declined: "rifiutato",
  expired: "scaduto",
};

function eventIcon(kind: OrderEvent["kind"]) {
  switch (kind) {
    case "user":
      return UserRound;
    case "partner":
      return Truck;
    case "finance":
      return Wallet;
    default:
      return Sparkles;
  }
}

function StepRail({ status }: { status: OrderStatus }) {
  const current = ORDER_STATUS_META[status].step;
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-[11.5px] text-danger">
        <CircleAlert className="size-4" /> Questo ordine è stato annullato. Il materiale collegato è tornato sul mercato.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="grid grid-cols-3 gap-px bg-line/60 sm:grid-cols-6">
        {ORDER_STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <div key={step.status} className="relative bg-white px-3 py-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full border font-mono text-[12px]",
                    done
                      ? "border-forest bg-forest text-lime"
                      : active
                        ? "border-forest text-forest"
                        : "border-line text-muted",
                  )}
                >
                  {done ? <Check className="size-2.5" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cn(
                    "font-mono text-[12px] uppercase tracking-[0.1em]",
                    active ? "text-ink" : "text-muted",
                  )}
                >
                  {step.label}
                </span>
              </div>
              <div
                className={cn(
                  "mt-2 h-0.5 rounded-full",
                  done || active ? "bg-forest" : "bg-line",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const org = useCurrentOrg();
  const user = useCurrentUser();

  const order = useAppStore((s) => s.orders.find((o) => o.id === orderId) ?? null);
  const listings = useAppStore((s) => s.listings);
  const requests = useAppStore((s) => s.requests);
  const organizations = useAppStore((s) => s.organizations);
  const locations = useAppStore((s) => s.locations);
  const quotes = useAppStore((s) => s.quotes);
  const matches = useAppStore((s) => s.matches);
  const partners = useAppStore((s) => s.partners);
  const memberships = useAppStore((s) => s.memberships);

  const issueQuote = useAppStore((s) => s.issueQuote);
  const acceptQuote = useAppStore((s) => s.acceptQuote);
  const scheduleCollection = useAppStore((s) => s.scheduleCollection);
  const completeOrder = useAppStore((s) => s.completeOrder);
  const cancelOrder = useAppStore((s) => s.cancelOrder);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transportChoice, setTransportChoice] = useState<"company" | "pickup">("company");

  useEffect(() => {
    const stored = window.localStorage.getItem(`offcut.transport.${orderId}`);
    setTransportChoice(stored === "pickup" ? "pickup" : "company");
  }, [orderId]);

  const defaultStart = useMemo(() => {
    const date = new Date(Date.now() + 3 * 86_400_000);
    date.setHours(8, 0, 0, 0);
    return toLocalInput(date.toISOString());
  }, []);
  const defaultEnd = useMemo(() => {
    const date = new Date(Date.now() + 3 * 86_400_000);
    date.setHours(13, 0, 0, 0);
    return toLocalInput(date.toISOString());
  }, []);

  const [windowStart, setWindowStart] = useState(defaultStart);
  const [windowEnd, setWindowEnd] = useState(defaultEnd);
  const [transportPartnerId, setTransportPartnerId] = useState("part_trans_1");
  const [processingPartnerId, setProcessingPartnerId] = useState("part_proc_1");
  const [qcPartnerId, setQcPartnerId] = useState("part_qc_1");
  const [instructions, setInstructions] = useState("");

  if (!order) {
    return (
      <EmptyState
        icon={Receipt}
        title="Ordine non trovato"
        description="Questo ordine potrebbe appartenere a un altro spazio di lavoro o essere stato reimpostato. Apri l'elenco ordini per continuare."
        action={
          <Button asChild size="sm">
            <Link href="/app/orders">Torna agli ordini</Link>
          </Button>
        }
      />
    );
  }

  const activeOrder = order;
  const listing = listings.find((l) => l.id === order.listingId) ?? null;
  const request = requests.find((r) => r.id === order.requestId) ?? null;
  const buyer = organizations.find((o) => o.id === order.buyerOrgId) ?? null;
  const supplier = organizations.find((o) => o.id === order.supplierOrgId) ?? null;
  const quote = quotes.find((q) => q.id === order.quoteId) ?? null;
  const match = matches.find((m) => m.id === order.matchId) ?? null;
  const listingLocation = locations.find((l) => l.id === listing?.locationId) ?? null;
  const requestLocation = locations.find((l) => l.id === request?.locationId) ?? null;
  const transportPartner = partners.find((p) => p.id === order.collection?.transportPartnerId);
  const processingPartner = partners.find((p) => p.id === order.collection?.processingPartnerId);
  const qcPartner = partners.find((p) => p.id === order.collection?.qcPartnerId);
  const creator = memberships.find((m) => m.userId === order.createdByUserId);
  const isBuyer = order.buyerOrgId === org?.id;
  const isSupplier = order.supplierOrgId === org?.id;

  const breakdown = quote?.breakdown ?? match?.breakdown ?? null;
  const processing = match?.requiredProcessing ?? request?.requiredProcessing ?? [];
  const processingLabels = processing.map((p) => PROCESSING_MAP[p].label);
  const expiry = quote ? daysUntil(quote.validUntil) : null;

  const transportPartners = partners.filter((p) => p.kind === "transport");
  const processingPartners = partners.filter((p) => p.kind === "processing");
  const qcPartners = partners.filter((p) => p.kind === "qc");

  function run(action: () => void, success: string, description?: string) {
    setBusy(true);
    try {
      action();
      toast.success(success, description ? { description } : undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operazione non riuscita.");
    } finally {
      setBusy(false);
    }
  }

  function downloadQuote() {
    const lines = [
      "OFFCUT — PREVENTIVO",
      "=====================",
      `Riferimento: ${activeOrder.reference}`,
      `Ordine: ${activeOrder.id}`,
      `Materiale: ${listing?.title ?? "—"}`,
      `Quantità: ${formatKg(activeOrder.quantityKg)}`,
      `Fornitore: ${supplier?.name ?? "—"}`,
      `Acquirente: ${buyer?.name ?? "—"}`,
      `Prezzo materiale: ${breakdown ? formatCurrency(breakdown.materialCost, { cents: true }) : "—"}`,
      `Commissione Offcut (${breakdown ? Math.round(breakdown.commissionRate * 100) : 6}%): ${breakdown ? formatCurrency(breakdown.commissionAmount, { cents: true }) : "—"}`,
      `Trasporto: ${breakdown ? formatCurrency(breakdown.transportCost, { cents: true }) : "—"}`,
      `Lavorazione: ${breakdown ? formatCurrency(breakdown.processingCost, { cents: true }) : "—"}`,
      `IVA: ${breakdown ? formatCurrency(breakdown.taxAmount, { cents: true }) : "—"}`,
      `Totale consegnato: ${breakdown ? formatCurrency(breakdown.total, { cents: true }) : "—"}`,
      "",
      `Modalità: ${transportChoice === "company" ? "Trasporto gestito da Offcut" : "Ritiro presso punto di ritiro Offcut"}`,
      `Ritiro: ${listingLocation?.city ?? "—"}`,
      `Consegna / punto di ritiro: ${requestLocation?.city ?? "—"}`,
      "",
      `Generato il ${formatDate(new Date().toISOString())}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `preventivo-${activeOrder.reference}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("Preventivo scaricato");
  }

  function chooseTransport(mode: "company" | "pickup") {
    setTransportChoice(mode);
    window.localStorage.setItem(`offcut.transport.${orderId}`, mode);
  }

  function handleSchedule() {
    if (!windowStart || !windowEnd) {
      toast.error("Scegli una fascia di ritiro.");
      return;
    }
    if (new Date(windowEnd) <= new Date(windowStart)) {
      toast.error("La fine della fascia deve essere successiva all'inizio.");
      return;
    }
    run(
      () =>
        scheduleCollection(orderId, {
          windowStart: new Date(windowStart).toISOString(),
          windowEnd: new Date(windowEnd).toISOString(),
          transportPartnerId,
          processingPartnerId,
          qcPartnerId,
          instructions: instructions.trim() || undefined,
        }),
      "Ritiro programmato",
      "Trasportatore, lavoratore e partner QC sono prenotati.",
    );
    setScheduleOpen(false);
  }

  const actionCard = (() => {
    if (order.status === "cancelled") {
      return {
        title: "Ordine annullato",
        body: "Non sono richieste azioni. L'annuncio è tornato sul mercato.",
        icon: X,
        content: (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/app/marketplace">Esplora il mercato</Link>
          </Button>
        ),
      };
    }
    if (order.status === "completed") {
      return {
        title: "Ordine completato",
        body: "QC superato e fattura saldata. I certificati sono allegati a questo ordine.",
        icon: FileCheck2,
        content: (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-sage/40 bg-mist/60 px-3 py-2 text-[12px] text-forest">
              <ShieldCheck className="size-3.5" /> Certificato QC QC-2026-8891 · superato
            </div>
            <Button variant="outline" className="w-full" onClick={() => window.print()}>
              <Printer className="size-3.5" /> Stampa riepilogo
            </Button>
            <Button className="w-full" asChild>
              <Link href="/app/marketplace">
                Cerca altro materiale <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        ),
      };
    }
    if (order.status === "collection_scheduled") {
      return {
        title: "Ritiro prenotato",
        body: order.collection
          ? `${transportPartner?.name ?? "Trasportatore"} arriva ${formatDateTime(order.collection.windowStart)}. Conferma la consegna quando il QC è superato.`
          : "Ritiro prenotato. Conferma la consegna quando il QC è superato.",
        icon: Truck,
        content: (
          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={busy}
              onClick={() =>
                run(
                  () => completeOrder(orderId),
                  "Ordine completato",
                  "QC superato, materiale consegnato, fattura saldata.",
                )
              }
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ClipboardCheck className="size-3.5" />}
              Conferma consegna e QC
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted" asChild>
              <Link href="/app/orders">
                <Download className="size-3.5" /> Esporta elenco ordini
              </Link>
            </Button>
          </div>
        ),
      };
    }
    if (order.status === "quote_accepted") {
      return {
        title: "Preventivo accettato",
        body: "Ora coordina la logistica. Scegli la fascia di ritiro e i partner per lavorazione e QC.",
        icon: CalendarClock,
        content: (
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <CalendarDays className="size-3.5" /> Programma ritiro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Programma ritiro</DialogTitle>
                <DialogDescription>
                  {formatKg(order.quantityKg)} da {listingLocation?.city ?? "sede fornitore"} a{" "}
                  {requestLocation?.city ?? "la tua sede"}. I partner sono coordinati da Offcut.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Inizio fascia</label>
                    <Input
                      type="datetime-local"
                      value={windowStart}
                      onChange={(e) => setWindowStart(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="field-label">Fine fascia</label>
                    <Input
                      type="datetime-local"
                      value={windowEnd}
                      onChange={(e) => setWindowEnd(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Partner di trasporto</label>
                  <Select
                    value={transportPartnerId}
                    onChange={(e) => setTransportPartnerId(e.target.value)}
                    className="mt-1.5"
                  >
                    {transportPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.coverage} · {p.onTimePct}% puntualità
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Partner di lavorazione</label>
                    <Select
                      value={processingPartnerId}
                      onChange={(e) => setProcessingPartnerId(e.target.value)}
                      className="mt-1.5"
                    >
                      {processingPartners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.coverage}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="field-label">Partner QC</label>
                    <Select
                      value={qcPartnerId}
                      onChange={(e) => setQcPartnerId(e.target.value)}
                      className="mt-1.5"
                    >
                      {qcPartners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.coverage}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="field-label">
                    Istruzioni per la sede <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    placeholder="Codice cancello, banchina di carico, requisiti di imbragatura, contatto in loco…"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setScheduleOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleSchedule} disabled={busy}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Truck className="size-3.5" />}
                  Conferma ritiro
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ),
      };
    }
    if (order.status === "quote_issued") {
      return {
        title: isBuyer ? "Preventivo in attesa di una tua decisione" : "Preventivo inviato all'acquirente",
        body:
          expiry !== null && expiry <= 0
            ? "Questo preventivo è scaduto. Emettine uno aggiornato prima di accettare."
            : `Valido ${expiry !== null ? `ancora ${expiry} ${expiry === 1 ? "giorno" : "giorni"}` : "14 giorni"} · prezzo consegnato dettagliato, commissione 6% inclusa.`,
        icon: Clock,
        content: (
          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={busy || (expiry !== null && expiry <= 0)}
              onClick={() =>
                run(
                  () => acceptQuote(orderId),
                  "Preventivo accettato",
                  "Programma ora la fascia di ritiro.",
                )
              }
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              {isBuyer ? "Accetta preventivo" : "Registra accettazione acquirente"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted"
              onClick={() => window.print()}
            >
              <Printer className="size-3.5" /> Stampa preventivo
            </Button>
            <Button variant="outline" className="w-full" onClick={downloadQuote}>
              <Download className="size-3.5" /> Scarica preventivo
            </Button>
          </div>
        ),
      };
    }
    // matched
    return {
      title: "Prepara il preventivo consegnato",
      body: "Conferma quantità e lavorazione, poi emetti un preventivo dettagliato. L'acquirente vede materiale, commissione, lavorazione, trasporto e IVA.",
      icon: FileText,
      content: (
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={busy}
            onClick={() =>
              run(
                () => issueQuote(orderId),
                "Preventivo inviato",
                "L'acquirente può ora accettare il prezzo consegnato.",
              )
            }
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
            Emetti preventivo
          </Button>
          <p className="text-center text-[11.5px] text-muted">Valido 14 giorni dall'emissione.</p>
        </div>
      ),
    };
  })();

  const ActionIcon = actionCard.icon;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/orders"
          className="inline-flex items-center gap-1.5 text-[11.5px] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> Ordini e preventivi
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
            {isBuyer ? "Stai acquistando" : isSupplier ? "Stai vendendo" : "Solo lettura"}
          </span>
          <span className="h-3 w-px bg-line" />
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-muted">
            <Printer className="size-3.5" /> Print
          </Button>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <Badge variant="outline">{order.reference}</Badge>
            {quote ? (
              <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                Preventivo {quote.id.replace("quo_", "").toUpperCase()}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-balance text-[32px] leading-[1.05] sm:text-[38px]">
            {listing?.title ?? "Ordine"}
          </h1>
          <p className="mt-2 text-[12px] text-muted">
            {isBuyer ? `Fornito da ${supplier?.name ?? "—"}` : `Venduto a ${buyer?.name ?? "—"}`} ·{" "}
            {formatKg(order.quantityKg)} · creato il {formatDate(order.createdAt)} · aggiornato{" "}
            {relativeTime(order.updatedAt)}
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-line bg-white px-4 py-3 text-right">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
            {quote ? "Totale consegnato" : "Totale indicativo"}
          </p>
          <p className="mt-1 font-display text-[28px] leading-none">
            {breakdown ? formatCurrency(breakdown.total, { cents: true }) : "—"}
          </p>
          <p className="mt-1 font-mono text-[11.5px] text-muted">
            {breakdown ? formatPerKg(breakdown.deliveredPerKg) : ""} · IVA inclusa
          </p>
        </div>
      </div>

      <StepRail status={order.status} />

      <section className="offcut-transport-card" aria-label="Modalità di trasporto">
        <div className="offcut-transport-icon">
          <Truck className="size-5" />
        </div>
        <div className="offcut-transport-body">
          <p className="eyebrow">Logistica</p>
          <h2>Modalità di trasporto</h2>
          <div className="offcut-transport-toggle" role="group" aria-label="Scegli la modalità">
            <button
              type="button"
              className={transportChoice === "company" ? "on" : ""}
              onClick={() => chooseTransport("company")}
              aria-pressed={transportChoice === "company"}
            >
              Trasportato da Offcut
            </button>
            <button
              type="button"
              className={transportChoice === "pickup" ? "on" : ""}
              onClick={() => chooseTransport("pickup")}
              aria-pressed={transportChoice === "pickup"}
            >
              Ritiro presso punto di ritiro
            </button>
          </div>
          <p className="mut">
            {transportChoice === "company"
              ? `Ritiro presso ${listingLocation?.city ?? "il fornitore"} e consegna a ${requestLocation?.city ?? "destinazione"}. Offcut coordina partner, working e controllo qualità.`
              : `L'acquirente ritira il materiale presso il punto di ritiro Offcut di ${requestLocation?.city ?? "Emilia-Romagna"}. Il ritiro è a carico dell'azienda acquirente.`}
          </p>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                {listing ? (
                  <MaterialThumb
                    category={listing.category}
                    reference={listing.reference}
                    photos={listing.photos}
                    compact
                    className="hidden h-20 w-24 shrink-0 rounded-lg sm:block"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="eyebrow">Materiale</p>
                  <Link
                    href={listing ? `/app/marketplace/${listing.id}` : "/app/marketplace"}
                    className="mt-1 block text-[15px] font-medium leading-[1.5] hover:underline"
                  >
                    {listing?.title ?? "Materiale non disponibile"}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                    {listing ? (
                      <>
                        <span className="flex items-center gap-1">
                          <CategoryIcon category={listing.category} size="sm" />
                          {CATEGORY_MAP[listing.category].label}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {listingLocation?.city ?? "—"}
                        </span>
                        <span>{listing.reference}</span>
                      </>
                    ) : null}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {listing ? (
                      <>
                        <Badge variant="success">{CONDITION_MAP[listing.condition].label}</Badge>
                        <Badge variant="outline">{listing.purityPct}% purezza</Badge>
                        <Badge variant="muted">{listing.packaging}</Badge>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="shrink-0 rounded-lg bg-paper/70 px-3 py-2 text-right">
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Quantità</p>
                <p className="mt-0.5 font-mono text-[13px]">{formatKg(order.quantityKg)}</p>
                {listing ? (
                  <p className="mt-0.5 font-mono text-[11.5px] text-muted">
                    {formatPerKg(listing.pricePerKg)} material
                  </p>
                ) : null}
              </div>
            </div>

            {listing && listing.composition.length > 0 ? (
              <div className="mt-4 border-t border-line pt-3.5">
                <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                  Composizione dichiarata
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {listing.composition.map((part) => (
                    <span
                      key={part.material}
                      className="rounded border border-line bg-paper/60 px-2 py-0.5 text-[11.5px]"
                    >
                      {part.material} {part.percent}%
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {quote || breakdown ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Dettaglio preventivo</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {quote
                      ? `Emesso il ${formatDate(quote.issuedAt)} · valido fino al ${formatDate(quote.validUntil)}`
                      : "Stima provvisoria dalle specifiche abbinate. Emetti per bloccarla."}
                  </p>
                </div>
                {quote ? (
                  <Badge
                    variant={
                      quote.status === "accepted"
                        ? "success"
                        : quote.status === "expired"
                          ? "danger"
                          : "lime"
                    }
                  >
                    {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                  </Badge>
                ) : (
                  <Badge variant="muted">Stima</Badge>
                )}
              </div>
              {breakdown ? (
                <PriceBreakdownPanel
                  breakdown={breakdown}
                  processingLabels={processingLabels}
                  distanceKm={match?.distanceKm}
                />
              ) : null}
              <div className="flex items-start gap-2 rounded-xl border border-line bg-white p-3.5">
                <Info className="mt-0.5 size-3.5 shrink-0 text-muted" />
                <p className="text-[11.5px] leading-relaxed text-muted">
                  Materiale e commissione sono fissati all'emissione. Lavorazione e trasporto sono
                  linee consolidate; se la fascia di ritiro cambia, Offcut riemette le voci
                  logistiche prima di qualsiasi addebito.
                </p>
              </div>
            </section>
          ) : null}

          {order.collection ? (
            <section className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow flex items-center gap-1.5">
                  <Truck className="size-3 text-muted" /> Ritiro e lavorazione
                </p>
                <Badge
                  variant={
                    order.collection.qcStatus === "passed"
                      ? "success"
                      : order.collection.qcStatus === "failed"
                        ? "danger"
                        : "sky"
                  }
                  className="capitalize"
                >
                  QC {QUALITY_LABELS[order.collection.qcStatus] ?? order.collection.qcStatus}
                </Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-paper/60 p-3.5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Fascia</p>
                  <p className="mt-1 text-[12px] font-medium">
                    {formatDate(order.collection.windowStart)} ·{" "}
                    {new Date(order.collection.windowStart).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    –{" "}
                    {new Date(order.collection.windowEnd).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {listingLocation?.addressLine ?? "Sede fornitore"}
                    {listingLocation ? `, ${listingLocation.city}` : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-paper/60 p-3.5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Trasportatore</p>
                  <p className="mt-1 text-[12px] font-medium">{transportPartner?.name ?? "—"}</p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {transportPartner
                      ? `${transportPartner.coverage} · ${transportPartner.onTimePct}% puntualità`
                      : "In attesa di assegnazione"}
                  </p>
                </div>
                <div className="rounded-xl bg-paper/60 p-3.5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                    Lavorazione
                  </p>
                  <p className="mt-1 text-[12px] font-medium">{processingPartner?.name ?? "—"}</p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {processingPartner?.coverage ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-paper/60 p-3.5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">QC</p>
                  <p className="mt-1 text-[12px] font-medium">{qcPartner?.name ?? "—"}</p>
                  <p className="mt-1 text-[11.5px] text-muted">{qcPartner?.coverage ?? "—"}</p>
                </div>
              </div>
              {order.collection.instructions ? (
                <p className="mt-3 rounded-lg border border-line/70 bg-white px-3 py-2 text-[12px] leading-relaxed text-muted">
                  <span className="font-medium text-ink">Istruzioni per la sede: </span>
                  {order.collection.instructions}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-2xl border border-line bg-white p-5">
            <p className="eyebrow flex items-center gap-1.5">
              <Clock className="size-3 text-muted" /> Cronologia
            </p>
            <ol className="mt-4 space-y-0">
              {[...order.timeline].reverse().map((event, index, list) => {
                const Icon = eventIcon(event.kind);
                return (
                  <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < list.length - 1 ? (
                      <span className="absolute left-[11px] top-6 h-full w-px bg-line" />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-white",
                        event.kind === "finance"
                          ? "border-sage/50 text-moss"
                          : event.kind === "partner"
                            ? "border-sky/30 text-sky"
                            : event.kind === "user"
                              ? "border-line text-ink"
                              : "border-line text-muted",
                      )}
                    >
                      <Icon className="size-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[11.5px] font-medium">{event.label}</p>
                        <p className="font-mono text-[12px] text-muted">{formatDateTime(event.at)}</p>
                      </div>
                      {event.note ? (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{event.note}</p>
                      ) : null}
                      <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.08em] text-muted/70">
                        {event.actor}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <p className="eyebrow flex items-center gap-1.5">
              <FileText className="size-3 text-muted" /> Documenti
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                {
                  title: quote ? `Preventivo ${order.reference}` : "Preventivo in attesa",
                  meta: quote ? `${formatCurrency(quote.breakdown.total, { cents: true })} · ${QUOTE_STATUS_LABELS[quote.status] ?? quote.status}` : "Emetti per generare",
                  ready: Boolean(quote),
                  icon: Receipt,
                },
                {
                  title: "Certificato QC",
                  meta:
                    order.collection?.qcStatus === "passed"
                      ? "QC-2026-8891 · superato"
                      : "Emesso dopo il campionamento",
                  ready: order.collection?.qcStatus === "passed",
                  icon: ShieldCheck,
                },
                {
                  title: "Nota di consegna",
                  meta: order.status === "completed" ? "Firmata alla consegna" : "Generato al ritiro",
                  ready: order.status === "completed",
                  icon: ClipboardCheck,
                },
                {
                  title: "Fattura commissione",
                  meta: quote ? formatCurrency(quote.breakdown.commissionAmount, { cents: true }) : "—",
                  ready: order.status === "completed",
                  icon: FileCheck2,
                },
              ].map((doc) => {
                const Icon = doc.icon;
                return (
                  <div
                    key={doc.title}
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-paper/40 px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg",
                        doc.ready ? "bg-mist text-moss" : "bg-sand text-muted",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium">{doc.title}</p>
                      <p className="truncate text-[11.5px] capitalize text-muted">{doc.meta}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[92px]">
          <div className="rounded-2xl border border-forest bg-forest p-5 text-paper">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-paper/10 text-lime">
                <ActionIcon className="size-4" />
              </span>
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-paper/55">
                Prossima azione
              </p>
            </div>
            <p className="mt-3 text-[17px] leading-tight text-paper">{actionCard.title}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-paper/60">{actionCard.body}</p>
            <div className="mt-4 [&_button]:w-full">{actionCard.content}</div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="eyebrow">Parti</p>
            <div className="mt-3 space-y-3">
              {[
                {
                  label: "Acquirente",
                  org: buyer,
                  city: requestLocation?.city,
                  icon: Building2,
                },
                {
                  label: "Fornitore",
                  org: supplier,
                  city: listingLocation?.city,
                  icon: Warehouse,
                },
              ].map((party) => {
                const Icon = party.icon;
                return (
                  <div key={party.label} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-paper text-muted">
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                        {party.label}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] font-medium">
                        {party.org?.name ?? "—"}
                        {party.org?.verified ? <BadgeCheck className="size-3 text-moss" /> : null}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {party.org?.vatNumber ?? "—"}
                        {party.city ? ` · ${party.city}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[11.5px] text-muted">
              <div className="flex justify-between">
                <span>Creato da</span>
                <span className="text-ink">{creator?.fullName ?? user?.fullName ?? "Offcut"}</span>
              </div>
              <div className="flex justify-between">
                <span>Data ordine</span>
                <span className="text-ink">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Punteggio abbinamento</span>
                <span className="text-ink">{match ? `${match.score}/100` : "—"}</span>
              </div>
            </div>
          </div>

          {processing.length > 0 ? (
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="eyebrow flex items-center gap-1.5">
                <Package className="size-3 text-muted" /> Lavorazione richiesta
              </p>
              <div className="mt-2.5">
                <ProcessingChips processing={processing} />
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                Incluso nella voce lavorazione del preventivo consegnato.
              </p>
            </div>
          ) : null}

          {order.status !== "completed" && order.status !== "cancelled" ? (
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-muted">
                  Annulla questo ordine
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Annullare {order.reference}?</DialogTitle>
                  <DialogDescription>
                    Il materiale torna sul mercato e il preventivo viene annullato. Questa operazione non può essere annullata nello spazio demo.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCancelOpen(false)}>
                    Mantieni ordine
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      run(() => cancelOrder(orderId), "Ordine annullato");
                      setCancelOpen(false);
                    }}
                  >
                    Annulla ordine
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}

          <div className="rounded-2xl border border-line bg-white/60 p-4">
            <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
              <Info className="size-3" /> Devi modificare qualcosa?
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Le modifiche a quantità, fascia e partner sono gestite dalle operazioni Offcut prima del ritiro. Nessun importo viene riaddebitato senza un preventivo riemesso.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
              <Link href="/app/settings">Impostazioni spazio di lavoro</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
