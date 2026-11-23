"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  Package,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/material/category-icon";
import { MaterialThumb } from "@/components/material/material-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  CATEGORY_MAP,
  CONDITIONS,
  HANDLING_OPTIONS,
} from "@/lib/constants";
import { addDaysInput, formatDate, todayInput } from "@/lib/format";
import { useCurrentOrg, useOrgLocations, usePrimaryLocation } from "@/lib/hooks";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MaterialCategory, MaterialCondition } from "@/types";

const STEPS = ["Materiale", "Specifiche", "Logistica e evidenze", "Revisione"];

async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1000;
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function NewListingPage() {
  const router = useRouter();
  const org = useCurrentOrg();
  const locations = useOrgLocations();
  const primary = usePrimaryLocation();
  const createListing = useAppStore((s) => s.createListing);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MaterialCategory | null>(null);
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<MaterialCondition>("clean");
  const [purity, setPurity] = useState(95);

  const [composition, setComposition] = useState([{ material: "", percent: 100 }]);
  const [quantityKg, setQuantityKg] = useState("");
  const [minOrderKg, setMinOrderKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [availableFrom, setAvailableFrom] = useState(todayInput());
  const [availableUntil, setAvailableUntil] = useState(addDaysInput(45));

  const [locationId, setLocationId] = useState(primary?.id ?? "");
  const [packaging, setPackaging] = useState("");
  const [handling, setHandling] = useState<string[]>(["Palletized"]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Select the primary site once the persisted workspace hydrates.
  useEffect(() => {
    if (!locationId && primary) setLocationId(primary.id);
  }, [locationId, primary]);

  const compositionTotal = composition.reduce((sum, part) => sum + (Number(part.percent) || 0), 0);
  const quantity = Number(quantityKg) || 0;
  const price = Number(pricePerKg) || 0;

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === locationId) ?? primary,
    [locations, locationId, primary],
  );

  function toggleHandling(value: string) {
    setHandling((prev) =>
      prev.includes(value) ? prev.filter((h) => h !== value) : [...prev, value],
    );
  }

  function validate(currentStep: number): boolean {
    setError(null);
    if (currentStep === 0) {
      if (title.trim().length < 6) return fail("Dai al materiale un titolo chiaro e descrittivo.");
      if (!category) return fail("Seleziona una delle tre categorie MVP.");
      if (description.trim().length < 30)
        return fail("Descrivi il materiale in linguaggio semplice (almeno 30 caratteri).");
      if (purity < 50 || purity > 100) return fail("La purezza deve essere tra il 50% e il 100%.");
      return true;
    }
    if (currentStep === 1) {
      if (composition.some((c) => c.material.trim().length < 2))
        return fail("Assegna un nome a ogni componente della composizione.");
      if (Math.abs(compositionTotal - 100) > 5)
        return fail("Le percentuali di composizione devono sommare 100% (±5%).");
      if (quantity <= 0) return fail("Inserisci la quantità disponibile in chilogrammi.");
      if (Number(minOrderKg) <= 0) return fail("Imposta una quantità minima d'ordine.");
      if (Number(minOrderKg) > quantity) return fail("L'ordine minimo non può superare la quantità disponibile.");
      if (price <= 0) return fail("Imposta un prezzo del materiale al kg.");
      if (new Date(availableUntil) < new Date(availableFrom))
        return fail("La data di fine disponibilità deve essere successiva a quella di inizio.");
      return true;
    }
    if (currentStep === 2) {
      if (!locationId) return fail("Seleziona la sede di ritiro.");
      if (packaging.trim().length < 2) return fail("Descrivi il confezionamento (es. balle, octabin).");
      if (handling.length === 0) return fail("Seleziona almeno un vincolo di movimentazione.");
      return true;
    }
    return true;
  }

  function fail(message: string): false {
    setError(message);
    return false;
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function publish(status: "active" | "draft") {
    if (!validate(0) || !validate(1) || !validate(2)) {
      setError("Completa i passaggi precedenti prima di pubblicare.");
      return;
    }
    if (!category || !locationId) return;
    setSaving(true);
    try {
      const id = createListing({
        title: title.trim(),
        description: description.trim(),
        category,
        composition: composition.map((c) => ({
          material: c.material.trim(),
          percent: Number(c.percent) || 0,
        })),
        quantityKg: quantity,
        condition,
        purityPct: purity,
        pricePerKg: price,
        availableFrom,
        availableUntil,
        photos,
        handling,
        packaging: packaging.trim(),
        minOrderKg: Number(minOrderKg),
        locationId,
        status,
      });
      const matchCount = useAppStore.getState().matches.filter((m) => m.listingId === id).length;
      toast.success(status === "active" ? "Annuncio pubblicato" : "Bozza salvata", {
        description:
          status === "active"
            ? `${matchCount} ${matchCount === 1 ? "azienda interessata" : "aziende interessate"} a questo materiale. Puoi contattarle subito.`
            : "Puoi pubblicarlo da I miei annunci.",
      });
      router.push(status === "active" ? `/app/matches?listing=${id}` : "/app/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile creare l'annuncio.");
      setSaving(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (photos.length >= 3) {
      toast.error("Massimo 3 foto in questa versione MVP.");
      return;
    }
    setUploading(true);
    try {
      const nextFiles = Array.from(files).slice(0, 3 - photos.length);
      const compressed = await Promise.all(
        nextFiles.filter((f) => f.size < 6_000_000).map((f) => compressImage(f)),
      );
      setPhotos((prev) => [...prev, ...compressed].slice(0, 3));
    } catch {
      toast.error("Impossibile leggere quell'immagine.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/listings"
          className="inline-flex items-center gap-1.5 text-[11.5px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> My listings
        </Link>
        <Badge variant="muted">Flusso fornitore · {org?.name}</Badge>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Ho materiale</p>
          <h1 className="mt-2 text-[34px] leading-none sm:text-[38px]">Pubblica materiale in eccedenza</h1>
          <p className="mt-2 max-w-[560px] text-[12px] leading-relaxed text-muted">
            Quattro passaggi. In questa versione MVP si può commerciare solo carta e cartone, legno e
            plastica. Il motore abbina subito alla pubblicazione.
          </p>
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
          Passo {step + 1} / {STEPS.length}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {STEPS.map((label, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <button
              key={label}
              onClick={() => index < step && setStep(index)}
              disabled={index > step}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-forest bg-white"
                  : done
                    ? "border-line bg-white/60 hover:border-sage"
                    : "border-line/70 bg-transparent opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[12px]",
                  done
                    ? "border-forest bg-forest text-lime"
                    : active
                      ? "border-forest text-forest"
                      : "border-line text-muted",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
              </span>
              <span className={cn("text-[12px]", active ? "font-medium text-ink" : "text-muted")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_310px]">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Passo 1</p>
                <h2 className="mt-1.5 text-[24px]">Di che materiale si tratta?</h2>
              </div>

              <Field
                label="Titolo annuncio"
                required
                hint="Linguaggio semplice, come farebbe una ricerca l'acquirente. Includi qualità o forma."
              >
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. Ritagli OCC kraft 90/10, in balle"
                />
              </Field>

              <div>
                <p className="field-label">
                  Categoria materiale <span className="text-clay">*</span>
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  Limitato al lancio. Le altre categorie sono disabilitate per policy.
                </p>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                  {CATEGORIES.map((cat) => {
                    const selected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          selected
                            ? "border-forest bg-mist/40 ring-1 ring-forest"
                            : "border-line hover:border-sage",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <CategoryIcon category={cat.value} size="sm" />
                          {selected ? <Check className="size-3.5 text-forest" strokeWidth={3} /> : null}
                        </div>
                        <p className="mt-2 text-[11.5px] font-medium">{cat.short}</p>
                        <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">{cat.blurb}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field
                label="Descrizione in linguaggio semplice"
                required
                hint="Origine, qualità, contaminazione, impieghi. Evita descrizioni fatte solo di gergo."
              >
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Ritagli puliti di cartone ondulato kraft da cartotecnica, asciutti, senza cera o laminati. Adatti per cartone riciclato…"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Condizione" required>
                  <Select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as MaterialCondition)}
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label} — {c.hint}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={`Purezza dichiarata — ${purity}%`} hint="Gli acquirenti lo vedono prima di richiedere un preventivo.">
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={purity}
                    onChange={(e) => setPurity(Number(e.target.value))}
                    className="mt-3 w-full accent-[#0066cc]"
                    aria-label="Purezza dichiarata"
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Passo 2</p>
                <h2 className="mt-1.5 text-[24px]">Specifiche e disponibilità</h2>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="field-label">Composizione</p>
                  <span
                    className={cn(
                      "font-mono text-[11.5px]",
                      Math.abs(compositionTotal - 100) <= 5 ? "text-moss" : "text-amber",
                    )}
                  >
                    {compositionTotal}% total
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {composition.map((part, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={part.material}
                        onChange={(e) =>
                          setComposition((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, material: e.target.value } : p)),
                          )
                        }
                        placeholder="Materiale, es. OCC"
                        className="flex-1"
                      />
                      <div className="relative w-[96px]">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          aria-label="Percentuale del componente"
                          value={part.percent}
                          onChange={(e) =>
                            setComposition((prev) =>
                              prev.map((p, i) =>
                                i === index ? { ...p, percent: Number(e.target.value) } : p,
                              ),
                            )
                          }
                          className="pr-6 font-mono"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11.5px] text-muted">
                          %
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setComposition((prev) => prev.filter((_, i) => i !== index))}
                        disabled={composition.length === 1}
                        aria-label="Rimuovi componente"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                {composition.length < 4 ? (
                  <button
                    type="button"
                    onClick={() => setComposition((prev) => [...prev, { material: "", percent: 0 }])}
                    className="mt-2 flex items-center gap-1 text-[12px] text-moss hover:underline"
                  >
                    <Plus className="size-3" /> Aggiungi componente
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Quantità disponibile (kg)" required>
                  <Input
                    type="number"
                    min={1}
                    max={1000000}
                    aria-label="Quantità disponibile in kg"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    placeholder="18500"
                    className="font-mono"
                  />
                </Field>
                <Field label="Ordine minimo (kg)" required>
                  <Input
                    type="number"
                    min={1}
                    max={1000000}
                    aria-label="Ordine minimo in kg"
                    value={minOrderKg}
                    onChange={(e) => setMinOrderKg(e.target.value)}
                    placeholder="5000"
                    className="font-mono"
                  />
                </Field>
                <Field label="Prezzo materiale (€/kg)" required>
                  <Input
                    type="number"
                    min={0}
                    max={10000}
                    step="0.01"
                    aria-label="Prezzo del materiale per kg in euro"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    placeholder="0.11"
                    className="font-mono"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Disponibile dal" required>
                  <Input
                    type="date"
                    min={todayInput()}
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                  />
                </Field>
                <Field label="Disponibile fino al" required>
                  <Input
                    type="date"
                    min={availableFrom}
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-line bg-paper/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted">Valore materiale a pieno volume</span>
                  <span className="font-mono text-[13px]">
                    {formatCurrency(quantity * price, { cents: true })}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted">
                  Esclude lavorazione, trasporto e IVA — gli acquirenti vedono una stima consegnata completa.
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Passo 3</p>
                <h2 className="mt-1.5 text-[24px]">Logistica e evidenze</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sede di ritiro" required>
                  <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} — {loc.city}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Confezionamento" required hint="es. balle ~650 kg, octabin, alla rinfusa.">
                  <Input
                    value={packaging}
                    onChange={(e) => setPackaging(e.target.value)}
                    placeholder="Bales ~650 kg"
                  />
                </Field>
              </div>

              <div>
                <p className="field-label">Vincoli di movimentazione</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  Seleziona tutto ciò che trasportatore o lavoratore devono sapere.
                </p>
                <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                  {HANDLING_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] transition-colors",
                        handling.includes(option)
                          ? "border-forest/40 bg-mist/30"
                          : "border-line hover:border-sage",
                      )}
                    >
                      <Checkbox
                        checked={handling.includes(option)}
                        onCheckedChange={() => toggleHandling(option)}
                        aria-label={option}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="field-label">Foto e evidenze</p>
                  <span className="font-mono text-[12px] text-muted">{photos.length}/3</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt={`Evidenza ${index + 1}`} className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute right-1.5 top-1.5 rounded-full bg-ink/70 p-1 text-paper opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label="Rimuovi foto"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 ? (
                    <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-paper/50 text-muted transition-colors hover:border-sage hover:text-forest">
                      {uploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ImagePlus className="size-4" />
                      )}
                      <span className="text-[11.5px]">{uploading ? "Elaborazione…" : "Aggiungi foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => handleFiles(e.target.files)}
                        disabled={uploading}
                      />
                    </label>
                  ) : null}
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  In questa versione MVP le foto vengono compresse e salvate localmente. In produzione si usa
                  Supabase Storage con URL firmati.
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-line bg-paper/60 p-3.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-moss" />
                <div>
                  <p className="text-[12px] font-medium">
                    {selectedLocation?.name ?? "Seleziona una sede"}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {selectedLocation
                      ? `${selectedLocation.addressLine}, ${selectedLocation.postalCode} ${selectedLocation.city}, ${selectedLocation.country}`
                      : "Aggiungi prima una sede nelle Impostazioni."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Passo 4</p>
                <h2 className="mt-1.5 text-[24px]">Revisiona e pubblica</h2>
                <p className="mt-1 text-[12px] text-muted">
                  Controlla le specifiche. Puoi mettere in pausa o archiviare l'annuncio in qualsiasi momento.
                </p>
              </div>

              <div className="flex gap-4 rounded-xl border border-line p-3.5">
                <MaterialThumb
                  category={category ?? "paper_cardboard"}
                  reference="NUOVO"
                  photos={photos}
                  className="h-20 w-28 shrink-0 rounded-lg"
                  compact
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-[1.5]">{title || "Annuncio senza titolo"}</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {category ? CATEGORY_MAP[category].label : "Nessuna categoria"} ·{" "}
                    {CONDITIONS.find((c) => c.value === condition)?.label} · {purity}% di purezza
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {description || "Nessuna descrizione"}
                  </p>
                </div>
              </div>

              <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                {[
                  { label: "Quantità", value: quantity > 0 ? formatKg(quantity) : "—" },
                  { label: "Ordine min", value: Number(minOrderKg) > 0 ? formatKg(Number(minOrderKg)) : "—" },
                  { label: "Prezzo", value: price > 0 ? formatPerKg(price) : "—" },
                  { label: "Valore materiale", value: formatCurrency(quantity * price) },
                  { label: "Disponibile", value: `${formatDate(availableFrom, { withYear: false })} – ${formatDate(availableUntil)}` },
                  { label: "Ritiro", value: selectedLocation?.city ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="bg-white px-3.5 py-2.5">
                    <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{item.label}</p>
                    <p className="mt-1 font-mono text-[12px]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-paper/70 p-3.5">
                <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">Composizione</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {composition.map((part) => (
                    <span key={part.material} className="rounded border border-line bg-white px-2 py-0.5 text-[11.5px]">
                      {part.material || "—"} {part.percent}%
                    </span>
                  ))}
                </div>
                <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">Movimentazione</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {handling.map((h) => (
                    <span key={h} className="rounded-full border border-line bg-white px-2 py-0.5 text-[11.5px] text-moss">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-lime/50 bg-lime/10 p-3.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-moss" />
                <p className="text-[12px] leading-relaxed text-ink/80">
                  Alla pubblicazione il motore valuta l'annuncio rispetto a ogni richiesta aperta sul mercato e
                  mostra i candidati più solidi a entrambe le parti.
                </p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2.5 text-[11.5px] leading-relaxed text-danger"
            >
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="-ml-2"
            >
              <ArrowLeft className="size-3.5" /> Indietro
            </Button>
            <div className="flex items-center gap-2">
              {step === 3 ? (
                <>
                  <Button variant="outline" onClick={() => publish("draft")} disabled={saving}>
                    Salva bozza
                  </Button>
                  <Button onClick={() => publish("active")} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-3.5" />}
                    Pubblica annuncio
                  </Button>
                </>
              ) : (
                <Button onClick={next}>
                  Continue <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[92px]">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="eyebrow">Anteprima annuncio</p>
            <MaterialThumb
              category={category ?? "paper_cardboard"}
              reference="PREVIEW"
              photos={photos}
              className="mt-3 h-32 w-full rounded-xl"
              compact
            />
            <p className="mt-3 line-clamp-2 text-[12.5px] font-medium">
              {title || "Titolo del tuo materiale"}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              {category ? CATEGORY_MAP[category].label : "Categoria non selezionata"} ·{" "}
              {selectedLocation?.city ?? "Sede"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12px]">
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Volume</p>
                <p className="mt-0.5 font-mono">{quantity > 0 ? formatKg(quantity) : "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Prezzo</p>
                <p className="mt-0.5 font-mono">{price > 0 ? formatPerKg(price) : "—"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white/60 p-4">
            <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
              <Package className="size-3" /> Checklist qualità
            </p>
            <ul className="mt-2.5 space-y-2 text-[12px] text-muted">
              {[
                "La categoria è una delle tre filiere MVP",
                "La composizione somma circa il 100%",
                "Disponibilità e ordine minimo impostati",
                "Vincoli di movimentazione dichiarati",
                "Foto o evidenze allegate (facoltativo)",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-3 shrink-0 text-moss" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
