import type { Lang } from "@/lib/i18n";

const it = {
  onRequest: "Su preventivo",
  hero: {
    eyebrow: "ECONOMIA CIRCOLARE INDUSTRIALE · BOLOGNA",
    title: "Lo scarto è solo l'inizio.",
    subtitle:
      "La piattaforma che connette le aziende per acquistare, vendere e valorizzare materiali industriali.",
    sell: "Vendi materiali",
    buy: "Trova materiali",
    note: "Un solo account per vendere e acquistare. Nessuna scelta di ruolo.",
    previewLabel: "Anteprima di una scheda materiale",
    visual: {
      category: "Carta e cartone · OCC",
      status: "Disponibile a Bologna",
      priceLabel: "Prezzo del materiale",
      price: "Su preventivo",
      flowLabel: "Flusso gestito",
      imageAlt: "Balle di cartone ondulato in magazzino",
      caption: "Dalla descrizione alla consegna, in un unico flusso.",
      steps: ["Ritiro", "Lavorazione", "Consegna"],
    },
    strip: [
      { value: "2 passi", label: "per iniziare" },
      { value: "IT / EN", label: "in ogni scheda" },
      { value: "Bologna", label: "area operativa iniziale" },
    ],
  },
  process: {
    eyebrow: "COME FUNZIONA OFFCUT",
    title: "Dal materiale in eccesso all'ordine, senza passaggi dispersi.",
    desc:
      "Descrivi il materiale o la richiesta. Offcut abbina domanda e offerta, rende leggibili i costi e coordina ciò che serve fino alla consegna.",
    steps: [
      {
        n: "01",
        title: "Pubblica o cerca",
        body: "Form brevi, foto del venditore e condizioni selezionabili. Non devi scegliere se essere buyer o supplier.",
      },
      {
        n: "02",
        title: "Ricevi match spiegati",
        body: "Composizione, quantità, condizioni e distanza. Ogni suggerimento indica perché è stato proposto.",
      },
      {
        n: "03",
        title: "Scarica il preventivo",
        body: "Materiale, commissione, trasporto e lavorazione in voci distinte. Se serve una lavorazione, il costo arriva su preventivo.",
      },
      {
        n: "04",
        title: "Conferma la consegna",
        body: "La data è scelta dall'acquirente. Offcut coordina ritiro, processamento e consegna dell'ordine.",
      },
    ],
  },
  audience: {
    eyebrow: "PER CHI È",
    title: "Due esigenze, un solo processo.",
    desc: "Buyer e supplier lavorano nello stesso marketplace, con dati chiari e azioni diverse.",
    shared:
      "Un account, entrambe le attività attive: puoi pubblicare materiali e inviare richieste senza creare due profili.",
    buyer: {
      eyebrow: "ACQUIRENTI",
      title: "Specifica una volta. Valuta offerte comprensibili.",
      body: "Quantità, condizioni, zona e data di consegna: la richiesta resta breve e le risposte arrivano con il motivo del match.",
      bullets: [
        "Select allineate ai campi che servono davvero",
        "Condizioni multiple selezionabili",
        "Data di consegna scelta dall'acquirente",
        "Preventivo scaricabile con tutte le voci",
      ],
      cta: "Trova materiali",
      href: "/app/marketplace",
    },
    supplier: {
      eyebrow: "FORNITORI",
      title: "Trasforma un'eccedenza in un materiale cercato.",
      body: "Pubblichi foto e dati essenziali, poi decidi disponibilità e vincoli. Le richieste e i messaggi restano nello stesso spazio.",
      bullets: [
        "Form brevi con upload delle foto",
        "Ricorrenza settimanale per le eccedenze",
        "Disponibilità e condizioni sotto il tuo controllo",
        "Match, richieste e inbox collegati",
      ],
      cta: "Vendi materiali",
      href: "/app/listings/new",
    },
  },
  materials: {
    eyebrow: "MATERIALI TRATTATI",
    title: "Pochi materiali. Gestiti bene.",
    desc:
      "Al lancio operiamo a Bologna su tre famiglie di materiali: abbastanza per creare mercato senza disperdere competenze.",
    items: [
      {
        image: "/images/material-carta.svg",
        alt: "Balle di cartone ondulato in magazzino",
        name: "Carta e cartone",
        blurb: "Cartone ondulato OCC, avanzi kraft e eccedenze di cartiera.",
        tag: "OCC 90/10",
      },
      {
        image: "/images/material-legno.svg",
        alt: "Pallet e ritagli di legno in falegnameria",
        name: "Legno",
        blurb: "Pallet, ritagli stagionati e avanzi di falegnameria.",
        tag: "Pallet e ritagli",
      },
      {
        image: "/images/material-plastica.svg",
        alt: "Scaglie di PET riciclato in contenitore trasparente",
        name: "Plastica",
        blurb: "Scaglie di PET riciclato e film LDPE post-industriale.",
        tag: "rPET e LDPE",
      },
    ],
  },
  marketplace: {
    eyebrow: "ANTEPRIMA MARKETPLACE",
    title: "Le specifiche prima di tutto.",
    desc:
      "Una lista pensata per chi decide in fretta: materiale, quantità, condizione, zona e prezzo. Quando il prezzo non è ancora definito, compare in modo esplicito.",
    previewLabel: "Anteprima dell'interfaccia del marketplace",
    previewTitle: "Marketplace · Materiali",
    filtersLabel: "Filtri",
    resultsLabel: "Risultati",
    filters: ["Materiale", "Quantità", "Zona", "Condizione"],
    rows: [
      { title: "Carta e cartone · OCC 90/10", sub: "Quantità e condizioni nella scheda", zone: "Bologna", availability: "Disponibilità su richiesta" },
      { title: "Legno · Pallet e ritagli", sub: "Quantità e condizioni nella scheda", zone: "Bologna", availability: "Disponibilità su richiesta" },
      { title: "Plastica · rPET", sub: "Quantità e condizioni nella scheda", zone: "Bologna", availability: "Disponibilità su richiesta" },
    ],
    note: "Anteprima dell'interfaccia: nessun dato di esempio o prezzo inventato.",
    cta: "Apri il marketplace",
    href: "/app/marketplace",
  },
  matching: {
    eyebrow: "MATCHING",
    title: "Un match si capisce dal motivo, non da un punteggio.",
    desc:
      "Offcut mette in relazione domanda e offerta e racconta quali criteri hanno portato al suggerimento. Puoi passare dalla spiegazione alla conversazione senza perdere il contesto.",
    requestLabel: "RICHIESTA",
    requestValue: "Materiale, quantità, condizioni, consegna",
    supplyLabel: "OFFERTA",
    supplyValue: "Materiale disponibile a Bologna",
    reasonsTitle: "Criteri del suggerimento",
    reasons: [
      "Stesso materiale e composizione",
      "Quantità compatibile",
      "Condizioni dichiarate dal venditore",
      "Distanza dall'area di Bologna",
    ],
    note: "Nessuna percentuale di compatibilità inventata: vedi le ragioni, poi decidi.",
    cta: "Vedi i match",
    href: "/app/matches",
  },
  logistics: {
    eyebrow: "TRASPORTO E PROCESSAMENTO",
    title: "Un solo percorso, fino alla consegna.",
    desc:
      "La data di consegna è scelta dall'acquirente. Offcut coordina ritiro, lavorazione e consegna, mantenendo visibile lo stato dell'ordine.",
    steps: [
      { n: "01", title: "Ordine confermato", body: "Materiale, quantità, condizioni e data di consegna sono definiti." },
      { n: "02", title: "Ritiro e lavorazione", body: "Ritiro, cernita e processamento vengono coordinati dal team Offcut." },
      { n: "03", title: "Consegna programmata", body: "L'acquirente segue lo stato dell'ordine fino alla consegna." },
    ],
    note: "Trasporto e processamento sono voci esplicite del preventivo: nessun addebito nascosto.",
  },
  impact: {
    eyebrow: "IMPATTO AMBIENTALE",
    title: "Prima di scegliere, prova Know Your Footprint.",
    desc:
      "Il calcolatore restituisce una stima a partire da materiale e quantità. Formule e fonti restano consultabili: una stima non è una certificazione.",
    previewLabel: "Anteprima del calcolatore Know Your Footprint",
    loopTitle: "Dallo scarto alla risorsa",
    loop: ["Riutilizzo diretto", "Recupero", "Riciclo"],
    fieldMaterial: "Materiale",
    fieldQuantity: "Quantità",
    fieldResult: "Stima",
    fieldSources: "Fonti e formula",
    placeholderMaterial: "Seleziona una categoria",
    placeholderQuantity: "Inserisci quantità e unità",
    placeholderResult: "La stima compare dopo i dati",
    sources: "Il dettaglio del calcolo resta consultabile",
    cta: "Calcola l'impatto",
    href: "/impatto",
  },
  platform: {
    eyebrow: "ANTEPRIMA DELLA PIATTAFORMA",
    title: "Un ambiente di lavoro, non un'altra vetrina.",
    desc:
      "Marketplace, match, ordini e messaggi convivono nello stesso spazio. Tutto disponibile in italiano e in inglese, anche nelle singole schede.",
    previewLabel: "Anteprima dell'interfaccia della piattaforma",
    sidebarLabel: "Navigazione della piattaforma",
    items: [
      { label: "Marketplace", detail: "Cerca e filtra materiali" },
      { label: "Match", detail: "Suggerimenti spiegati" },
      { label: "Ordini", detail: "Stato e consegna" },
      { label: "Inbox", detail: "Conversazioni collegate" },
      { label: "Impostazioni", detail: "Lingua e profilo" },
    ],
    emptyMatch: "Nessun match recente",
    emptyOrders: "Nessun ordine in corso",
    emptyInbox: "Nessun messaggio recente",
    note: "Gli spazi vuoti sono parte del prodotto: non mostriamo dati inventati.",
    cta: "Entra nella piattaforma",
    href: "/app/dashboard",
  },
  company: {
    eyebrow: "CHI SIAMO",
    title: "Materiali in movimento, con un solo referente.",
    desc:
      "Offcut nasce a Bologna per rendere concreto lo scambio di materiali industriali tra aziende. Mettiamo in contatto chi ha un'eccedenza e chi può usarla come input, poi coordiniamo ritiro, lavorazione e consegna.",
    secondary: "Nessun abbonamento, nessun paywall: le voci economiche sono definite prima della conferma.",
    cta: "Conosci Offcut",
    href: "/chi-siamo",
    markAlt: "Logo Offcut",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Le risposte che contano.",
    items: [
      {
        q: "Devo scegliere se sono buyer o supplier?",
        a: "No. Un solo account abilita entrambe le attività: puoi pubblicare materiali e inviare richieste dallo stesso spazio, senza doppio profilo.",
      },
      {
        q: "Come funziona l'onboarding?",
        a: "Sono previsti 2 passi essenziali. I form restano brevi e chiedono solo le informazioni necessarie per pubblicare o cercare materiale.",
      },
      {
        q: "Quanto costa iniziare?",
        a: "Su preventivo. Non ci sono abbonamenti: materiale, commissione, trasporto e eventuale lavorazione sono indicati prima della conferma.",
      },
      {
        q: "Dove opera Offcut?",
        a: "Al lancio operiamo solo a Bologna e nelle aree limitrofe. La zona è un campo esplicito nelle richieste e nei filtri.",
      },
      {
        q: "Posso caricare foto e scegliere più condizioni?",
        a: "Sì. Il venditore carica le foto e seleziona più condizioni; l'acquirente sceglie la data di consegna e scarica il preventivo.",
      },
      {
        q: "Le schede sono disponibili in inglese?",
        a: "Sì. Interfaccia, schede materiale e FAQ sono complete in italiano e in inglese.",
      },
      {
        q: "Offcut AI può agire al posto mio?",
        a: "No. L'assistente risponde nella tua lingua e aiuta a orientarsi nella piattaforma; non esegue operazioni o invia comunicazioni senza autorizzazione.",
      },
      {
        q: "Posso pubblicare materiale ricorrente?",
        a: "Sì. Le eccedenze possono essere pianificate con ricorrenza settimanale, mantenendo aggiornata la disponibilità.",
      },
    ],
  },
  final: {
    eyebrow: "INIZIA ORA",
    title: "Il tuo prossimo materiale è già in circolo.",
    desc: "Pubblica un'eccedenza o cerca un input. Offcut coordina il resto con costi chiari prima della conferma.",
    sell: "Vendi materiali",
    buy: "Trova materiali",
  },
  footer: {
    tagline: "Materiali in movimento.",
    navLabel: "Link del footer",
    groups: [
      {
        title: "Piattaforma",
        links: [
          { label: "Marketplace", href: "/app/marketplace" },
          { label: "Match", href: "/app/matches" },
          { label: "Ordini", href: "/app/orders" },
          { label: "Preventivo", href: "/preventivo" },
        ],
      },
      {
        title: "Offcut",
        links: [
          { label: "Come funziona", href: "/#come-funziona" },
          { label: "Chi siamo", href: "/chi-siamo" },
          { label: "Impatto", href: "/impatto" },
          { label: "Contatti", href: "/preventivo" },
        ],
      },
      {
        title: "Legale",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Termini", href: "/terms" },
          { label: "Prezzi", href: "/preventivo" },
        ],
      },
    ],
    domain: "Offcut · Emilia-Romagna",
    rights: "© 2026 Offcut. Tutti i diritti riservati.",
  },
};

const en: typeof it = {
  onRequest: "On request",
  hero: {
    eyebrow: "INDUSTRIAL CIRCULAR ECONOMY · BOLOGNA",
    title: "Waste is only the beginning.",
    subtitle:
      "The platform that connects companies to buy, sell and add value to industrial materials.",
    sell: "Sell materials",
    buy: "Find materials",
    note: "One account to sell and buy. No role to choose.",
    previewLabel: "Preview of a material listing",
    visual: {
      category: "Paper & cardboard · OCC",
      status: "Available in Bologna",
      priceLabel: "Material price",
      price: "On request",
      flowLabel: "Managed flow",
      imageAlt: "Bales of corrugated cardboard in a warehouse",
      caption: "From description to delivery, in one flow.",
      steps: ["Collection", "Processing", "Delivery"],
    },
    strip: [
      { value: "2 steps", label: "to get started" },
      { value: "IT / EN", label: "on every listing" },
      { value: "Bologna", label: "initial operating area" },
    ],
  },
  process: {
    eyebrow: "HOW OFFCUT WORKS",
    title: "From surplus material to order, without scattered steps.",
    desc:
      "Describe the material or the request. Offcut matches supply and demand, makes costs readable and coordinates everything through delivery.",
    steps: [
      {
        n: "01",
        title: "Publish or search",
        body: "Short forms, seller photos and selectable conditions. You do not have to choose between buyer or supplier.",
      },
      {
        n: "02",
        title: "Receive explained matches",
        body: "Composition, quantity, conditions and distance. Every suggestion says why it was proposed.",
      },
      {
        n: "03",
        title: "Download the quote",
        body: "Material, commission, transport and processing as separate lines. When processing is needed, its cost is quoted.",
      },
      {
        n: "04",
        title: "Confirm delivery",
        body: "The buyer chooses the date. Offcut coordinates collection, processing and order delivery.",
      },
    ],
  },
  audience: {
    eyebrow: "WHO IT IS FOR",
    title: "Two needs, one process.",
    desc: "Buyers and suppliers work in the same marketplace, with clear data and different actions.",
    shared:
      "One account, both activities active: you can publish materials and send requests without creating two profiles.",
    buyer: {
      eyebrow: "BUYERS",
      title: "Specify once. Assess understandable supply.",
      body: "Quantity, conditions, area and delivery date: the request stays short and replies include the reason for the match.",
      bullets: [
        "Selects aligned with the fields you actually use",
        "Multiple conditions can be selected",
        "Delivery date chosen by the buyer",
        "Downloadable quote with every line item",
      ],
      cta: "Find materials",
      href: "/app/marketplace",
    },
    supplier: {
      eyebrow: "SUPPLIERS",
      title: "Turn surplus into material someone needs.",
      body: "You upload photos and essential data, then control availability and constraints. Requests and messages stay in one place.",
      bullets: [
        "Short forms with photo upload",
        "Weekly recurrence for recurring surplus",
        "Availability and conditions under your control",
        "Linked matches, requests and inbox",
      ],
      cta: "Sell materials",
      href: "/app/listings/new",
    },
  },
  materials: {
    eyebrow: "MATERIALS HANDLED",
    title: "Few materials. Properly handled.",
    desc:
      "At launch we operate in Bologna across three material families: enough to build a market without spreading thin.",
    items: [
      {
        image: "/images/material-carta.svg",
        alt: "Bales of corrugated cardboard in a warehouse",
        name: "Paper & cardboard",
        blurb: "Corrugated board OCC, kraft offcuts and mill surplus.",
        tag: "OCC 90/10",
      },
      {
        image: "/images/material-legno.svg",
        alt: "Pallets and wood offcuts in a workshop",
        name: "Wood",
        blurb: "Pallets, kiln-dried offcuts and workshop remnants.",
        tag: "Pallets & offcuts",
      },
      {
        image: "/images/material-plastica.svg",
        alt: "Recycled PET flakes in a transparent container",
        name: "Plastic",
        blurb: "Recycled PET flakes and post-industrial LDPE film.",
        tag: "rPET & LDPE",
      },
    ],
  },
  marketplace: {
    eyebrow: "MARKETPLACE PREVIEW",
    title: "Specifications first.",
    desc:
      "A list built for fast decisions: material, quantity, condition, area and price. When a price is not set yet, it is stated clearly.",
    previewLabel: "Preview of the marketplace interface",
    previewTitle: "Marketplace · Materials",
    filtersLabel: "Filters",
    resultsLabel: "Results",
    filters: ["Material", "Quantity", "Area", "Condition"],
    rows: [
      { title: "Paper & cardboard · OCC 90/10", sub: "Quantity and conditions in the listing", zone: "Bologna", availability: "Availability on request" },
      { title: "Wood · Pallets and offcuts", sub: "Quantity and conditions in the listing", zone: "Bologna", availability: "Availability on request" },
      { title: "Plastic · rPET", sub: "Quantity and conditions in the listing", zone: "Bologna", availability: "Availability on request" },
    ],
    note: "Interface preview: no sample data or invented prices.",
    cta: "Open the marketplace",
    href: "/app/marketplace",
  },
  matching: {
    eyebrow: "MATCHING",
    title: "A match is understood by its reason, not a score.",
    desc:
      "Offcut connects demand and supply and shows which criteria led to the suggestion. You can move from the explanation to the conversation without losing context.",
    requestLabel: "REQUEST",
    requestValue: "Material, quantity, conditions, delivery",
    supplyLabel: "SUPPLY",
    supplyValue: "Material available in Bologna",
    reasonsTitle: "Suggestion criteria",
    reasons: [
      "Same material and composition",
      "Compatible quantity",
      "Conditions declared by the seller",
      "Distance from the Bologna area",
    ],
    note: "No invented compatibility percentage: see the reasons, then decide.",
    cta: "See matches",
    href: "/app/matches",
  },
  logistics: {
    eyebrow: "TRANSPORT AND PROCESSING",
    title: "One path, all the way to delivery.",
    desc:
      "The buyer chooses the delivery date. Offcut coordinates collection, processing and delivery while keeping the order status visible.",
    steps: [
      { n: "01", title: "Order confirmed", body: "Material, quantity, conditions and delivery date are defined." },
      { n: "02", title: "Collection and processing", body: "Collection, sorting and processing are coordinated by the Offcut team." },
      { n: "03", title: "Delivery scheduled", body: "The buyer follows the order status through to delivery." },
    ],
    note: "Transport and processing are explicit quote lines: no hidden charges.",
  },
  impact: {
    eyebrow: "ENVIRONMENTAL IMPACT",
    title: "Before choosing, try Know Your Footprint.",
    desc:
      "The calculator returns an estimate from material and quantity. Formulas and sources remain available: an estimate is not a certification.",
    previewLabel: "Preview of the Know Your Footprint calculator",
    loopTitle: "From surplus to resource",
    loop: ["Direct reuse", "Recovery", "Recycling"],
    fieldMaterial: "Material",
    fieldQuantity: "Quantity",
    fieldResult: "Estimate",
    fieldSources: "Sources and formula",
    placeholderMaterial: "Select a category",
    placeholderQuantity: "Enter quantity and unit",
    placeholderResult: "The estimate appears after the input",
    sources: "The calculation detail remains available",
    cta: "Calculate impact",
    href: "/impatto",
  },
  platform: {
    eyebrow: "PLATFORM PREVIEW",
    title: "A workspace, not another storefront.",
    desc:
      "Marketplace, matches, orders and messages live in the same space. Everything is available in Italian and English, including individual listings.",
    previewLabel: "Preview of the platform interface",
    sidebarLabel: "Platform navigation",
    items: [
      { label: "Marketplace", detail: "Search and filter materials" },
      { label: "Matches", detail: "Explained suggestions" },
      { label: "Orders", detail: "Status and delivery" },
      { label: "Inbox", detail: "Linked conversations" },
      { label: "Settings", detail: "Language and profile" },
    ],
    emptyMatch: "No recent matches",
    emptyOrders: "No orders in progress",
    emptyInbox: "No recent messages",
    note: "Empty states are part of the product: we do not show invented data.",
    cta: "Enter the platform",
    href: "/app/dashboard",
  },
  company: {
    eyebrow: "WHO WE ARE",
    title: "Materials in motion, with one point of contact.",
    desc:
      "Offcut was born in Bologna to make industrial material exchange practical for businesses. We connect companies with surplus and companies that can use it as an input, then coordinate collection, processing and delivery.",
    secondary: "No subscriptions, no paywall: commercial items are defined before confirmation.",
    cta: "Discover Offcut",
    href: "/chi-siamo",
    markAlt: "Offcut logo",
  },
  faq: {
    eyebrow: "FAQ",
    title: "The answers that matter.",
    items: [
      {
        q: "Do I have to choose between buyer and supplier?",
        a: "No. One account enables both activities: you can publish materials and send requests from the same space, without two profiles.",
      },
      {
        q: "How does onboarding work?",
        a: "There are 2 essential steps. Forms stay short and ask only for the information needed to publish or search for material.",
      },
      {
        q: "What does it cost to start?",
        a: "On request. There are no subscriptions: material, commission, transport and any processing are shown before confirmation.",
      },
      {
        q: "Where does Offcut operate?",
        a: "At launch we operate only in Bologna and nearby areas. The area is an explicit field in requests and filters.",
      },
      {
        q: "Can I upload photos and select multiple conditions?",
        a: "Yes. The seller uploads photos and selects multiple conditions; the buyer chooses the delivery date and downloads the quote.",
      },
      {
        q: "Are listings available in English?",
        a: "Yes. The interface, material listings and FAQ are complete in both Italian and English.",
      },
      {
        q: "Can Offcut AI act on my behalf?",
        a: "No. The assistant answers in your language and helps you navigate the platform; it does not perform actions or send messages without authorisation.",
      },
      {
        q: "Can I publish recurring material?",
        a: "Yes. Surplus can be scheduled with weekly recurrence, keeping availability up to date.",
      },
    ],
  },
  final: {
    eyebrow: "GET STARTED",
    title: "Your next material is already in circulation.",
    desc: "Publish surplus or source an input. Offcut coordinates the rest with clear costs before confirmation.",
    sell: "Sell materials",
    buy: "Find materials",
  },
  footer: {
    tagline: "Materials in motion.",
    navLabel: "Footer links",
    groups: [
      {
        title: "Platform",
        links: [
          { label: "Marketplace", href: "/app/marketplace" },
          { label: "Matches", href: "/app/matches" },
          { label: "Orders", href: "/app/orders" },
          { label: "Quote", href: "/preventivo" },
        ],
      },
      {
        title: "Offcut",
        links: [
          { label: "How it works", href: "/#come-funziona" },
          { label: "Who we are", href: "/chi-siamo" },
          { label: "Impact", href: "/impatto" },
          { label: "Contact", href: "/preventivo" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
          { label: "Pricing", href: "/preventivo" },
        ],
      },
    ],
    domain: "Offcut · Emilia-Romagna",
    rights: "© 2026 Offcut. All rights reserved.",
  },
};

export const COPY: Record<Lang, typeof it> = { it, en };

export type LandingCopy = typeof it;
