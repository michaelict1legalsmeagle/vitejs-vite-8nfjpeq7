// src/lib/sdlt.ts
import type { Region } from "./region";

/**
 * Pragmatic SDLT/LTT/LBTT calculator.
 * Enough for investor comparisons; not a substitute for a solicitor.
 * Returns tax in GBP for a given purchase price.
 */

type Band = { upTo: number | null; rate: number }; // rate = % (e.g., 8 for 8%)

function calcBands(price: number, bands: Band[]): number {
  let remaining = price;
  let tax = 0;
  let lower = 0;
  for (const b of bands) {
    const cap = b.upTo ?? Infinity;
    const slice = Math.max(Math.min(remaining, cap - lower), 0);
    if (slice > 0) {
      tax += slice * (b.rate / 100);
      remaining -= slice;
      lower = cap;
    }
    if (remaining <= 0) break;
  }
  return Math.max(0, Math.round(tax));
}

/**
 * England & Northern Ireland – Additional property (3% surcharge) simplified.
 * Source: investor “higher rates” bands. Rounded for app use.
 */
const ENI_INVESTOR: Band[] = [
  { upTo: 250_000, rate: 3 },    // 0-250k
  { upTo: 925_000, rate: 8 },    // 250k-925k
  { upTo: 1_500_000, rate: 13 }, // 925k-1.5m
  { upTo: null, rate: 15 },      // 1.5m+
];

/** Wales (LTT) additional property (approx investor bands). */
const WALES_INVESTOR: Band[] = [
  { upTo: 180_000, rate: 4 },
  { upTo: 250_000, rate: 7.5 },
  { upTo: 400_000, rate: 9 },
  { upTo: 750_000, rate: 11.5 },
  { upTo: 1_500_000, rate: 14 },
  { upTo: null, rate: 16 },
];

/** Scotland (LBTT) with ADS uplift (approx). */
const SCOTLAND_INVESTOR: Band[] = [
  { upTo: 145_000, rate: 6 },    // ADS ~6% up to threshold
  { upTo: 250_000, rate: 8 },
  { upTo: 325_000, rate: 11 },
  { upTo: 750_000, rate: 16 },
  { upTo: null, rate: 18 },
];

/**
 * Compute property transaction tax at purchase time.
 * `secondHome=true` is assumed for BTL investors.
 */
export function computeSdlt(price: number | null | undefined, region: Region, secondHome = true): number {
  const p = Math.max(Number(price ?? 0), 0);
  if (!secondHome || p <= 0) return 0;

  switch (region) {
    case "Wales": return calcBands(p, WALES_INVESTOR);
    case "Scotland": return calcBands(p, SCOTLAND_INVESTOR);
    case "England":
    case "Northern Ireland":
    default:
      return calcBands(p, ENI_INVESTOR);
  }
}
