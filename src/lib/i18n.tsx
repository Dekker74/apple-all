"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "it" | "en";

const STORAGE_KEY = "circularlink.lang";

const it: Record<string, string> = {
  "nav.how": "Come funziona",
  "nav.materials": "Materiali",
  "nav.pricing": "Prezzi",
  "nav.audience": "Per chi è",
  "nav.about": "Chi siamo",
  "nav.impact": "Impatto",
  "nav.signin": "Accedi",
  "nav.cta": "Richiedi un preventivo",
  "nav.ctaShort": "Preventivo",
  "nav.menu": "Apri menu",
  "nav.close": "Chiudi menu",

  "hero.badge": "Nord Italia · carta, legno, plastica",
  "hero.title1": "Materiale in eccedenza,",
  "hero.title2": "non rifiuto.",
  "hero.subtitle":
    "Vendi o trova carta, legno e plastica di recupero. Pensiamo noi ad abbinamento, lavorazione, trasporto e controllo qualità: tu ricevi un solo prezzo.",
  "hero.primary": "Richiedi un preventivo",
  "hero.secondary": "Scopri come funziona",
  "hero.trust1": "Partner verificati",
  "hero.trust2": "Aziende con P.IVA verificata",
  "hero.matchLabel": "Abbinamento",
  "hero.match": "Abbinamento",
  "hero.delivered": "Prezzo consegnato",
  "hero.material": "Carta e cartone · OCC",
  "hero.title": "Ritagli kraft OCC 90/10",
  "hero.location": "GreenLoop Fibres · Bologna",
  "hero.scoreNote": "compatibilità",
  "hero.priceValue": "€4.046,74",
  "hero.reason1": "Composizione compatibile: OCC, cartone ondulato",
  "hero.reason2": "18,5 t disponibili: coprono l'intera richiesta",
  "hero.reason3": "218 km da Milano · entro il raggio di 300 km",
  "hero.process1": "Cernita",
  "hero.process2": "Imballaggio",

  "stat.commission": "commissione solo sugli affari conclusi",
  "stat.quote": "per il tuo preventivo",
  "stat.co2": "di CO₂ con fibre riciclate al posto di quelle vergini",
  "stat.source": "JRC 2018 (Roth et al., 2016) · carta e cartone, emissioni di CO₂",

  "problem.eyebrow": "Il problema",
  "problem.title1": "Il materiale c'è.",
  "problem.title2": "Il mercato no.",
  "problem.today": "Oggi",
  "problem.with": "Con Offcut",
  "problem.today1": "Si trova tra broker e gruppi WhatsApp.",
  "problem.today2": "La qualità si dichiara, non si dimostra.",
  "problem.today3": "Lavorazione, trasporto e QC sono tre fornitori.",
  "problem.with1": "Un solo spazio per offerta, domanda e ordini.",
  "problem.with2": "Specifiche chiare, evidenze e controlli QC.",
  "problem.with3": "Un unico prezzo consegnato, tutto incluso.",

  "how.eyebrow": "Flusso gestito",
  "how.title1": "Dall'eccedenza alla consegna,",
  "how.title2": "in quattro passi.",
  "how.desc":
    "Lavoriamo con partner verificati per cernita, trasporto e QC e restiamo il tuo unico referente.",
  "how.s1t": "Descrivi il materiale",
  "how.s1b": "Dati, foto e disponibilità in linguaggio semplice.",
  "how.s2t": "L'AI abbina domanda e offerta",
  "how.s2b": "Composizione, volume, distanza e budget, con spiegazioni.",
  "how.s3t": "Un preventivo chiaro",
  "how.s3b": "Materiale, 6%, lavorazione, trasporto e IVA in una riga.",
  "how.s4t": "Coordiamo il ritiro",
  "how.s4b": "Partner verificati ritirano, lavorano e certificano.",

  "audience.eyebrow": "Per chi è",
  "audience.title": "Due ruoli, un solo processo.",
  "audience.supplier": "Fornitori",
  "audience.buyer": "Acquirenti",
  "audience.supplierTitle": "Trasforma un costo in ricavo.",
  "audience.buyerTitle": "Specifica una volta, ricevi offerte valide.",
  "audience.supplier1": "Ritiro e documentazione inclusi",
  "audience.supplier2": "Acquirenti qualificati, senza fredde call",
  "audience.supplier3": "Decidi tu disponibilità e vincoli",
  "audience.buyer1": "Costo consegnato prima dell'impegno",
  "audience.buyer2": "Segnalazioni tecniche su ogni abbinamento",
  "audience.buyer3": "Evidenze QC allegate a ogni ordine",
  "audience.cta": "Richiedi un preventivo",
  "audience.ctaSupplier": "Vendi il tuo materiale",
  "audience.ctaBuyer": "Cerca materiale",

  "materials.eyebrow": "3 materiali al lancio",
  "materials.title1": "Pochi materiali.",
  "materials.title2": "Gestiti bene.",
  "materials.desc":
    "Partiamo da carta, legno e plastica: sufficienti per creare mercato senza disperdere competenze.",
  "materials.paper": "Carta e cartone",
  "materials.paperBlurb": "Cartone ondulato (OCC), avanzi di carta kraft e cartiere.",
  "materials.wood": "Legno",
  "materials.woodBlurb": "Pallet, ritagli di legno stagionato e avanzi di falegnameria.",
  "materials.plastic": "Plastica",
  "materials.plasticBlurb": "Scaglie di PET riciclato (rPET) e film LDPE post-industriale.",

  "pricing.eyebrow": "Prezzi",
  "pricing.title1": "Un prezzo.",
  "pricing.title2": "Nessuna sorpresa.",
  "pricing.desc":
    "Ogni abbinamento risponde alle domande che un ufficio acquisti si fa davvero. Nessuna scatola nera.",
  "pricing.q1": "Che materiale è?",
  "pricing.a1": "Materiale, composizione, quantità, stato ed evidenze.",
  "pricing.q2": "Perché fa match?",
  "pricing.a2": "Punteggio su composizione, volume, purezza, distanza e budget.",
  "pricing.q3": "Quanto costa consegnato?",
  "pricing.a3": "Materiale + commissione + lavorazione + trasporto + IVA.",
  "pricing.q4": "Serve lavorazione?",
  "pricing.a4": "Cernita, lavaggio, triturazione, pellettizzazione, essiccazione.",
  "pricing.reliability": "Ogni abbinamento ha un livello di affidabilità",
  "pricing.badgeStrong": "Candidato forte",
  "pricing.badgeReview": "Da verificare",
  "pricing.badgeLow": "Affidabilità bassa",
  "pricing.example": "Esempio illustrativo",
  "pricing.cardTitle": "CL-2026-0146",
  "pricing.cardSub": "Preventivo consegnato",
  "pricing.quoteIssued": "Preventivo emesso",
  "pricing.material": "Materiale · 6,0 t scaglie di PET riciclato",
  "pricing.materialValue": "€3.750,00",
  "pricing.commission": "Commissione Offcut · 6%",
  "pricing.commissionValue": "€225,00",
  "pricing.processing": "Lavorazione · lavaggio + pellettizzazione",
  "pricing.processingValue": "€1.350,00",
  "pricing.transport": "Trasporto · 218 km consolidati",
  "pricing.transportValue": "€742,00",
  "pricing.vat": "IVA · 22%",
  "pricing.vatValue": "€1.334,74",
  "pricing.total": "Totale consegnato",
  "pricing.totalValue": "€7.401,74",
  "pricing.valid": "valido 14 giorni",
  "pricing.note": "Iscrizione gratuita, 6% solo sugli affari conclusi.",

  "faq.eyebrow": "Domande frequenti",
  "faq.title": "Le risposte che contano.",
  "faq.q1": "Qual è il volume minimo?",
  "faq.a1":
    "Per il lancio lavoriamo da 2 tonnellate in su. Sotto quella soglia valutiamo comunque il caso: scrivici e ti rispondiamo entro 48 ore.",
  "faq.q2": "Chi gestisce il trasporto?",
  "faq.a2":
    "Coordiamo noi partner di trasporto verificati. Il costo è già dentro il prezzo consegnato: nessuna fattura separata.",
  "faq.q3": "Cosa succede se il materiale non è conforme?",
  "faq.a3":
    "Il controllo qualità avviene prima del ritiro e alla consegna. Se il materiale non rientra nelle specifiche, segnaliamo le differenze e ricalcoliamo il prezzo prima di procedere.",
  "faq.q4": "Quando si viene pagati?",
  "faq.a4":
    "Il fornitore riceve il pagamento dopo la conferma di consegna e del controllo qualità. Le condizioni esatte sono nel preventivo.",
  "faq.q5": "Quali zone coprite?",
  "faq.a5":
    "Partiamo dal Nord Italia: Lombardia, Veneto, Emilia-Romagna, Piemonte e Trentino-Alto Adige. Altre zone su richiesta.",

  "final.title1": "La prossima tonnellata",
  "final.title2": "può essere circolare.",
  "final.desc": "Raccontaci materiale, quantità e zona. Ti rispondiamo con un preventivo entro 48 ore.",
  "final.primary": "Richiedi un preventivo",
  "final.secondary": "Scopri come funziona",

  "footer.desc": "Marketplace gestito per materiali in eccedenza. Un solo prezzo, dalla raccolta alla consegna.",
  "footer.platform": "Piattaforma",
  "footer.users": "Utenti",
  "footer.company": "Azienda",
  "footer.about": "Chi siamo e contatti",
  "footer.privacy": "Privacy",
  "footer.terms": "Termini",
  "footer.demoLogin": "Prova la demo",
  "footer.disclaimer": "Progetto in fase di validazione · Nord Italia",
  "footer.tagline": "Carta · Legno · Plastica",

  "auth.asideEyebrow": "Il marketplace dei materiali gestiti",
  "auth.asideTitle1": "Il materiale più sostenibile è quello già",
  "auth.asideTitle2": "sopra terra.",
  "auth.aside1": "Abbinamento AI su composizione, volume, purezza e distanza",
  "auth.aside2": "Un solo prezzo consegnato: lavorazione, trasporto e QC inclusi",
  "auth.aside3": "Evidenze e controlli qualità su ogni ordine",
  "auth.statCommission": "commissione",
  "auth.statCategories": "materiali",
  "auth.statQuote": "per il preventivo",
  "auth.chipVetted": "Partner verificati",
  "auth.chipCircular": "Materiali circolari",
  "auth.chipExplain": "Prezzi spiegati",
  "auth.back": "Torna al sito",
  "auth.footer": "Continuando accetti Termini e Privacy Policy.",

  "login.eyebrow": "Bentornato",
  "login.title": "Accedi a Offcut",
  "login.desc": "Ritrova i tuoi abbinamenti, preventivi e ritiri.",
  "login.orEmail": "oppure con email",
  "login.email": "Email di lavoro",
  "login.password": "Password",
  "login.forgot": "Password dimenticata?",
  "login.signin": "Accedi",
  "login.demoTitle": "Prova la demo",
  "login.demoBuyer": "Acquirente · Milano",
  "login.demoSupplier": "Fornitore · Bologna",
  "login.error": "Impossibile accedere. Controlla email e password.",
  "login.demoError": "Accesso demo non riuscito.",
  "login.newHere": "Non hai ancora un workspace?",
  "login.createAccount": "Crea un account",

  "signup.eyebrow": "Inizia gratis",
  "signup.title": "Richiedi un preventivo",
  "signup.desc": "Prima ci racconti il materiale. L'account serve solo dopo.",
  "signup.material": "Materiale",
  "signup.materialPlaceholder": "Seleziona un materiale",
  "signup.quantity": "Quantità indicativa (kg)",
  "signup.zone": "Zona",
  "signup.email": "Email di lavoro",
  "signup.continue": "Continua",
  "signup.back": "Indietro",
  "signup.step2Eyebrow": "Ultimo passo",
  "signup.step2Title": "Crea il tuo workspace",
  "signup.step2Desc": "Dati azienda e P.IVA si aggiungono durante l'onboarding.",
  "signup.name": "Nome e cognome",
  "signup.password": "Password",
  "signup.passwordHint": "Almeno 8 caratteri, un numero, lettere maiuscole e minuscole.",
  "signup.termsError": "Accetta i termini per creare il workspace.",
  "signup.error": "Impossibile creare l'account.",
  "signup.noCompanyData": "Nessun dato aziendale richiesto ora.",
  "signup.terms": "Accetto Termini e Privacy Policy e confermo di essere autorizzato a registrare l'organizzazione.",
  "signup.submit": "Crea account",
  "signup.successTitle": "Richiesta registrata",
  "signup.successDesc": "Ti rispondiamo entro 48 ore. Nel frattempo puoi esplorare la demo.",
  "signup.haveAccount": "Hai già un workspace?",
  "signup.signin": "Accedi",

  "quote.eyebrow": "Preventivo",
  "quote.title": "Richiedi un preventivo",
  "quote.desc": "Pochi campi, nessuna password. Ti rispondiamo entro 48 ore.",
  "quote.intentLabel": "Cosa ti serve?",
  "quote.intentHave": "Ho materiale",
  "quote.intentSearch": "Cerco materiale",
  "quote.notes": "Note (facoltative)",
  "quote.quantityPlaceholder": "es. 5.000",
  "quote.privacyPrefix": "Inviando accetti la",
  "quote.submit": "Invia richiesta",
  "quote.success": "Richiesta ricevuta, ti rispondiamo entro 48 ore",
  "quote.successDesc": "Grazie. Un nostro referente ti risponderà all'indirizzo indicato.",
  "quote.back": "Torna alla home",
  "quote.company": "Azienda (facoltativa)",
  "quote.companyPlaceholder": "Ragione sociale",
  "quote.consent": "Accetto l'informativa privacy e l'uso dei dati per essere ricontattato su questa richiesta.",
  "quote.consentError": "Per inviare la richiesta devi accettare l'informativa privacy.",
  "quote.sending": "Invio in corso…",
  "quote.errorTitle": "Non siamo riusciti a inviare la richiesta",
  "quote.errorValidationTitle": "Controlla i campi",
  "quote.errorGeneric": "Riprova tra qualche istante. Se il problema continua, scrivi a hello@circularlink.app.",
  "quote.errorValidation": "Controlla i campi evidenziati qui sotto.",
  "quote.errorRate": "Hai inviato troppe richieste da questo indirizzo. Riprova tra qualche minuto.",
  "quote.errorNetwork": "Connessione assente o risposta non valida. Controlla la rete e riprova.",
  "quote.reference": "Riferimento",
  "quote.successNext": "Cosa succede ora",
  "quote.next1": "Verifichiamo specifiche, volumi e zona di ritiro.",
  "quote.next2": "Ti inviamo un preventivo con un solo prezzo consegnato.",
  "quote.next3": "Se ti convince, organizziamo ritiro, lavorazione e trasporto.",
  "quote.successEmail": "Ti abbiamo inviato una copia della richiesta via email.",
  "quote.successNoEmail": "La conferma automatica non è partita. La richiesta è registrata: se non ricevi risposta entro 48 ore lavorative, scrivi a hello@circularlink.app citando il riferimento.",
  "quote.successNoStorage": "L'archiviazione automatica non è disponibile. Conserva il riferimento e scrivi a hello@circularlink.app.",
  "quote.manual": "Scrivi direttamente a hello@circularlink.app",
  "quote.panelTitle": "Cosa ottieni",
  "quote.panel1": "Risposta entro 48 ore lavorative.",
  "quote.panel2": "Un prezzo consegnato: materiale, lavorazione e trasporto.",
  "quote.panel3": "Specifiche e controllo qualità documentati.",
  "quote.panel4": "Nessun costo per chiedere il preventivo.",
  "quote.panelNote": "Se i volumi non sono ancora definiti, indica una stima: la sistemiamo insieme.",
  "quote.fieldsRequired": "I campi contrassegnati con * sono obbligatori.",
  "quote.errEmail": "Inserisci un indirizzo email valido.",
  "quote.errQuantity": "Indica una quantità tra 1 e 1.000.000 kg.",
  "quote.errZone": "Indica la città o la provincia di ritiro.",
  "quote.errMaterial": "Seleziona un materiale.",

  "forgot.title": "Recupera la password",
  "forgot.desc": "Inserisci la tua email: ti inviamo il link per reimpostare la password.",
  "forgot.submit": "Invia link",
  "forgot.success": "Controlla la tua casella di posta.",
  "forgot.error": "Recupero password non disponibile in questa versione.",
  "forgot.back": "Torna al login",
};

const en: Record<string, string> = {
  "nav.how": "How it works",
  "nav.materials": "Materials",
  "nav.pricing": "Pricing",
  "nav.audience": "Who it's for",
  "nav.about": "About",
  "nav.impact": "Impact",
  "nav.signin": "Sign in",
  "nav.cta": "Request a quote",
  "nav.ctaShort": "Quote",
  "nav.menu": "Open menu",
  "nav.close": "Close menu",

  "hero.badge": "Northern Italy · paper, wood, plastic",
  "hero.title1": "Surplus material,",
  "hero.title2": "not surplus waste.",
  "hero.subtitle":
    "Sell or source recovered paper, wood and plastic. We handle matching, processing, transport and QC: you get one single price.",
  "hero.primary": "Request a quote",
  "hero.secondary": "See how it works",
  "hero.trust1": "Vetted partners",
  "hero.trust2": "VAT-verified companies",
  "hero.matchLabel": "Match",
  "hero.match": "Match",
  "hero.delivered": "Delivered price",
  "hero.material": "Paper & cardboard · OCC",
  "hero.title": "Kraft OCC offcuts 90/10",
  "hero.location": "GreenLoop Fibres · Bologna",
  "hero.scoreNote": "compatibility",
  "hero.priceValue": "€4,046.74",
  "hero.reason1": "Compatible composition: OCC, corrugated board",
  "hero.reason2": "18.5 t available — the full request is covered",
  "hero.reason3": "218 km from Milan · within a 300 km radius",
  "hero.process1": "Sorting",
  "hero.process2": "Baling",

  "stat.commission": "commission on completed deals only",
  "stat.quote": "for your quote",
  "stat.co2": "of CO₂ with recycled fibre instead of virgin fibre",
  "stat.source": "JRC 2018 (Roth et al., 2016) · paper and board, CO₂ emissions",

  "problem.eyebrow": "The gap",
  "problem.title1": "The material exists.",
  "problem.title2": "The market doesn't.",
  "problem.today": "Today",
  "problem.with": "With Offcut",
  "problem.today1": "Found via brokers and WhatsApp groups.",
  "problem.today2": "Quality is claimed, not evidenced.",
  "problem.today3": "Processing, transport and QC mean three vendors.",
  "problem.with1": "One workspace for supply, demand and orders.",
  "problem.with2": "Clear specs, evidence and QC checkpoints.",
  "problem.with3": "One delivered price, everything included.",

  "how.eyebrow": "Managed flow",
  "how.title1": "From surplus to delivery,",
  "how.title2": "in four moves.",
  "how.desc":
    "We work with vetted partners for sorting, transport and QC, and stay your single point of contact.",
  "how.s1t": "Describe the material",
  "how.s1b": "Facts, photos and availability in plain language.",
  "how.s2t": "AI matches real demand",
  "how.s2b": "Composition, volume, distance and budget, explained.",
  "how.s3t": "One clear quote",
  "how.s3b": "Material, 6%, processing, transport and VAT in one line.",
  "how.s4t": "We coordinate collection",
  "how.s4b": "Vetted partners collect, upgrade and certify.",

  "audience.eyebrow": "Who it's for",
  "audience.title": "Two roles, one process.",
  "audience.supplier": "Suppliers",
  "audience.buyer": "Buyers",
  "audience.supplierTitle": "Turn a cost into revenue.",
  "audience.buyerTitle": "Specify once, get qualified supply.",
  "audience.supplier1": "Collection and paperwork included",
  "audience.supplier2": "Qualified buyers, no cold outreach",
  "audience.supplier3": "You control availability and constraints",
  "audience.buyer1": "Delivered cost before you commit",
  "audience.buyer2": "Technical flags on every match",
  "audience.buyer3": "QC evidence with every order",
  "audience.cta": "Request a quote",
  "audience.ctaSupplier": "Sell your material",
  "audience.ctaBuyer": "Find material",

  "materials.eyebrow": "3 materials at launch",
  "materials.title1": "Few materials.",
  "materials.title2": "Done properly.",
  "materials.desc":
    "We start with paper, wood and plastic: enough to build a market without spreading thin.",
  "materials.paper": "Paper & cardboard",
  "materials.paperBlurb": "Corrugated board (OCC), kraft paper offcuts and mill surplus.",
  "materials.wood": "Wood",
  "materials.woodBlurb": "Pallets, kiln-dried offcuts and workshop remnants.",
  "materials.plastic": "Plastic",
  "materials.plasticBlurb": "Recycled PET flakes (rPET) and post-industrial LDPE film.",

  "pricing.eyebrow": "Pricing",
  "pricing.title1": "One price.",
  "pricing.title2": "No surprises.",
  "pricing.desc":
    "Every match answers the questions a procurement team actually asks. No black box.",
  "pricing.q1": "What is it?",
  "pricing.a1": "Material, composition, quantity, condition and evidence.",
  "pricing.q2": "Why does it match?",
  "pricing.a2": "Score across composition, volume, purity, distance and budget.",
  "pricing.q3": "What does it cost delivered?",
  "pricing.a3": "Material + commission + processing + transport + VAT.",
  "pricing.q4": "Is processing needed?",
  "pricing.a4": "Sorting, washing, shredding, pelletizing, drying or baling.",
  "pricing.reliability": "Every match has a reliability level",
  "pricing.badgeStrong": "Strong candidate",
  "pricing.badgeReview": "Needs review",
  "pricing.badgeLow": "Low reliability",
  "pricing.example": "Illustrative example",
  "pricing.cardTitle": "CL-2026-0146",
  "pricing.cardSub": "Delivered quote",
  "pricing.quoteIssued": "Quote issued",
  "pricing.material": "Material · 6.0 t recycled PET flakes",
  "pricing.materialValue": "€3,750.00",
  "pricing.commission": "Offcut commission · 6%",
  "pricing.commissionValue": "€225.00",
  "pricing.processing": "Processing · washing + pelletizing",
  "pricing.processingValue": "€1,350.00",
  "pricing.transport": "Transport · 218 km consolidated",
  "pricing.transportValue": "€742.00",
  "pricing.vat": "VAT · 22%",
  "pricing.vatValue": "€1,334.74",
  "pricing.total": "Total delivered",
  "pricing.totalValue": "€7,401.74",
  "pricing.valid": "valid 14 days",
  "pricing.note": "Free to join, 6% only on completed deals.",

  "faq.eyebrow": "FAQ",
  "faq.title": "The answers that matter.",
  "faq.q1": "What is the minimum volume?",
  "faq.a1":
    "At launch we work from 2 tonnes upward. Below that we still assess the case: write to us and we reply within 48 hours.",
  "faq.q2": "Who handles transport?",
  "faq.a2":
    "We coordinate vetted transport partners. The cost is already in the delivered price: no separate invoice.",
  "faq.q3": "What if the material is not conforming?",
  "faq.a3":
    "Quality is checked before collection and on delivery. If the material is off spec, we flag the differences and recalculate before proceeding.",
  "faq.q4": "When do suppliers get paid?",
  "faq.a4":
    "Suppliers are paid after delivery and quality confirmation. Exact terms are in the quote.",
  "faq.q5": "Which areas do you cover?",
  "faq.a5":
    "We start in Northern Italy: Lombardy, Veneto, Emilia-Romagna, Piedmont and Trentino-Alto Adige. Other areas on request.",

  "final.title1": "Make the next tonne",
  "final.title2": "circular.",
  "final.desc": "Tell us material, quantity and area. We reply with a quote within 48 hours.",
  "final.primary": "Request a quote",
  "final.secondary": "See how it works",

  "footer.desc": "Managed marketplace for surplus materials. One price, from collection to delivery.",
  "footer.platform": "Platform",
  "footer.users": "Users",
  "footer.company": "Company",
  "footer.about": "About and contacts",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.demoLogin": "Try the demo",
  "footer.disclaimer": "Project in validation · Northern Italy",
  "footer.tagline": "Paper · Wood · Plastic",

  "auth.asideEyebrow": "The managed materials marketplace",
  "auth.asideTitle1": "The most sustainable material is the one already",
  "auth.asideTitle2": "above ground.",
  "auth.aside1": "AI matching across composition, volume, purity and distance",
  "auth.aside2": "One delivered price — processing, transport and QC included",
  "auth.aside3": "Evidence and quality checkpoints on every order",
  "auth.statCommission": "commission",
  "auth.statCategories": "materials",
  "auth.statQuote": "to quote",
  "auth.chipVetted": "Vetted partners",
  "auth.chipCircular": "Circular materials",
  "auth.chipExplain": "Explained prices",
  "auth.back": "Back to site",
  "auth.footer": "By continuing you accept our Terms and Privacy Policy.",

  "login.eyebrow": "Welcome back",
  "login.title": "Sign in to Offcut",
  "login.desc": "Access your matches, quotes and logistics pipeline.",
  "login.orEmail": "or with email",
  "login.email": "Work email",
  "login.password": "Password",
  "login.forgot": "Forgot password?",
  "login.signin": "Sign in",
  "login.demoTitle": "Try the demo",
  "login.demoBuyer": "Buyer · Milan",
  "login.demoSupplier": "Supplier · Bologna",
  "login.error": "Unable to sign in. Check your email and password.",
  "login.demoError": "Demo sign-in failed.",
  "login.newHere": "New to Offcut?",
  "login.createAccount": "Create an account",

  "signup.eyebrow": "Start free",
  "signup.title": "Request a quote",
  "signup.desc": "First tell us about the material. The account comes after.",
  "signup.material": "Material",
  "signup.materialPlaceholder": "Select a material",
  "signup.quantity": "Approx. quantity (kg)",
  "signup.zone": "Area",
  "signup.email": "Work email",
  "signup.continue": "Continue",
  "signup.back": "Back",
  "signup.step2Eyebrow": "Last step",
  "signup.step2Title": "Create your workspace",
  "signup.step2Desc": "Company details and VAT number come later, during onboarding.",
  "signup.name": "Full name",
  "signup.password": "Password",
  "signup.passwordHint": "At least 8 characters, one number, upper and lower case.",
  "signup.termsError": "Accept the terms to create your workspace.",
  "signup.error": "Unable to create the account.",
  "signup.noCompanyData": "No company details needed now.",
  "signup.terms":
    "I agree to the Terms and Privacy Policy, and confirm I am authorised to register this organization.",
  "signup.submit": "Create account",
  "signup.successTitle": "Request recorded",
  "signup.successDesc": "We reply within 48 hours. Meanwhile you can explore the demo.",
  "signup.haveAccount": "Already have a workspace?",
  "signup.signin": "Sign in",

  "quote.eyebrow": "Quote",
  "quote.title": "Request a quote",
  "quote.desc": "A few fields, no password. We reply within 48 hours.",
  "quote.intentLabel": "What do you need?",
  "quote.intentHave": "I have material",
  "quote.intentSearch": "I'm looking for material",
  "quote.notes": "Notes (optional)",
  "quote.quantityPlaceholder": "e.g. 5,000",
  "quote.privacyPrefix": "By submitting you accept the",
  "quote.submit": "Send request",
  "quote.success": "Request received, we'll reply within 48 hours",
  "quote.successDesc": "Thank you. A member of our team will reply to the address you provided.",
  "quote.back": "Back to home",
  "quote.company": "Company (optional)",
  "quote.companyPlaceholder": "Company name",
  "quote.consent": "I accept the privacy policy and the use of my data to be contacted about this request.",
  "quote.consentError": "You must accept the privacy policy to send the request.",
  "quote.sending": "Sending…",
  "quote.errorTitle": "We couldn't send your request",
  "quote.errorValidationTitle": "Check the fields",
  "quote.errorGeneric": "Try again in a moment. If the problem persists, write to hello@circularlink.app.",
  "quote.errorValidation": "Check the highlighted fields below.",
  "quote.errorRate": "Too many requests from this address. Try again in a few minutes.",
  "quote.errorNetwork": "No connection or invalid response. Check your network and try again.",
  "quote.reference": "Reference",
  "quote.successNext": "What happens next",
  "quote.next1": "We check specifications, volumes and pickup area.",
  "quote.next2": "We send a quote with one delivered price.",
  "quote.next3": "If it works for you, we arrange pickup, processing and transport.",
  "quote.successEmail": "We emailed you a copy of the request.",
  "quote.successNoEmail": "The automatic confirmation did not go out. Your request is recorded: if you don't hear from us within 48 working hours, write to hello@circularlink.app quoting the reference.",
  "quote.successNoStorage": "Automatic storage is unavailable. Keep the reference and write to hello@circularlink.app.",
  "quote.manual": "Write directly to hello@circularlink.app",
  "quote.panelTitle": "What you get",
  "quote.panel1": "A reply within 48 working hours.",
  "quote.panel2": "One delivered price: material, processing and transport.",
  "quote.panel3": "Documented specifications and quality control.",
  "quote.panel4": "No cost to request a quote.",
  "quote.panelNote": "If volumes are not final yet, give an estimate: we'll adjust it together.",
  "quote.fieldsRequired": "Fields marked * are required.",
  "quote.errEmail": "Enter a valid email address.",
  "quote.errQuantity": "Enter a quantity between 1 and 1,000,000 kg.",
  "quote.errZone": "Enter the pickup city or province.",
  "quote.errMaterial": "Select a material.",

  "forgot.title": "Reset your password",
  "forgot.desc": "Enter your email and we send you a reset link.",
  "forgot.submit": "Send link",
  "forgot.success": "Check your inbox.",
  "forgot.error": "Password reset is unavailable in this version.",
  "forgot.back": "Back to sign in",
};

const dictionaries: Record<Lang, Record<string, string>> = { it, en };

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "it" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggle = useCallback(() => setLangState((v) => (v === "it" ? "en" : "it")), []);
  const t = useCallback((key: string) => dictionaries[lang][key] ?? dictionaries.it[key] ?? key, [lang]);

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, toggle, t }), [lang, setLang, toggle, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={`inline-flex items-center rounded-full border border-line bg-white/70 p-0.5 text-[11.5px] ${className ?? ""}`}
      role="group"
      aria-label="Language"
    >
      {(["it", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2 py-1 font-mono uppercase tracking-[0.1em] transition-colors ${
            lang === code ? "bg-forest text-paper" : "text-muted hover:text-ink"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
