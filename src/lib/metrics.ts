// src/lib/metrics.ts
import { regionFromPostcode, type Region } from "./region";
import { stressFloorFor } from "./thresholds";
import { computeSdlt } from "./sdlt";

/** Inputs the rest of the app passes around. */
export type DealInputs = {
  price: number | null;
  rent: number | null;          // monthly
  loan: number | null;
  rate: number | null;          // % p.a.
  term: number | null;          // years
  costs: number | null;         // upfront non-tax costs
  product: "" | "IO" | "REPAY";
  postcode: string;
  scenario?: string;
  lender: string;
  includeSdlt: boolean;
};

/** Metrics we render on tiles / explainer. */
export type Metrics = {
  region: Region;

  grossYieldPct: number;     // %
  icr: number;               // x
  stressUsedPct: number;     // %

  monthlyDebtService: number;
  annualDebtService: number;
  annualCashflow: number;

  cashInvested: number;      // upfront cash-in (inc. SDLT if toggled)
  cocPct: number;            // %
};

export const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
export function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "£0";
  return GBP.format(Math.round(n));
}
export function fmtPct(n: number): string {
  if (!isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}

/** IO interest per month at a given annual % rate. */
function monthlyInterestIO(loan: number, ratePct: number): number {
  const r = ratePct / 100 / 12;
  return loan * r;
}

/** Full amortising repayment (monthly) at rate% for term years. */
function monthlyPaymentRepay(loan: number, ratePct: number, years: number): number {
  const r = ratePct / 100 / 12;
  const n = Math.max(1, Math.round(years * 12));
  if (r <= 0) return loan / n;
  const k = Math.pow(1 + r, n);
  return (loan * r * k) / (k - 1);
}

/** Core compute. Conservative but readable, no external deps. */
export function computeMetricsWithRegion(values: DealInputs): Metrics {
  const price   = Math.max(Number(values.price ?? 0), 0);
  const rentM   = Math.max(Number(values.rent ?? 0), 0);
  const loan    = Math.max(Number(values.loan ?? 0), 0);
  const ratePct = Math.max(Number(values.rate ?? 0), 0);
  const termY   = Math.max(Number(values.term ?? 0), 0);
  const costs   = Math.max(Number(values.costs ?? 0), 0);
  const product = (values.product || "") as "" | "IO" | "REPAY";

  const region  = regionFromPostcode(values.postcode || "");
  const floor   = stressFloorFor(region, values.lender || "", product);
  const stressUsedPct = Math.max(ratePct, floor);

  // Yield
  const grossYieldPct = price > 0 ? ((rentM * 12) * 100) / price : 0;

  // Stressed IO interest only (lenders assess ICR like this, even for repayment)
  const stressedInterestM = loan > 0 ? monthlyInterestIO(loan, stressUsedPct) : 0;
  const icr = stressedInterestM > 0 ? rentM / stressedInterestM : 0;

  // Debt service & cashflow at ACTUAL chosen product/rate
  let monthlyDebtService = 0;
  if (loan > 0) {
    if (product === "REPAY") monthlyDebtService = monthlyPaymentRepay(loan, ratePct, termY || 25);
    else monthlyDebtService = monthlyInterestIO(loan, ratePct);
  }
  const annualDebtService = monthlyDebtService * 12;
  const annualCashflow = rentM * 12 - annualDebtService;

  // Cash in (optionally include SDLT/LTT/LBTT)
  const equity = Math.max(price - loan, 0);
  const tax = values.includeSdlt ? computeSdlt(price, region, /*secondHome*/true) : 0;
  const cashInvested = equity + costs + tax;

  const cocPct = cashInvested > 0 ? (annualCashflow * 100) / cashInvested : 0;

  return {
    region,
    grossYieldPct,
    icr,
    stressUsedPct,
    monthlyDebtService,
    annualDebtService,
    annualCashflow,
    cashInvested,
    cocPct,
  };
}
