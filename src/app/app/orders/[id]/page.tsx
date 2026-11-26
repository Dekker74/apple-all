"use client";

import { useI18n } from "@/lib/i18n";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
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
import { localized } from "@/components/app/offcut-ux-copy";
import { dateText, dateTimeText, money, perKg, relativeText, timeText } from "@/components/app/offcut-ux-text";
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
import {
  CATEGORY_MAP,
  CONDITIONS,
  CONDITION_MAP,
  ORDER_STATUS_META,
  ORDER_STEPS,
  PROCESSING_MAP,
} from "@/lib/constants";
import { daysUntil, todayInput } from "@/lib/format";
import { useCurrentOrg, useCurrentUser } from "@/lib/hooks";
import { formatKg } from "@/lib/pricing";
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

const COPY = {
  it: {
    qcCertificate: (reference: string) => `Certificato QC ${reference} · superato`,
    qcDocument: (reference: string) => `${reference} · superato`,
  },
  en: {
    qcCertificate: (reference: string) => `QC certificate ${reference} · passed`,
    qcDocument: (reference: string) => `${reference} · passed`,
  },
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
  const { t } = useI18n();
  const current = ORDER_STATUS_META[status].step;
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-[11.5px] text-danger">
        <CircleAlert className="size-4" /> {t("Questo ordine è stato annullato. Il materiale collegato è tornato sul mercato.")}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white" aria-label={t("Pipeline ordini")}>
      <div className="grid min-w-[720px] grid-cols-6 gap-px bg-line/60">
        {ORDER_STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <div
              key={step.status}
              className="relative bg-white px-3 py-3"
              aria-current={active ? "step" : undefined}
            >
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
                  {t(step.label)}
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
  const { t, lang } = useI18n();
  const c = localized(COPY, lang);
  const fmtMoney = (value: number, opts?: { cents?: boolean; compact?: boolean }) =>
    money(value, lang, opts);
  const fmtPerKg = (value: number, digits = 2) => perKg(value, lang, digits);
  const fmtDate = (value: string | Date, opts?: { withYear?: boolean }) =>
    dateText(value, lang, opts);
  const fmtDateTime = (value: string | Date) => dateTimeText(value, lang);
  const fmtRelative = (value: string | Date) => relativeText(value, lang);
  const fmtTime = (value: string | Date) => timeText(value, lang);
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
        title={t("Ordine non trovato")}
        description={t("Questo ordine potrebbe appartenere a un altro spazio di lavoro o essere stato reimpostato. Apri l'elenco ordini per continuare.")}
        action={
          <Button asChild size="sm">
            <Link href="/app/orders">{t("Torna agli ordini")}</Link>
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
  const processingLabels = processing.map((p) => t(PROCESSING_MAP[p].label));
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
      toast.error(error instanceof Error ? error.message : t("Operazione non riuscita."));
    } finally {
      setBusy(false);
    }
  }

  function downloadQuote() {
    const lines = [
      t("OFFCUT — PREVENTIVO"),
      "=====================",
      t(`Riferimento: ${activeOrder.reference}`),
      t(`Ordine: ${activeOrder.id}`),
      t(`Materiale: ${t(listing?.title ?? "—")}`),
      t(`Quantità: ${formatKg(activeOrder.quantityKg)}`),
      t(`Fornitore: ${supplier?.name ?? "—"}`),
      t(`Acquirente: ${buyer?.name ?? "—"}`),
      t(`Prezzo materiale: ${breakdown ? fmtMoney(breakdown.materialCost, { cents: true }) : "—"}`),
      t(`Commissione Offcut (${breakdown ? Math.round(breakdown.commissionRate * 100) : 6}%): ${breakdown ? fmtMoney(breakdown.commissionAmount, { cents: true }) : "—"}`),
      t(`Trasporto: ${breakdown ? fmtMoney(breakdown.transportCost, { cents: true }) : "—"}`),
      t(`Lavorazione: ${breakdown ? fmtMoney(breakdown.processingCost, { cents: true }) : "—"}`),
      t(`IVA: ${breakdown ? fmtMoney(breakdown.taxAmount, { cents: true }) : "—"}`),
      t(`Totale consegnato: ${breakdown ? fmtMoney(breakdown.total, { cents: true }) : "—"}`),
      "",
      t(`Modalità: ${transportChoice === "company" ? t("Trasporto gestito da Offcut") : t("Ritiro presso punto di ritiro Offcut")}`),
      t(`Ritiro: ${listingLocation?.city ?? "—"}`),
      t(`Consegna / punto di ritiro: ${requestLocation?.city ?? "—"}`),
      "",
      t(`Generato il ${fmtDate(new Date().toISOString())}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = t(`preventivo-${activeOrder.reference}.txt`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(t("Preventivo scaricato"));
  }

  function chooseTransport(mode: "company" | "pickup") {
    setTransportChoice(mode);
    window.localStorage.setItem(`offcut.transport.${orderId}`, mode);
  }

  function handleSchedule() {
    if (!windowStart || !windowEnd) {
      toast.error(t("Scegli una fascia di ritiro."));
      return;
    }
    if (new Date(windowEnd) <= new Date(windowStart)) {
      toast.error(t("La fine della fascia deve essere successiva all'inizio."));
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
      t("Ritiro programmato"),
      t("Trasportatore, lavoratore e partner QC sono prenotati."),
    );
    setScheduleOpen(false);
  }

  const actionCard = (() => {
    if (order.status === "cancelled") {
      return {
        title: t("Ordine annullato"),
        body: t("Non sono richieste azioni. L'annuncio è tornato sul mercato."),
        icon: X,
        content: (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/app/marketplace">{t("Esplora il mercato")}</Link>
          </Button>
        ),
      };
    }
    if (order.status === "completed") {
      return {
        title: t("Ordine completato"),
        body: t("QC superato e fattura saldata. I certificati sono allegati a questo ordine."),
        icon: FileCheck2,
        content: (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-sage/40 bg-mist/60 px-3 py-2 text-[12px] text-forest">
              <ShieldCheck className="size-3.5" /> {c.qcCertificate(order.reference)}
            </div>
            {quote ? (
              <Button variant="outline" className="w-full" onClick={downloadQuote}>
                <Download className="size-3.5" /> {t("Scarica preventivo")}
              </Button>
            ) : null}
            <Button variant="outline" className="w-full" onClick={() => window.print()}>
              <Printer className="size-3.5" /> {t("Stampa riepilogo")}
            </Button>
            <Button className="w-full" asChild>
              <Link href="/app/marketplace">
                {t("Cerca altro materiale")} <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        ),
      };
    }
    if (order.status === "collection_scheduled") {
      return {
        title: t("Ritiro prenotato"),
        body: order.collection
          ? t(`${transportPartner?.name ?? t("Trasportatore")} arriva ${fmtDateTime(order.collection.windowStart)}. Conferma la consegna quando il QC è superato.`)
          : t("Ritiro prenotato. Conferma la consegna quando il QC è superato."),
        icon: Truck,
        content: (
          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={busy}
              onClick={() =>
                run(
                  () => completeOrder(orderId),
                  t("Ordine completato"),
                  t("QC superato, materiale consegnato, fattura saldata."),
                )
              }
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ClipboardCheck className="size-3.5" />}
              {t("Conferma consegna e QC")}
            </Button>
            {quote ? (
              <Button variant="outline" className="w-full" onClick={downloadQuote}>
                <Download className="size-3.5" /> {t("Scarica preventivo")}
              </Button>
            ) : null}
          </div>
        ),
      };
    }
    if (order.status === "quote_accepted") {
      return {
        title: t("Preventivo accettato"),
        body: t("Ora coordina la logistica. Scegli la fascia di ritiro e i partner per lavorazione e QC."),
        icon: CalendarClock,
        content: (
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <CalendarDays className="size-3.5" /> {t("Programma ritiro")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{t("Programma ritiro")}</DialogTitle>
                <DialogDescription>
                  {t(`${formatKg(order.quantityKg)} da ${listingLocation?.city ?? t("sede fornitore")} a ${requestLocation?.city ?? t("la tua sede")}. I partner sono coordinati da Offcut.`)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label">{t("Inizio fascia")}</label>
                    <Input
                      type="datetime-local"
                      value={windowStart}
                      onChange={(e) => setWindowStart(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="field-label">{t("Fine fascia")}</label>
                    <Input
                      type="datetime-local"
                      value={windowEnd}
                      onChange={(e) => setWindowEnd(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">{t("Partner di trasporto")}</label>
                  <Select
                    value={transportPartnerId}
                    onChange={(e) => setTransportPartnerId(e.target.value)}
                    className="mt-1.5"
                  >
                    {transportPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.coverage} · {p.onTimePct}% {t("puntualità")}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label">{t("Partner di lavorazione")}</label>
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
                    <label className="field-label">{t("Partner QC")}</label>
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
                    {t("Istruzioni per la sede")} <span className="font-normal text-muted">{t("(facoltativo)")}</span>
                  </label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    placeholder={t("Codice cancello, banchina di carico, requisiti di imbragatura, contatto in loco…")}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setScheduleOpen(false)}>
                  {t("Annulla")}
                </Button>
                <Button onClick={handleSchedule} disabled={busy}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Truck className="size-3.5" />}
                  {t("Conferma ritiro")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ),
      };
    }
    if (order.status === "quote_issued") {
      return {
        title: isBuyer ? t("Preventivo in attesa di una tua decisione") : t("Preventivo inviato all'acquirente"),
        body:
          expiry !== null && expiry <= 0
            ? t("Questo preventivo è scaduto. Emettine uno aggiornato prima di accettare.")
            : t(`Valido ${expiry !== null ? `ancora ${expiry} ${expiry === 1 ? t("giorno") : t("giorni")}` : t("14 giorni")} · prezzo consegnato dettagliato, commissione 6% inclusa.`),
        icon: Clock,
        content: (
          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={busy || (expiry !== null && expiry <= 0)}
              onClick={() =>
                run(
                  () => acceptQuote(orderId),
                  t("Preventivo accettato"),
                  t("Programma ora la fascia di ritiro."),
                )
              }
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              {isBuyer ? t("Accetta preventivo") : t("Registra accettazione acquirente")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted"
              onClick={() => window.print()}
            >
              <Printer className="size-3.5" /> {t("Stampa preventivo")}
            </Button>
            <Button variant="outline" className="w-full" onClick={downloadQuote}>
              <Download className="size-3.5" /> {t("Scarica preventivo")}
            </Button>
          </div>
        ),
      };
    }
    // matched
    return {
      title: t("Prepara il preventivo consegnato"),
      body: t("Conferma quantità e lavorazione, poi emetti un preventivo dettagliato. L'acquirente vede materiale, commissione, lavorazione, trasporto e IVA."),
      icon: FileText,
      content: (
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={busy}
            onClick={() =>
              run(
                () => issueQuote(orderId),
                t("Preventivo inviato"),
                t("L'acquirente può ora accettare il prezzo consegnato."),
              )
            }
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
            {t("Emetti preventivo")}
          </Button>
          <p className="text-center text-[11.5px] text-muted">{t("Valido 14 giorni dall'emissione.")}</p>
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
          <ArrowLeft className="size-3.5" /> {t("Ordini e preventivi")}
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
            {isBuyer ? t("Stai acquistando") : isSupplier ? t("Stai vendendo") : t("Solo lettura")}
          </span>
          <span className="h-3 w-px bg-line" />
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-muted">
            <Printer className="size-3.5" /> {t("Stampa")}
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
                {t(`Preventivo ${quote.id.replace("quo_", "").toUpperCase()}`)}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-balance text-[32px] leading-[1.05] sm:text-[38px]">
            {t(listing?.title ?? "Ordine")}
          </h1>
          <p className="mt-2 text-[12px] text-muted">
            {isBuyer ? t(`Fornito da ${supplier?.name ?? "—"}`) : t(`Venduto a ${buyer?.name ?? "—"}`)} ·{" "}
            {t(`${formatKg(order.quantityKg)} · creato il ${fmtDate(order.createdAt)} · aggiornato`)}{" "}
            {t(fmtRelative(order.updatedAt))}
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-line bg-white px-4 py-3 text-right">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
            {quote ? t("Totale consegnato") : t("Totale indicativo")}
          </p>
          <p className="mt-1 font-display text-[28px] leading-none">
            {breakdown ? fmtMoney(breakdown.total, { cents: true }) : "—"}
          </p>
          <p className="mt-1 font-mono text-[11.5px] text-muted">
            {breakdown ? fmtPerKg(breakdown.deliveredPerKg) : ""} {t("· IVA inclusa")}
          </p>
        </div>
      </div>

      <StepRail status={order.status} />

      <section className="offcut-transport-card" aria-label={t("Modalità di trasporto")}>
        <div className="offcut-transport-icon">
          <Truck className="size-5" />
        </div>
        <div className="offcut-transport-body">
          <p className="eyebrow">{t("Logistica")}</p>
          <h2>{t("Modalità di trasporto")}</h2>
          <div className="offcut-transport-toggle" role="group" aria-label={t("Scegli la modalità")}>
            <button
              type="button"
              className={transportChoice === "company" ? "on" : ""}
              onClick={() => chooseTransport("company")}
              aria-pressed={transportChoice === "company"}
            >
              {t("Trasportato da Offcut")}
            </button>
            <button
              type="button"
              className={transportChoice === "pickup" ? "on" : ""}
              onClick={() => chooseTransport("pickup")}
              aria-pressed={transportChoice === "pickup"}
            >
              {t("Ritiro presso punto di ritiro")}
            </button>
          </div>
          <p className="mut">
            {transportChoice === "company"
              ? t(`Ritiro presso ${listingLocation?.city ?? t("il fornitore")} e consegna a ${requestLocation?.city ?? t("destinazione")}. Offcut coordina partner, lavorazione e controllo qualità.`)
              : t(`L'acquirente ritira il materiale presso il punto di ritiro Offcut di ${requestLocation?.city ?? "Emilia-Romagna"}. Il ritiro è a carico dell'azienda acquirente.`)}
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
                  <p className="eyebrow">{t("Materiale")}</p>
                  <Link
                    href={listing ? `/app/marketplace/${listing.id}` : "/app/marketplace"}
                    className="mt-1 block text-[15px] font-medium leading-[1.5] hover:underline"
                  >
                    {t(listing?.title ?? "Materiale non disponibile")}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                    {listing ? (
                      <>
                        <span className="flex items-center gap-1">
                          <CategoryIcon category={listing.category} size="sm" />
                          {t(CATEGORY_MAP[listing.category].label)}
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
                        <Badge variant="success">{t(CONDITION_MAP[listing.condition].label)}</Badge>
                        <Badge variant="outline">
                          {t(CONDITIONS.find((c) => c.value === listing.condition)?.label ??
                            CONDITION_MAP[listing.condition].label)}
                        </Badge>
                        <Badge variant="muted">{t(listing.packaging)}</Badge>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="shrink-0 rounded-lg bg-paper/70 px-3 py-2 text-right">
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t("Quantità")}</p>
                <p className="mt-0.5 font-mono text-[13px]">{formatKg(order.quantityKg)}</p>
                {listing ? (
                  <p className="mt-0.5 font-mono text-[11.5px] text-muted">
                    {fmtPerKg(listing.pricePerKg)} {t("materiale")}
                  </p>
                ) : null}
              </div>
            </div>

            {listing && listing.composition.length > 0 ? (
              <div className="mt-4 border-t border-line pt-3.5">
                <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                  {t("Composizione dichiarata")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {listing.composition.map((part) => (
                    <span
                      key={part.material}
                      className="rounded border border-line bg-paper/60 px-2 py-0.5 text-[11.5px]"
                    >
                      {t(part.material)} {part.percent}%
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
                  <p className="eyebrow">{t("Dettaglio preventivo")}</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {quote
                      ? t(`Emesso il ${fmtDate(quote.issuedAt)} · valido fino al ${fmtDate(quote.validUntil)}`)
                      : t("Stima provvisoria dalle specifiche abbinate. Emetti per bloccarla.")}
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
                    {t(QUOTE_STATUS_LABELS[quote.status] ?? quote.status)}
                  </Badge>
                ) : (
                  <Badge variant="muted">{t("Stima")}</Badge>
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
                  {t("Materiale e commissione sono fissati all'emissione. Lavorazione e trasporto sono linee consolidate; se la fascia di ritiro cambia, Offcut riemette le voci logistiche prima di qualsiasi addebito.")}
                </p>
              </div>
            </section>
          ) : null}

          {order.collection ? (
            <section className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow flex items-center gap-1.5">
                  <Truck className="size-3 text-muted" /> {t("Ritiro e lavorazione")}
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
                  QC {t(QUALITY_LABELS[order.collection.qcStatus] ?? order.collection.qcStatus)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-paper/60 p-3.5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t("Fascia")}</p>
                  <p className="mt-1 text-[12px] font-medium">
                    {fmtDate(order.collection.windowStart)} · {fmtTime(order.collection.windowStart)}–{fmtTime(order.collection.windowEnd)}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {listingLocation?.addressLine ?? t("Sede fornitore")}
                    {listingLocation ? `, ${listingLocation.city}` : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-paper/60 p-3.5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t("Trasportatore")}</p>
                  <p className="mt-1 text-[12px] font-medium">{transportPartner?.name ?? "—"}</p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {transportPartner
                      ? t(`${transportPartner.coverage} · ${transportPartner.onTimePct}% puntualità`)
                      : t("In attesa di assegnazione")}
                  </p>
                </div>
                <div className="rounded-xl bg-paper/60 p-3.5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                    {t("Lavorazione")}
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
                  <span className="font-medium text-ink">{t("Istruzioni per la sede: ")}</span>
                  {order.collection.instructions}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-2xl border border-line bg-white p-5">
            <p className="eyebrow flex items-center gap-1.5">
              <Clock className="size-3 text-muted" /> {t("Cronologia")}
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
                        <p className="text-[11.5px] font-medium">{t(event.label)}</p>
                        <p className="font-mono text-[12px] text-muted">{fmtDateTime(event.at)}</p>
                      </div>
                      {event.note ? (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{t(event.note)}</p>
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
              <FileText className="size-3 text-muted" /> {t("Documenti")}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                {
                  title: quote ? t(`Preventivo ${order.reference}`) : t("Preventivo in attesa"),
                  meta: quote ? t(`${fmtMoney(quote.breakdown.total, { cents: true })} · ${t(QUOTE_STATUS_LABELS[quote.status] ?? quote.status)}`) : t("Emetti per generare"),
                  ready: Boolean(quote),
                  icon: Receipt,
                },
                {
                  title: t("Certificato QC"),
                  meta:
                    order.collection?.qcStatus === "passed"
                      ? c.qcDocument(order.reference)
                      : t("Emesso dopo il campionamento"),
                  ready: order.collection?.qcStatus === "passed",
                  icon: ShieldCheck,
                },
                {
                  title: t("Nota di consegna"),
                  meta: order.status === "completed" ? t("Firmata alla consegna") : t("Generato al ritiro"),
                  ready: order.status === "completed",
                  icon: ClipboardCheck,
                },
                {
                  title: t("Fattura commissione"),
                  meta: quote ? fmtMoney(quote.breakdown.commissionAmount, { cents: true }) : "—",
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

        <aside className="space-y-3 lg:sticky lg:top-app-sticky">
          <div className="rounded-2xl border border-forest bg-forest p-5 text-paper">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-paper/10 text-lime">
                <ActionIcon className="size-4" />
              </span>
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-paper/55">
                {t("Prossima azione")}
              </p>
            </div>
            <p className="mt-3 text-[17px] leading-tight text-paper">{actionCard.title}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-paper/60">{actionCard.body}</p>
            <div className="mt-4 [&_button]:w-full">{actionCard.content}</div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="eyebrow">{t("Parti")}</p>
            <div className="mt-3 space-y-3">
              {[
                {
                  label: t("Acquirente"),
                  org: buyer,
                  city: requestLocation?.city,
                  icon: Building2,
                },
                {
                  label: t("Fornitore"),
                  org: supplier,
                  city: listingLocation?.city,
                  icon: Warehouse,
                },
              ].map((party) => {
                const Icon = party.icon;
                return (
                  <div key={t(party.label)} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-paper text-muted">
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                        {t(party.label)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] font-medium">
                        {party.org?.name ?? "—"}
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
                <span>{t("Creato da")}</span>
                <span className="text-ink">{creator?.fullName ?? user?.fullName ?? t("Offcut")}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("Data ordine")}</span>
                <span className="text-ink">{fmtDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("Punteggio abbinamento")}</span>
                <span className="text-ink">{match ? `${match.score}/100` : "—"}</span>
              </div>
            </div>
          </div>

          {processing.length > 0 ? (
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="eyebrow flex items-center gap-1.5">
                <Package className="size-3 text-muted" /> {t("Lavorazione richiesta")}
              </p>
              <div className="mt-2.5">
                <ProcessingChips processing={processing} />
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                {t("Incluso nella voce lavorazione del preventivo consegnato.")}
              </p>
            </div>
          ) : null}

          {order.status !== "completed" && order.status !== "cancelled" ? (
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-muted">
                  {t("Annulla questo ordine")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t(`Annullare ${order.reference}?`)}</DialogTitle>
                  <DialogDescription>
                    {t("Il materiale torna sul mercato e il preventivo viene annullato. Questa operazione non può essere annullata nello spazio demo.")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCancelOpen(false)}>
                    {t("Mantieni ordine")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      run(() => cancelOrder(orderId), t("Ordine annullato"));
                      setCancelOpen(false);
                    }}
                  >
                    {t("Annulla ordine")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}

          <div className="rounded-2xl border border-line bg-white/60 p-4">
            <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
              <Info className="size-3" /> {t("Devi modificare qualcosa?")}
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              {t("Le modifiche a quantità, fascia e partner sono gestite dalle operazioni Offcut prima del ritiro. Nessun importo viene riaddebitato senza un preventivo riemesso.")}
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
              <Link href="/app/settings">{t("Impostazioni spazio di lavoro")}</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
