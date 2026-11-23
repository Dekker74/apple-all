"use client";

import Link from "next/link";
import { useState } from "react";
import { OffcutLogo } from "@/components/offcut/logo";
import { OffcutShell } from "@/components/offcut/shell";
import { OffcutBotCard } from "@/components/offcut/bot-card";
import { useI18n } from "@/lib/i18n";

const COPY = {
  it: {
    eyebrow: "MATERIALI IN MOVIMENTO",
    title: "Chi siamo",
    lead: "Crediamo che ciò che avanza non debba essere abbandonato.",
    desc: "Offcut aiuta le aziende a vedere gli scarti industriali come una risorsa. Mettiamo in contatto chi ha materiali riutilizzabili o recuperabili con chi può dar loro un nuovo impiego.",
    start: "Inizia — accedi o registrati",
    footprint: "Calcola la tua impronta",
    ideaEyebrow: "L'IDEA",
    ideaTitle: "Che cos'è l'economia circolare?",
    ideaDesc: "L'economia circolare è un modello di produzione e consumo che mira a mantenere prodotti e materiali in uso il più a lungo possibile. Invece del modello lineare «prendi–produci–butta», privilegia la riduzione dei rifiuti, il riutilizzo, la riparazione, il refurbishment e il riciclo dei materiali.",
    roleEyebrow: "IL NOSTRO RUOLO",
    roleTitle: "Come contribuisce Offcut",
    roleDesc: "Un materiale che un'azienda non può usare può essere un input prezioso per un'altra. Offcut aiuta a scoprire queste opportunità abbinando tipo di materiale, condizione, quantità, prezzo e distanza. La raccolta dello scarto è gratuita e Offcut gestisce ritiro e consegna.",
    principlesTitle: "Dallo scarto alla risorsa",
    principles: [
      ["Colleghiamo", "Mettiamo in contatto chi offre materiali e chi potrebbe usarli."],
      ["Manteniamo il valore in circolazione", "Privilegiamo il riutilizzo diretto quando possibile, poi il recupero e il riciclo."],
      ["Rendiamo gli scambi concreti", "Una volta trovato l'abbinamento, prenoti ritiro o consegna direttamente con Offcut."],
    ],
    teamEyebrow: "CONTATTACI",
    teamTitle: "Conosci il team",
    teamDesc: "Copia un indirizzo email per contattare una delle persone dietro Offcut.",
    copy: "Copia",
    copied: "Copiato",
  },
  en: {
    eyebrow: "MATERIALS IN MOTION",
    title: "Who we are",
    lead: "We believe that what is left over should not be left behind.",
    desc: "Offcut helps businesses see industrial surplus as a resource. We connect companies that have reusable or recoverable materials with companies that can put those materials to work.",
    start: "Get started — Log in or Sign up",
    footprint: "Know your footprint",
    ideaEyebrow: "THE IDEA",
    ideaTitle: "What is the circular economy?",
    ideaDesc: "The circular economy is an approach to production and consumption that aims to keep products and materials in use for as long as possible. Instead of the traditional take–make–dispose model, it prioritises reducing waste, reusing products, repairing, refurbishing and recycling materials.",
    roleEyebrow: "OUR ROLE",
    roleTitle: "How Offcut contributes",
    roleDesc: "A material that one company cannot use may be a valuable input for another. Offcut helps businesses discover those opportunities by matching material type, condition, quantity, price and distance. Collecting scrap is free, and Offcut handles pick-up and drop-off.",
    principlesTitle: "From surplus to resource",
    principles: [
      ["Connect", "Bring material suppliers and potential users together."],
      ["Keep value in circulation", "Prioritise direct reuse where suitable, then recovery and recycling when needed."],
      ["Make exchanges practical", "Once connected, book a pick-up or drop-off directly with Offcut."],
    ],
    teamEyebrow: "GET IN TOUCH",
    teamTitle: "Meet the team",
    teamDesc: "Copy an email address to contact one of the people behind Offcut.",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const EMAILS = [
  "andrea.greco@steamschoolemilia.it",
  "linda.battaglia@steamschoolemilia.it",
  "dario.felice@steamschoolemilia.it",
];

export function AboutPage() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const [copied, setCopied] = useState<string | null>(null);

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <OffcutShell>
      <section className="about-page">
        <div className="about-hero card">
          <div className="about-brand">
            <OffcutLogo href={null} large />
            <div>
              <p className="eyebrow">{c.eyebrow}</p>
              <h1>{c.title}</h1>
            </div>
          </div>
          <p className="about-lead">{c.lead}</p>
          <p className="mut">{c.desc}</p>
          <div className="about-actions">
            <Link className="btn sm" href="/login">{c.start}</Link>
            <Link className="btn sm ghost" href="/impatto">{c.footprint}</Link>
          </div>
        </div>

        <div className="about-grid">
          <article className="card">
            <p className="eyebrow">{c.ideaEyebrow}</p>
            <h2>{c.ideaTitle}</h2>
            <p className="mut">{c.ideaDesc}</p>
          </article>
          <article className="card">
            <p className="eyebrow">{c.roleEyebrow}</p>
            <h2>{c.roleTitle}</h2>
            <p className="mut">{c.roleDesc}</p>
          </article>
        </div>

        <div className="card principles">
          <h2>{c.principlesTitle}</h2>
          <div className="principle-list">
            {c.principles.map(([title, body], index) => (
              <div key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><b>{title}</b><p className="mut">{body}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card contact-card">
          <div>
            <p className="eyebrow">{c.teamEyebrow}</p>
            <h2>{c.teamTitle}</h2>
            <p className="mut">{c.teamDesc}</p>
          </div>
          <div className="email-list">
            {EMAILS.map((email) => (
              <div className="email-row" key={email}>
                <span>{email}</span>
                <button type="button" className="btn sm ghost copy-email" onClick={() => void copyEmail(email)}>
                  {copied === email ? c.copied : c.copy}
                </button>
              </div>
            ))}
          </div>
        </div>

        <OffcutBotCard />
      </section>
    </OffcutShell>
  );
}
