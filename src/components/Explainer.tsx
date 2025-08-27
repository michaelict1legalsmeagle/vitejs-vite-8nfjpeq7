import React from "react";
import lenderRules from "@/data/lenderRules.json";
import regionBands from "@/data/regionBands.json";
import defaults from "@/data/defaults.json";
import policy from "@/data/policy.json";

import { resolveContext } from "@/lib/resolveContext.fast";
import { resolveBands } from "@/lib/resolveBands";
import { bandify } from "@/lib/scoring";
import type { MetricKey } from "@/lib/types";

import { useDeal } from "@/store/useSavedDeals";
import { usePrefs } from "@/store/usePrefs";
import { useLender } from "@/store/useLender";

const METRICS: MetricKey[] = ["gross","net","coc","icr","roi5","breakeven","ltv","sdlt"];

export default function Explainer() {
  const deal = useDeal((s)=>s.values);
  const vals = useDeal((s)=>s.metrics);
  const user = usePrefs((s)=>s.values);
  const lenderId = useLender((s)=>s.lenderId);

  const ctx = resolveContext(deal.postcode, { ...user }, lenderId, {
    tenancy: user.tenancy,
    lenderRules: lenderRules as any,
    policy: policy as any,
    regionBands: regionBands as any,
    defaults: defaults as any
  });

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="font-semibold">Why this rating?</div>
      <div className="grid md:grid-cols-2 gap-2 text-sm">
        {METRICS.map((k) => {
          const b = resolveBands(k, ctx);
          const colour = bandify(vals[k] ?? 0, b);
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
    </section>
  );
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
function fmt(metric: string, v:number) {
  if (["gross","net","coc","roi5","sdlt"].includes(metric)) return (v*100).toFixed(2) + "%";
  if (metric==="ltv" || metric==="breakeven") return (v*100).toFixed(1) + "%";
  if (metric==="icr") return v.toFixed(2) + "×";
  return String(v);
}
function tone(colour:"GREEN"|"AMBER"|"RED") {
  return colour === "GREEN" ? "text-green-600" : colour === "AMBER" ? "text-amber-600" : "text-red-600";
}
