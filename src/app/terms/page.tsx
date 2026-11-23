"use client";

import { OffcutShell } from "@/components/offcut/shell";
import { useI18n } from "@/lib/i18n";

const CONTENT = {
  it: {
    title: "Termini di servizio",
    updated: "Ultimo aggiornamento: 20 novembre 2026",
    intro: "Questi termini valgono per la versione dimostrativa di Offcut. Non costituiscono un contratto commerciale.",
    sections: [
      ["Natura del progetto", "Offcut è un progetto dimostrativo, non una società registrata. Le offerte, i prezzi e gli annunci mostrati sono esempi salvo diverso accordo scritto."],
      ["Iscrizione gratuita", "La creazione di un account è gratuita. La commissione del 6% è prevista solo sugli affari conclusi tramite la piattaforma; lavorazione e trasporto sono voci separate del preventivo."],
      ["Preventivi", "I preventivi hanno validità 14 giorni e sono indicativi fino alla verifica delle specifiche e del controllo qualità."],
      ["Prenotazioni e stime", "Le stime mostrate in fase di prenotazione (trasporto €120, servizio €45, lavorazione per condizione) sono indicative: il preventivo conferma gli importi effettivi prima della conferma."],
      ["Controllo qualità", "Se il materiale non corrisponde alle specifiche concordate, le differenze vengono segnalate e il prezzo ricalcolato prima di procedere."],
      ["Responsabilità", "La piattaforma dimostrativa non garantisce la conclusione di operazioni commerciali e non sostituisce un contratto di fornitura."],
      ["Contatti", "Per domande sui termini: hello@circularlink.app."],
    ],
  },
  en: {
    title: "Terms of service",
    updated: "Last updated: 20 November 2026",
    intro: "These terms apply to the demonstration version of Offcut. They do not constitute a commercial contract.",
    sections: [
      ["Nature of the project", "Offcut is a demonstration project, not a registered company. Offers, prices and listings are examples unless otherwise agreed in writing."],
      ["Free to join", "Creating an account is free. The 6% commission applies only to deals completed through the platform; processing and transport are separate quote line items."],
      ["Quotes", "Quotes are valid for 14 days and remain indicative until specifications and quality checks are confirmed."],
      ["Bookings and estimates", "Estimates shown when booking (transport €120, service €45, processing by condition) are indicative: the quote confirms actual amounts before confirmation."],
      ["Quality control", "If material does not match the agreed specifications, differences are flagged and the price recalculated before proceeding."],
      ["Liability", "The demonstration platform does not guarantee that commercial transactions will be completed and does not replace a supply contract."],
      ["Contacts", "For questions about these terms: hello@circularlink.app."],
    ],
  },
};

export default function TermsPage() {
  const { lang } = useI18n();
  const c = CONTENT[lang];
  return (
    <OffcutShell>
      <p className="eyebrow">Offcut</p>
      <h1 className="mt-3 text-[42px] leading-tight">{c.title}</h1>
      <p className="mt-2 text-[13px] text-muted">{c.updated}</p>
      <p className="mt-6 max-w-[760px] text-[17px] leading-[1.6] text-muted">{c.intro}</p>
      <div className="mt-10 space-y-8">
        {c.sections.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-[24px] leading-tight">{title}</h2>
            <p className="mt-2 max-w-[760px] text-[16px] leading-[1.6] text-muted">{body}</p>
          </section>
        ))}
      </div>
    </OffcutShell>
  );
}
