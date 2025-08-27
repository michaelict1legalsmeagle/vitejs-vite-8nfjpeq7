// src/lib/region.ts
// Minimal, pragmatic postcode → region mapping used by metrics & SDLT.
// We only need country-level granularity for tax (England/NI, Wales, Scotland)
// plus a sensible default for unknowns.

export type Region = "England" | "Wales" | "Scotland" | "Northern Ireland" | "Unknown";

/**
 * Normalise a raw postcode-ish input into a simple uppercase string,
 * and return its outward code (the bit before the space).
 */
function outward(raw: string): string {
  if (!raw) return "";
  const up = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const parts = up.split(" ");
  return (parts[0] || "").replace(/[^A-Z0-9]/g, "");
}

/**
 * Rough country mappings by outward-code prefix.
 * This is intentionally broad and fast; if we ever need finer English regions
 * (e.g., North West vs West Midlands), we can extend with another layer.
 */
const SCOT_PREFIXES = [
  // Edinburgh / Lothians / Borders
  "EH", "TD",
  // Glasgow / Strathclyde
  "G", "PA", "KA",
  // Aberdeen / North East
  "AB",
  // Dundee / Angus / Fife / Perth & Kinross
  "DD", "KY", "PH",
  // Highlands & Islands / Inverness / Orkney / Shetland / Hebrides
  "IV", "KW", "HS", "ZE",
  // Stirling / Falkirk / Clackmannanshire
  "FK",
  // Dumfries & Galloway
  "DG",
  // Argyll & Bute
  "PA",
];

const WALES_PREFIXES = [
  // Cardiff / South Glamorgan
  "CF",
  // Swansea
  "SA",
  // Newport
  "NP",
  // Llandudno / Conwy / Colwyn Bay
  "LL",
  // Wrexham
  "LL", "CH7", "CH8", // CH7/8 straddle border; keep it simple
  // Llandrindod Wells (LD)
  "LD",
  // Hereford-adjacent Welsh (HR3 parts straddle; we won't overfit here)
];

const NI_PREFIXES = ["BT"]; // All Northern Ireland outward codes are BT

/**
 * Country-level region from a UK postcode (or free text).
 * Falls back to England if it looks UK-ish but doesn't match Wales/Scotland/NI;
 * otherwise "Unknown".
 */
export function regionFromPostcode(input: string | null | undefined): Region {
  if (!input) return "Unknown";
  const out = outward(String(input));
  if (!out) return "Unknown";

  // Northern Ireland first (unique and unambiguous)
  if (out.startsWith("BT")) return "Northern Ireland";

  // Scotland
  for (const p of SCOT_PREFIXES) {
    if (out.startsWith(p)) return "Scotland";
  }

  // Wales
  for (const p of WALES_PREFIXES) {
    if (out.startsWith(p)) return "Wales";
  }

  // If it looks like a valid outward code (letters+digits), treat as England.
  if (/^[A-Z]{1,2}\d[A-Z0-9]?$/.test(out) || /^[A-Z]{1,2}\d{1,2}$/.test(out)) {
    return "England";
  }

  return "Unknown";
}
