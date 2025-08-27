// src/lib/region.ts
// Minimal, pragmatic postcode → country mapping for tax & lender logic.
// We only need country-level granularity (England | Wales | Scotland | Northern Ireland | Unknown).

export type Region = "England" | "Wales" | "Scotland" | "Northern Ireland" | "Unknown";

/** Normalise a raw postcode-ish input into an uppercase outward code (bit before the space). */
export function outward(raw: string): string {
  if (!raw) return "";
  const up = raw.trim().toUpperCase().replace(/\s+/g, " ");
  // Outward code is everything up to first space; strip trailing non-alnum just in case.
  return up.split(" ")[0].replace(/[^A-Z0-9]/g, "");
}

/** Country from UK outward code. Falls back to 'England' with a final Unknown catch. */
export function regionFromPostcode(raw: string): Region {
  const out = outward(raw);
  if (!out) return "Unknown";

  // Northern Ireland: all BT
  if (/^BT/.test(out)) return "Northern Ireland";

  // Scotland outward codes (Royal Mail set)
  if (/^(AB|DD|DG|EH|FK|G|HS|IV|KA|KW|KY|ML|PA|PH|ZE)/.test(out)) return "Scotland";

  // Wales outward codes (pragmatic; SY spans border, treat as England unless you add a finer map)
  if (/^(CF|LD|LL|NP|SA)/.test(out)) return "Wales";

  // Everything else under UK is England for our purposes
  if (/^[A-Z]{1,2}\d/.test(out) || /^[A-Z]{1,2}\d[A-Z]/.test(out)) return "England";

  return "Unknown";
}
