"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type MaterialKey = "cardboard" | "wood" | "plastic";
type Intent = "sell" | "buy";

/** Indicative sector averages shared with /impatto, not issued prices.
 *  EUR values are per tonne; CO₂e values are tonnes avoided per tonne. */
const FP_DATA: Record<MaterialKey, { virginPrice: number; offcutPrice: number; disposalCost: number; co2SavedPerTon: number }> = {
  plastic: { virginPrice: 1350, offcutPrice: 230, disposalCost: 190, co2SavedPerTon: 1.85 },
  cardboard: { virginPrice: 420, offcutPrice: 60, disposalCost: 110, co2SavedPerTon: 1.1 },
  wood: { virginPrice: 240, offcutPrice: 55, disposalCost: 95, co2SavedPerTon: 0.92 },
};

const CONTENT = {
  it: {
    eyebrow: "Impatto",
    title: "Calcola il tuo impatto.",
    lead: "Scegli materiale e volume mensile: stimiamo quanto puoi risparmiare ogni anno e quanta CO₂e eviti rispetto allo smaltimento o alla materia prima vergine. È una stima indicativa: il preventivo conferma i valori reali.",
    materialLabel: "Materiale",
    intentLabel: "Cosa fai con il materiale?",
    sell: "Ho materiale",
    buy: "Cerco materiale",
    tonsLabel: "Tonnellate al mese",
    resultsEyebrow: "Risparmio annuo stimato",
    sellNote: "Di costi di smaltimento evitati",
    buyNote: "Rispetto alla materia prima vergine",
    co2Eyebrow: "CO₂e evitata all'anno",
    co2Note: "Sottratte a discarica e incenerimento",
    tonsUnit: "tonnellate / mese",
    co2Unit: "tonnellate",
    disclaimer: "Metodo: per chi vende, costo medio di smaltimento evitato × t/mese × 12; per chi compra, differenza tra prezzo medio della materia vergine e del recuperato × t/mese × 12. CO₂e con fattori medi di settore: carta 1,1, legno 0,92, plastica 1,85 tCO₂e/tonnellata.",
    scope: "Servizio al lancio solo a Bologna e dintorni; ritiro e trasporto sono definiti nel preventivo.",
    notOffer: "I numeri mostrati sono una stima, non un prezzo emesso né un risparmio garantito.",
    cta: "Richiedi un preventivo",
    materials: { cardboard: "Carta e cartone", wood: "Legno", plastic: "Plastica" } as Record<MaterialKey, string>,
  },
  en: {
    eyebrow: "Impact",
    title: "Know your footprint.",
    lead: "Pick a material and monthly volume: we estimate your annual savings and the CO₂e you avoid versus disposal or virgin raw material. This is an indicative estimate: your quote confirms the real values.",
    materialLabel: "Material",
    intentLabel: "What do you do with the material?",
    sell: "I have material",
    buy: "I'm looking for material",
    tonsLabel: "Tons per month",
    resultsEyebrow: "Estimated annual savings",
    sellNote: "In avoided waste disposal fees",
    buyNote: "Compared to virgin raw material",
    co2Eyebrow: "CO₂e avoided per year",
    co2Note: "Kept out of landfill & incineration",
    tonsUnit: "tons / month",
    co2Unit: "tons",
    disclaimer: "Method: for sellers, average avoided disposal cost × tonnes/month × 12; for buyers, the difference between average virgin and recovered material prices × tonnes/month × 12. CO₂e uses sector-average factors: paper 1.1, wood 0.92, plastic 1.85 tCO₂e per tonne.",
    scope: "At launch we serve Bologna and nearby towns only; collection and transport are set out in the quote.",
    notOffer: "These figures are an estimate, not an issued price or a guaranteed saving.",
    cta: "Request a quote",
    materials: { cardboard: "Paper & cardboard", wood: "Wood", plastic: "Plastic" } as Record<MaterialKey, string>,
  },
};

export function FootprintCalculator() {
  const { lang } = useI18n();
  const c = CONTENT[lang];
  const [material, setMaterial] = useState<MaterialKey>("cardboard");
  const [intent, setIntent] = useState<Intent>("sell");
  const [tons, setTons] = useState(40);

  const { annualEur, annualCo2 } = useMemo(() => {
    const d = FP_DATA[material];
    const eur = (intent === "sell" ? tons * d.disposalCost : tons * (d.virginPrice - d.offcutPrice)) * 12;
    return { annualEur: eur, annualCo2: Math.round(tons * d.co2SavedPerTon * 12) };
  }, [material, intent, tons]);

  const money = useMemo(
    () => new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
    [lang],
  );

  const pill =
    "flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg px-3 text-[15px] font-medium transition-colors peer-checked:bg-forest peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-moss text-muted hover:text-ink";

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-8">
      <fieldset>
        <legend id="calc-material-label" className="field-label">{c.materialLabel}</legend>
        <div className="mt-1.5 grid grid-cols-1 gap-2 rounded-xl border border-line bg-paper p-1 sm:grid-cols-3" role="radiogroup" aria-labelledby="calc-material-label">
          {(Object.keys(FP_DATA) as MaterialKey[]).map((key) => (
            <label key={key} className="relative">
              <input
                type="radio"
                name="fp-material"
                value={key}
                checked={material === key}
                onChange={() => setMaterial(key)}
                className="peer sr-only"
              />
              <span className={pill}>{c.materials[key]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend id="calc-intent-label" className="field-label">{c.intentLabel}</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-xl border border-line bg-paper p-1" role="radiogroup" aria-labelledby="calc-intent-label">
          {(["sell", "buy"] as Intent[]).map((key) => (
            <label key={key} className="relative">
              <input
                type="radio"
                name="fp-intent"
                value={key}
                checked={intent === key}
                onChange={() => setIntent(key)}
                className="peer sr-only"
              />
              <span className={pill}>{key === "sell" ? c.sell : c.buy}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="fp-tons" className="field-label">
            {c.tonsLabel}
          </label>
          <span className="font-mono text-[15px] font-medium tabular-nums text-ink">
            {tons} {c.tonsUnit}
          </span>
        </div>
        <input
          id="fp-tons"
          type="range"
          min={1}
          max={200}
          step={1}
          value={tons}
          onChange={(e) => setTons(Number(e.target.value))}
          aria-valuetext={`${tons} ${c.tonsUnit}`}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-sand accent-forest"
        />
        <div className="mt-1 flex justify-between text-[12px] text-muted">
          <span>1</span>
          <span>200</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-live="polite">
        <div className="rounded-xl border border-line bg-paper p-5">
          <p className="eyebrow flex items-center gap-1.5">
            <PiggyBank className="size-3.5 text-moss" aria-hidden /> {c.resultsEyebrow}
          </p>
          <p className="mt-2 font-display text-[34px] leading-none text-forest tabular-nums">{money.format(annualEur)}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{intent === "sell" ? c.sellNote : c.buyNote}</p>
        </div>
        <div className="rounded-xl border border-line bg-paper p-5">
          <p className="eyebrow flex items-center gap-1.5">
            <Leaf className="size-3.5 text-moss" aria-hidden /> {c.co2Eyebrow}
          </p>
          <p className="mt-2 font-display text-[34px] leading-none text-forest tabular-nums">
            {annualCo2} <span className="text-[18px]">{c.co2Unit}</span>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{c.co2Note}</p>
        </div>
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-muted">{c.disclaimer}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{c.scope}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{c.notOffer}</p>

      <Button className="mt-6 w-full sm:w-auto" size="lg" asChild>
        <Link href="/preventivo">
          {c.cta} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
