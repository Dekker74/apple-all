"use client";

import { useI18n } from "@/lib/i18n";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  FileText,
  Image as ImageIcon,
  Info,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { localized } from "@/components/app/offcut-ux-copy";
import { dateText, money, perKg } from "@/components/app/offcut-ux-text";
import { ListingCard } from "@/components/material/listing-card";
import { MaterialThumb } from "@/components/material/material-thumb";
import { ProcessingChips } from "@/components/material/price-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_MAP, CONDITIONS, CONDITION_MAP, PROCESSING_MAP } from "@/lib/constants";
import { addDaysInput, todayInput } from "@/lib/format";
import {
  useCurrentOrg,
  useMatchViews,
  usePrimaryLocation,
} from "@/lib/hooks";
import {
  computePriceBreakdown,
  formatKg,
  haversineKm,
  resolveProcessing,
} from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const COPY = {
  it: {
    evidenceCount: (ready: number, total: number) => `${ready}/${total} disponibili`,
    commission: (rate: number) => `Commissione ${Math.round(rate * 100)}%`,
    tax: (rate: number) => `IVA ${Math.round(rate * 100)}%`,
    category: "Categoria",
    memberSince: "Membro dal",
  },
  en: {
    evidenceCount: (ready: number, total: number) => `${ready}/${total} available`,
    commission: (rate: number) => `Commission ${Math.round(rate * 100)}%`,
    tax: (rate: number) => `VAT ${Math.round(rate * 100)}%`,
    category: "Category",
    memberSince: "Member since",
  },
};

export default function ListingDetailPage() {
  const { t, lang } = useI18n();
  const c = localized(COPY, lang);
  const fmtMoney = (value: number, opts?: { cents?: boolean; compact?: boolean }) =>
    money(value, lang, opts);
  const fmtPerKg = (value: number, digits = 2) => perKg(value, lang, digits);
  const fmtDate = (value: string | Date, opts?: { withYear?: boolean }) =>
    dateText(value, lang, opts);
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const org = useCurrentOrg();
  const primary = usePrimaryLocation();
  const views = useMatchViews();
  const requestQuoteForListing = useAppStore((s) => s.requestQuoteForListing);
  const listings = useAppStore((s) => s.listings);
  const locations = useAppStore((s) => s.locations);
  const organizations = useAppStore((s) => s.organizations);
  const allRequests = useAppStore((s) => s.requests);

  const listing = listings.find((l) => l.id === params.id);
  const [quantity, setQuantity] = useState(listing?.minOrderKg ?? 1000);
  const [deliveryDate, setDeliveryDate] = useState(addDaysInput(21));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (listing) setQuantity(listing.minOrderKg);
  }, [listing?.id]);

  const location = locations.find((l) => l.id === listing?.locationId);
  const supplier = organizations.find((o) => o.id === listing?.orgId);
  const distanceKm =
    primary && location ? haversineKm(primary, location) : 0;

  const match = useMemo(() => {
    if (!listing) return null;
    const orgRequestIds = new Set(
      allRequests.filter((r) => r.orgId === org?.id).map((r) => r.id),
    );
    return (
      views
        .map((v) => v.match)
        .filter((m) => m.listingId === listing.id && orgRequestIds.has(m.requestId))
        .sort((a, b) => b.score - a.score)[0] ?? null
    );
  }, [views, listing, allRequests, org?.id]);

  const processing = listing ? resolveProcessing(listing) : [];
  const clampedQty = listing
    ? Math.max(listing.minOrderKg, Math.min(quantity || listing.minOrderKg, listing.quantityKg))
    : 0;
  const breakdown = listing
    ? computePriceBreakdown({
        listing,
        quantityKg: clampedQty,
        distanceKm,
        processing,
      })
    : null;

  if (!listing) {
    return (
      <EmptyState
        icon={Package}
        title={t("Materiale non trovato")}
        description={t("Questo annuncio potrebbe essere stato venduto o archiviato. Esplora il mercato attivo.")}
        action={
          <Button asChild size="sm">
            <Link href="/app/marketplace">{t("Torna al marketplace")}</Link>
          </Button>
        }
      />
    );
  }

  const similar = listings
    .filter(
      (l) =>
        l.id !== listing.id &&
        l.category === listing.category &&
        (l.status === "active" || l.status === "matched"),
    )
    .slice(0, 3);

  const declaredConditions = listing.conditionFlags?.length
    ? listing.conditionFlags
    : [listing.condition];
  const conditionLabel = declaredConditions
    .map((value) => t(CONDITIONS.find((option) => option.value === value)?.label ?? CONDITION_MAP[value].label))
    .join(" + ");

  const evidence = [
    {
      label: t("Dichiarazione di composizione"),
      note: listing.composition.map((c) => `${c.material} ${c.percent}%`).join(" · "),
      ok: true,
    },
    {
      label: t("Dichiarazione di assenza di pericoli"),
      note: listing.handling.includes(t("Dichiarazione di assenza di pericoli"))
        ? t("Dichiarazione firmata in archivio")
        : t("Da confermare al ritiro"),
      ok: listing.handling.includes(t("Dichiarazione di assenza di pericoli")),
    },
    {
      label: t("Fotografia del materiale"),
      note:
        listing.photos.length > 0
          ? t(`${listing.photos.length} ${listing.photos.length === 1 ? "foto caricata" : "foto caricate"}`)
          : t("In attesa — il fornitore ha richiesto il caricamento"),
      ok: listing.photos.length > 0,
    },
    {
      label: t("Condizioni dichiarate"),
      note: t(`${conditionLabel} · verifica visiva al QC`),
      ok: true,
    },
  ];

  async function handleQuote() {
    if (!listing) return;
    if (new Date(deliveryDate) < new Date(todayInput())) {
      toast.error(t("Seleziona una data di consegna nel futuro."));
      return;
    }
    setSubmitting(true);
    try {
      const orderId = requestQuoteForListing(listing.id, clampedQty, deliveryDate);
      toast.success(t("Ordine creato"), {
        description: t("Rivedi il preventivo dettagliato ed emettilo quando pronto."),
      });
      router.push(`/app/orders/${orderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Impossibile creare l'ordine."));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/marketplace"
          className="inline-flex items-center gap-1.5 text-[11.5px] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> {t("Mercato")}
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{t(CATEGORY_MAP[listing.category].label)}</Badge>
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
            {listing.reference}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <MaterialThumb
              category={listing.category}
              reference={listing.reference}
              photos={listing.photos}
              className="h-[260px] w-full sm:h-[320px]"
            />
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {match ? (
                  <Badge variant={match.confidence === "strong" ? "strong" : "review"}>
                    <Sparkles className="size-3" /> {t(`Abbinamento AI · ${match.score}`)}
                  </Badge>
                ) : null}
                <Badge variant="success">{t(CONDITION_MAP[listing.condition].label)}</Badge>
                <Badge variant="outline">{t(`${formatKg(listing.quantityKg)} disponibili`)}</Badge>
                {listing.status === "matched" ? <Badge variant="warning">{t("Parzialmente impegnato")}</Badge> : null}
              </div>
              <h1 className="mt-3 text-balance text-[32px] leading-[1.05] sm:text-[38px]">
                {t(listing.title)}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-forest font-mono text-[12px] text-lime">
                    {supplier?.name.slice(0, 2).toUpperCase()}
                  </span>
                  {supplier?.name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {t(`${location?.city} · ${distanceKm} km da ${primary?.city ?? t("la tua sede")}`)}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> {t("Disponibile dal")} {t(fmtDate(listing.availableFrom, { withYear: false }))} –{" "}
                  {t(fmtDate(listing.availableUntil))}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
                {[
                  { label: t("Prezzo materiale"), value: fmtPerKg(listing.pricePerKg), icon: Package },
                  { label: t("Quantità"), value: formatKg(listing.quantityKg), icon: Warehouse },
                  { label: t("Ordine min."), value: formatKg(listing.minOrderKg), icon: Truck },
                  { label: t("Condizione"), value: t(CONDITION_MAP[listing.condition].label), icon: ShieldCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-white px-3.5 py-3">
                      <p className="flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                        <Icon className="size-2.5" /> {item.label}
                      </p>
                      <p className="mt-1.5 font-mono text-[13px] tabular-nums">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <p className="eyebrow">{t("Informazioni sul materiale")}</p>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink/80">{t(listing.description)}</p>

            <Separator className="my-5" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow">{t("Composizione")}</p>
                <div className="mt-3 space-y-2.5">
                  {listing.composition.map((part) => (
                    <div key={part.material}>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span>{t(part.material)}</span>
                        <span className="font-mono text-[12px] text-muted">{part.percent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
                        <div
                          className="h-full rounded-full bg-moss/70"
                          style={{ width: `${part.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow">{t("Vincoli di movimentazione")}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {listing.handling.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-[12px] text-ink/80"
                    >
                      {t(h)}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-muted">
                  {t(`Confezionamento: ${t(listing.packaging)} · Ritiro da ${location?.city}.`)}
                </p>
              </div>
            </div>

            <Separator className="my-5" />

            <div>
              <div className="flex items-center justify-between">
                <p className="eyebrow">{t("Foto e evidenze")}</p>
                <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                  {c.evidenceCount(evidence.filter((e) => e.ok).length, evidence.length)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {evidence.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-2.5 rounded-xl border border-line bg-paper/40 p-3"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md",
                        item.ok ? "bg-mist text-moss" : "bg-amber/10 text-amber",
                      )}
                    >
                      {item.ok ? <Check className="size-3" strokeWidth={3} /> : <CircleAlert className="size-3" />}
                    </span>
                    <div>
                      <p className="text-[12px] font-medium">{item.label}</p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{t(item.note)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2 rounded-xl border border-dashed border-line p-3 text-[11.5px] text-muted">
                <ImageIcon className="size-4 shrink-0 text-muted/70" />
                <p>
                  {t("In produzione i fornitori caricano qui foto, report di laboratorio e dichiarazioni. Questa versione MVP usa la specifica dichiarata e il campionamento QC al ritiro.")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <p className="eyebrow">{t("Lavorazione e qualità")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ProcessingChips processing={processing} />
              <span className="text-[12px] text-muted">
                {processing.length > 0
                  ? t("Coordinato da Offcut con partner verificati.")
                  : t("Pronto all'uso — nessuna lavorazione richiesta.")}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { title: t("Ritiro"), body: t("Trasportatore prenotato dopo l'accettazione del preventivo. Vincoli di carico confermati in anticipo."), icon: Truck },
                { title: t("Lavorazione"), body: processing.length > 0 ? processing.map((p) => t(PROCESSING_MAP[p].label)).join(" · ") : t("Semplice — il materiale viene spedito così com'è."), icon: Warehouse },
                { title: t("Controllo qualità"), body: t("Campionamento indipendente sulle condizioni dichiarate e sulle specifiche concordate."), icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={t(item.title)} className="rounded-xl bg-paper/60 p-3.5">
                    <Icon className="size-4 text-moss" />
                    <p className="mt-2 text-[11.5px] font-medium">{t(item.title)}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{t(item.body)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-app-sticky space-y-3">
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="eyebrow">{t("Stima consegnata immediata")}</p>
                  <p className="mt-1.5 font-display text-[36px] leading-none">
                    {breakdown ? fmtMoney(breakdown.total, { cents: true }) : "—"}
                  </p>
                  <p className="mt-1.5 text-[12px] text-muted">
                    {breakdown ? fmtPerKg(breakdown.deliveredPerKg) : ""} {t("· IVA inclusa")}
                  </p>
                </div>
                <span className="rounded-full border border-line bg-paper px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                  {distanceKm} km
                </span>
              </div>

              <div className="mt-4">
                <label htmlFor="quantity" className="field-label">
                  {t("Quantità ordine (kg)")}
                </label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min={listing.minOrderKg}
                    max={listing.quantityKg}
                    step={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setQuantity(listing.quantityKg)}
                  >
                    {t("Completo")}
                  </Button>
                </div>
                <p className="mt-1.5 text-[11.5px] text-muted">
                  {t(`Min ${formatKg(listing.minOrderKg)} · Massimo ${formatKg(listing.quantityKg)} disponibili`)}
                </p>
              </div>

              <div className="mt-4">
                <label htmlFor="delivery-date" className="field-label">
                  {t("Data di consegna desiderata")}
                </label>
                <Input
                  id="delivery-date"
                  type="date"
                  min={todayInput()}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1.5 text-[11.5px] text-muted">
                  {t("Scegli tu quando vuoi ricevere il materiale.")}
                </p>
              </div>

              {breakdown ? (
                <div className="mt-4 space-y-1.5 border-t border-line pt-3.5 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted">{t("Materiale")}</span>
                    <span className="font-mono">{fmtMoney(breakdown.materialCost, { cents: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{c.commission(breakdown.commissionRate)}</span>
                    <span className="font-mono">{fmtMoney(breakdown.commissionAmount, { cents: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("Lavorazione")}</span>
                    <span className="font-mono">{fmtMoney(breakdown.processingCost, { cents: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("Trasporto")}</span>
                    <span className="font-mono">{fmtMoney(breakdown.transportCost, { cents: true })}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1.5">
                    <span className="text-muted">{c.tax(breakdown.taxRate)}</span>
                    <span className="font-mono">{fmtMoney(breakdown.taxAmount, { cents: true })}</span>
                  </div>
                </div>
              ) : null}

              <Button className="mt-4 w-full" size="lg" onClick={handleQuote} disabled={submitting}>
                {submitting ? t("Creazione ordine…") : t("Richiedi questo materiale")}
                <ArrowRight className="size-4" />
              </Button>
              <p className="mt-2 text-center text-[11.5px] leading-relaxed text-muted">
                {t("Crea un ordine abbinato e un preventivo bozza. Lo rivedi ed emetti prima che qualsiasi impegno diventi effettivo.")}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                <Info className="size-3" /> {t("Cosa succede ora")}
              </p>
              <ol className="mt-3 space-y-2.5">
                {[
                  t("Confermiamo volume e disponibilità con il fornitore."),
                  t("Partner di lavorazione, trasporto e QC sono inclusi nel prezzo."),
                  t("Accetti un preventivo consegnato, valido 14 giorni."),
                ].map((step, index) => (
                  <li key={step} className="flex gap-2.5 text-[12px] leading-relaxed text-muted">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[12px] text-forest">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-line bg-forest p-4 text-paper">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-paper/10 font-mono text-[11.5px] text-lime">
                  {supplier?.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-medium">{supplier?.name}</p>
                  {supplier?.vatNumber ? (
                    <p className="text-[11.5px] text-paper/50">{supplier.vatNumber}</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-paper/15 pt-3 text-center">
                <div>
                  <p className="truncate font-display text-[17px] leading-none">
                    {t(CATEGORY_MAP[listing.category].short)}
                  </p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-paper/45">
                    {c.category}
                  </p>
                </div>
                <div>
                  <p className="font-display text-[20px] leading-none">
                    {supplier ? new Date(supplier.createdAt).getFullYear() : "—"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-paper/45">
                    {c.memberSince}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="border-t border-line pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">{t("Stessa categoria")}</p>
              <h2 className="mt-1.5 text-[24px]">{t(`Altri annunci di ${CATEGORY_MAP[listing.category].short.toLowerCase()}`)}</h2>
            </div>
            <Link href="/app/marketplace" className="flex items-center gap-1 text-[12px] text-muted hover:text-forest">
              {t("Esplora tutto")} <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => {
              const loc = locations.find((l) => l.id === item.locationId);
              const sup = organizations.find((o) => o.id === item.orgId);
              const distance = primary && loc ? haversineKm(primary, loc) : 0;
              const qty = Math.max(item.minOrderKg, Math.min(item.quantityKg, 8000));
              const b = computePriceBreakdown({
                listing: item,
                quantityKg: qty,
                distanceKm: distance,
                processing: resolveProcessing(item),
              });
              return (
                <ListingCard
                  key={item.id}
                  listing={item}
                  supplierName={sup?.name ?? t("Fornitore")}
                  city={loc?.city ?? "—"}
                  distanceKm={distance}
                  deliveredPerKg={b.deliveredPerKg}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
