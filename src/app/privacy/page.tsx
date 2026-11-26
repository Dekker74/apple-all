"use client";

import { OffcutShell } from "@/components/offcut/shell";
import { useI18n } from "@/lib/i18n";

const CONTENT = {
  it: {
    title: "Privacy Policy",
    updated: "Ultimo aggiornamento: 23 novembre 2026",
    intro:
      "Offcut è un progetto in fase di validazione. Trattiamo i dati che ci invii solo per rispondere alle tue richieste e per gestire gli account della piattaforma.",
    sections: [
      [
        "Dati raccolti",
        "Quando richiedi un preventivo salviamo materiale, quantità indicativa, zona di ritiro, email, azienda se la indichi ed eventuali note. Quando crei un account, Supabase Auth gestisce email e password; i dati dell'organizzazione restano nel database del progetto.",
      ],
      [
        "Finalità e base giuridica",
        "I dati servono a preparare il preventivo, metterti in contatto con il team e gestire ordini e abbinamenti. La richiesta di preventivo è trattata sulla base del consenso che presti al momento dell'invio e dell'interesse a rispondere a una richiesta commerciale.",
      ],
      [
        "Destinatari",
        "Ci appoggiamo a fornitori tecnici: Supabase per database e autenticazione, Resend per l'invio delle email. Non vendiamo dati a terzi e non li usiamo per pubblicità.",
      ],
      [
        "Conservazione",
        "Le richieste di preventivo sono archiviate nel database del progetto e restano disponibili al team finché non ne chiedi la cancellazione. I dati degli account restano finché l'account è attivo.",
      ],
      [
        "Cookie e analytics",
        "Questa versione non usa cookie di tracciamento né analytics di terze parti. Usiamo solo localStorage per ricordare lingua e tema scelti.",
      ],
      [
        "Diritti",
        "Puoi chiedere accesso, correzione o cancellazione dei tuoi dati usando il modulo preventivo e indicando “Privacy” nelle note. Rispondiamo entro 30 giorni.",
      ],
      ["Contatti", "Per questioni privacy usa il modulo preventivo."],
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 23 November 2026",
    intro:
      "Offcut is a project in validation. We process the data you send only to answer your requests and to manage platform accounts.",
    sections: [
      [
        "Data collected",
        "When you request a quote we store material, approximate quantity, pickup area, email, company if provided and optional notes. When you create an account, Supabase Auth manages email and password; organization data stays in the project database.",
      ],
      [
        "Purpose and legal basis",
        "Data is used to prepare your quote, contact you and manage orders and matches. Quote requests are processed on the basis of the consent you give when submitting and the interest in answering a commercial request.",
      ],
      [
        "Recipients",
        "We rely on technical providers: Supabase for database and authentication, Resend for email delivery. We do not sell data to third parties and do not use it for advertising.",
      ],
      [
        "Retention",
        "Quote requests are stored in the project database and remain available to the team until you ask us to delete them. Account data is kept while the account is active.",
      ],
      [
        "Cookies and analytics",
        "This version uses no tracking cookies and no third-party analytics. We only use localStorage to remember your language and theme choices.",
      ],
      [
        "Rights",
        "You can request access, correction or deletion of your data using the quote form and writing “Privacy” in the notes. We reply within 30 days.",
      ],
      ["Contacts", "For privacy matters, use the quote form."],
    ],
  },
};

export default function PrivacyPage() {
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
