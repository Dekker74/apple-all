"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addDaysInput, todayInput } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/pricing";
import {
  APPOINTMENT_HUBS,
  APPOINTMENT_PROCESSING_RATES,
  APPOINTMENT_RATES,
  APPOINTMENT_SLOTS,
  computeAppointmentFinance,
  useAppStore,
  type AppointmentCondition,
  type AppointmentFinance,
  type AppointmentMaterial,
  type AppointmentType,
} from "@/lib/store";
import { cn } from "@/lib/utils";

const MATERIALS: AppointmentMaterial[] = ["plastic", "cardboard", "wood"];
const CONDITIONS: AppointmentCondition[] = ["clean", "mixed", "contaminated"];

const FEE_CONTENT = {
  it: {
    material: "Materiale",
    commission: "Commissione (6%)",
    transport: "Trasporto",
    service: "Servizio",
    processing: "Lavorazione",
    total: "Prezzo totale",
    conditions: { clean: "Pulito", mixed: "Misto", contaminated: "Contaminato" },
  },
  en: {
    material: "Material",
    commission: "Commission (6%)",
    transport: "Transport",
    service: "Service",
    processing: "Processing",
    total: "Total price",
    conditions: { clean: "Clean", mixed: "Mixed", contaminated: "Contaminated" },
  },
} as const;

export function FeeBreakdown({
  finance,
  condition,
  className,
}: {
  finance: AppointmentFinance;
  condition: AppointmentCondition;
  className?: string;
}) {
  const { lang } = useI18n();
  const t = FEE_CONTENT[lang];
  
  // Simple additive breakdown: material + commission + transport + service + processing = total
  const rows = [
    {
      label: `${t.material} (${formatCurrency(finance.rate)}/t × ${(finance.gross / finance.rate).toFixed(1)}t)`,
      value: formatCurrency(finance.gross, { cents: true }),
    },
    { label: t.commission, value: formatCurrency(finance.commission, { cents: true }) },
    { label: t.transport, value: formatCurrency(finance.transport, { cents: true }) },
    { label: t.service, value: formatCurrency(finance.service, { cents: true }) },
    {
      label: `${t.processing} (${t.conditions[condition].toLowerCase()})`,
      value: formatCurrency(finance.processing, { cents: true }),
    },
  ];

  // Total = sum of all items
  const total = finance.gross + finance.commission + finance.transport + finance.service + finance.processing;

  return (
    <div className={cn("rounded-2xl border border-line bg-mist p-4", className)}>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className="min-w-0 text-muted">{row.label}</span>
            <span className="whitespace-nowrap font-mono tabular-nums text-ink">
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-line pt-2.5 text-[13px] font-medium">
        <span className="text-ink">{t.total}</span>
        <span className="whitespace-nowrap font-mono tabular-nums text-forest">
          {formatCurrency(total, { cents: true })}
        </span>
      </div>
    </div>
  );
}

const CONTENT = {
  it: {
    title: "Prenota appuntamento",
    subPartner: (name: string) =>
      `Ritiro o consegna gestiti da Offcut per la tua connessione con ${name}.`,
    subDirect: "Programma un ritiro o una consegna gestiti direttamente da Offcut.",
    type: "Tipo di servizio",
    pickup: "Ritiro (pick-up)",
    dropoff: "Consegna (drop-off)",
    material: "Materiale",
    materials: { plastic: "Plastica", cardboard: "Cartone", wood: "Legno" },
    condition: "Condizione",
    conditions: { clean: "Pulito", mixed: "Misto", contaminated: "Contaminato" },
    tons: "Tonnellate",
    hub: "Hub",
    date: "Data",
    time: "Fascia oraria",
    preview: "Anteprima economica",
    cancel: "Annulla",
    submit: "Conferma prenotazione",
    toastTitle: "Appuntamento prenotato",
    invalidTons: "Inserisci un numero di tonnellate maggiore di zero.",
    invalidDate: "Scegli una data a partire da oggi.",
  },
  en: {
    title: "Book appointment",
    subPartner: (name: string) =>
      `Pick-up or drop-off handled by Offcut for your connection with ${name}.`,
    subDirect: "Schedule a pick-up or drop-off handled directly by Offcut.",
    type: "Service type",
    pickup: "Pick-up",
    dropoff: "Drop-off",
    material: "Material",
    materials: { plastic: "Plastic", cardboard: "Cardboard", wood: "Wood" },
    condition: "Condition",
    conditions: { clean: "Clean", mixed: "Mixed", contaminated: "Contaminated" },
    tons: "Tons",
    hub: "Hub",
    date: "Date",
    time: "Time slot",
    preview: "Live breakdown",
    cancel: "Cancel",
    submit: "Confirm booking",
    toastTitle: "Appointment booked",
    invalidTons: "Enter a tonnage greater than zero.",
    invalidDate: "Pick a date from today onwards.",
  },
} as const;

export interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerName?: string;
  defaultMaterial?: AppointmentMaterial;
  defaultCondition?: AppointmentCondition;
  defaultTons?: number;
  defaultHub?: string;
}

export function BookingModal({
  open,
  onOpenChange,
  partnerName,
  defaultMaterial,
  defaultCondition,
  defaultTons,
  defaultHub,
}: BookingModalProps) {
  const { lang } = useI18n();
  const t = CONTENT[lang];
  const bookAppointment = useAppStore((s) => s.bookAppointment);

  const [type, setType] = useState<AppointmentType>("pickup");
  const [material, setMaterial] = useState<AppointmentMaterial>("plastic");
  const [condition, setCondition] = useState<AppointmentCondition>("clean");
  const [tons, setTons] = useState("10");
  const [hub, setHub] = useState<string>(APPOINTMENT_HUBS[0]);
  const [date, setDate] = useState(addDaysInput(2));
  const [time, setTime] = useState<string>(APPOINTMENT_SLOTS[0]);

  useEffect(() => {
    if (!open) return;
    setType("pickup");
    setMaterial(defaultMaterial ?? "plastic");
    setCondition(defaultCondition ?? "clean");
    setTons(defaultTons && defaultTons > 0 ? String(defaultTons) : "10");
    setHub(defaultHub ?? APPOINTMENT_HUBS[0]);
    setDate(addDaysInput(2));
    setTime(APPOINTMENT_SLOTS[0]);
  }, [open, defaultMaterial, defaultCondition, defaultTons, defaultHub]);

  const tonsNum = Number(tons);
  const tonsValid = Number.isFinite(tonsNum) && tonsNum > 0;
  const dateValid = date !== "" && date >= todayInput();
  const complete = tonsValid && dateValid && hub !== "" && time !== "";

  const finance = useMemo(
    () =>
      computeAppointmentFinance({
        material,
        condition,
        tons: tonsValid ? tonsNum : 0,
      }),
    [material, condition, tonsNum, tonsValid],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    bookAppointment({
      partnerName: partnerName ?? "Offcut Hub",
      type,
      material,
      condition,
      tons: tonsNum,
      hub,
      date,
      time,
    });
    toast.success(t.toastTitle, {
      description: `${partnerName ?? "Offcut Hub"} · ${date} · ${time} · ${hub}`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarPlus className="size-5 shrink-0 text-moss" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {partnerName ? t.subPartner(partnerName) : t.subDirect}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bk-type" className="field-label">
              {t.type}
            </Label>
            <Select
              id="bk-type"
              value={type}
              onChange={(e) => setType(e.target.value as AppointmentType)}
              className="h-11"
            >
              <option value="pickup">{t.pickup}</option>
              <option value="dropoff">{t.dropoff}</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bk-material" className="field-label">
              {t.material}
            </Label>
            <Select
              id="bk-material"
              value={material}
              onChange={(e) => setMaterial(e.target.value as AppointmentMaterial)}
              className="h-11"
            >
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {t.materials[m]} · {formatCurrency(APPOINTMENT_RATES[m])}/t
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bk-condition" className="field-label">
              {t.condition}
            </Label>
            <Select
              id="bk-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as AppointmentCondition)}
              className="h-11"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {t.conditions[c]} · {formatCurrency(APPOINTMENT_PROCESSING_RATES[c])}/t
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bk-tons" className="field-label">
              {t.tons}
            </Label>
            <Input
              id="bk-tons"
              type="number"
              inputMode="decimal"
              min={0.5}
              step={0.5}
              value={tons}
              onChange={(e) => setTons(e.target.value)}
              className="h-11"
              aria-invalid={!tonsValid}
              aria-describedby={!tonsValid ? "bk-tons-error" : undefined}
            />
            {!tonsValid ? (
              <p id="bk-tons-error" className="text-[11.5px] text-danger">
                {t.invalidTons}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bk-hub" className="field-label">
              {t.hub}
            </Label>
            <Select
              id="bk-hub"
              value={hub}
              onChange={(e) => setHub(e.target.value)}
              className="h-11"
            >
              {APPOINTMENT_HUBS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bk-date" className="field-label">
              {t.date}
            </Label>
            <Input
              id="bk-date"
              type="date"
              min={todayInput()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
              aria-invalid={!dateValid}
              aria-describedby={!dateValid ? "bk-date-error" : undefined}
            />
            {!dateValid ? (
              <p id="bk-date-error" className="text-[11.5px] text-danger">
                {t.invalidDate}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bk-time" className="field-label">
              {t.time}
            </Label>
            <Select
              id="bk-time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-11"
            >
              {APPOINTMENT_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <p className="field-label">{t.preview}</p>
            <div aria-live="polite">
              <FeeBreakdown finance={finance} condition={condition} />
            </div>
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button type="submit" className="h-11" disabled={!complete}>
              <CalendarPlus className="size-4" />
              {t.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
