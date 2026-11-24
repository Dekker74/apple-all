"use client";

import { useI18n } from "@/lib/i18n";

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
  deriveCondition,
  derivePurityPct,
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
  const { t } = useI18n();
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
  const [conditionFlags, setConditionFlags] = useState<MaterialCondition[]>([]);

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
  const condition = deriveCondition(conditionFlags);
  const purity = derivePurityPct(conditionFlags);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === locationId) ?? primary,
    [locations, locationId, primary],
  );

  function toggleHandling(value: string) {
    setHandling((prev) =>
      prev.includes(value) ? prev.filter((h) => h !== value) : [...prev, value],
    );
  }

  function toggleCondition(value: MaterialCondition) {
    setConditionFlags((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  }

  function validate(currentStep: number): boolean {
    setError(null);
    if (currentStep === 0) {
      if (title.trim().length < 6) return fail(t("Dai al materiale un titolo chiaro e descrittivo."));
      if (!category) return fail(t("Seleziona una delle tre categorie MVP."));
      if (description.trim().length === 0)
        return fail(t("Descrivi il materiale in linguaggio semplice."));
      if (conditionFlags.length === 0)
        return fail(t("Seleziona almeno una condizione del materiale."));
      return true;
    }
    if (currentStep === 1) {
      if (composition.some((c) => c.material.trim().length < 2))
        return fail(t("Assegna un nome a ogni componente della composizione."));
      if (Math.abs(compositionTotal - 100) > 5)
        return fail(t("Le percentuali di composizione devono sommare 100% (±5%)."));
      if (quantity <= 0) return fail(t("Inserisci la quantità disponibile in chilogrammi."));
      if (Number(minOrderKg) <= 0) return fail(t("Imposta una quantità minima d'ordine."));
      if (Number(minOrderKg) > quantity) return fail(t("L'ordine minimo non può superare la quantità disponibile."));
      if (price <= 0) return fail(t("Imposta un prezzo del materiale al kg."));
      if (new Date(availableUntil) < new Date(availableFrom))
        return fail(t("La data di fine disponibilità deve essere successiva a quella di inizio."));
      return true;
    }
    if (currentStep === 2) {
      if (!locationId) return fail(t("Seleziona la sede di ritiro."));
      if (packaging.trim().length < 2) return fail(t("Descrivi il confezionamento (es. balle, octabin)."));
      if (handling.length === 0) return fail(t("Seleziona almeno un vincolo di movimentazione."));
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
      setError(t("Completa i passaggi precedenti prima di pubblicare."));
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
        conditionFlags,
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
      toast.success(status === "active" ? t("Annuncio pubblicato") : t("Bozza salvata"), {
        description:
          status === "active"
            ? t(`${matchCount} ${matchCount === 1 ? t("azienda interessata") : t("aziende interessate")} a questo materiale. Puoi contattarle subito.`)
            : t("Puoi pubblicarlo da I miei annunci."),
      });
      router.push(status === "active" ? `/app/matches?listing=${id}` : "/app/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Impossibile creare l'annuncio."));
      setSaving(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (photos.length >= 3) {
      toast.error(t("Puoi caricare al massimo 3 foto."));
      return;
    }
    const candidates = Array.from(files).slice(0, 3 - photos.length);
    const valid = candidates.filter((file) => file.type.startsWith("image/") && file.size <= 8_000_000);
    if (valid.length === 0) {
      toast.error(t("Scegli un'immagine JPEG, PNG o WebP di massimo 8 MB."));
      return;
    }
    if (valid.length < candidates.length) {
      toast.error(t("Alcuni file non sono immagini valide e sono stati ignorati."));
    }
    setUploading(true);
    try {
      const compressed = await Promise.all(valid.map((file) => compressImage(file)));
      setPhotos((prev) => [...prev, ...compressed].slice(0, 3));
      toast.success(compressed.length === 1 ? t("Foto aggiunta all'annuncio.") : t("Foto aggiunte all'annuncio."));
    } catch {
      toast.error(t("Impossibile leggere quell'immagine. Prova con un altro file."));
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
          <ArrowLeft className="size-3.5" /> {t("I miei annunci")}
        </Link>
        <Badge variant="muted">{t("Flusso fornitore")} · {org?.name}</Badge>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{t("Ho materiale")}</p>
          <h1 className="mt-2 text-[34px] leading-none sm:text-[38px]">{t("Pubblica materiale in eccedenza")}</h1>
          <p className="mt-2 max-w-[560px] text-[12px] leading-relaxed text-muted">
            {t("Quattro passaggi. In questa versione MVP si può commerciare solo carta e cartone, legno e plastica. Il motore abbina subito alla pubblicazione.")}
          </p>
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
          {t(`Passo ${step + 1}`)} / {STEPS.length}
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
                {t(label)}
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
                <p className="eyebrow">{t("Passo 1")}</p>
                <h2 className="mt-1.5 text-[24px]">{t("Di che materiale si tratta?")}</h2>
              </div>

              <Field
                label={t("Titolo annuncio")}
                required
                hint={t("Linguaggio semplice, come farebbe una ricerca l'acquirente. Includi qualità o forma.")}
              >
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("es. Ritagli OCC kraft 90/10, in balle")}
                />
              </Field>

              <div>
                <p className="field-label">
                  {t("Categoria materiale")} <span className="text-clay">*</span>
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {t("Limitato al lancio. Le altre categorie sono disabilitate per policy.")}
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
                        <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">{t(cat.blurb)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field
                label={t("Descrizione in linguaggio semplice")}
                required
                hint={t("Origine, qualità e impieghi. Evita descrizioni fatte solo di gergo.")}
              >
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder={t("Ritagli puliti di cartone ondulato kraft da cartotecnica, asciutti, senza cera o laminati. Adatti per cartone riciclato…")}
                />
              </Field>

              <div>
                <p className="field-label">
                  {t("Condizioni del prodotto")} <span className="text-clay">*</span>
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {t("Seleziona tutto quello che descrive il materiale. Puoi scegliere più di una condizione.")}
                </p>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                  {CONDITIONS.map((option) => {
                    const checked = conditionFlags.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleCondition(option.value)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors",
                          checked
                            ? "border-forest bg-mist/40 ring-1 ring-forest"
                            : "border-line hover:border-sage",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                            checked ? "border-forest bg-forest text-paper" : "border-line",
                          )}
                        >
                          {checked ? <Check className="size-3" strokeWidth={3} /> : null}
                        </span>
                        <span>
                          <span className="block text-[12px] font-medium">{t(option.label)}</span>
                          <span className="mt-0.5 block text-[11.5px] leading-[1.45] text-muted">
                            {t(option.hint)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{t("Passo 2")}</p>
                <h2 className="mt-1.5 text-[24px]">{t("Specifiche e disponibilità")}</h2>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="field-label">{t("Composizione")}</p>
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
                        placeholder={t("Materiale, es. OCC")}
                        className="flex-1"
                      />
                      <div className="relative w-[96px]">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          aria-label={t("Percentuale del componente")}
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
                        aria-label={t("Rimuovi componente")}
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
                    <Plus className="size-3" /> {t("Aggiungi componente")}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("Quantità disponibile (kg)")} required>
                  <Input
                    type="number"
                    min={1}
                    max={1000000}
                    aria-label={t("Quantità disponibile in kg")}
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    placeholder="18500"
                    className="font-mono"
                  />
                </Field>
                <Field label={t("Ordine minimo (kg)")} required>
                  <Input
                    type="number"
                    min={1}
                    max={1000000}
                    aria-label={t("Ordine minimo in kg")}
                    value={minOrderKg}
                    onChange={(e) => setMinOrderKg(e.target.value)}
                    placeholder="5000"
                    className="font-mono"
                  />
                </Field>
                <Field label={t("Prezzo materiale (€/kg)")} required>
                  <Input
                    type="number"
                    min={0}
                    max={10000}
                    step="0.01"
                    aria-label={t("Prezzo del materiale per kg in euro")}
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    placeholder="0.11"
                    className="font-mono"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("Disponibile dal")} required>
                  <Input
                    type="date"
                    min={todayInput()}
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                  />
                </Field>
                <Field label={t("Disponibile fino al")} required>
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
                  <span className="text-[12px] text-muted">{t("Valore materiale a pieno volume")}</span>
                  <span className="font-mono text-[13px]">
                    {formatCurrency(quantity * price, { cents: true })}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted">
                  {t("Esclude lavorazione, trasporto e IVA — gli acquirenti vedono una stima consegnata completa.")}
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{t("Passo 3")}</p>
                <h2 className="mt-1.5 text-[24px]">{t("Logistica e evidenze")}</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("Sede di ritiro")} required>
                  <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {t(loc.name)} — {loc.city}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("Confezionamento")} required hint={t("es. balle ~650 kg, octabin, alla rinfusa.")}>
                  <Input
                    value={packaging}
                    onChange={(e) => setPackaging(e.target.value)}
                    placeholder="Bales ~650 kg"
                  />
                </Field>
              </div>

              <div>
                <p className="field-label">{t("Vincoli di movimentazione")}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {t("Seleziona tutto ciò che trasportatore o lavoratore devono sapere.")}
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
                        aria-label={t(option)}
                      />
                      {t(option)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="field-label">{t("Foto del prodotto")}</p>
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
                        aria-label={t("Rimuovi foto")}
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
                      <span className="text-[11.5px]">{uploading ? t("Elaborazione…") : t("Aggiungi foto")}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          void handleFiles(e.target.files);
                          e.target.value = "";
                        }}
                        disabled={uploading}
                      />
                    </label>
                  ) : null}
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  {t("Mostra il materiale reale: foto chiare aumentano la fiducia degli acquirenti. Le immagini vengono compresse prima di essere allegate all'annuncio.")}
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-line bg-paper/60 p-3.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-moss" />
                <div>
                  <p className="text-[12px] font-medium">
                    {selectedLocation?.name ?? t("Seleziona una sede")}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {selectedLocation
                      ? `${selectedLocation.addressLine}, ${selectedLocation.postalCode} ${selectedLocation.city}, ${selectedLocation.country}`
                      : t("Aggiungi prima una sede nelle Impostazioni.")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{t("Passo 4")}</p>
                <h2 className="mt-1.5 text-[24px]">{t("Revisiona e pubblica")}</h2>
                <p className="mt-1 text-[12px] text-muted">
                  {t("Controlla le specifiche. Puoi mettere in pausa o archiviare l'annuncio in qualsiasi momento.")}
                </p>
              </div>

              <div className="flex gap-4 rounded-xl border border-line p-3.5">
                <MaterialThumb
                  category={category ?? "paper_cardboard"}
                  reference={t("NUOVO")}
                  photos={photos}
                  className="h-20 w-28 shrink-0 rounded-lg"
                  compact
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-[1.5]">{title || t("Annuncio senza titolo")}</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {category ? t(CATEGORY_MAP[category].label) : t("Nessuna categoria")} ·{" "}
                    {conditionFlags.length > 0
                      ? conditionFlags.map((c) => t(CONDITIONS.find((o) => o.value === c)?.label ?? "")).join(" + ")
                      : t("Condizioni non selezionate")}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {description || t("Nessuna descrizione")}
                  </p>
                  <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                    {photos.length === 0
                      ? t("Nessuna foto allegata")
                      : `${photos.length} ${photos.length === 1 ? "foto allegata" : "foto allegate"}`}
                  </p>
                </div>
              </div>

              <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                {[
                  { label: t("Quantità"), value: quantity > 0 ? formatKg(quantity) : "—" },
                  { label: t("Ordine min"), value: Number(minOrderKg) > 0 ? formatKg(Number(minOrderKg)) : "—" },
                  { label: t("Prezzo"), value: price > 0 ? formatPerKg(price) : "—" },
                  { label: t("Valore materiale"), value: formatCurrency(quantity * price) },
                  { label: t("Disponibile"), value: t(`${formatDate(availableFrom, { withYear: false })} – ${formatDate(availableUntil)}`) },
                  { label: t("Ritiro"), value: selectedLocation?.city ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="bg-white px-3.5 py-2.5">
                    <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{item.label}</p>
                    <p className="mt-1 font-mono text-[12px]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-paper/70 p-3.5">
                <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">{t("Composizione")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {composition.map((part) => (
                    <span key={part.material} className="rounded border border-line bg-white px-2 py-0.5 text-[11.5px]">
                      {part.material || "—"} {part.percent}%
                    </span>
                  ))}
                </div>
                <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">{t("Movimentazione")}</p>
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
                  {t("Alla pubblicazione il motore valuta l'annuncio rispetto a ogni richiesta aperta sul mercato e mostra i candidati più solidi a entrambe le parti.")}
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
              <ArrowLeft className="size-3.5" /> {t("Indietro")}
            </Button>
            <div className="flex items-center gap-2">
              {step === 3 ? (
                <>
                  <Button variant="outline" onClick={() => publish("draft")} disabled={saving}>
                    {t("Salva bozza")}
                  </Button>
                  <Button onClick={() => publish("active")} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-3.5" />}
                    {t("Pubblica annuncio")}
                  </Button>
                </>
              ) : (
                <Button onClick={next}>
                  {t("Continua")} <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-app-sticky">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="eyebrow">{t("Anteprima annuncio")}</p>
            <MaterialThumb
              category={category ?? "paper_cardboard"}
              reference="PREVIEW"
              photos={photos}
              className="mt-3 h-32 w-full rounded-xl"
              compact
            />
            <p className="mt-3 line-clamp-2 text-[12.5px] font-medium">
              {title || t("Titolo del tuo materiale")}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              {category ? t(CATEGORY_MAP[category].label) : t("Categoria non selezionata")} ·{" "}
              {selectedLocation?.city ?? t("Sede")}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              {conditionFlags.length > 0
                ? conditionFlags
                    .map((c) => t(CONDITIONS.find((o) => o.value === c)?.label ?? ""))
                    .join(" + ")
                : t("Condizioni da selezionare")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12px]">
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t("Volume")}</p>
                <p className="mt-0.5 font-mono">{quantity > 0 ? formatKg(quantity) : "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{t("Prezzo")}</p>
                <p className="mt-0.5 font-mono">{price > 0 ? formatPerKg(price) : "—"}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
