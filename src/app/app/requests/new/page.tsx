"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  ClipboardList,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/material/category-icon";
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
  PROCESSING_OPTIONS,
} from "@/lib/constants";
import { addDaysInput, formatDate, todayInput } from "@/lib/format";
import { useCurrentOrg, useOrgLocations, usePrimaryLocation } from "@/lib/hooks";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MaterialCategory, ProcessingType } from "@/types";

const STEPS = ["Richiesta materiale", "Volume e budget", "Lavorazione e revisione"];

export default function NewRequestPage() {
  const router = useRouter();
  const org = useCurrentOrg();
  const locations = useOrgLocations();
  const primary = usePrimaryLocation();
  const createRequest = useAppStore((s) => s.createRequest);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MaterialCategory | null>(null);
  const [description, setDescription] = useState("");
  const [composition, setComposition] = useState<string[]>([]);
  const [compositionInput, setCompositionInput] = useState("");
  const [minPurity, setMinPurity] = useState(95);
  const [maxMoisture, setMaxMoisture] = useState(8);
  const [maxContamination, setMaxContamination] = useState(2);

  const [quantityKg, setQuantityKg] = useState("");
  const [frequency, setFrequency] = useState<"one_off" | "monthly" | "quarterly">("monthly");
  const [maxBudget, setMaxBudget] = useState("");
  const [neededBy, setNeededBy] = useState(addDaysInput(21));
  const [radiusKm, setRadiusKm] = useState(250);
  const [locationId, setLocationId] = useState(primary?.id ?? "");

  const [processing, setProcessing] = useState<ProcessingType[]>([]);

  // Select the delivery site once the persisted workspace hydrates.
  useEffect(() => {
    if (!locationId && primary) setLocationId(primary.id);
  }, [locationId, primary]);

  const quantity = Number(quantityKg) || 0;
  const budget = Number(maxBudget) || 0;
  const budgetPerKg = quantity > 0 ? budget / quantity : 0;
  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === locationId) ?? primary,
    [locations, locationId, primary],
  );

  function addComposition(value?: string) {
    const raw = (value ?? compositionInput).trim();
    if (!raw) return;
    setComposition((prev) => (prev.includes(raw) ? prev : [...prev, raw]));
    setCompositionInput("");
  }

  function validate(current: number): boolean {
    setError(null);
    if (current === 0) {
      if (title.trim().length < 6) return fail("Dai alla richiesta un titolo chiaro.");
      if (!category) return fail("Seleziona una delle tre categorie MVP.");
      if (description.trim().length < 25)
        return fail("Descrivi l'impiego e i requisiti del materiale.");
      if (composition.length === 0) return fail("Aggiungi almeno una composizione accettabile.");
      return true;
    }
    if (current === 1) {
      if (quantity <= 0) return fail("Inserisci la quantità richiesta in chilogrammi.");
      if (budget <= 0) return fail("Imposta un budget massimo consegnato.");
      if (new Date(neededBy) < new Date(todayInput()))
        return fail("La data richiesta deve essere nel futuro.");
      if (radiusKm < 25) return fail("Imposta un raggio di ritiro di almeno 25 km.");
      return true;
    }
    if (current === 2) {
      if (!locationId) return fail("Seleziona la sede di consegna.");
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

  function publish() {
    if (!validate(0) || !validate(1) || !validate(2)) {
      setError("Completa i passaggi precedenti prima di pubblicare.");
      return;
    }
    if (!category || !locationId) return;
    setSaving(true);
    try {
      const id = createRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        acceptableComposition: composition,
        qualityThresholds: {
          minPurityPct: minPurity,
          maxMoisturePct: maxMoisture,
          maxContaminationPct: maxContamination,
        },
        quantityKg: quantity,
        frequency,
        maxBudget: budget,
        requiredProcessing: processing,
        neededBy,
        radiusKm,
        locationId,
      });
      const count = useAppStore.getState().matches.filter((m) => m.requestId === id).length;
      toast.success("Richiesta pubblicata", {
        description: `${count} ${count === 1 ? "potenziale abbinamento trovato" : "potenziali abbinamenti trovati"} sul mercato.`,
      });
      router.push("/app/requests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile pubblicare la richiesta.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/requests"
          className="inline-flex items-center gap-1.5 text-[11.5px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> Le mie richieste
        </Link>
        <Badge variant="muted">Flusso acquirente · {org?.name}</Badge>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Cerco materiale</p>
          <h1 className="mt-2 text-[34px] leading-none sm:text-[38px]">Pubblica una richiesta di materiale</h1>
          <p className="mt-2 max-w-[560px] text-[12px] leading-relaxed text-muted">
            Definisci la specifica una sola volta. Il motore valuta ogni annuncio attivo, inclusi lavorazione e budget consegnato.
          </p>
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
          Passo {step + 1} / {STEPS.length}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
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
                    : "border-line/70 opacity-50",
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
                <h2 className="mt-1.5 text-[24px]">Di cosa hai bisogno?</h2>
              </div>

              <Field label="Titolo richiesta" required hint="Includi l'impiego finale: aiuta i fornitori a proporre la qualità giusta.">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. Fiocchi rPET food-grade per estrusione vaschette"
                />
              </Field>

              <div>
                <p className="field-label">
                  Categoria materiale <span className="text-clay">*</span>
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

              <Field label="Impiego e requisiti" required>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Sostituzione del PET vergine nelle vaschette termoformate. Richiesti conformità al contatto alimentare e tracciabilità…"
                />
              </Field>

              <div>
                <p className="field-label">Composizione accettabile</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  Aggiungi qualità o nomi di materiale. Le alternative aumentano gli abbinamenti qualificati.
                </p>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={compositionInput}
                    onChange={(e) => setCompositionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Invio" || e.key === ",") {
                        e.preventDefault();
                        addComposition();
                      }
                    }}
                    placeholder="es. fiocchi rPET, poi premi Invio"
                  />
                  <Button type="button" variant="outline" onClick={() => addComposition()}>
                    <Plus className="size-3.5" /> Aggiungi
                  </Button>
                </div>
                {composition.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {composition.map((item) => (
                      <span
                        key={item}
                        className="flex items-center gap-1 rounded-full border border-line bg-paper/60 py-1 pl-2.5 pr-1.5 text-[12px]"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setComposition((prev) => prev.filter((c) => c !== item))}
                          className="rounded-full p-0.5 text-muted hover:bg-sand hover:text-ink"
                          aria-label={`Rimuovi ${item}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11.5px] text-amber">È richiesta almeno una composizione accettabile.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Purezza minima", value: minPurity, set: setMinPurity, min: 50, max: 100, unit: "%" },
                  { label: "Umidità massima", value: maxMoisture, set: setMaxMoisture, min: 0, max: 25, unit: "%" },
                  { label: "Contaminazione massima", value: maxContamination, set: setMaxContamination, min: 0, max: 15, unit: "%" },
                ].map((threshold) => (
                  <div key={threshold.label}>
                    <div className="flex items-center justify-between">
                      <p className="field-label">{threshold.label}</p>
                      <span className="font-mono text-[11.5px]">
                        {threshold.value}
                        {threshold.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={threshold.min}
                      max={threshold.max}
                      value={threshold.value}
                      onChange={(e) => threshold.set(Number(e.target.value))}
                      className="mt-3 w-full accent-[#0066cc]"
                      aria-label={threshold.label}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Passo 2</p>
                <h2 className="mt-1.5 text-[24px]">Volume, budget e portata</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Quantità richiesta (kg)" required>
                  <Input
                    type="number"
                    min={1}
                    max={1000000}
                    aria-label="Quantità richiesta in kg"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    placeholder="6000"
                    className="font-mono"
                  />
                </Field>
                <Field label="Frequenza" required>
                  <Select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                  >
                    <option value="one_off">Acquisto una tantum</option>
                    <option value="monthly">Ricorrenza mensile</option>
                    <option value="quarterly">Ricorrenza trimestrale</option>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Budget massimo consegnato (€)"
                  required
                  hint={
                    quantity > 0 && budget > 0
                      ? `Massimale di ${formatPerKg(budgetPerKg)} tutto incluso consegnato.`
                      : "Tutto incluso: materiale, commissione, lavorazione, trasporto e IVA."
                  }
                >
                  <Input
                    type="number"
                    min={1}
                    max={100000000}
                    aria-label="Budget massimo consegnato in euro"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="7800"
                    className="font-mono"
                  />
                </Field>
                <Field label="Entro il" required>
                  <Input
                    type="date"
                    min={todayInput()}
                    value={neededBy}
                    onChange={(e) => setNeededBy(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Sede di consegna / consumo" required>
                <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.city}
                    </option>
                  ))}
                </Select>
              </Field>

              <div>
                <div className="flex items-center justify-between">
                  <p className="field-label">Raggio di ritiro</p>
                  <span className="font-mono text-[11.5px]">{radiusKm} km</span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted">
                  Distanza massima da {selectedLocation?.city ?? "la tua sede"} al fornitore.
                </p>
                <input
                  type="range"
                  min={25}
                  max={500}
                  step={25}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="mt-3 w-full accent-[#0066cc]"
                  aria-label="Raggio di ritiro"
                />
                <div className="mt-1 flex justify-between font-mono text-[12px] text-muted">
                  <span>25 km</span>
                  <span>500 km</span>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-paper/60 p-3.5">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-muted">Massimale di budget</span>
                  <span className="font-mono">{budget > 0 ? formatCurrency(budget, { cents: true }) : "—"}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
                  <span className="text-muted">Al kg, consegnato</span>
                  <span className="font-mono">{budgetPerKg > 0 ? formatPerKg(budgetPerKg) : "—"}</span>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                  Il motore scarta gli abbinamenti la cui stima consegnata supera questo massimale. I volumi parziali sono proporzionalmente ridotti.
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Passo 3</p>
                <h2 className="mt-1.5 text-[24px]">Lavorazione e revisione</h2>
                <p className="mt-1 text-[12px] text-muted">
                  Seleziona le fasi che il materiale deve attraversare prima di soddisfare le tue specifiche. I
                  costi sono inclusi nel preventivo consegnato.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {PROCESSING_OPTIONS.map((option) => {
                  const checked = processing.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors",
                        checked ? "border-forest/40 bg-mist/30" : "border-line hover:border-sage",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          setProcessing((prev) =>
                            prev.includes(option.value)
                              ? prev.filter((p) => p !== option.value)
                              : [...prev, option.value],
                          )
                        }
                        className="mt-0.5"
                        aria-label={option.label}
                      />
                      <span>
                        <span className="block text-[11.5px] font-medium">{option.label}</span>
                        <span className="mt-0.5 block font-mono text-[12px] text-muted">
                          ~{formatPerKg(option.perKg, 3)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="rounded-xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <CategoryIcon category={category ?? "plastic"} size="md" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-[1.5]">{title || "Richiesta senza titolo"}</p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {category ? CATEGORY_MAP[category].label : "Nessuna categoria"} ·{" "}
                      {selectedLocation?.city ?? "Sede"} · {frequency === "monthly" ? "Mensile" : frequency === "quarterly" ? "Trimestrale" : "Una tantum"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12px] sm:grid-cols-4">
                  <div>
                    <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Volume</p>
                    <p className="mt-0.5 font-mono">{quantity > 0 ? formatKg(quantity) : "—"}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Budget</p>
                    <p className="mt-0.5 font-mono">{budget > 0 ? formatCurrency(budget) : "—"}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Entro il</p>
                    <p className="mt-0.5 font-mono">{formatDate(neededBy, { withYear: false })}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Raggio</p>
                    <p className="mt-0.5 font-mono">{radiusKm} km</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {composition.map((c) => (
                    <span key={c} className="rounded border border-line bg-paper/60 px-1.5 py-0.5 text-[11.5px] text-muted">
                      {c}
                    </span>
                  ))}
                  {processing.map((p) => (
                    <span key={p} className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[11.5px] text-moss">
                      {PROCESSING_OPTIONS.find((o) => o.value === p)?.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-lime/50 bg-lime/10 p-3.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-moss" />
                <p className="text-[12px] leading-relaxed text-ink/80">
                  Soglie qualitative: purezza ≥ {minPurity}%, umidità ≤ {maxMoisture}%, contaminazione ≤{" "}
                  {maxContamination}%. Gli abbinamenti fuori tolleranza vengono segnalati per verifica tecnica e non accettati
                  automaticamente.
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

          <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="-ml-2"
            >
              <ArrowLeft className="size-3.5" /> Indietro
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>
                Continua <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button onClick={publish} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-3.5" />}
                Pubblica richiesta
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[92px]">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="eyebrow">Anteprima domanda</p>
            <div className="mt-3 flex items-center gap-2.5">
              <CategoryIcon category={category ?? "plastic"} size="md" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-[12px] font-medium leading-[1.5]">
                  {title || "La tua richiesta"}
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {category ? CATEGORY_MAP[category].label : "Categoria"}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12px]">
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Volume</p>
                <p className="mt-0.5 font-mono">{quantity > 0 ? formatKg(quantity) : "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">Budget/kg</p>
                <p className="mt-0.5 font-mono">{budgetPerKg > 0 ? formatPerKg(budgetPerKg) : "—"}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-paper/70 px-2.5 py-2 text-[11.5px] text-muted">
              <MapPin className="size-3" /> {selectedLocation?.city ?? "Sede"} · {radiusKm} km di raggio
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white/60 p-4">
            <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
              <ClipboardList className="size-3" /> Checklist richiesta
            </p>
            <ul className="mt-2.5 space-y-2 text-[12px] text-muted">
              {[
                "Una delle tre categorie MVP",
                "Composizione accettabile specificata",
                "Soglie qualitative dichiarate",
                "Massimale budget consegnato impostato",
                "Fasi di lavorazione selezionate",
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
