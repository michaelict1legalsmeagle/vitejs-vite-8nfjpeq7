import React from "react";
import { useDeals } from "@/store/useSavedDeals";
import {
  toAnnual,
  grossYield,
  netYield,
  ltv as ltvPct,
  ioMonthly,
  pmtMonthly,
  icr as icrCalc,
  breakEvenOcc,
  cashOnCash,
  roi5Years,
} from "@/lib/finance";
import { calcSdlt, sdltImpactPct } from "@/lib/sdlt";

const DEFAULT_DEAL = {
  price: 250000,
  rentMonthly: 1600,
  loan: 187500,
  rate: 0.055,
  termYears: 25,
  costsAnnual: 2500,
  product: "IO" as "IO" | "Repay",
};

const THRESH = {
  gross:     { green: 0.07, amber: 0.05, invert: false },
  net:       { green: 0.045, amber: 0.03, invert: false },
  coc:       { green: 0.10,  amber: 0.07, invert: false },
  icr:       { green: 1.45,  amber: 1.25, invert: false },
  roi5:      { green: 0.50,  amber: 0.30, invert: false },
  breakeven: { green: 0.80,  amber: 0.90, invert: true  },
  ltv:       { green: 0.75,  amber: 0.80, invert: true  },
  sdlt:      { green: 0.03,  amber: 0.05, invert: true  },
} as const;

type Key = keyof typeof THRESH;

function bandify(val: number, k: Key): "GREEN"|"AMBER"|"RED" {
  const { green, amber, invert } = THRESH[k];
  if (invert) return val <= green ? "GREEN" : val <= amber ? "AMBER" : "RED";
  return val >= green ? "GREEN" : val >= amber ? "AMBER" : "RED";
}

export default function InvestmentMetrics() {
  const { items } = useDeals();
  const d = (items[0]?.deal as typeof DEFAULT_DEAL) ?? DEFAULT_DEAL;

  const rentA = toAnnual(d.rentMonthly);
  const gy = grossYield(d.price, rentA);
  const ny = netYield(d.price, rentA, d.costsAnnual);
  const ltv = ltvPct(d.loan, d.price);

  const stressedMonthly = ioMonthly(d.rate, d.loan);
  const icr = icrCalc(d.rentMonthly, stressedMonthly);

  const actualMonthly = d.product === "Repay" ? pmtMonthly(d.rate, d.termYears, d.loan) : ioMonthly(d.rate, d.loan);
  const mortgageAnnual = actualMonthly * 12;
  const be = breakEvenOcc(d.costsAnnual, mortgageAnnual, rentA);

  const sdlt = calcSdlt({ price: d.price, surcharge3pc: true });
  const sdltPct = sdltImpactPct(d.price, sdlt);

  const netCashAnnual = Math.max(0, rentA - d.costsAnnual - mortgageAnnual);
  const cashInv = Math.max(1, d.price - d.loan + sdlt);
  const coc = cashOnCash(netCashAnnual, cashInv);

  const roi5 = roi5Years({
    annualNetCash: netCashAnnual,
    monthlyPayment: d.product === "Repay" ? actualMonthly : 0,
    rateAnnual: d.rate,
    termYears: d.termYears,
    loan: d.loan,
    price: d.price,
    growthAnnual: 0.02,
    cashInvested: cashInv,
  });

  const rows: { key: Key; value: number }[] = [
    { key: "gross",     value: gy },
    { key: "net",       value: ny },
    { key: "coc",       value: coc },
    { key: "icr",       value: icr },
    { key: "roi5",      value: roi5 },
    { key: "breakeven", value: be },
    { key: "ltv",       value: ltv },
    { key: "sdlt",      value: sdltPct },
  ];

  return (
    <section className="space-y-3">
      <div className="text-lg font-semibold mb-1">Metrics</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map(({ key, value }) => {
          const band = bandify(value, key);
          return (
            <div key={key} className={`rounded-xl border p-3 ${tone(band)} transition-colors`}>
              <div className="flex items-center justify-between">
                <div className="text-xs opacity-70">{label(key)}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge(band)}`}>{band}</span>
              </div>
              <div className="text-2xl font-semibold mt-1">{fmt(key, value)}</div>
              <div className="text-[11px] opacity-60 mt-1">
                {THRESH[key].invert ? "Lower is better" : "Higher is better"} · G≥{fmt(key, THRESH[key].green)} · A≥{fmt(key, THRESH[key].amber)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function fmt(k: Key, v: number) {
  if (k === "icr") return v.toFixed(2) + "×";
  if (k === "ltv" || k === "breakeven") return (v * 100).toFixed(1) + "%";
  return (v * 100).toFixed(2) + "%";
}
function label(k: Key) {
  switch (k) {
    case "gross": return "Gross Yield";
    case "net": return "Net Yield";
    case "coc": return "Cash‑on‑Cash";
    case "icr": return "ICR (Stress)";
    case "roi5": return "ROI (5y, simple)";
    case "breakeven": return "Break‑even Occupancy";
    case "ltv": return "LTV";
    case "sdlt": return "SDLT Impact";
  }
}
function tone(c: "GREEN" | "AMBER" | "RED") {
  return c === "GREEN"
    ? "border-green-200 bg-green-50"
    : c === "AMBER"
    ? "border-amber-200 bg-amber-50"
    : "border-rose-200 bg-rose-50";
}
function badge(c: "GREEN" | "AMBER" | "RED") {
  return c === "GREEN"
    ? "text-green-700 bg-green-100 border-green-300"
    : c === "AMBER"
    ? "text-amber-700 bg-amber-100 border-amber-300"
    : "text-rose-700 bg-rose-100 border-rose-300";
}
