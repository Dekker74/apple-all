"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OffcutShell } from "@/components/offcut/shell";
import { useI18n } from "@/lib/i18n";

type MaterialKey = "cardboard" | "wood" | "plastic";
type Operation = "sell" | "buy";

/** Indicative sector averages, shared with the marketing calculator.
 *  EUR values are per tonne; CO₂e values are tonnes of CO₂e avoided per tonne. */
const DATA: Record<MaterialKey, { virgin: number; offcut: number; disposal: number; co2: number }> = {
  cardboard: { virgin: 420, offcut: 60, disposal: 110, co2: 1.1 },
  wood: { virgin: 240, offcut: 55, disposal: 95, co2: 0.92 },
  plastic: { virgin: 1350, offcut: 230, disposal: 190, co2: 1.85 },
};

const COPY = {
  it: {
    title: "Calcola la tua impronta",
    sub: "Scegli materiale e volume mensile per una stima indicativa di risparmio e CO₂e evitata. Il preventivo conferma i valori reali sul tuo materiale.",
    material: "Materiale",
    operation: "Cosa fai?",
    sell: "Vendo materiale",
    buy: "Compro materia prima",
    volume: "Volume mensile",
    unit: "t / mese",
    saving: "Risparmio annuo stimato",
    savingNoteSell: "Costi di smaltimento evitati (stima)",
    savingNoteBuy: "Rispetto alla materia prima vergine (stima)",
    co2: "CO₂e evitata all'anno",
    co2Note: "Stima indicativa, non un certificate emissioni",
    scopeTitle: "Solo Bologna e dintorni",
    scopeDesc: "Per il lancio gestiamo ritiri e consegne a Bologna e nei comuni limitrofi, con ritiro e trasporto definiti nel preventivo.",
    methodTitle: "Come calcoliamo",
    method: "Per chi vende: costo medio di smaltimento evitato × tonnellate al mese × 12. Per chi compra: differenza tra prezzo medio della materia vergine e del materiale recuperato × tonnellate al mese × 12. La CO₂e usa fattori medi di settore (carta 1,1; legno 0,92; plastica 1,85 tCO₂e per tonnellata).",
    fakeTitle: "Una stima, non un'offerta",
    fakeDesc: "I valori mostrati non sono prezzi emessi: materiale, lavorazione e trasporto vengono verificati e confermati nel preventivo.",
    cta: "Richiedi un preventivo",
    materials: { cardboard: "Carta e cartone", wood: "Legno", plastic: "Plastica" } as Record<MaterialKey, string>,
  },
  en: {
    title: "Know your footprint",
    sub: "Pick a material and monthly volume for an indicative estimate of savings and CO₂e avoided. Your quote confirms the real values for your material.",
    material: "Material",
    operation: "What are you doing?",
    sell: "I have material",
    buy: "I'm buying raw material",
    volume: "Monthly volume",
    unit: "tons / month",
    saving: "Estimated annual savings",
    savingNoteSell: "Avoided disposal costs (estimate)",
    savingNoteBuy: "Compared with virgin raw material (estimate)",
    co2: "CO₂e avoided per year",
    co2Note: "Indicative estimate, not a certified emission figure",
    scopeTitle: "Bologna and nearby towns only",
    scopeDesc: "At launch we handle pick-ups and deliveries in Bologna and nearby towns; collection and transport are set out in the quote.",
    methodTitle: "How we calculate",
    method: "For sellers: average avoided disposal cost × tonnes per month × 12. For buyers: the difference between average virgin and recovered material prices × tonnes per month × 12. CO₂e uses sector-average factors (paper 1.1; wood 0.92; plastic 1.85 tCO₂e per tonne).",
    fakeTitle: "An estimate, not an offer",
    fakeDesc: "These figures are not issued prices: material, processing and transport are checked and confirmed in the quote.",
    cta: "Request a quote",
    materials: { cardboard: "Paper & cardboard", wood: "Wood", plastic: "Plastic" } as Record<MaterialKey, string>,
  },
} as const;

export function FootprintPage() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const [material, setMaterial] = useState<MaterialKey>("cardboard");
  const [operation, setOperation] = useState<Operation>("sell");
  const [tons, setTons] = useState(40);

  const result = useMemo(() => {
    const d = DATA[material];
    const yearly = (operation === "sell" ? d.disposal : d.virgin - d.offcut) * tons * 12;
    return { yearly, co2: Math.round(d.co2 * tons * 12) };
  }, [material, operation, tons]);

  const money = useMemo(
    () => new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-GB", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }),
    [lang],
  );

  return (
    <OffcutShell>
      <section data-v="footprint">
        <h1>{c.title}</h1>
        <p className="mut" style={{ marginTop: 6, maxWidth: 560 }}>{c.sub}</p>
        <div className="fp-wrap">
          <div className="card">
            <p className="field-label" id="fp-material-label">{c.material}</p>
            <div className="fp-pills" id="fp-mat-pills" role="group" aria-labelledby="fp-material-label">
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

            <p className="field-label" id="fp-operation-label">{c.operation}</p>
            <div className="seg" id="fp-op-seg" role="group" aria-labelledby="fp-operation-label">
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
              <h3>{c.scopeTitle}</h3>
              <p className="mut" style={{ marginTop: 4, fontSize: ".94rem" }}>{c.scopeDesc}</p>
              <h3 style={{ marginTop: 14 }}>{c.methodTitle}</h3>
              <p className="mut" style={{ marginTop: 4, fontSize: ".94rem" }}>{c.method}</p>
              <p className="mut" style={{ marginTop: 8, fontSize: ".94rem" }}><strong>{c.fakeTitle}.</strong> {c.fakeDesc}</p>
            </div>
            <Link className="btn sm" href="/preventivo">{c.cta}</Link>
          </div>
        </div>
      </section>
    </OffcutShell>
  );
}
