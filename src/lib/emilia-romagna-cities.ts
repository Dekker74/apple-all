/**
 * Città dell'Emilia-Romagna organizzate per provincia
 * Include capoluoghi e comuni principali
 */

export const emiliaRomagnaCities = [
  // Bologna (Provincia)
  "Bologna",
  "Imola",
  "Casalecchio di Reno",
  "San Lazzaro di Savena",
  "Castel Maggiore",
  "Zola Predosa",
  "Pianoro",
  "San Giovanni in Persiceto",
  "Molinella",
  "Budrio",

  // Modena (Provincia)
  "Modena",
  "Carpi",
  "Sassuolo",
  "Formigine",
  "Vignola",
  "Mirandola",
  "Castelfranco Emilia",
  "Maranello",
  "Fiorano Modenese",
  "Pavullo nel Frignano",

  // Parma (Provincia)
  "Parma",
  "Fidenza",
  "Collecchio",
  "Salsomaggiore Terme",
  "Langhirano",
  "Noceto",
  "Traversetolo",
  "Fornovo di Taro",

  // Reggio Emilia (Provincia)
  "Reggio Emilia",
  "Correggio",
  "Guastalla",
  "Scandiano",
  "Casalgrande",
  "Rubiera",
  "Castellarano",
  "Montecchio Emilia",

  // Ferrara (Provincia)
  "Ferrara",
  "Cento",
  "Comacchio",
  "Argenta",
  "Bondeno",
  "Codigoro",
  "Portomaggiore",

  // Ravenna (Provincia)
  "Ravenna",
  "Faenza",
  "Lugo",
  "Cervia",
  "Russi",
  "Alfonsine",
  "Bagnacavallo",

  // Forlì-Cesena (Provincia)
  "Forlì",
  "Cesena",
  "Cesenatico",
  "Forlimpopoli",
  "Savignano sul Rubicone",
  "Meldola",
  "Bertinoro",
  "Castrocaro Terme",

  // Rimini (Provincia)
  "Rimini",
  "Riccione",
  "Cattolica",
  "Santarcangelo di Romagna",
  "Bellaria-Igea Marina",
  "Misano Adriatico",
  "San Giovanni in Marignano",

  // Piacenza (Provincia)
  "Piacenza",
  "Castel San Giovanni",
  "Fiorenzuola d'Arda",
  "Rottofreno",
  "Podenzano",
  "Carpaneto Piacentino",
].sort();

export const emiliaRomagnaProvinces = [
  "Bologna",
  "Ferrara",
  "Forlì-Cesena",
  "Modena",
  "Parma",
  "Piacenza",
  "Ravenna",
  "Reggio Emilia",
  "Rimini",
] as const;

export type EmiliaRomagnaCity = (typeof emiliaRomagnaCities)[number];
export type EmiliaRomagnaProvince = (typeof emiliaRomagnaProvinces)[number];
