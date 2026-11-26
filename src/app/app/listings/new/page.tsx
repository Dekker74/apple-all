"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Info, Loader2, MapPin, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "@/components/forms/category-picker";
import { ConditionPicker } from "@/components/forms/condition-picker";
import { DraftStatus } from "@/components/forms/draft-status";
import { LISTING_DRAFT_KEY } from "@/components/forms/draft-keys";
import { CATEGORY_COPY, CONDITION_COPY, HANDLING_COPY } from "@/components/forms/form-copy";
import { InlineError } from "@/components/forms/inline-error";
import { formatLocalDate } from "@/components/forms/local-format";
import { MaterialPreview } from "@/components/forms/material-preview";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { FormStepper } from "@/components/forms/stepper";
import { useFormDraft } from "@/components/forms/use-form-draft";
import { useLocalCopy } from "@/components/forms/use-local-copy";
import { CATEGORIES, HANDLING_OPTIONS, deriveCondition, derivePurityPct } from "@/lib/constants";
import { addDaysInput, todayInput } from "@/lib/format";
import { useCurrentOrg, useOrgLocations, usePrimaryLocation } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatKg, formatPerKg } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import type { MaterialCategory, MaterialCondition } from "@/types";

const COPY = {
  it: {
    back: "I miei annunci",
    flow: "Flusso fornitore",
    eyebrow: "Ho materiale",
    title: "Pubblica materiale in eccedenza",
    editTitle: "Modifica annuncio",
    intro:
      "Sei passaggi brevi. Indichi tu il prezzo del materiale al kg: lavorazione, trasporto e IVA sono gestiti da Offcut nel preventivo consegnato.",
    editIntro: "Aggiorna i dettagli dell'annuncio: le modifiche saranno applicate all'annuncio esistente.",
    requiredNote: "* Campi obbligatori",
    stepCounter: (current: number, total: number) => `Passo ${current} di ${total}`,
    steps: [
      "Categoria",
      "Informazioni materiale",
      "Quantità e prezzo",
      "Specifiche",
      "Foto",
      "Riepilogo",
    ],
    categoryTitle: "Che materiale vuoi vendere?",
    categoryHint: "Scegli una categoria per volta. Al lancio sono disponibili carta/cartone, legno e plastica.",
    infoTitle: "Descrivi il materiale",
    infoHint: "Un titolo chiaro e una descrizione semplice aiutano gli acquirenti a trovarti.",
    quantityTitle: "Quanto ne hai e a che prezzo?",
    quantityHint: "Inserisci quantità e prezzo del solo materiale. Nessun valore viene calcolato automaticamente.",
    specsTitle: "Specifiche e ritiro",
    specsHint: "Completa composizione, confezionamento e modalità di ritiro.",
    photosTitle: "Aggiungi una foto",
    photosHint: "Fino a 3 immagini. Le foto aiutano gli acquirenti a valutare il materiale; il passaggio è facoltativo.",
    reviewTitle: "Controlla e pubblica",
    reviewHint: "Verifica i dati qui sotto. Puoi pubblicare subito o salvare una bozza.",
    titleLabel: "Titolo dell'annuncio",
    titleHint: "Usa parole che un acquirente cercherebbe: tipo di materiale, qualità e forma.",
    titlePlaceholder: "es. Ritagli OCC kraft 90/10 in balle",
    categoryLabel: "Categoria materiale",
    categoryError: "Seleziona una categoria.",
    descriptionLabel: "Descrizione",
    descriptionHint: "Indica origine, qualità e impieghi possibili. Evita solo gergo tecnico.",
    descriptionPlaceholder:
      "Ritagli puliti di cartone ondulato kraft da cartotecnica, asciutti, senza cera o laminati…",
    descriptionError: "Aggiungi una descrizione del materiale.",
    titleError: "Dai al materiale un titolo chiaro (almeno 6 caratteri).",
    conditionLabel: "Condizioni del materiale",
    conditionHint: "Seleziona tutte le condizioni che descrivono il materiale.",
    conditionError: "Seleziona almeno una condizione.",
    compositionLabel: "Composizione",
    compositionHint: "Indica i componenti principali. Le percentuali devono sommare 100% (tolleranza ±5%).",
    compositionTotal: (value: number) => `${value}% totale`,
    componentName: "Componente",
    componentPercent: "Percentuale",
    componentPlaceholder: "Materiale, es. OCC",
    addComponent: "Aggiungi componente",
    removeComponent: "Rimuovi componente",
    compositionNameError: "Dai un nome a ogni componente (almeno 2 caratteri).",
    compositionTotalError: "Le percentuali devono sommare 100% (±5%).",
    quantityLabel: "Quantità disponibile (kg)",
    minOrderLabel: "Ordine minimo (kg)",
    priceLabel: "Prezzo materiale (€/kg)",
    priceHint: "Solo materiale: Offcut aggiunge lavorazione, trasporto e IVA nel preventivo.",
    quantityPlaceholder: "18500",
    minOrderPlaceholder: "5000",
    pricePlaceholder: "0.00",
    availableFromLabel: "Disponibile dal",
    availableUntilLabel: "Disponibile fino al",
    quantityError: "Inserisci la quantità disponibile in chilogrammi.",
    minOrderError: "Imposta una quantità minima d'ordine.",
    minOrderAboveError: "L'ordine minimo non può superare la quantità disponibile.",
    priceError: "Imposta un prezzo del materiale al kg.",
    untilError: "La data di fine deve essere successiva a quella di inizio.",
    materialValue: "Valore del solo materiale",
    materialValueNote: "Esclude lavorazione, trasporto e IVA. Non è il prezzo consegnato finale.",
    locationLabel: "Sede di ritiro",
    locationPlaceholder: "Seleziona una sede",
    locationMissing: "Aggiungi una sede nelle impostazioni prima di pubblicare.",
    locationError: "Seleziona la sede di ritiro.",
    packagingLabel: "Confezionamento",
    packagingHint: "es. balle ~650 kg, octabin, alla rinfusa.",
    packagingPlaceholder: "Balle ~650 kg",
    packagingError: "Descrivi il confezionamento (almeno 2 caratteri).",
    handlingLabel: "Vincoli di movimentazione",
    handlingHint: "Seleziona tutto ciò che trasportatore e lavoratore devono sapere.",
    handlingError: "Seleziona almeno un vincolo di movimentazione.",
    photoLabel: "Foto del materiale",
    photoHint: "Mostra il materiale reale: immagini chiare aumentano la fiducia. Vengono compresse prima di essere allegate.",
    previewLabel: "Anteprima annuncio",
    previewTitle: "Titolo del tuo materiale",
    previewCategory: "Categoria non selezionata",
    previewCondition: "Condizioni da selezionare",
    previewLocation: "Sede",
    previewNoPhoto: "Nessuna foto allegata",
    previewPhotos: (count: number) => `${count} ${count === 1 ? "foto allegata" : "foto allegate"}`,
    summaryQuantity: "Quantità",
    summaryMinOrder: "Ordine min.",
    summaryPrice: "Prezzo",
    summaryValue: "Valore materiale",
    summaryAvailable: "Disponibile",
    summaryPickup: "Ritiro",
    summaryComposition: "Composizione",
    summaryHandling: "Movimentazione",
    noValue: "—",
    publishNote:
      "Alla pubblicazione il motore confronta l'annuncio con le richieste aperte e mostra i candidati più solidi.",
    continue: "Continua",
    backButton: "Indietro",
    saveDraft: "Salva bozza",
    publish: "Pubblica annuncio",
    saving: "Salvataggio…",
    fixFields: "Controlla i campi evidenziati prima di continuare.",
    createFailed: "Impossibile creare l'annuncio. Riprova.",
    updateFailed: "Impossibile aggiornare l'annuncio. Riprova.",
    noOrg: "Seleziona prima un'organizzazione attiva.",
    published: "Annuncio pubblicato",
    publishedDesc: (count: number) =>
      `${count} ${count === 1 ? "azienda interessata" : "aziende interessate"} a questo materiale. Puoi contattarle subito.`,
    draftSaved: "Bozza salvata",
    draftSavedDesc: "Puoi pubblicarla da I miei annunci.",
    saveChanges: "Salva modifiche",
    updated: "Annuncio aggiornato",
    updatedDesc: "Le modifiche sono state salvate e gli abbinamenti sono stati aggiornati.",
  },
  en: {
    back: "My listings",
    flow: "Supplier flow",
    eyebrow: "I have material",
    title: "List surplus material",
    editTitle: "Edit listing",
    intro:
      "Six short steps. You set the material price per kg: Offcut adds processing, transport and VAT in the delivered quote.",
    editIntro: "Update the listing details: changes will be applied to the existing listing.",
    requiredNote: "* Required fields",
    stepCounter: (current: number, total: number) => `Step ${current} of ${total}`,
    steps: [
      "Category",
      "Material details",
      "Quantity and price",
      "Specifications",
      "Photos",
      "Review",
    ],
    categoryTitle: "What material are you selling?",
    categoryHint: "Pick one category at a time. At launch we cover paper/cardboard, wood and plastic.",
    infoTitle: "Describe the material",
    infoHint: "A clear title and plain description help buyers find your material.",
    quantityTitle: "How much do you have, and at what price?",
    quantityHint: "Enter volume and material-only price. No value is calculated automatically.",
    specsTitle: "Specifications and collection",
    specsHint: "Add composition, packaging and collection constraints.",
    photosTitle: "Add a photo",
    photosHint:
      "Up to 3 images. Photos help buyers assess the material; this step is optional.",
    reviewTitle: "Review and publish",
    reviewHint: "Check the details below. You can publish now or save a draft.",
    titleLabel: "Listing title",
    titleHint: "Use words a buyer would search: material type, quality and format.",
    titlePlaceholder: "e.g. Kraft OCC offcuts 90/10 in bales",
    categoryLabel: "Material category",
    categoryError: "Select a category.",
    descriptionLabel: "Description",
    descriptionHint: "State origin, quality and possible uses. Avoid jargon only.",
    descriptionPlaceholder:
      "Clean kraft corrugated board offcuts from a box plant, dry, no wax or laminates…",
    descriptionError: "Add a description of the material.",
    titleError: "Give the material a clear title (at least 6 characters).",
    conditionLabel: "Material conditions",
    conditionHint: "Select every condition that describes the material.",
    conditionError: "Select at least one condition.",
    compositionLabel: "Composition",
    compositionHint: "List the main components. Percentages must add up to 100% (±5% tolerance).",
    compositionTotal: (value: number) => `${value}% total`,
    componentName: "Component",
    componentPercent: "Percentage",
    componentPlaceholder: "Material, e.g. OCC",
    addComponent: "Add component",
    removeComponent: "Remove component",
    compositionNameError: "Name every component (at least 2 characters).",
    compositionTotalError: "Percentages must add up to 100% (±5%).",
    quantityLabel: "Available quantity (kg)",
    minOrderLabel: "Minimum order (kg)",
    priceLabel: "Material price (€/kg)",
    priceHint: "Material only: Offcut adds processing, transport and VAT to the quote.",
    quantityPlaceholder: "18500",
    minOrderPlaceholder: "5000",
    pricePlaceholder: "0.00",
    availableFromLabel: "Available from",
    availableUntilLabel: "Available until",
    quantityError: "Enter the available quantity in kilograms.",
    minOrderError: "Set a minimum order quantity.",
    minOrderAboveError: "The minimum order cannot exceed the available quantity.",
    priceError: "Set a material price per kg.",
    untilError: "The end date must be after the start date.",
    materialValue: "Material-only value",
    materialValueNote: "Excludes processing, transport and VAT. Not the final delivered price.",
    locationLabel: "Collection site",
    locationPlaceholder: "Select a site",
    locationMissing: "Add a site in settings before publishing.",
    locationError: "Select the collection site.",
    packagingLabel: "Packaging",
    packagingHint: "e.g. ~650 kg bales, octabin, loose.",
    packagingPlaceholder: "~650 kg bales",
    packagingError: "Describe the packaging (at least 2 characters).",
    handlingLabel: "Handling constraints",
    handlingHint: "Select everything the carrier or processor needs to know.",
    handlingError: "Select at least one handling constraint.",
    photoLabel: "Material photos",
    photoHint: "Show the real material: clear images build buyer trust. They are compressed before upload.",
    previewLabel: "Listing preview",
    previewTitle: "Your material title",
    previewCategory: "No category selected",
    previewCondition: "Conditions to select",
    previewLocation: "Site",
    previewNoPhoto: "No photo attached",
    previewPhotos: (count: number) => `${count} ${count === 1 ? "photo" : "photos"} attached`,
    summaryQuantity: "Quantity",
    summaryMinOrder: "Min. order",
    summaryPrice: "Price",
    summaryValue: "Material value",
    summaryAvailable: "Available",
    summaryPickup: "Collection",
    summaryComposition: "Composition",
    summaryHandling: "Handling",
    noValue: "—",
    publishNote:
      "On publish, the engine compares the listing with open requests and shows the strongest candidates.",
    continue: "Continue",
    backButton: "Back",
    saveDraft: "Save draft",
    publish: "Publish listing",
    saving: "Saving…",
    fixFields: "Check the highlighted fields before continuing.",
    createFailed: "Could not create the listing. Please try again.",
    updateFailed: "Could not update the listing. Please try again.",
    noOrg: "Select an active organisation first.",
    published: "Listing published",
    publishedDesc: (count: number) =>
      `${count} ${count === 1 ? "interested company" : "interested companies"} for this material. You can contact them now.`,
    draftSaved: "Draft saved",
    draftSavedDesc: "You can publish it from My listings.",
    saveChanges: "Save changes",
    updated: "Listing updated",
    updatedDesc: "Your changes were saved and matches were refreshed.",
  },
} as const;

type ListingForm = {
  title: string;
  category: MaterialCategory | "";
  description: string;
  conditionFlags: MaterialCondition[];
  composition: { material: string; percent: number }[];
  quantityKg: string;
  minOrderKg: string;
  pricePerKg: string;
  availableFrom: string;
  availableUntil: string;
  locationId: string;
  packaging: string;
  handling: string[];
  photos: string[];
  editingId?: string;
};

type Errors = Partial<Record<keyof ListingForm | "form", string>>;

export default function NewListingPage() {
  const s = useLocalCopy(COPY);
  const { lang } = useI18n();
  const categoryCopy = useLocalCopy(CATEGORY_COPY);
  const conditionCopy = useLocalCopy(CONDITION_COPY);
  const router = useRouter();
  const org = useCurrentOrg();
  const locations = useOrgLocations();
  const primary = usePrimaryLocation();
  const createListing = useAppStore((state) => state.createListing);
  const updateListing = useAppStore((state) => state.updateListing);

  const initial = useMemo<ListingForm>(
    () => ({
      title: "",
      category: "",
      description: "",
      conditionFlags: [],
      composition: [{ material: "", percent: 100 }],
      quantityKg: "",
      minOrderKg: "",
      pricePerKg: "",
      availableFrom: todayInput(),
      availableUntil: addDaysInput(45),
      locationId: "",
      packaging: "",
      handling: ["Su pallet"],
      photos: [],
    }),
    [],
  );

  const { value: form, setValue: setForm, restored, savedAt, reset, clear } = useFormDraft(
    LISTING_DRAFT_KEY,
    initial,
  );
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const editingId = form.editingId ?? null;

  useEffect(() => {
    if (locations.length === 0) return;
    const valid = locations.some((location) => location.id === form.locationId);
    if (!valid) {
      const fallback = primary?.id ?? locations[0].id;
      setForm((prev) => (prev.locationId === fallback ? prev : { ...prev, locationId: fallback }));
    }
  }, [form.locationId, locations, primary, setForm]);

  const quantity = Number(form.quantityKg) || 0;
  const price = Number(form.pricePerKg) || 0;
  const compositionTotal = form.composition.reduce(
    (sum, part) => sum + (Number(part.percent) || 0),
    0,
  );
  const conditionFlags = form.conditionFlags.filter(
    (item): item is MaterialCondition => item in conditionCopy,
  );
  const condition = deriveCondition(conditionFlags);
  const purity = derivePurityPct(conditionFlags);
  const selectedLocation = locations.find((location) => location.id === form.locationId);
  const categoryValue =
    form.category && CATEGORIES.some((option) => option.value === form.category)
      ? form.category
      : null;

  function patch<K extends keyof ListingForm>(key: K, value: ListingForm[K]) {
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

  function a11y(key: keyof ListingForm, id: string) {
    return {
      id,
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `${id}-error` : undefined,
    };
  }

  function collectErrors(index: number): Errors {
    const next: Errors = {};
    if (index === 0) {
      if (!categoryValue) next.category = s.categoryError;
    }
    if (index === 1) {
      if (form.title.trim().length < 6) next.title = s.titleError;
      if (form.description.trim().length === 0) next.description = s.descriptionError;
      if (conditionFlags.length === 0) next.conditionFlags = s.conditionError;
    }
    if (index === 2) {
      if (quantity <= 0) next.quantityKg = s.quantityError;
      if (Number(form.minOrderKg) <= 0) next.minOrderKg = s.minOrderError;
      else if (Number(form.minOrderKg) > quantity) next.minOrderKg = s.minOrderAboveError;
      if (price <= 0) next.pricePerKg = s.priceError;
      if (!form.availableFrom) next.availableFrom = s.quantityError;
      if (!form.availableUntil || new Date(form.availableUntil) < new Date(form.availableFrom)) {
        next.availableUntil = s.untilError;
      }
    }
    if (index === 3) {
      if (form.composition.some((part) => part.material.trim().length < 2)) {
        next.composition = s.compositionNameError;
      } else if (Math.abs(compositionTotal - 100) > 5) {
        next.composition = s.compositionTotalError;
      }
      if (!form.locationId) next.locationId = s.locationError;
      if (form.packaging.trim().length < 2) next.packaging = s.packagingError;
      if (form.handling.length === 0) next.handling = s.handlingError;
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

  function publish(status: "active" | "draft") {
    if (saving) return;
    for (let index = 0; index <= 3; index += 1) {
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
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: categoryValue,
        composition: form.composition.map((part) => ({
          material: part.material.trim(),
          percent: Number(part.percent) || 0,
        })),
        quantityKg: quantity,
        condition,
        conditionFlags: conditionFlags,
        purityPct: purity,
        pricePerKg: price,
        availableFrom: form.availableFrom,
        availableUntil: form.availableUntil,
        photos: form.photos,
        handling: form.handling,
        packaging: form.packaging.trim(),
        minOrderKg: Number(form.minOrderKg),
        locationId: form.locationId,
      };
      if (editingId) {
        updateListing(editingId, payload);
      }
      const listingId = editingId ?? createListing({ ...payload, status });
      const matchCount = useAppStore.getState().matches.filter((match) => match.listingId === listingId).length;
      toast.success(
        editingId ? s.updated : status === "active" ? s.published : s.draftSaved,
        {
          description: editingId
            ? s.updatedDesc
            : status === "active"
              ? s.publishedDesc(matchCount)
              : s.draftSavedDesc,
        },
      );
      clear();
      router.push(
        editingId
          ? "/app/listings"
          : status === "active"
            ? `/app/matches?listing=${listingId}`
            : "/app/listings",
      );
    } catch (err) {
      const noOrg = err instanceof Error && /organization/i.test(err.message);
      setFormError(noOrg ? s.noOrg : editingId ? s.updateFailed : s.createFailed);
      setSaving(false);
    }
  }

  function addPhotos(urls: string[]) {
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...urls].slice(0, 3) }));
  }

  function removePhoto(index: number) {
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  }

  function conditionLabel(value: MaterialCondition) {
    return conditionCopy[value].label;
  }

  const summary = [
    { label: s.summaryQuantity, value: quantity > 0 ? formatKg(quantity) : s.noValue },
    {
      label: s.summaryMinOrder,
      value: Number(form.minOrderKg) > 0 ? formatKg(Number(form.minOrderKg)) : s.noValue,
    },
    { label: s.summaryPrice, value: price > 0 ? formatPerKg(price) : s.noValue },
    { label: s.summaryValue, value: formatCurrency(quantity * price) },
    {
      label: s.summaryAvailable,
      value:
        form.availableFrom && form.availableUntil
          ? `${formatLocalDate(form.availableFrom, lang)} – ${formatLocalDate(form.availableUntil, lang)}`
          : s.noValue,
    },
    { label: s.summaryPickup, value: selectedLocation?.city ?? s.noValue },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/listings"
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
          <h1 className="mt-2 text-balance text-[32px] leading-[1.08] sm:text-[38px]">
            {editingId ? s.editTitle : s.title}
          </h1>
          <p className="mt-2 max-w-[620px] text-[12.5px] leading-relaxed text-muted">
            {editingId ? s.editIntro : s.intro}
          </p>
          <p className="mt-1 text-[11.5px] text-muted">{s.requiredNote}</p>
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
          {s.stepCounter(step + 1, s.steps.length)}
        </p>
      </div>

      <FormStepper
        steps={[...s.steps]}
        active={step}
        onSelect={goToStep}
        ariaLabel={s.title}
      />

      <DraftStatus savedAt={savedAt} restored={restored} onReset={reset} editing={Boolean(editingId)} />

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
                id="listing-category"
                value={form.category}
                onChange={(value) => patch("category", value)}
                label={s.categoryLabel}
                hint={s.categoryHint}
                error={errors.category}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(2, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.infoTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.infoHint}</p>
              </div>
              <Field
                label={s.titleLabel}
                required
                htmlFor="listing-title"
                hint={errors.title ? undefined : s.titleHint}
              >
                <Input
                  {...a11y("title", "listing-title")}
                  value={form.title}
                  onChange={(event) => patch("title", event.target.value)}
                  placeholder={s.titlePlaceholder}
                />
                <InlineError id="listing-title-error">{errors.title}</InlineError>
              </Field>
              <Field
                label={s.descriptionLabel}
                required
                htmlFor="listing-description"
                hint={errors.description ? undefined : s.descriptionHint}
              >
                <Textarea
                  {...a11y("description", "listing-description")}
                  value={form.description}
                  onChange={(event) => patch("description", event.target.value)}
                  rows={5}
                  placeholder={s.descriptionPlaceholder}
                />
                <InlineError id="listing-description-error">{errors.description}</InlineError>
              </Field>
              <ConditionPicker
                id="listing-condition"
                values={conditionFlags}
                onChange={(values) => patch("conditionFlags", values)}
                label={s.conditionLabel}
                hint={s.conditionHint}
                error={errors.conditionFlags}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(3, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.quantityTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.quantityHint}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={s.quantityLabel} required htmlFor="listing-quantity">
                  <Input
                    {...a11y("quantityKg", "listing-quantity")}
                    type="number"
                    min={1}
                    max={1000000}
                    value={form.quantityKg}
                    onChange={(event) => patch("quantityKg", event.target.value)}
                    placeholder={s.quantityPlaceholder}
                    className="font-mono"
                  />
                  <InlineError id="listing-quantity-error">{errors.quantityKg}</InlineError>
                </Field>
                <Field label={s.minOrderLabel} required htmlFor="listing-min-order">
                  <Input
                    {...a11y("minOrderKg", "listing-min-order")}
                    type="number"
                    min={1}
                    max={1000000}
                    value={form.minOrderKg}
                    onChange={(event) => patch("minOrderKg", event.target.value)}
                    placeholder={s.minOrderPlaceholder}
                    className="font-mono"
                  />
                  <InlineError id="listing-min-order-error">{errors.minOrderKg}</InlineError>
                </Field>
                <Field
                  label={s.priceLabel}
                  required
                  htmlFor="listing-price"
                  hint={errors.pricePerKg ? undefined : s.priceHint}
                >
                  <Input
                    {...a11y("pricePerKg", "listing-price")}
                    type="number"
                    min={0}
                    max={10000}
                    step="0.01"
                    value={form.pricePerKg}
                    onChange={(event) => patch("pricePerKg", event.target.value)}
                    placeholder={s.pricePlaceholder}
                    className="font-mono"
                  />
                  <InlineError id="listing-price-error">{errors.pricePerKg}</InlineError>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={s.availableFromLabel} required htmlFor="listing-from">
                  <Input
                    {...a11y("availableFrom", "listing-from")}
                    type="date"
                    min={todayInput()}
                    value={form.availableFrom}
                    onChange={(event) => patch("availableFrom", event.target.value)}
                  />
                  <InlineError id="listing-from-error">{errors.availableFrom}</InlineError>
                </Field>
                <Field label={s.availableUntilLabel} required htmlFor="listing-until">
                  <Input
                    {...a11y("availableUntil", "listing-until")}
                    type="date"
                    min={form.availableFrom}
                    value={form.availableUntil}
                    onChange={(event) => patch("availableUntil", event.target.value)}
                  />
                  <InlineError id="listing-until-error">{errors.availableUntil}</InlineError>
                </Field>
              </div>
              <div className="rounded-xl border border-line bg-paper/60 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] text-muted">{s.materialValue}</span>
                  <span className="font-mono text-[14px]">
                    {formatCurrency(quantity * price, { cents: true })}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  {s.materialValueNote}
                </p>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(4, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.specsTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.specsHint}</p>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="field-label">
                    {s.compositionLabel} <span className="text-clay">*</span>
                  </p>
                  <span
                    className={`font-mono text-[11.5px] ${
                      Math.abs(compositionTotal - 100) <= 5 ? "text-moss" : "text-amber"
                    }`}
                  >
                    {s.compositionTotal(compositionTotal)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{s.compositionHint}</p>
                <div
                  role="group"
                  aria-label={s.compositionLabel}
                  aria-describedby={errors.composition ? "listing-composition-error" : undefined}
                  className="mt-2.5 space-y-2"
                >
                  {form.composition.map((part, index) => (
                    <div key={index} className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={part.material}
                        onChange={(event) =>
                          patch(
                            "composition",
                            form.composition.map((item, i) =>
                              i === index ? { ...item, material: event.target.value } : item,
                            ),
                          )
                        }
                        placeholder={s.componentPlaceholder}
                        aria-label={`${s.componentName} ${index + 1}`}
                        className="min-w-0 flex-1"
                      />
                      <div className="relative w-full sm:w-24">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={part.percent}
                          onChange={(event) =>
                            patch(
                              "composition",
                              form.composition.map((item, i) =>
                                i === index ? { ...item, percent: Number(event.target.value) } : item,
                              ),
                            )
                          }
                          aria-label={`${s.componentPercent} ${index + 1}`}
                          className="pr-7 font-mono"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">
                          %
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0 sm:size-10"
                        onClick={() =>
                          patch(
                            "composition",
                            form.composition.filter((_, i) => i !== index),
                          )
                        }
                        disabled={form.composition.length === 1}
                        aria-label={`${s.removeComponent} ${index + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <InlineError id="listing-composition-error">{errors.composition}</InlineError>
                {form.composition.length < 4 ? (
                  <button
                    type="button"
                    onClick={() =>
                      patch("composition", [...form.composition, { material: "", percent: 0 }])
                    }
                    className="mt-2 inline-flex min-h-10 items-center gap-1 text-[12px] text-moss hover:underline"
                  >
                    <Plus className="size-3.5" /> {s.addComponent}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={s.locationLabel} required htmlFor="listing-location">
                  <Select
                    {...a11y("locationId", "listing-location")}
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
                  <InlineError id="listing-location-error">{errors.locationId}</InlineError>
                  {locations.length === 0 ? (
                    <p className="text-[11.5px] text-amber">{s.locationMissing}</p>
                  ) : null}
                </Field>
                <Field
                  label={s.packagingLabel}
                  required
                  htmlFor="listing-packaging"
                  hint={errors.packaging ? undefined : s.packagingHint}
                >
                  <Input
                    {...a11y("packaging", "listing-packaging")}
                    value={form.packaging}
                    onChange={(event) => patch("packaging", event.target.value)}
                    placeholder={s.packagingPlaceholder}
                  />
                  <InlineError id="listing-packaging-error">{errors.packaging}</InlineError>
                </Field>
              </div>

              <div>
                <p className="field-label">{s.handlingLabel}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{s.handlingHint}</p>
                <div
                  role="group"
                  aria-label={s.handlingLabel}
                  aria-describedby={errors.handling ? "listing-handling-error" : undefined}
                  className="mt-2.5 grid gap-2 sm:grid-cols-2"
                >
                  {HANDLING_OPTIONS.map((option) => {
                    const checked = form.handling.includes(option);
                    const label = HANDLING_COPY[option]?.[lang] ?? option;
                    return (
                      <label
                        key={option}
                        className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] transition-colors motion-reduce:transition-none ${
                          checked ? "border-forest/40 bg-mist/40" : "border-line bg-white hover:border-sage"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() =>
                            patch(
                              "handling",
                              checked
                                ? form.handling.filter((item) => item !== option)
                                : [...form.handling, option],
                            )
                          }
                          aria-label={label}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
                <InlineError id="listing-handling-error">{errors.handling}</InlineError>
              </div>

              {selectedLocation ? (
                <div className="flex items-start gap-2 rounded-xl border border-line bg-paper/60 p-3.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-moss" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium">{selectedLocation.name}</p>
                    <p className="mt-0.5 break-words text-[11.5px] text-muted">
                      {selectedLocation.addressLine}, {selectedLocation.postalCode}{" "}
                      {selectedLocation.city}, {selectedLocation.country}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(5, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.photosTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.photosHint}</p>
              </div>
              <PhotoUpload
                photos={form.photos}
                onAdd={addPhotos}
                onRemove={removePhoto}
                label={s.photoLabel}
                hint={s.photoHint}
              />
              <div className="flex items-start gap-2 rounded-xl border border-line bg-paper/60 p-3.5">
                <Info className="mt-0.5 size-4 shrink-0 text-moss" />
                <p className="text-[11.5px] leading-relaxed text-muted">
                  {s.photosHint}
                </p>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">{s.stepCounter(6, s.steps.length)}</p>
                <h2 className="mt-1.5 text-[24px] leading-tight">{s.reviewTitle}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{s.reviewHint}</p>
              </div>

              <div className="flex gap-4 rounded-xl border border-line p-3.5">
                <MaterialPreview
                  category={form.category}
                  photos={form.photos}
                  className="h-20 w-28 shrink-0 rounded-lg"
                  compact
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-[1.5]">
                    {form.title || s.previewTitle}
                  </p>
                  <p className="mt-1 text-[12px] text-muted">
                    {form.category
                      ? categoryCopy[form.category].label
                      : s.previewCategory}{" "}
                    ·{" "}
                    {conditionFlags.length > 0
                      ? conditionFlags.map(conditionLabel).join(" + ")
                      : s.previewCondition}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {form.description || "—"}
                  </p>
                  <p className="mt-1 font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                    {form.photos.length === 0
                      ? s.previewNoPhoto
                      : s.previewPhotos(form.photos.length)}
                  </p>
                </div>
              </div>

              <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                {summary.map((item) => (
                  <div key={item.label} className="bg-white px-3.5 py-2.5">
                    <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 break-words font-mono text-[12px]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-paper/70 p-3.5">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted">
                  {s.summaryComposition}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.composition.map((part, index) => (
                    <span
                      key={`${index}-${part.material}`}
                      className="rounded border border-line bg-white px-2 py-0.5 text-[11.5px]"
                    >
                      {part.material || s.noValue} {part.percent}%
                    </span>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted">
                  {s.summaryHandling}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.handling.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-line bg-white px-2 py-0.5 text-[11.5px] text-moss"
                    >
                      {HANDLING_COPY[item]?.[lang] ?? item}
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
            <div className="flex flex-wrap items-center gap-2">
              {step === s.steps.length - 1 ? (
                <>
                  {editingId ? null : (
                    <Button variant="outline" onClick={() => publish("draft")} disabled={saving}>
                      {s.saveDraft}
                    </Button>
                  )}
                  <Button onClick={() => publish("active")} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {saving ? s.saving : editingId ? s.saveChanges : s.publish}
                  </Button>
                </>
              ) : (
                <Button onClick={nextStep}>
                  {s.continue} <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-app-sticky">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="eyebrow">{s.previewLabel}</p>
            <MaterialPreview
              category={form.category}
              photos={form.photos}
              className="mt-3 h-32 w-full rounded-xl"
            />
            <p className="mt-3 line-clamp-2 text-[12.5px] font-medium">
              {form.title || s.previewTitle}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              {form.category ? categoryCopy[form.category].label : s.previewCategory} ·{" "}
              {selectedLocation?.city ?? s.previewLocation}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              {conditionFlags.length > 0
                ? conditionFlags.map(conditionLabel).join(" + ")
                : s.previewCondition}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12px]">
              <div className="min-w-0">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                  {s.summaryQuantity}
                </p>
                <p className="mt-0.5 truncate font-mono">
                  {quantity > 0 ? formatKg(quantity) : s.noValue}
                </p>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
                  {s.summaryPrice}
                </p>
                <p className="mt-0.5 truncate font-mono">
                  {price > 0 ? formatPerKg(price) : s.noValue}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
