"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OffcutShell } from "@/components/offcut/shell";
import { useI18n } from "@/lib/i18n";

type MaterialKey = "Plastic" | "Cardboard" | "Wood";
type Operation = "sell" | "buy";

const DATA: Record<MaterialKey, { virgin: number; offcut: number; disposal: number; co2: number }> = {
  Plastic: { virgin: 1350, offcut: 230, disposal: 190, co2: 1.85 },
  Cardboard: { virgin: 420, offcut: 60, disposal: 110, co2: 1.1 },
  Wood: { virgin: 240, offcut: 55, disposal: 95, co2: 0.92 },
};

const COPY = {
  it: {
    title: "Calcola la tua impronta",
    sub: "Scegli un materiale e il volume mensile per vedere quanto può risparmiare la tua azienda con Offcut.",
    material: "Materiale",
    operation: "Cosa fai?",
    sell: "Vendo scarti (ritiro gratuito)",
    buy: "Compro materia prima",
    volume: "Volume mensile",
    unit: "t / mese",
    saving: "Risparmio annuo stimato",
    savingNoteSell: "Costi di smaltimento evitati",
    savingNoteBuy: "Rispetto alla materia prima vergine",
    co2: "CO₂e evitata all'anno",
    co2Note: "Sottratta a discarica e incenerimento",
    regionTitle: "In tutta l'Emilia-Romagna",
    regionDesc: "Le aziende della regione separano già oltre l'80% dei rifiuti urbani: Offcut trasforma gli scarti industriali in fornitura locale.",
    cta: "Inizia ad abbinare",
    materials: { Plastic: "Plastica", Cardboard: "Carta e cartone", Wood: "Legno" },
  },
  en: {
    title: "Know your footprint",
    sub: "Pick a material and your monthly volume to see what your business can save with Offcut.",
    material: "Material",
    operation: "What are you doing?",
    sell: "Selling scrap (free pick-up)",
    buy: "Buying raw material",
    volume: "Monthly volume",
    unit: "tons / month",
    saving: "Estimated annual savings",
    savingNoteSell: "In avoided disposal costs",
    savingNoteBuy: "Compared to virgin raw material",
    co2: "CO₂e avoided per year",
    co2Note: "Kept out of landfill & incineration",
    regionTitle: "Across Emilia-Romagna",
    regionDesc: "Regional businesses already sort over 80% of municipal waste—Offcut turns industrial leftovers into local supply.",
    cta: "Start matching",
    materials: { Plastic: "Plastic", Cardboard: "Cardboard", Wood: "Wood" },
  },
} as const;

export function FootprintPage() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const [material, setMaterial] = useState<MaterialKey>("Plastic");
  const [operation, setOperation] = useState<Operation>("sell");
  const [tons, setTons] = useState(40);

  const result = useMemo(() => {
    const d = DATA[material];
    const yearly = (operation === "sell" ? d.disposal : d.virgin - d.offcut) * tons * 12;
    return { yearly, co2: Math.round(d.co2 * tons * 12) };
  }, [material, operation, tons]);

  const money = new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <OffcutShell>
      <section data-v="footprint">
        <h2>{c.title}</h2>
        <p className="mut" style={{ marginTop: 6, maxWidth: 560 }}>{c.sub}</p>
        <div className="fp-wrap">
          <div className="card">
            <label style={{ marginTop: 0 }}>{c.material}</label>
            <div className="fp-pills" id="fp-mat-pills">
              {(Object.keys(DATA) as MaterialKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={material === key ? "on" : undefined}
                  aria-pressed={material === key}
                  onClick={() => setMaterial(key)}
                >
                  {c.materials[key]}
                </button>
              ))}
            </div>

            <label>{c.operation}</label>
            <div className="seg" id="fp-op-seg">
              <button type="button" className={operation === "sell" ? "on" : undefined} aria-pressed={operation === "sell"} onClick={() => setOperation("sell")}>
                {c.sell}
              </button>
              <button type="button" className={operation === "buy" ? "on" : undefined} aria-pressed={operation === "buy"} onClick={() => setOperation("buy")}>
                {c.buy}
              </button>
            </div>

            <div className="fp-range-head">
              <label htmlFor="fp-tons" style={{ margin: 0 }}>{c.volume}</label>
              <span className="fp-range-val" id="fp-tons-label">{tons} {c.unit}</span>
            </div>
            <input
              id="fp-tons"
              type="range"
              min={5}
              max={200}
              step={5}
              value={tons}
              onChange={(event) => setTons(Number(event.target.value))}
              aria-valuetext={`${tons} ${c.unit}`}
            />

            <div className="fp-outcome" id="fp-results" aria-live="polite">
              <div>
                <p className="eyebrow">{c.saving}</p>
                <p className="big">{money.format(result.yearly)}</p>
                <p className="mut small">{operation === "sell" ? c.savingNoteSell : c.savingNoteBuy}</p>
              </div>
              <div>
                <p className="eyebrow">{c.co2}</p>
                <p className="big">{result.co2} t</p>
                <p className="mut small">{c.co2Note}</p>
              </div>
            </div>
          </div>

          <div className="fp-note">
            <div>
              <h3>{c.regionTitle}</h3>
              <p className="mut" style={{ marginTop: 4, fontSize: ".94rem" }}>{c.regionDesc}</p>
            </div>
            <Link className="btn sm" href="/preventivo">{c.cta}</Link>
          </div>
        </div>
      </section>
    </OffcutShell>
  );
}
