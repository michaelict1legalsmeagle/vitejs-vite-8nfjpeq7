import React from "react";

import lenderRules from "@/data/lenderRules.json";
import regionBands from "@/data/regionBands.json";
import defaults from "@/data/defaults.json";
import policy from "@/data/policy.json";

import { resolveContext } from "@/lib/resolveContext.fast";
import { resolveBands } from "@/lib/resolveBands";
import { bandify, points, composite } from "@/lib/scoring";
import type { MetricKey } from "@/lib/types";

import { useDeal } from "@/store/useSavedDeals";
import { usePrefs } from "@/store/usePrefs";
import { useLender } from "@/store/useLender";

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

type ScenarioKey = "BASE" | "RATE_UP_200" | "VOID_2M" | "COSTS_UP_15" | "RENT_DOWN_10";

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "BASE",        label: "Base" },
  { key: "RATE_UP_200", label: "+200bps" },
  { key: "VOID_2M",     label: "Void +2m" },
  { key: "COSTS_UP_15", label: "Costs +15%" },
  { key: "RENT_DOWN_10",label: "Rent −10%" },
];

const METRICS: MetricKey[] = ["gross","net","coc","icr","roi5","breakeven","ltv","sdlt"];

function applyScenario(d: any, s: ScenarioKey) {
  switch (s) {
    case "BASE": return { ...d };
    case "RATE_UP_200": return { ...d, rate: d.rate + 0.02 };
    case "VOID_2M": {
      const adjusted = ((12 - 2) / 12) * (d.rentMonthly * 12) / 12;
      return { ...d, rentMonthly: adjusted };
    }
    case "COSTS_UP_15": return { ...d, costsAnnual: Math.round(d.costsAnnual * 1.15) };
    case "RENT_DOWN_10": return { ...d, rentMonthly: d.rentMonthly * 0.9 };
  }
}

function confidenceBump(outcomes: Record<ScenarioKey, "GREEN"|"AMBER"|"RED">): number {
  const greens = Object.values(outcomes).filter((c) => c === "GREEN").length;
  if (greens >= 3) return +5;
  if (greens <= 1) return -5;
  return 0;
}

function fmt(metric: string, v:number) {
  if (["gross","net","coc","roi5","sdlt"].includes(metric)) return (v*100).toFixed(2) + "%";
  if (metric==="ltv" || metric==="breakeven") return (v*100).toFixed(1) + "%";
  if (metric==="icr") return v.toFixed(2) + "×";
  return String(v);
}
function tone(colour:"GREEN"|"AMBER"|"RED") {
  return colour === "GREEN" ? "text-green-600" : colour === "AMBER" ? "text-amber-600" : "text-red-600";
}
function label(k: string) {
  switch (k) {
    case "gross": return "Gross Yield";
    case "net": return "Net Yield";
    case "coc": return "Cash-on-Cash";
    case "icr": return "ICR (Stress)";
    case "roi5": return "ROI (5y)";
    case "breakeven": return "Break-even Occupancy";
    case "ltv": return "LTV";
    case "sdlt": return "SDLT Impact";
    default: return k.toUpperCase();
  }
}

export default function InsightsPanel() {
  const { values: deal } = useDeal();
  const { values: user } = usePrefs();
  const lenderId = useLender((s)=>s.lenderId);

  const [active, setActive] = React.useState<ScenarioKey>("BASE");

  // Compute scenario results (overall + score) and active context for explainer
  const { results, activeCtx, activeValues } = React.useMemo(() => {
    const map: Record<ScenarioKey, { overall: "GREEN"|"AMBER"|"RED"; score: number }> = {} as any;
    let activeCtxLocal: any = null;
    let activeValuesLocal: Record<MetricKey, number> = METRICS.reduce((o,k)=>({ ...o, [k]: 0 }), {} as any);

    for (const { key } of SCENARIOS) {
      const d = applyScenario(deal, key);
      const ctx = resolveContext(d.postcode ?? deal.postcode, { ...user }, lenderId, {
        tenancy: user.tenancy,
        lenderRules: lenderRules as any,
        policy: policy as any,
        regionBands: regionBands as any,
        defaults: defaults as any
      });

      const rentA = toAnnual(d.rentMonthly);
      const gy = grossYield(d.price, rentA);
      const ny = netYield(d.price, rentA, d.costsAnnual);
      const ltv = ltvPct(d.loan, d.price);

      const stressedMonthly = ioMonthly((ctx.lender?.stressRate ?? d.rate), d.loan);
      const icr = icrCalc(d.rentMonthly, stressedMonthly);

      const actualMonthly =
        (d as any).product === "Repay"
          ? pmtMonthly(d.rate, d.termYears, d.loan)
          : ioMonthly(d.rate, d.loan);

      const mortgageAnnual = actualMonthly * 12;
      const be = breakEvenOcc(d.costsAnnual, mortgageAnnual, rentA);

      const sdlt = calcSdlt({ price: d.price, surcharge3pc: true });
      const sdltPct = sdltImpactPct(d.price, sdlt);

      const netCashAnnual = Math.max(0, rentA - d.costsAnnual - mortgageAnnual);
      const cashInvested = Math.max(1, d.price - d.loan + sdlt);
      const coc = cashOnCash(netCashAnnual, cashInvested);

      const roi5 = roi5Years({
        annualNetCash: netCashAnnual,
        monthlyPayment: (d as any).product === "Repay" ? actualMonthly : 0,
        rateAnnual: d.rate,
        termYears: d.termYears,
        loan: d.loan,
        price: d.price,
        growthAnnual: 0.02,
        cashInvested
      });

      const values = { gross: gy, net: ny, coc, icr, roi5, breakeven: be, ltv, sdlt: sdltPct } as Record<MetricKey, number>;

      const perMetric = Object.fromEntries(
        METRICS.map((k) => {
          const band = resolveBands(k, ctx);
          const colour = bandify(values[k], band);
          return [k, { value: values[k], band: colour, points: points(colour) } as const];
        })
      ) as Record<MetricKey, { value:number; band:"GREEN"|"AMBER"|"RED"; points:100|70|40 }>;

      const { score, overall } = composite(perMetric, user.weights);
      map[key] = { score, overall };

      if (key === active) {
        activeCtxLocal = ctx;
        activeValuesLocal = values;
      }
    }

    return { results: map, activeCtx: activeCtxLocal, activeValues: activeValuesLocal };
  }, [deal, user, lenderId, active]);

  const conf = confidenceBump(
    Object.fromEntries(Object.entries(results).map(([k, v]) => [k as ScenarioKey, v.overall])) as any
  );

  return (
    <section className="space-y-4">
      {/* Scenario chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {SCENARIOS.map(({ key, label }) => {
          const r = results[key];
          const toneCls =
            r?.overall === "GREEN" ? "bg-green-100 text-green-800 border-green-300" :
            r?.overall === "AMBER" ? "bg-amber-100 text-amber-800 border-amber-300" :
            "bg-red-100 text-red-800 border-red-300";
          const activeTone = key === active ? "ring-2 ring-offset-2 ring-slate-400" : "";
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`px-3 py-1.5 rounded-full border text-sm ${toneCls} ${activeTone}`}
              title={`Score: ${r?.score ?? "—"}`}
            >
              {label} · {r?.overall ?? "—"}
            </button>
          );
        })}
      </div>
      <div className="text-sm opacity-70">
        Confidence adjustment preview: {conf >= 0 ? `+${conf}` : conf} points
      </div>

      {/* Explainer for the ACTIVE scenario */}
      {activeCtx && (
        <div className="rounded-xl border p-4 space-y-3">
          <div className="font-semibold">Why this rating? — {SCENARIOS.find(s=>s.key===active)?.label}</div>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {METRICS.map((k) => {
              const b = resolveBands(k, activeCtx);
              const colour = bandify(activeValues[k] ?? 0, b);
              return (
                <div key={k} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{label(k)}</div>
                    <span className={`text-xs ${tone(colour)}`}>{colour}</span>
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    Source: <b>{b.source}</b> · Thresholds: G≥{fmt(k, b.green)} · A≥{fmt(k, b.amber)} {b.invert ? "(lower=better)" : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-xs opacity-70">
            Lender floors are enforced for ICR/LTV based on selected product and tax band. Regional bands derive from your postcode.
            User targets override all other sources per metric.
          </div>
        </div>
      )}
    </section>
  );
}
