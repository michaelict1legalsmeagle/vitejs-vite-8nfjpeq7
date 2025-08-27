// src/lib/sdlt.ts
// Property transfer tax for investors by nation:
// - England & Northern Ireland: SDLT + 3% investor surcharge bands
// - Wales: LTT additional residential bands
// - Scotland: LBTT + ADS uplift (approximated as integrated bands)

import type { Region } from "./region";

type Band = { upTo: number | null; rate: number }; // rate in %

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

/** England & NI: SDLT with 3% investor surcharge (representative bands). */
const ENGLAND_NI_INVESTOR: Band[] = [
  { upTo: 250_000,   rate: 3  },
  { upTo: 925_000,   rate: 8  },
  { upTo: 1_500_000, rate: 13 },
  { upTo: null,      rate: 15 },
];

/** Wales: LTT additional residential (representative investor bands). */
const WALES_LTT_INVESTOR: Band[] = [
  { upTo: 180_000,   rate: 4   },
  { upTo: 250_000,   rate: 7.5 },
  { upTo: 400_000,   rate: 9   },
  { upTo: 750_000,   rate: 11.5},
  { upTo: 1_500_000, rate: 14  },
  { upTo: null,      rate: 16  },
];

/** Scotland: LBTT with ADS (represented as integrated investor bands). */
const SCOTLAND_LBTT_INVESTOR: Band[] = [
  { upTo: 145_000,   rate: 6  },
  { upTo: 250_000,   rate: 8  },
  { upTo: 325_000,   rate: 11 },
  { upTo: 750_000,   rate: 16 },
  { upTo: null,      rate: 18 },
];

/**
 * Compute property transaction tax for investors.
 * - `price`: purchase price (GBP)
 * - `region`: from regionFromPostcode
 * - `secondHome`: if false, returns 0 (we model investors as true)
 */
export function computeSdlt(
  price: number | null | undefined,
  region: Region,
  secondHome: boolean = true
): number {
  const p = Math.max(Number(price ?? 0), 0);
  if (!secondHome || p <= 0) return 0;

  switch (region) {
    case "Wales":
      return calcBands(p, WALES_LTT_INVESTOR);
    case "Scotland":
      return calcBands(p, SCOTLAND_LBTT_INVESTOR);
    case "Northern Ireland":
    case "England":
    default:
      return calcBands(p, ENGLAND_NI_INVESTOR);
  }
}
