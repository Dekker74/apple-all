/**
 * Offcut MVP: Emilia-Romagna region, limited to the Bologna area.
 * The export names are kept for compatibility with existing selectors.
 */

export const emiliaRomagnaCities = [
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
].sort();

export const emiliaRomagnaProvinces = ["Bologna"] as const;

export type EmiliaRomagnaCity = (typeof emiliaRomagnaCities)[number];
export type EmiliaRomagnaProvince = (typeof emiliaRomagnaProvinces)[number];
