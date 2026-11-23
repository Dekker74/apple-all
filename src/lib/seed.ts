import { buildMatchId, evaluateMatch } from "@/lib/matching";
import { computePriceBreakdown, round } from "@/lib/pricing";
import type {
  CollectionPlan,
  DemoAccount,
  Location,
  Match,
  MaterialListing,
  MaterialRequest,
  Membership,
  NotificationItem,
  Order,
  OrderEvent,
  Organization,
  Partner,
  Profile,
  Quote,
} from "@/types";

const day = 86_400_000;

function iso(offsetDays: number, hour = 10): string {
  const d = new Date(Date.now() + offsetDays * day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function dateOnly(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface SeedData {
  profiles: Profile[];
  accounts: DemoAccount[];
  organizations: Organization[];
  locations: Location[];
  memberships: Membership[];
  listings: MaterialListing[];
  requests: MaterialRequest[];
  matches: Match[];
  orders: Order[];
  quotes: Quote[];
  partners: Partner[];
  notifications: NotificationItem[];
}

export function createSeedData(): SeedData {
  const profiles: Profile[] = [
    {
      id: "usr_elena",
      fullName: "Elena Ricci",
      email: "elena.ricci@northwind.demo",
      accountRole: "business",
      jobTitle: "Responsabile acquisti",
      onboarded: true,
      createdAt: iso(-420),
    },
    {
      id: "usr_marco",
      fullName: "Marco Bianchi",
      email: "marco.bianchi@greenloop.demo",
      accountRole: "business",
      jobTitle: "Amministratore delegato",
      onboarded: true,
      createdAt: iso(-380),
    },
  ];

  const accounts: DemoAccount[] = [
    { userId: "usr_elena", email: "elena.ricci@northwind.demo", isDemo: true },
    { userId: "usr_marco", email: "marco.bianchi@greenloop.demo", isDemo: true },
  ];

  const organizations: Organization[] = [
    {
      id: "org_northwind",
      name: "Northwind Packaging S.p.A.",
      vatNumber: "IT04829170159",
      country: "IT",
      website: "northwind-packaging.it",
      type: "buyer",
      verified: true,
      createdAt: iso(-420),
      description:
        "Convertitore di imballaggi rigidi e flessibili per aziende food & beverage nel Nord Italia.",
    },
    {
      id: "org_greenloop",
      name: "GreenLoop Fibres S.r.l.",
      vatNumber: "IT03918470237",
      country: "IT",
      website: "greenloop-fibres.it",
      type: "supplier",
      verified: true,
      createdAt: iso(-380),
      description:
        "Recupero e valorizzazione di polimeri post-industriali a Bologna. Flussi rPET food-grade e poliolefine.",
    },
    {
      id: "org_alpine",
      name: "Alpine Timber Works",
      vatNumber: "IT02736180237",
      country: "IT",
      website: "alpinetimber.it",
      type: "supplier",
      verified: true,
      createdAt: iso(-300),
      description: "Produttore di falegnameria e mobili, ritagli di legno duro essiccato e recupero pallet.",
    },
    {
      id: "org_cartiera",
      name: "Cartiera Veneta S.p.A.",
      vatNumber: "IT01298450283",
      country: "IT",
      website: "cartieraveneta.it",
      type: "supplier",
      verified: true,
      createdAt: iso(-260),
      description: "Cartiera di cartone per imballaggi riciclati con linea di disinchiostro a Padova.",
    },
    {
      id: "org_polimeri",
      name: "Polimeri Adriatica",
      vatNumber: "IT02184760392",
      country: "IT",
      website: "polimeri-adriatica.it",
      type: "supplier",
      verified: false,
      createdAt: iso(-190),
      description: "Impianto di compounding, rigranulato HDPE e recupero big bag in PP.",
    },
    {
      id: "org_legnami",
      name: "Legnami Brianza",
      vatNumber: "IT01829370156",
      country: "IT",
      website: "legnamibrianza.it",
      type: "supplier",
      verified: true,
      createdAt: iso(-150),
      description: "Taglio pannelli e segheria nei pressi di Monza.",
    },
    {
      id: "org_terra",
      name: "Terra Forma Costruzioni",
      vatNumber: "IT03129470018",
      country: "IT",
      website: "terraforma.it",
      type: "buyer",
      verified: true,
      createdAt: iso(-140),
      description: "Impresa di infrastrutture a Torino. Applicazioni con geomembrane e protezione cantieri.",
    },
    {
      id: "org_emilia",
      name: "Emilia Packaging Coop",
      vatNumber: "IT02938410364",
      country: "IT",
      website: "emiliapack.it",
      type: "buyer",
      verified: true,
      createdAt: iso(-120),
      description: "Stabilimento di scatole in cartone ondulato per produttori alimentari dell'Emilia-Romagna.",
    },
  ];

  const locations: Location[] = [
    {
      id: "loc_nw_milan",
      orgId: "org_northwind",
      name: "Sede e stabilimento di conversione di Milano",
      addressLine: "Via Savona 42",
      city: "Milano",
      postalCode: "20144",
      country: "IT",
      lat: 45.4555,
      lng: 9.1665,
      isPrimary: true,
    },
    {
      id: "loc_nw_verona",
      orgId: "org_northwind",
      name: "Stabilimento flessibili di Verona",
      addressLine: "Via dell'Industria 118",
      city: "Verona",
      postalCode: "37135",
      country: "IT",
      lat: 45.4189,
      lng: 10.9808,
      isPrimary: false,
    },
    {
      id: "loc_gl_bologna",
      orgId: "org_greenloop",
      name: "Hub di recupero di Bologna",
      addressLine: "Via del Frullo 9",
      city: "Bologna",
      postalCode: "40127",
      country: "IT",
      lat: 44.5112,
      lng: 11.3865,
      isPrimary: true,
    },
    {
      id: "loc_alp_verona",
      orgId: "org_alpine",
      name: "Segheria di Verona",
      addressLine: "Via Legnami 4",
      city: "Verona",
      postalCode: "37139",
      country: "IT",
      lat: 45.4512,
      lng: 10.9462,
      isPrimary: true,
    },
    {
      id: "loc_cv_padua",
      orgId: "org_cartiera",
      name: "Cartiera di Padova",
      addressLine: "Via del Porto 210",
      city: "Padova",
      postalCode: "35129",
      country: "IT",
      lat: 45.4212,
      lng: 11.9021,
      isPrimary: true,
    },
    {
      id: "loc_pa_ravenna",
      orgId: "org_polimeri",
      name: "Impianto di compounding di Ravenna",
      addressLine: "Via Baiona 155",
      city: "Ravenna",
      postalCode: "48122",
      country: "IT",
      lat: 44.4562,
      lng: 12.2215,
      isPrimary: true,
    },
    {
      id: "loc_lb_monza",
      orgId: "org_legnami",
      name: "Stabilimento pannelli di Monza",
      addressLine: "Viale Lombardia 88",
      city: "Monza",
      postalCode: "20900",
      country: "IT",
      lat: 45.5942,
      lng: 9.3002,
      isPrimary: true,
    },
    {
      id: "loc_tf_turin",
      orgId: "org_terra",
      name: "Deposito di Torino",
      addressLine: "Corso Romania 66",
      city: "Torino",
      postalCode: "10156",
      country: "IT",
      lat: 45.1021,
      lng: 7.7192,
      isPrimary: true,
    },
    {
      id: "loc_ep_modena",
      orgId: "org_emilia",
      name: "Stabilimento scatole di Modena",
      addressLine: "Via Emilia Est 1240",
      city: "Modena",
      postalCode: "41126",
      country: "IT",
      lat: 44.6335,
      lng: 10.9542,
      isPrimary: true,
    },
  ];

  const memberships: Membership[] = [
    {
      id: "mem_1",
      orgId: "org_northwind",
      userId: "usr_elena",
      role: "owner",
      fullName: "Elena Ricci",
      email: "elena.ricci@northwind.demo",
      title: "Responsabile acquisti",
      status: "active",
      joinedAt: iso(-420),
    },
    {
      id: "mem_2",
      orgId: "org_northwind",
      userId: "usr_sofia",
      role: "admin",
      fullName: "Sofia Conti",
      email: "sofia.conti@northwind.demo",
      title: "Responsabile sostenibilità",
      status: "active",
      joinedAt: iso(-390),
    },
    {
      id: "mem_3",
      orgId: "org_northwind",
      userId: "usr_luca",
      role: "member",
      fullName: "Luca Ferri",
      email: "luca.ferri@northwind.demo",
      title: "Gestione stabilimento",
      status: "active",
      joinedAt: iso(-300),
    },
    {
      id: "mem_4",
      orgId: "org_greenloop",
      userId: "usr_marco",
      role: "owner",
      fullName: "Marco Bianchi",
      email: "marco.bianchi@greenloop.demo",
      title: "Amministratore delegato",
      status: "active",
      joinedAt: iso(-380),
    },
    {
      id: "mem_5",
      orgId: "org_greenloop",
      userId: "usr_giulia",
      role: "admin",
      fullName: "Giulia Neri",
      email: "giulia.neri@greenloop.demo",
      title: "Responsabile commerciale",
      status: "active",
      joinedAt: iso(-350),
    },
  ];

  const listings: MaterialListing[] = [
    {
      id: "lst_rpet",
      reference: "LST-2026-0412",
      orgId: "org_greenloop",
      locationId: "loc_gl_bologna",
      title: "Fiocchi rPET food-grade — lavati, 99,5%",
      description:
        "Fiocchi rPET lavati e decontaminati da raccolta di bottiglie post-consumo. Conformi al contatto alimentare, linea di lavaggio a caldo, metalli e colori separati. Forniti in octabin da 1.000 kg o sacchi da 25 kg.",
      category: "plastic",
      composition: [
        { material: "rPET", percent: 99.5 },
        { material: "Residui HDPE / PP", percent: 0.5 },
      ],
      quantityKg: 6800,
      condition: "clean",
      purityPct: 99,
      pricePerKg: 0.78,
      currency: "EUR",
      availableFrom: dateOnly(2),
      availableUntil: dateOnly(34),
      photos: [],
      handling: ["Su pallet", "Stoccaggio coperto", "Banchina di carico disponibile"],
      packaging: "Octabin da 1.000 kg",
      minOrderKg: 1000,
      status: "matched",
      createdAt: iso(-12),
      views: 148,
    },
    {
      id: "lst_ldpe",
      reference: "LST-2026-0408",
      orgId: "org_greenloop",
      locationId: "loc_gl_bologna",
      title: "Film LDPE post-industriale — pulito, su pallet",
      description:
        "Film stretch e shrink da operatore logistico, selezionato per colore e senza etichette. Bassa umidità, nessuna contaminazione organica. In balle imbragate su pallet da 1.200 kg.",
      category: "plastic",
      composition: [
        { material: "Film LDPE", percent: 92 },
        { material: "Reggette PP", percent: 8 },
      ],
      quantityKg: 12400,
      condition: "clean",
      purityPct: 96,
      pricePerKg: 0.42,
      currency: "EUR",
      availableFrom: dateOnly(1),
      availableUntil: dateOnly(40),
      photos: [],
      handling: ["In balle", "Su pallet", "Avvolto in pellicola", "Carrello elevatore in loco"],
      packaging: "Balle da circa 420 kg",
      minOrderKg: 2000,
      status: "active",
      createdAt: iso(-9),
      views: 203,
    },
    {
      id: "lst_occ",
      reference: "LST-2026-0401",
      orgId: "org_greenloop",
      locationId: "loc_gl_bologna",
      title: "Ritagli OCC kraft 90/10",
      description:
        "Ritagli puliti di cartone ondulato kraft da una cartotecnica, 90% OCC / 10% kraft liner. Asciutti, su pallet, privi di cera e cartone laminato. Disponibilità mensile continuativa.",
      category: "paper_cardboard",
      composition: [
        { material: "OCC (ondulato)", percent: 90 },
        { material: "Kraft liner", percent: 10 },
      ],
      quantityKg: 18500,
      condition: "clean",
      purityPct: 94,
      pricePerKg: 0.11,
      currency: "EUR",
      availableFrom: dateOnly(0),
      availableUntil: dateOnly(55),
      photos: [],
      handling: ["In balle", "Su pallet", "Stoccaggio coperto", "Banchina di carico disponibile"],
      packaging: "Balle da circa 650 kg",
      minOrderKg: 5000,
      status: "active",
      createdAt: iso(-7),
      views: 96,
    },
    {
      id: "lst_oak",
      reference: "LST-2026-0389",
      orgId: "org_alpine",
      locationId: "loc_alp_verona",
      title: "Ritagli di rovere essiccato in forno",
      description:
        "Ritagli di falegnameria, essiccati in forno al 10–12% di umidità. Non trattati, senza chiodi, dimensioni 30–90 cm. Adatti per riparazione pallet, giuntatura o biomassa.",
      category: "wood",
      composition: [{ material: "Rovere (legno duro)", percent: 98 }, { material: "Fini", percent: 2 }],
      quantityKg: 9200,
      condition: "clean",
      purityPct: 98,
      pricePerKg: 0.16,
      currency: "EUR",
      availableFrom: dateOnly(3),
      availableUntil: dateOnly(28),
      photos: [],
      handling: ["Su pallet", "Stoccaggio coperto", "Carrello elevatore in loco"],
      packaging: "Pallet da circa 800 kg",
      minOrderKg: 2000,
      status: "matched",
      createdAt: iso(-16),
      views: 74,
    },
    {
      id: "lst_pallet",
      reference: "LST-2026-0375",
      orgId: "org_alpine",
      locationId: "loc_alp_verona",
      title: "Legno da pallet misto — trattato a caldo",
      description:
        "Legno da pallet smontato, trattato a caldo ISPM-15, pino e legno duro misti. Contiene chiodi e alcune tavole rotte: richiede cernita prima del riutilizzo.",
      category: "wood",
      composition: [
        { material: "Pino (legno tenero)", percent: 70 },
        { material: "Legno duro", percent: 30 },
      ],
      quantityKg: 14000,
      condition: "mixed",
      purityPct: 88,
      pricePerKg: 0.07,
      currency: "EUR",
      availableFrom: dateOnly(0),
      availableUntil: dateOnly(45),
      photos: [],
      handling: ["Sfuso", "Carrello elevatore in loco", "Dichiarazione di assenza di pericoli"],
      packaging: "Cataste sfuse",
      minOrderKg: 4000,
      status: "active",
      createdAt: iso(-21),
      views: 61,
    },
    {
      id: "lst_news",
      reference: "LST-2026-0361",
      orgId: "org_cartiera",
      locationId: "loc_cv_padua",
      title: "Carta da giornale per disinchiostro",
      description:
        "Misto di carta da giornale e riviste da raccolta comunale. Qualità per disinchiostro, 91% carta da giornale. Umidità nella specifica, lieve contaminazione plastica.",
      category: "paper_cardboard",
      composition: [
        { material: "Carta da giornale", percent: 91 },
        { material: "Riviste patinate", percent: 9 },
      ],
      quantityKg: 22000,
      condition: "mixed",
      purityPct: 91,
      pricePerKg: 0.09,
      currency: "EUR",
      availableFrom: dateOnly(4),
      availableUntil: dateOnly(60),
      photos: [],
      handling: ["In balle", "Sfuso", "Banchina di carico disponibile"],
      packaging: "Balle da circa 900 kg",
      minOrderKg: 8000,
      status: "active",
      createdAt: iso(-24),
      views: 118,
    },
    {
      id: "lst_office",
      reference: "LST-2026-0354",
      orgId: "org_cartiera",
      locationId: "loc_cv_padua",
      title: "Carta da ufficio bianca, triturata",
      description:
        "Carta da ufficio bianca triturata da distruzione certificata, 97% qualità bianca. Nessuna carta carbone o archivio. Ideale per carta tissue e cartoni speciali.",
      category: "paper_cardboard",
      composition: [{ material: "Carta da ufficio bianca", percent: 97 }, { material: "Residui di toner", percent: 3 }],
      quantityKg: 7400,
      condition: "clean",
      purityPct: 97,
      pricePerKg: 0.14,
      currency: "EUR",
      availableFrom: dateOnly(6),
      availableUntil: dateOnly(38),
      photos: [],
      handling: ["In balle", "Su pallet", "Stoccaggio coperto"],
      packaging: "Balle da circa 500 kg",
      minOrderKg: 2000,
      status: "active",
      createdAt: iso(-28),
      views: 52,
    },
    {
      id: "lst_hdpe",
      reference: "LST-2026-0347",
      orgId: "org_polimeri",
      locationId: "loc_pa_ravenna",
      title: "Rigranulato HDPE, colori misti",
      description:
        "Rigranulato HDPE post-industriale da scarti di soffiaggio. Colori misti (naturale, bianco, blu), fiocchi da 8 mm. Lavaggio consigliato per applicazioni prossime al food.",
      category: "plastic",
      composition: [{ material: "HDPE", percent: 93 }, { material: "PP", percent: 7 }],
      quantityKg: 15600,
      condition: "mixed",
      purityPct: 93,
      pricePerKg: 0.51,
      currency: "EUR",
      availableFrom: dateOnly(2),
      availableUntil: dateOnly(50),
      photos: [],
      handling: ["In balle", "Sfuso", "Carrello elevatore in loco"],
      packaging: "Big bag da 1.250 kg",
      minOrderKg: 3000,
      status: "active",
      createdAt: iso(-31),
      views: 167,
    },
    {
      id: "lst_ppbags",
      reference: "LST-2026-0339",
      orgId: "org_polimeri",
      locationId: "loc_pa_ravenna",
      title: "Big bag in PP, in balle",
      description:
        "Big bag in polipropilene usati, svuotati e imballati in balle. Puliti, senza residui pericolosi. Adatti per rigranulato PP o recupero energetico.",
      category: "plastic",
      composition: [{ material: "PP (big bag)", percent: 96 }, { material: "Etichette / reggette", percent: 4 }],
      quantityKg: 5200,
      condition: "clean",
      purityPct: 90,
      pricePerKg: 0.33,
      currency: "EUR",
      availableFrom: dateOnly(0),
      availableUntil: dateOnly(30),
      photos: [],
      handling: ["In balle", "Sfuso"],
      packaging: "Balle da circa 380 kg",
      minOrderKg: 1500,
      status: "active",
      createdAt: iso(-35),
      views: 44,
    },
    {
      id: "lst_mdf",
      reference: "LST-2026-0328",
      orgId: "org_legnami",
      locationId: "loc_lb_monza",
      title: "Ritagli MDF, asciutti",
      description:
        "Ritagli MDF asciutti da taglio pannelli per mobili. Spessore costante 18 mm, dimensioni miste. Adatti per prodotti stampati o biomassa; richiede macinazione.",
      category: "wood",
      composition: [{ material: "MDF (pannello di fibre)", percent: 96 }, { material: "Bordo melaminico", percent: 4 }],
      quantityKg: 11800,
      condition: "mixed",
      purityPct: 92,
      pricePerKg: 0.06,
      currency: "EUR",
      availableFrom: dateOnly(1),
      availableUntil: dateOnly(42),
      photos: [],
      handling: ["Su pallet", "Stoccaggio coperto", "Banchina di carico disponibile"],
      packaging: "Pallet da circa 700 kg",
      minOrderKg: 4000,
      status: "active",
      createdAt: iso(-39),
      views: 39,
    },
    {
      id: "lst_sawdust",
      reference: "LST-2026-0317",
      orgId: "org_legnami",
      locationId: "loc_lb_monza",
      title: "Segatura non trattata — sfusa",
      description:
        "Segatura mista di legno tenero non trattata da segheria pulita. Bassa umidità, senza colle o rivestimenti. Disponibile sfusa su rimorchi con pavimento mobile.",
      category: "wood",
      composition: [{ material: "Segatura di legno tenero", percent: 99 }, { material: "Fini di corteccia", percent: 1 }],
      quantityKg: 26000,
      condition: "needs_processing",
      purityPct: 95,
      pricePerKg: 0.04,
      currency: "EUR",
      availableFrom: dateOnly(0),
      availableUntil: dateOnly(20),
      photos: [],
      handling: ["Sfuso", "Banchina di carico disponibile", "Dichiarazione di assenza di pericoli"],
      packaging: "Sfuso",
      minOrderKg: 10000,
      status: "active",
      createdAt: iso(-43),
      views: 33,
    },
    {
      id: "lst_stretch",
      reference: "LST-2026-0305",
      orgId: "org_greenloop",
      locationId: "loc_gl_bologna",
      title: "Film stretch, post-commerciale",
      description:
        "Film stretch post-commerciale da centri di distribuzione. Colori misti, lieve contaminazione. In balle imbragate, ideale per rigranulazione in film non food.",
      category: "plastic",
      composition: [{ material: "Film LDPE", percent: 85 }, { material: "Etichette / nastro", percent: 15 }],
      quantityKg: 9400,
      condition: "mixed",
      purityPct: 91,
      pricePerKg: 0.31,
      currency: "EUR",
      availableFrom: dateOnly(5),
      availableUntil: dateOnly(48),
      photos: [],
      handling: ["In balle", "Su pallet", "Carrello elevatore in loco"],
      packaging: "Balle da circa 450 kg",
      minOrderKg: 2500,
      status: "active",
      createdAt: iso(-46),
      views: 87,
    },
  ];

  const requests: MaterialRequest[] = [
    {
      id: "req_rpet",
      reference: "REQ-2026-0218",
      orgId: "org_northwind",
      locationId: "loc_nw_milan",
      title: "Fiocchi rPET food-grade per estrusione vaschette",
      description:
        "Sostituzione del PET vergine nelle vaschette alimentari termoformate. Richiede rPET conforme al contatto alimentare con tracciabilità completa e documentazione sui test di migrazione.",
      category: "plastic",
      acceptableComposition: ["fiocchi rPET", "PET"],
      qualityThresholds: { minPurityPct: 98, maxMoisturePct: 0.5, maxContaminationPct: 1 },
      quantityKg: 6000,
      frequency: "monthly",
      maxBudget: 7800,
      requiredProcessing: ["washing", "pelletizing"],
      neededBy: dateOnly(21),
      radiusKm: 250,
      status: "open",
      createdAt: iso(-10),
    },
    {
      id: "req_occ",
      reference: "REQ-2026-0214",
      orgId: "org_northwind",
      locationId: "loc_nw_milan",
      title: "OCC per linea cartone ondulato",
      description:
        "OCC kraft per cartone ondulato riciclato. Deve essere privo di cera, laminati e contaminazione plastica. Volume mensile ricorrente con revisione prezzi trimestrale.",
      category: "paper_cardboard",
      acceptableComposition: ["OCC", "ondulato kraft"],
      qualityThresholds: { minPurityPct: 92, maxMoisturePct: 8, maxContaminationPct: 2 },
      quantityKg: 20000,
      frequency: "monthly",
      maxBudget: 4200,
      requiredProcessing: ["sorting", "baling"],
      neededBy: dateOnly(14),
      radiusKm: 300,
      status: "open",
      createdAt: iso(-8),
    },
    {
      id: "req_oak",
      reference: "REQ-2026-0209",
      orgId: "org_northwind",
      locationId: "loc_nw_verona",
      title: "Ritagli di legno duro essiccato per riparazione pallet",
      description:
        "Ritagli di legno duro per la nostra linea di riparazione pallet. Senza chiodi, non trattati, umidità sotto il 12%. Lunghezza minima 30 cm.",
      category: "wood",
      acceptableComposition: ["legno duro", "rovere"],
      qualityThresholds: { minPurityPct: 95, maxMoisturePct: 12, maxContaminationPct: 3 },
      quantityKg: 8000,
      frequency: "one_off",
      maxBudget: 3200,
      requiredProcessing: ["drying", "sorting"],
      neededBy: dateOnly(18),
      radiusKm: 200,
      status: "open",
      createdAt: iso(-5),
    },
    {
      id: "req_ldpe",
      reference: "REQ-2026-0204",
      orgId: "org_terra",
      locationId: "loc_tf_turin",
      title: "Film LDPE per teli da cantiere",
      description:
        "Film LDPE post-industriale da rigranulare per teli di protezione cantieri. Colore non critico, bassa umidità, nessuna contaminazione organica.",
      category: "plastic",
      acceptableComposition: ["Film LDPE", "film stretch"],
      qualityThresholds: { minPurityPct: 94, maxMoisturePct: 1, maxContaminationPct: 2 },
      quantityKg: 9000,
      frequency: "monthly",
      maxBudget: 7200,
      requiredProcessing: ["sorting", "shredding"],
      neededBy: dateOnly(25),
      radiusKm: 350,
      status: "open",
      createdAt: iso(-19),
    },
    {
      id: "req_pallets",
      reference: "REQ-2026-0198",
      orgId: "org_terra",
      locationId: "loc_tf_turin",
      title: "Legno da pallet per linea di riparazione",
      description:
        "Legno da pallet misto per linea di riparazione e riutilizzo. Chiodi accettabili, cernita a nostro carico. Preferito materiale trattato a caldo.",
      category: "wood",
      acceptableComposition: ["legno da pallet", "pino"],
      qualityThresholds: { minPurityPct: 85, maxMoisturePct: 15, maxContaminationPct: 5 },
      quantityKg: 12000,
      frequency: "monthly",
      maxBudget: 2400,
      requiredProcessing: ["sorting"],
      neededBy: dateOnly(30),
      radiusKm: 300,
      status: "open",
      createdAt: iso(-23),
    },
    {
      id: "req_kraft",
      reference: "REQ-2026-0191",
      orgId: "org_emilia",
      locationId: "loc_ep_modena",
      title: "OCC kraft per cartotecnica",
      description:
        "OCC kraft per produzione scatole in cartone ondulato. Pulito, asciutto, preferibilmente in balle. Consegne settimanali costanti.",
      category: "paper_cardboard",
      acceptableComposition: ["OCC", "kraft"],
      qualityThresholds: { minPurityPct: 90, maxMoisturePct: 8, maxContaminationPct: 2 },
      quantityKg: 15000,
      frequency: "monthly",
      maxBudget: 3300,
      requiredProcessing: ["sorting", "baling"],
      neededBy: dateOnly(16),
      radiusKm: 200,
      status: "open",
      createdAt: iso(-27),
    },
  ];

  const partners: Partner[] = [
    {
      id: "part_trans_1",
      name: "TransItalia Logistics",
      kind: "transport",
      coverage: "Italia settentrionale e centrale",
      rating: 4.7,
      onTimePct: 96,
    },
    {
      id: "part_trans_2",
      name: "Alpine Freight",
      kind: "transport",
      coverage: "Corridoio IT / AT / DE",
      rating: 4.5,
      onTimePct: 93,
    },
    {
      id: "part_proc_1",
      name: "RePlast Hub Emilia",
      kind: "processing",
      coverage: "Emilia-Romagna · polimeri",
      rating: 4.8,
      onTimePct: 97,
    },
    {
      id: "part_proc_2",
      name: "Cartiera di Verona",
      kind: "processing",
      coverage: "Veneto · fibre",
      rating: 4.6,
      onTimePct: 95,
    },
    {
      id: "part_proc_3",
      name: "LegnoCircolare",
      kind: "processing",
      coverage: "Lombardia · legno",
      rating: 4.4,
      onTimePct: 92,
    },
    {
      id: "part_qc_1",
      name: "Bureau Veritas Circular",
      kind: "qc",
      coverage: "Campionamento in tutta l'UE",
      rating: 4.9,
      onTimePct: 99,
    },
    {
      id: "part_qc_2",
      name: "SGS Materials",
      kind: "qc",
      coverage: "Italia · laboratorio materiali",
      rating: 4.7,
      onTimePct: 97,
    },
  ];

  const locationsById = new Map(locations.map((l) => [l.id, l]));

  // Deterministic AI match generation for the seeded market.
  const matches: Match[] = [];
  for (const request of requests) {
    for (const listing of listings) {
      if (listing.orgId === request.orgId) continue;
      const evaluation = evaluateMatch(
        listing,
        request,
        locationsById.get(listing.locationId),
        locationsById.get(request.locationId),
      );
      if (!evaluation || evaluation.score < 55) continue;
      matches.push({
        id: buildMatchId(request.id, listing.id),
        listingId: listing.id,
        requestId: request.id,
        ...evaluation,
        status: "suggested",
        createdAt: iso(-3),
      });
    }
  }

  const quotedPairs = new Set([
    "req_rpet::lst_rpet",
    "req_occ::lst_occ",
    "req_oak::lst_oak",
    "req_ldpe::lst_ldpe",
  ]);
  for (const match of matches) {
    if (quotedPairs.has(`${match.requestId}::${match.listingId}`)) {
      match.status = "quoted";
    }
  }

  function findMatch(requestId: string, listingId: string): Match {
    const match = matches.find((m) => m.requestId === requestId && m.listingId === listingId);
    if (!match) throw new Error(`Abbinamento iniziale mancante per ${requestId}/${listingId}`);
    return match;
  }

  const quotes: Quote[] = [];
  const orders: Order[] = [];

  function addOrder(input: {
    id: string;
    reference: string;
    requestId: string;
    listingId: string;
    quantityKg: number;
    status: Order["status"];
    createdAtOffset: number;
    quoteStatus: Quote["status"];
    collection?: CollectionPlan;
    timeline: { label: string; note?: string; actor: string; kind: OrderEvent["kind"]; offset: number }[];
    notes?: string;
  }): void {
    const request = requests.find((r) => r.id === input.requestId)!;
    const listing = listings.find((l) => l.id === input.listingId)!;
    const match = findMatch(input.requestId, input.listingId);
    const breakdown = computePriceBreakdown({
      listing,
      quantityKg: input.quantityKg,
      distanceKm: match.distanceKm,
      processing: match.requiredProcessing,
    });
    const quoteId = `quo_${input.id.replace(/^ord_/, "")}`;
    quotes.push({
      id: quoteId,
      orderId: input.id,
      breakdown,
      validUntil: iso(12),
      status: input.quoteStatus,
      issuedAt: iso(input.createdAtOffset + 1),
      notes: input.notes,
    });
    orders.push({
      id: input.id,
      reference: input.reference,
      buyerOrgId: request.orgId,
      supplierOrgId: listing.orgId,
      listingId: listing.id,
      requestId: request.id,
      matchId: match.id,
      quoteId,
      quantityKg: input.quantityKg,
      status: input.status,
      createdAt: iso(input.createdAtOffset),
      updatedAt: iso(Math.max(...input.timeline.map((t) => t.offset), input.createdAtOffset)),
      collection: input.collection ?? null,
      timeline: input.timeline.map((t, index) => ({
        id: `evt_${input.id}_${index}`,
        at: iso(t.offset, 9 + index),
        label: t.label,
        note: t.note,
        actor: t.actor,
        kind: t.kind,
      })),
      createdByUserId: request.orgId === "org_northwind" ? "usr_elena" : "usr_marco",
    });
  }

  addOrder({
    id: "ord_rpet",
    reference: "CL-2026-0146",
    requestId: "req_rpet",
    listingId: "lst_rpet",
    quantityKg: 6000,
    status: "collection_scheduled",
    createdAtOffset: -11,
    quoteStatus: "accepted",
    collection: {
      windowStart: iso(6, 8),
      windowEnd: iso(6, 13),
      transportPartnerId: "part_trans_1",
      processingPartnerId: "part_proc_1",
      qcPartnerId: "part_qc_1",
      qcStatus: "scheduled",
      instructions: "Banchina 2, codice cancello 4417. Gli octabin devono essere imbragati prima del carico.",
    },
    timeline: [
      { label: "Ordine creato", note: "Abbinamento confermato da Elena Ricci", actor: "Elena Ricci", kind: "user", offset: -11 },
      { label: "Preventivo inviato", note: "Applicata commissione piattaforma del 6%", actor: "Offcut", kind: "system", offset: -10 },
      { label: "Preventivo accettato", note: "Emesso ordine d'acquisto PO-88214", actor: "Elena Ricci", kind: "finance", offset: -8 },
      {
        label: "Ritiro programmato",
        note: "TransItalia Logistics · fascia 08:00–13:00",
        actor: "Operazioni Offcut",
        kind: "partner",
        offset: -4,
      },
      { label: "Campionamento QC prenotato", note: "Bureau Veritas · campione pre-spedizione", actor: "Bureau Veritas", kind: "partner", offset: -2 },
    ],
  });

  addOrder({
    id: "ord_occ",
    reference: "CL-2026-0139",
    requestId: "req_occ",
    listingId: "lst_occ",
    quantityKg: 18000,
    status: "quote_issued",
    createdAtOffset: -4,
    quoteStatus: "issued",
    timeline: [
      { label: "Ordine creato", note: "Generato da abbinamento AI", actor: "Offcut", kind: "system", offset: -4 },
      { label: "Preventivo inviato", note: "Valido 12 giorni", actor: "Offcut", kind: "system", offset: -3 },
    ],
  });

  addOrder({
    id: "ord_oak",
    reference: "CL-2026-0124",
    requestId: "req_oak",
    listingId: "lst_oak",
    quantityKg: 8000,
    status: "completed",
    createdAtOffset: -38,
    quoteStatus: "accepted",
    collection: {
      windowStart: iso(-24, 7),
      windowEnd: iso(-24, 12),
      transportPartnerId: "part_trans_2",
      processingPartnerId: "part_proc_3",
      qcPartnerId: "part_qc_2",
      qcStatus: "passed",
      instructions: "Ritirato dalla segheria di Verona, essiccato presso LegnoCircolare, consegnato allo stabilimento di Verona.",
    },
    timeline: [
      { label: "Ordine creato", actor: "Elena Ricci", kind: "user", offset: -38 },
      { label: "Preventivo inviato", actor: "Offcut", kind: "system", offset: -37 },
      { label: "Preventivo accettato", actor: "Elena Ricci", kind: "finance", offset: -35 },
      { label: "Ritiro completato", note: "8.000 kg caricati · 2 rimorchi", actor: "Alpine Freight", kind: "partner", offset: -24 },
      { label: "Lavorazione completata", note: "Essiccato al 10,4% di umidità", actor: "LegnoCircolare", kind: "partner", offset: -20 },
      { label: "QC superato", note: "Certificato QC-2026-8891 emesso", actor: "SGS Materials", kind: "partner", offset: -18 },
      { label: "Ordine completato", note: "Fattura saldata · 30 giorni netti", actor: "Offcut", kind: "finance", offset: -17 },
    ],
  });

  addOrder({
    id: "ord_ldpe",
    reference: "CL-2026-0142",
    requestId: "req_ldpe",
    listingId: "lst_ldpe",
    quantityKg: 9000,
    status: "quote_accepted",
    createdAtOffset: -7,
    quoteStatus: "accepted",
    timeline: [
      { label: "Ordine creato", actor: "Marco Bianchi", kind: "user", offset: -7 },
      { label: "Preventivo inviato", actor: "Offcut", kind: "system", offset: -6 },
      { label: "Preventivo accettato", note: "In attesa di conferma fascia di ritiro", actor: "Terra Forma Costruzioni", kind: "finance", offset: -5 },
    ],
  });

  const notifications: NotificationItem[] = [
    {
      id: uid("ntf"),
      title: "Preventivo CL-2026-0139 in attesa di accettazione",
      body: "18 t di OCC kraft · 4.046 € consegnati · valido 12 giorni.",
      href: "/app/orders/ord_occ",
      createdAt: iso(0, 8),
      read: false,
      tone: "warning",
    },
    {
      id: uid("ntf"),
      title: "Ritiro confermato per CL-2026-0146",
      body: "TransItalia Logistics prenotata per la fascia 08:00–13:00. Campionamento QC prenotato con Bureau Veritas.",
      href: "/app/orders/ord_rpet",
      createdAt: iso(-1, 16),
      read: false,
      tone: "success",
    },
    {
      id: uid("ntf"),
      title: "2 abbinamenti solidi per vaschette rPET",
      body: "Nuova fornitura di rPET lavato disponibile entro 250 km da te.",
      href: "/app/matches",
      createdAt: iso(-2, 11),
      read: false,
      tone: "info",
    },
    {
      id: uid("ntf"),
      title: "Certificato QC emesso — CL-2026-0124",
      body: "I ritagli di rovere hanno superato i controlli di umidità e contaminazione. Certificato QC-2026-8891 disponibile.",
      href: "/app/orders/ord_oak",
      createdAt: iso(-18, 9),
      read: true,
      tone: "success",
    },
  ];

  return {
    profiles,
    accounts,
    organizations,
    locations,
    memberships,
    listings,
    requests,
    matches,
    orders,
    quotes,
    partners,
    notifications,
  };
}

export { round };
