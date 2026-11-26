"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Info, Loader2, MapPin, Plus, Sparkles, Target, X } from "lucide-react";
import { toast } from "sonner";
import { CategoryPicker } from "@/components/forms/category-picker";
import { ConditionPicker } from "@/components/forms/condition-picker";
import { DraftStatus } from "@/components/forms/draft-status";
import { REQUEST_DRAFT_KEY } from "@/components/forms/draft-keys";
import {
  CATEGORY_COPY,
  CONDITION_COPY,
  FREQUENCY_COPY,
  PROCESSING_COPY,
} from "@/components/forms/form-copy";
import { InlineError } from "@/components/forms/inline-error";
import { formatLocalDate } from "@/components/forms/local-format";
import { FormStepper } from "@/components/forms/stepper";
import { useFormDraft } from "@/components/forms/use-form-draft";
import { useLocalCopy } from "@/components/forms/use-local-copy";
import { CATEGORIES, PROCESSING_OPTIONS, deriveQualityThresholds } from "@/lib/constants";
import { addDaysInput, todayInput } from "@/lib/format";
import { useCurrentOrg, useOrgLocations, usePrimaryLocation } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import type { MaterialCategory, MaterialCondition, ProcessingType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const COPY = {
  it: {
    back: "Le mie richieste",
    flow: "Flusso acquirente",
    eyebrow: "Cerco materiale",
    title: "Pubblica una richiesta di materiale",
    intro:
      "Definisci la specifica una sola volta. Il motore valuta gli annunci attivi usando budget consegnato, condizioni accettate e lavorazione richiesta.",
    requiredNote: "* Campi obbligatori",
    stepCounter: (current: number, total: number) => `Passo ${current} di ${total}`,
    steps: [
      "Categoria",
      "Quantità e budget",
      "Condizione",
      "Consegna e riepilogo",
    ],
    categoryTitle: "Di cosa hai bisogno?",
    categoryHint: "Parti dalla categoria, poi aggiungi un titolo e un impiego chiaro.",
    quantityTitle: "Quanto ti serve e con che budget?",
    quantityHint: "Il budget è il massimale consegnato, tutto incluso. Nessun prezzo viene inventato dal sistema.",
    conditionTitle: "Quali condizioni accetti?",
    conditionHint: "Indica composizioni e condizioni accettabili, poi eventuali fasi di lavorazione.",
    deliveryTitle: "Dove e quando consegnare?",
    deliveryHint: "Scegli la data di consegna e la sede. Controlla il riepilogo prima di pubblicare.",
    titleLabel: "Titolo della richiesta",
    titleHint: "Includi l'impiego finale: aiuta i fornitori a proporre la qualità giusta.",
    titlePlaceholder: "es. Fiocchi rPET per estrusione vaschette",
    titleError: "Dai alla richiesta un titolo chiaro (almeno 6 caratteri).",
    categoryLabel: "Categoria materiale",
    categoryError: "Seleziona una categoria.",
    descriptionLabel: "Impiego e requisiti",
    descriptionHint: "Descrivi come userai il materiale e quali requisiti sono indispensabili.",
    descriptionPlaceholder:
      "Sostituzione del PET vergine nelle vaschette termoformate. Richiesti conformità al contatto alimentare e tracciabilità…",
    descriptionError: "Descrivi l'impiego e i requisiti del materiale.",
    quantityLabel: "Quantità richiesta (kg)",
    quantityPlaceholder: "6000",
    quantityError: "Inserisci la quantità richiesta in chilogrammi.",
    frequencyLabel: "Frequenza",
    budgetLabel: "Budget massimo consegnato (€)",
    budgetHint: "Tutto incluso: materiale, commissione, lavorazione, trasporto e IVA.",
    budgetPerKgHint: (value: string) => `Massimale di ${value} tutto incluso consegnato.`,
    budgetPlaceholder: "0",
    budgetError: "Imposta un budget massimo consegnato.",
    neededByLabel: "Data di consegna richiesta",
    dateError: "La data di consegna deve essere nel futuro.",
    compositionLabel: "Composizione accettabile",
    compositionHint: "Aggiungi qualità o nomi di materiale. Le alternative aumentano gli abbinamenti qualificati.",
    compositionPlaceholder: "es. fiocchi rPET, poi premi Invio",
    addComposition: "Aggiungi",
    removeComposition: (value: string) => `Rimuovi ${value}`,
    compositionError: "Aggiungi almeno una composizione accettabile.",
    conditionsLabel: "Condizioni accettabili",
    conditionsHint: "Seleziona tutte le condizioni che puoi accettare.",
    conditionsError: "Seleziona almeno una condizione accettabile.",
    processingLabel: "Lavorazione richiesta (facoltativa)",
    processingHint:
      "Seleziona le fasi necessarie. I valori indicati sono stime del listino esistente; il preventivo consegnato è quello definitivo.",
    locationLabel: "Sede di consegna / consumo",
    locationPlaceholder: "Seleziona una sede",
    locationMissing: "Aggiungi una sede nelle impostazioni prima di pubblicare.",
    locationError: "Seleziona la sede di consegna.",
    radiusLabel: "Raggio di ritiro",
    radiusHint: (city: string) => `Distanza massima da ${city} al fornitore.`,
    radiusError: "Imposta un raggio di almeno 25 km.",
    previewLabel: "Anteprima richiesta",
    previewTitle: "La tua richiesta",
    previewCategory: "Categoria",
    previewSite: "Sede",
    summaryVolume: "Volume",
    summaryBudget: "Budget",
    summaryBudgetKg: "Budget / kg",
    summaryDelivery: "Consegna",
    summaryRadius: "Raggio",
    summaryFrequency: "Frequenza",
    summaryComposition: "Composizione accettabile",
    summaryConditions: "Condizioni accettabili",
    summaryProcessing: "Lavorazione",
    noValue: "—",
    publishNote:
      "Alla pubblicazione il motore confronta la richiesta con gli annunci attivi e mostra i candidati più solidi a entrambe le parti.",
    continue: "Continua",
    backButton: "Indietro",
    publish: "Pubblica richiesta",
    saving: "Pubblicazione…",
    fixFields: "Controlla i campi evidenziati prima di continuare.",
    createFailed: "Impossibile pubblicare la richiesta. Riprova.",
    noOrg: "Seleziona prima un'organizzazione attiva.",
    published: "Richiesta pubblicata",
    publishedDesc: (count: number) =>
      `${count} ${count === 1 ? "potenziale abbinamento trovato" : "potenziali abbinamenti trovati"} sul mercato.`,
  },
  en: {
    back: "My requests",
    flow: "Buyer flow",
    eyebrow: "I need material",
    title: "Post a material request",
    intro:
      "Define the specification once. The engine checks active listings using your delivered budget cap, accepted conditions and required processing.",
    requiredNote: "* Required fields",
    stepCounter: (current: number, total: number) => `Step ${current} of ${total}`,
    steps: [
      "Category",
      "Quantity and budget",
      "Condition",
      "Delivery and review",
    ],
    categoryTitle: "What do you need?",
    categoryHint: "Start with the category, then add a clear title and intended use.",
    quantityTitle: "How much do you need, and at what budget?",
    quantityHint:
      "Budget is the all-inclusive delivered cap. The system does not invent any price.",
    conditionTitle: "Which conditions can you accept?",
    conditionHint: "Add acceptable compositions and conditions, then any processing steps.",
    deliveryTitle: "Where and when should it be delivered?",
    deliveryHint: "Choose the delivery date and site. Review the summary before publishing.",
    titleLabel: "Request title",
    titleHint: "Include the final use: it helps suppliers propose the right quality.",
    titlePlaceholder: "e.g. rPET flakes for tray extrusion",
    titleError: "Give the request a clear title (at least 6 characters).",
    categoryLabel: "Material category",
    categoryError: "Select a category.",
    descriptionLabel: "Use and requirements",
    descriptionHint: "Describe how you will use the material and which requirements are essential.",
    descriptionPlaceholder:
      "Replacing virgin PET in thermoformed trays. Food-contact compliance and traceability required…",
    descriptionError: "Describe the use and material requirements.",
    quantityLabel: "Required quantity (kg)",
    quantityPlaceholder: "6000",
    quantityError: "Enter the required quantity in kilograms.",
    frequencyLabel: "Frequency",
    budgetLabel: "Maximum delivered budget (€)",
    budgetHint: "All inclusive: material, commission, processing, transport and VAT.",
    budgetPerKgHint: (value: string) => `Cap of ${value} all inclusive, delivered.`,
    budgetPlaceholder: "0",
    budgetError: "Set a maximum delivered budget.",
    neededByLabel: "Required delivery date",
    dateError: "The delivery date must be in the future.",
    compositionLabel: "Acceptable composition",
    compositionHint: "Add grades or material names. Alternatives increase qualified matches.",
    compositionPlaceholder: "e.g. rPET flakes, then press Enter",
    addComposition: "Add",
    removeComposition: (value: string) => `Remove ${value}`,
    compositionError: "Add at least one acceptable composition.",
    conditionsLabel: "Acceptable conditions",
    conditionsHint: "Select every condition you can accept.",
    conditionsError: "Select at least one acceptable condition.",
    processingLabel: "Required processing (optional)",
    processingHint:
      "Select the steps you need. Figures shown are estimates from the existing rate card; the delivered quote is final.",
    locationLabel: "Delivery / consumption site",
    locationPlaceholder: "Select a site",
    locationMissing: "Add a site in settings before publishing.",
    locationError: "Select the delivery site.",
    radiusLabel: "Collection radius",
    radiusHint: (city: string) => `Maximum distance from ${city} to the supplier.`,
    radiusError: "Set a radius of at least 25 km.",
    previewLabel: "Request preview",
    previewTitle: "Your request",
    previewCategory: "Category",
    previewSite: "Site",
    summaryVolume: "Volume",
    summaryBudget: "Budget",
    summaryBudgetKg: "Budget / kg",
    summaryDelivery: "Delivery",
    summaryRadius: "Radius",
    summaryFrequency: "Frequency",
    summaryComposition: "Acceptable composition",
    summaryConditions: "Acceptable conditions",
    summaryProcessing: "Processing",
    noValue: "—",
    publishNote:
      "On publish, the engine compares the request with active listings and shows the strongest candidates to both parties.",
    continue: "Continue",
    backButton: "Back",
    publish: "Publish request",
    saving: "Publishing…",
    fixFields: "Check the highlighted fields before continuing.",
    createFailed: "Could not publish the request. Please try again.",
    noOrg: "Select an active organisation first.",
    published: "Request published",
    publishedDesc: (count: number) =>
      `${count} ${count === 1 ? "potential match found" : "potential matches found"} on the market.`,
  },
} as const;

type Frequency = "one_off" | "weekly" | "monthly" | "quarterly";

type RequestForm = {
  title: string;
  category: MaterialCategory | "";
  description: string;
  quantityKg: string;
  frequency: Frequency;
  maxBudget: string;
  composition: string[];
  compositionInput: string;
  acceptedConditions: MaterialCondition[];
  processing: ProcessingType[];
  neededBy: string;
  locationId: string;
  radiusKm: number;
};

type Errors = Partial<Record<keyof RequestForm | "form", string>>;

export default function NewRequestPage() {
  const s = useLocalCopy(COPY);
  const { lang } = useI18n();
  const categoryCopy = useLocalCopy(CATEGORY_COPY);
  const conditionCopy = useLocalCopy(CONDITION_COPY);
  const router = useRouter();
  const org = useCurrentOrg();
  const locations = useOrgLocations();
  const primary = usePrimaryLocation();
  const createRequest = useAppStore((state) => state.createRequest);

  const initial = useMemo<RequestForm>(
    () => ({
      title: "",
      category: "",
      description: "",
      quantityKg: "",
      frequency: "monthly",
      maxBudget: "",
      composition: [],
      compositionInput: "",
      acceptedConditions: [],
      processing: [],
      neededBy: addDaysInput(21),
      locationId: "",
      radiusKm: 250,
    }),
    [],
  );

  const { value: form, setValue: setForm, restored, savedAt, reset, clear } = useFormDraft(
    REQUEST_DRAFT_KEY,
    initial,
  );
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (locations.length === 0) return;
    const valid = locations.some((location) => location.id === form.locationId);
    if (!valid) {
      const fallback = primary?.id ?? locations[0].id;
      setForm((prev) => (prev.locationId === fallback ? prev : { ...prev, locationId: fallback }));
    }
  }, [form.locationId, locations, primary, setForm]);

  const quantity = Number(form.quantityKg) || 0;
  const budget = Number(form.maxBudget) || 0;
  const budgetPerKg = quantity > 0 ? budget / quantity : 0;
  const categoryValue =
    form.category && CATEGORIES.some((option) => option.value === form.category)
      ? form.category
      : null;
  const acceptedConditions = form.acceptedConditions.filter(
    (item): item is MaterialCondition => item in conditionCopy,
  );
  const processing = form.processing.filter(
    (item): item is ProcessingType => item in PROCESSING_COPY,
  );
  const frequencyValue: Frequency = form.frequency in FREQUENCY_COPY ? form.frequency : "monthly";
  const qualityThresholds = deriveQualityThresholds(acceptedConditions);
  const selectedLocation = locations.find((location) => location.id === form.locationId);

  function patch<K extends keyof RequestForm>(key: K, value: RequestForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key] && !prev.form) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });
    setFormError(null);
  }

  function a11y(key: keyof RequestForm, id: string) {
    return {
      id,
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `${id}-error` : undefined,
    };
  }

  function addComposition(value?: string) {
    const raw = (value ?? form.compositionInput).trim();
    if (!raw) return;
    patch(
      "composition",
      form.composition.includes(raw) ? form.composition : [...form.composition, raw],
    );
    patch("compositionInput", "");
  }

  function collectErrors(index: number): Errors {
    const next: Errors = {};
    if (index === 0) {
      if (form.title.trim().length < 6) next.title = s.titleError;
      if (!categoryValue) next.category = s.categoryError;
      if (form.description.trim().length === 0) next.description = s.descriptionError;
    }
    if (index === 1) {
      if (quantity <= 0) next.quantityKg = s.quantityError;
      if (budget <= 0) next.maxBudget = s.budgetError;
    }
    if (index === 2) {
      if (form.composition.length === 0) next.composition = s.compositionError;
      if (acceptedConditions.length === 0) next.acceptedConditions = s.conditionsError;
    }
    if (index === 3) {
      if (!form.locationId) next.locationId = s.locationError;
      if (!form.neededBy || new Date(form.neededBy) < new Date(todayInput())) {
        next.neededBy = s.dateError;
      }
      if (form.radiusKm < 25) next.radiusKm = s.radiusError;
    }
    return next;
  }

  function goToStep(index: number) {
    setErrors({});
    setFormError(null);
    setStep(index);
  }

  function nextStep() {
    const found = collectErrors(step);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFormError(s.fixFields);
      return;
    }
    goToStep(Math.min(s.steps.length - 1, step + 1));
  }

  function publish() {
    if (saving) return;
    for (let index = 0; index < s.steps.length; index += 1) {
      const found = collectErrors(index);
      if (Object.keys(found).length > 0) {
        setStep(index);
        setErrors(found);
        setFormError(s.fixFields);
        return;
      }
    }
    if (!categoryValue || !form.locationId) return;
    setSaving(true);
    setFormError(null);
    try {
      const id = createRequest({
        title: form.title.trim(),
        description: form.description.trim(),
        category: categoryValue,
        acceptableComposition: form.composition,
        acceptedConditions,
        qualityThresholds,
        quantityKg: quantity,
        frequency: frequencyValue,
        maxBudget: budget,
        requiredProcessing: processing,
        neededBy: form.neededBy,
        radiusKm: form.radiusKm,
        locationId: form.locationId,
      });
      const count = useAppStore.getState().matches.filter((match) => match.requestId === id).length;
      toast.success(s.published, { description: s.publishedDesc(count) });
      clear();
      router.push("/app/requests");
    } catch (err) {
      const noOrg = err instanceof Error && /organization/i.test(err.message);
      setFormError(noOrg ? s.noOrg : s.createFailed);
      setSaving(false);
    }
  }

  function toggleProcessing(value: ProcessingType) {
    patch(
      "processing",
      processing.includes(value)
        ? processing.filter((item) => item !== value)
        : [...processing, value],
    );
  }

  const frequencyLabel = FREQUENCY_COPY[frequencyValue][lang];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/requests"
          className="inline-flex min-h-10 items-center gap-1.5 text-[12px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> {s.back}
        </Link>
        <Badge variant="muted">
          {s.flow} · {org?.name}
        </Badge>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="eyebrow">{s.eyebrow}</p>
          <h1 className="mt-2 text-balance text-[32px] leading-[1.08] sm:text-[38px]">{s.title}</h1>
          <p className="mt-2 max-w-[640px] text-[12.5px] leading-relaxed text-muted">{s.intro}</p>
          <p className="mt-1 text-[11.5px] text-muted">{s.requiredNote}</p>
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
          {s.stepCounter(step + 1, s.steps.length)}
        </p>
      </div>

      <FormStepper steps={[...s.steps]} active={step} onSelect={goToStep} ariaLabel={s.title} />

      <DraftStatus savedAt={savedAt} restored={restored} onReset={reset} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0 rounded-2xl border border-line bg-white p-5 sm:p-7">
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(1, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.categoryTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.categoryHint}</p>
              </div>
              <CategoryPicker
                id="request-category"
                value={categoryValue ?? ""}
                onChange={(value) => patch("category", value)}
                label={s.categoryLabel}
                hint={s.categoryHint}
                error={errors.category}
              />
              <Field
                label={s.titleLabel}
                required
                htmlFor="request-title"
                hint={errors.title ? undefined : s.titleHint}
              >
                <Input
                  {...a11y("title", "request-title")}
                  value={form.title}
                  onChange={(event) => patch("title", event.target.value)}
                  placeholder={s.titlePlaceholder}
                />
                <InlineError id="request-title-error">{errors.title}</InlineError>
              </Field>
              <Field
                label={s.descriptionLabel}
                required
                htmlFor="request-description"
                hint={errors.description ? undefined : s.descriptionHint}
              >
                <Textarea
                  {...a11y("description", "request-description")}
                  value={form.description}
                  onChange={(event) => patch("description", event.target.value)}
                  rows={4}
                  placeholder={s.descriptionPlaceholder}
                />
                <InlineError id="request-description-error">{errors.description}</InlineError>
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(2, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.quantityTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.quantityHint}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={s.quantityLabel} required htmlFor="request-quantity">
                  <Input
                    {...a11y("quantityKg", "request-quantity")}
                    type="number"
                    min={1}
                    max={1000000}
                    value={form.quantityKg}
                    onChange={(event) => patch("quantityKg", event.target.value)}
                    placeholder={s.quantityPlaceholder}
                    className="font-mono"
                  />
                  <InlineError id="request-quantity-error">{errors.quantityKg}</InlineError>
                </Field>
                <Field label={s.frequencyLabel} required htmlFor="request-frequency">
                  <Select
                    {...a11y("frequency", "request-frequency")}
                    value={frequencyValue}
                    onChange={(event) => patch("frequency", event.target.value as Frequency)}
                  >
                    {(Object.keys(FREQUENCY_COPY) as Frequency[]).map((value) => (
                      <option key={value} value={value}>
                        {FREQUENCY_COPY[value][lang]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field
                label={s.budgetLabel}
                required
                htmlFor="request-budget"
                hint={
                  errors.maxBudget
                    ? undefined
                    : quantity > 0 && budget > 0
                      ? s.budgetPerKgHint(formatPerKg(budgetPerKg))
                      : s.budgetHint
                }
              >
                <Input
                  {...a11y("maxBudget", "request-budget")}
                  type="number"
                  min={1}
                  max={100000000}
                  value={form.maxBudget}
                  onChange={(event) => patch("maxBudget", event.target.value)}
                  placeholder={s.budgetPlaceholder}
                  className="font-mono"
                />
                <InlineError id="request-budget-error">{errors.maxBudget}</InlineError>
              </Field>
              <div className="rounded-xl border border-line bg-paper/60 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                  <span className="text-muted">{s.summaryBudget}</span>
                  <span className="font-mono">
                    {budget > 0 ? formatCurrency(budget, { cents: true }) : s.noValue}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                  <span className="text-muted">{s.summaryBudgetKg}</span>
                  <span className="font-mono">
                    {budgetPerKg > 0 ? formatPerKg(budgetPerKg) : s.noValue}
                  </span>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{s.budgetHint}</p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(3, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.conditionTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.conditionHint}</p>
              </div>

              <div>
                <p className="field-label">
                  {s.compositionLabel} <span className="text-clay">*</span>
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{s.compositionHint}</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={form.compositionInput}
                    onChange={(event) => patch("compositionInput", event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addComposition();
                      }
                    }}
                    placeholder={s.compositionPlaceholder}
                    aria-label={s.compositionLabel}
                  />
                  <Button type="button" variant="outline" onClick={() => addComposition()}>
                    <Plus className="size-3.5" /> {s.addComposition}
                  </Button>
                </div>
                <div
                  role="group"
                  aria-label={s.compositionLabel}
                  aria-describedby={errors.composition ? "request-composition-error" : undefined}
                  className="mt-2.5 flex flex-wrap gap-1.5"
                >
                  {form.composition.map((item) => (
                    <span
                      key={item}
                      className="flex items-center gap-1 rounded-full border border-line bg-paper/60 py-1 pl-2.5 pr-1.5 text-[12px]"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          patch(
                            "composition",
                            form.composition.filter((candidate) => candidate !== item),
                          )
                        }
                        className="flex size-7 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink"
                        aria-label={s.removeComposition(item)}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <InlineError id="request-composition-error">{errors.composition}</InlineError>
              </div>

              <ConditionPicker
                id="request-condition"
                values={acceptedConditions}
                onChange={(values) => patch("acceptedConditions", values)}
                label={s.conditionsLabel}
                hint={s.conditionsHint}
                error={errors.acceptedConditions}
              />

              <div>
                <p className="field-label">{s.processingLabel}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{s.processingHint}</p>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  {PROCESSING_OPTIONS.map((option) => {
                    const checked = processing.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors motion-reduce:transition-none ${
                          checked ? "border-forest/40 bg-mist/40" : "border-line bg-white hover:border-sage"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleProcessing(option.value)}
                          className="mt-0.5"
                          aria-label={PROCESSING_COPY[option.value][lang]}
                        />
                        <span className="min-w-0">
                          <span className="block text-[12px] font-medium">
                            {PROCESSING_COPY[option.value][lang]}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11.5px] text-muted">
                            ~{formatPerKg(option.perKg, 3)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(4, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.deliveryTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.deliveryHint}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={s.locationLabel} required htmlFor="request-location">
                  <Select
                    {...a11y("locationId", "request-location")}
                    value={form.locationId}
                    onChange={(event) => patch("locationId", event.target.value)}
                  >
                    <option value="" disabled>
                      {s.locationPlaceholder}
                    </option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} — {location.city}
                      </option>
                    ))}
                  </Select>
                  <InlineError id="request-location-error">{errors.locationId}</InlineError>
                  {locations.length === 0 ? (
                    <p className="text-[11.5px] text-amber">{s.locationMissing}</p>
                  ) : null}
                </Field>
                <Field label={s.neededByLabel} required htmlFor="request-needed-by">
                  <Input
                    {...a11y("neededBy", "request-needed-by")}
                    type="date"
                    min={todayInput()}
                    value={form.neededBy}
                    onChange={(event) => patch("neededBy", event.target.value)}
                  />
                  <InlineError id="request-needed-by-error">{errors.neededBy}</InlineError>
                </Field>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="field-label">{s.radiusLabel}</p>
                  <span className="font-mono text-[12px]">{form.radiusKm} km</span>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  {s.radiusHint(selectedLocation?.city ?? s.previewSite)}
                </p>
                <input
                  type="range"
                  min={25}
                  max={500}
                  step={25}
                  value={form.radiusKm}
                  onChange={(event) => patch("radiusKm", Number(event.target.value))}
                  className="mt-3 h-10 w-full accent-[#14532d]"
                  aria-label={s.radiusLabel}
                  aria-describedby={errors.radiusKm ? "request-radius-error" : undefined}
                />
                <div className="flex justify-between font-mono text-[11.5px] text-muted">
                  <span>25 km</span>
                  <span>500 km</span>
                </div>
                <InlineError id="request-radius-error">{errors.radiusKm}</InlineError>
              </div>

              <div className="rounded-xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-[1.5]">
                      {form.title || s.previewTitle}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {categoryValue ? categoryCopy[categoryValue].label : s.previewCategory} ·{" "}
                      {selectedLocation?.city ?? s.previewSite} · {frequencyLabel}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12px] sm:grid-cols-4">
                  {[
                    {
                      label: s.summaryVolume,
                      value: quantity > 0 ? formatKg(quantity) : s.noValue,
                    },
                    {
                      label: s.summaryBudget,
                      value: budget > 0 ? formatCurrency(budget) : s.noValue,
                    },
                    {
                      label: s.summaryDelivery,
                      value: form.neededBy ? formatLocalDate(form.neededBy, lang) : s.noValue,
                    },
                    { label: s.summaryRadius, value: `${form.radiusKm} km` },
                  ].map((item) => (
                    <div key={item.label} className="min-w-0">
                      <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate font-mono">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {form.composition.map((item) => (
                    <span
                      key={item}
                      className="rounded border border-line bg-paper/60 px-1.5 py-0.5 text-[11.5px] text-muted"
                    >
                      {item}
                    </span>
                  ))}
                  {acceptedConditions.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-line bg-mist/40 px-1.5 py-0.5 text-[11.5px] text-moss"
                    >
                      {conditionCopy[item].label}
                    </span>
                  ))}
                  {processing.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[11.5px] text-moss"
                    >
                      {PROCESSING_COPY[item][lang]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-lime/50 bg-lime/10 p-3.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-moss" />
                <p className="text-[12px] leading-relaxed text-ink/80">{s.publishNote}</p>
              </div>
            </div>
          ) : null}

          {formError ? (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2.5 text-[11.5px] leading-relaxed text-danger"
            >
              <Info className="mt-px size-3.5 shrink-0" />
              {formError}
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
            <Button
              variant="ghost"
              onClick={() => goToStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="-ml-2"
            >
              <ArrowLeft className="size-4" /> {s.backButton}
            </Button>
            {step < s.steps.length - 1 ? (
              <Button onClick={nextStep}>
                {s.continue} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={publish} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
                {saving ? s.saving : s.publish}
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-app-sticky">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="eyebrow">{s.previewLabel}</p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="min-w-0">
                <p className="line-clamp-2 text-[12px] font-medium leading-[1.5]">
                  {form.title || s.previewTitle}
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {categoryValue ? categoryCopy[categoryValue].label : s.previewCategory}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12px]">
              <div className="min-w-0">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                  {s.summaryVolume}
                </p>
                <p className="mt-0.5 truncate font-mono">
                  {quantity > 0 ? formatKg(quantity) : s.noValue}
                </p>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                  {s.summaryBudgetKg}
                </p>
                <p className="mt-0.5 truncate font-mono">
                  {budgetPerKg > 0 ? formatPerKg(budgetPerKg) : s.noValue}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-paper/70 px-2.5 py-2 text-[11.5px] text-muted">
              <MapPin className="size-3" /> {selectedLocation?.city ?? s.previewSite} ·{" "}
              {form.radiusKm} km
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white/60 p-4">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted">
              {s.summaryFrequency}
            </p>
            <p className="mt-1.5 text-[12px] text-ink">{frequencyLabel}</p>
            <p className="mt-3 font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted">
              {s.summaryConditions}
            </p>
            <p className="mt-1.5 text-[12px] text-ink">
              {acceptedConditions.length > 0
                ? form.acceptedConditions.map((item) => conditionCopy[item].label).join(" + ")
                : s.noValue}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
