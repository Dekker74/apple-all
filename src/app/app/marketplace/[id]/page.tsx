"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
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
import { CategoryIcon } from "@/components/material/category-icon";
import { ListingCard } from "@/components/material/listing-card";
import { MaterialThumb } from "@/components/material/material-thumb";
import { ProcessingChips } from "@/components/material/price-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_MAP, CONDITIONS, CONDITION_MAP, PROCESSING_MAP } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import {
  useCurrentOrg,
  useMatchViews,
  usePrimaryLocation,
} from "@/lib/hooks";
import {
  computePriceBreakdown,
  formatCurrency,
  formatKg,
  formatPerKg,
  haversineKm,
  resolveProcessing,
} from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ListingDetailPage() {
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
        title="Materiale non trovato"
        description="Questo annuncio potrebbe essere stato venduto o archiviato. Esplora il mercato attivo."
        action={
          <Button asChild size="sm">
            <Link href="/app/marketplace">Torna al marketplace</Link>
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
    .map((value) => CONDITIONS.find((option) => option.value === value)?.label ?? CONDITION_MAP[value].label)
    .join(" + ");

  const evidence = [
    {
      label: "Dichiarazione di composizione",
      note: listing.composition.map((c) => `${c.material} ${c.percent}%`).join(" · "),
      ok: true,
    },
    {
      label: "Dichiarazione di assenza di pericoli",
      note: listing.handling.includes("Dichiarazione di assenza di pericoli")
        ? "Dichiarazione firmata in archivio"
        : "Da confermare al ritiro",
      ok: listing.handling.includes("Dichiarazione di assenza di pericoli"),
    },
    {
      label: "Fotografia del materiale",
      note:
        listing.photos.length > 0
          ? `${listing.photos.length} ${listing.photos.length === 1 ? "foto caricata" : "foto caricate"}`
          : "In attesa — il fornitore ha richiesto il caricamento",
      ok: listing.photos.length > 0,
    },
    {
      label: "Condizioni dichiarate",
      note: `${conditionLabel} · verifica visiva al QC`,
      ok: true,
    },
  ];

  async function handleQuote() {
    if (!listing) return;
    setSubmitting(true);
    try {
      const orderId = requestQuoteForListing(listing.id, clampedQty);
      toast.success("Ordine creato", {
        description: "Rivedi il preventivo dettagliato ed emettilo quando pronto.",
      });
      router.push(`/app/orders/${orderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossibile creare l'ordine.");
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
          <ArrowLeft className="size-3.5" /> Marketplace
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{CATEGORY_MAP[listing.category].label}</Badge>
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
                    <Sparkles className="size-3" /> Abbinamento AI · {match.score}
                  </Badge>
                ) : null}
                <Badge variant="success">{CONDITION_MAP[listing.condition].label}</Badge>
                <Badge variant="outline">{formatKg(listing.quantityKg)} disponibili</Badge>
                {listing.status === "matched" ? <Badge variant="warning">Parzialmente impegnato</Badge> : null}
              </div>
              <h1 className="mt-3 text-balance text-[32px] leading-[1.05] sm:text-[38px]">
                {listing.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-forest font-mono text-[12px] text-lime">
                    {supplier?.name.slice(0, 2).toUpperCase()}
                  </span>
                  {supplier?.name}
                  {supplier?.verified ? <BadgeCheck className="size-3.5 text-moss" /> : null}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {location?.city} · {distanceKm} km da{" "}
                  {primary?.city ?? "la tua sede"}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> Disponibile dal {formatDate(listing.availableFrom, { withYear: false })} –{" "}
                  {formatDate(listing.availableUntil)}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
                {[
                  { label: "Prezzo materiale", value: formatPerKg(listing.pricePerKg), icon: Package },
                  { label: "Quantità", value: formatKg(listing.quantityKg), icon: Warehouse },
                  { label: "Ordine min.", value: formatKg(listing.minOrderKg), icon: Truck },
                  { label: "Condizione", value: CONDITION_MAP[listing.condition].label, icon: ShieldCheck },
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
            <p className="eyebrow">Informazioni sul materiale</p>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink/80">{listing.description}</p>

            <Separator className="my-5" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow">Composizione</p>
                <div className="mt-3 space-y-2.5">
                  {listing.composition.map((part) => (
                    <div key={part.material}>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span>{part.material}</span>
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
                <p className="eyebrow">Vincoli di movimentazione</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {listing.handling.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-[12px] text-ink/80"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-muted">
                  Confezionamento: {listing.packaging} · Ritiro da {location?.city}.
                </p>
              </div>
            </div>

            <Separator className="my-5" />

            <div>
              <div className="flex items-center justify-between">
                <p className="eyebrow">Foto e evidenze</p>
                <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                  {evidence.filter((e) => e.ok).length}/{evidence.length} verificato
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
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2 rounded-xl border border-dashed border-line p-3 text-[11.5px] text-muted">
                <ImageIcon className="size-4 shrink-0 text-muted/70" />
                <p>
                  In produzione i fornitori caricano qui foto, report di laboratorio e dichiarazioni. Questa
                  versione MVP usa la specifica dichiarata e il campionamento QC al ritiro.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <p className="eyebrow">Lavorazione e qualità</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ProcessingChips processing={processing} />
              <span className="text-[12px] text-muted">
                {processing.length > 0
                  ? "Coordinato da Offcut con partner verificati."
                  : "Pronto all'uso — nessuna lavorazione richiesta."}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { title: "Ritiro", body: "Trasportatore prenotato dopo l'accettazione del preventivo. Vincoli di carico confermati in anticipo.", icon: Truck },
                { title: "Lavorazione", body: processing.length > 0 ? processing.map((p) => PROCESSING_MAP[p].label).join(" · ") : "Semplice — il materiale viene spedito così com'è.", icon: Warehouse },
                { title: "Controllo qualità", body: "Campionamento indipendente sulle condizioni dichiarate e sulle soglie di contaminazione.", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl bg-paper/60 p-3.5">
                    <Icon className="size-4 text-moss" />
                    <p className="mt-2 text-[11.5px] font-medium">{item.title}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{item.body}</p>
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
                  <p className="eyebrow">Stima consegnata immediata</p>
                  <p className="mt-1.5 font-display text-[36px] leading-none">
                    {breakdown ? formatCurrency(breakdown.total, { cents: true }) : "—"}
                  </p>
                  <p className="mt-1.5 text-[12px] text-muted">
                    {breakdown ? formatPerKg(breakdown.deliveredPerKg) : ""} · IVA inclusa
                  </p>
                </div>
                <span className="rounded-full border border-line bg-paper px-2 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                  {distanceKm} km
                </span>
              </div>

              <div className="mt-4">
                <label htmlFor="quantity" className="field-label">
                  Quantità ordine (kg)
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
                    Completo
                  </Button>
                </div>
                <p className="mt-1.5 text-[11.5px] text-muted">
                  Min {formatKg(listing.minOrderKg)} · Massimo {formatKg(listing.quantityKg)} disponibili
                </p>
              </div>

              {breakdown ? (
                <div className="mt-4 space-y-1.5 border-t border-line pt-3.5 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted">Materiale</span>
                    <span className="font-mono">{formatCurrency(breakdown.materialCost, { cents: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Commissione 6%</span>
                    <span className="font-mono">{formatCurrency(breakdown.commissionAmount, { cents: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Lavorazione</span>
                    <span className="font-mono">{formatCurrency(breakdown.processingCost, { cents: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Trasporto</span>
                    <span className="font-mono">{formatCurrency(breakdown.transportCost, { cents: true })}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1.5">
                    <span className="text-muted">IVA 22%</span>
                    <span className="font-mono">{formatCurrency(breakdown.taxAmount, { cents: true })}</span>
                  </div>
                </div>
              ) : null}

              <Button className="mt-4 w-full" size="lg" onClick={handleQuote} disabled={submitting}>
                {submitting ? "Creazione ordine…" : "Richiedi questo materiale"}
                <ArrowRight className="size-4" />
              </Button>
              <p className="mt-2 text-center text-[11.5px] leading-relaxed text-muted">
                Crea un ordine abbinato e un preventivo bozza. Lo rivedi ed emetti prima che qualsiasi impegno
                diventi effettivo.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                <Info className="size-3" /> Cosa succede ora
              </p>
              <ol className="mt-3 space-y-2.5">
                {[
                  "Confermiamo volume e disponibilità con il fornitore.",
                  "Partner di lavorazione, trasporto e QC sono inclusi nel prezzo.",
                  "Accetti un preventivo consegnato, valido 14 giorni.",
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
                  <p className="text-[11.5px] text-paper/50">
                    {supplier?.verified ? "Partita IVA verificata · " : ""}Membro dal{" "}
                    {supplier ? new Date(supplier.createdAt).getFullYear() : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-paper/15 pt-3 text-center">
                <div>
                  <p className="font-display text-[20px] leading-none">4.8</p>
                  <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-paper/45">Valutazione</p>
                </div>
                <div>
                  <p className="font-display text-[20px] leading-none">96%</p>
                  <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-paper/45">Nei tempi</p>
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
              <p className="eyebrow">Stessa categoria</p>
              <h2 className="mt-1.5 text-[24px]">Altri annunci di {CATEGORY_MAP[listing.category].short.toLowerCase()}</h2>
            </div>
            <Link href="/app/marketplace" className="flex items-center gap-1 text-[12px] text-muted hover:text-forest">
              Esplora tutto <ArrowRight className="size-3" />
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
                  supplierName={sup?.name ?? "Fornitore"}
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
