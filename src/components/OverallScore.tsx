// src/components/OverallScore.tsx
import React from "react";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion } from "../lib/metrics";

type Rag = "GREEN" | "AMBER" | "RED";

const BANDS = {
  yield: { green: 7, amber: 5 },      // >=7% GREEN, 5–7% AMBER, else RED
  icr:   { green: 1.25, amber: 1.10 },// >=1.25x GREEN, 1.10–1.25x AMBER, else RED
  coc:   { green: 10, amber: 6 },     // >=10% GREEN, 6–10% AMBER, else RED
};

function ragFor(metric: "yield" | "icr" | "coc", v: number): Rag {
  const t = BANDS[metric];
  if (metric === "icr") {
    if (v >= t.green) return "GREEN";
    if (v >= t.amber) return "AMBER";
    return "RED";
  }
  if (v >= t.green) return "GREEN";
  if (v >= t.amber) return "AMBER";
  return "RED";
}

function overallFrom(...bands: Rag[]): Rag {
  if (bands.includes("RED")) return "RED";
  if (bands.includes("AMBER")) return "AMBER";
  return "GREEN";
}

function ringClass(band: Rag): string {
  // Subtle, non-layout-changing ring/background for the headline score
  if (band === "GREEN") return "ring-emerald-600/40 bg-emerald-600/10 text-emerald-600";
  if (band === "AMBER") return "ring-amber-400/50 bg-amber-400/15 text-amber-600";
  return "ring-red-600/40 bg-red-600/10 text-red-600";
}

export default function OverallScore() {
  const { values } = useDealValues((s) => s);
  const m = computeMetricsWithRegion(values);

  const gyBand = ragFor("yield", m.grossYieldPct);
  const icrBand = ragFor("icr", m.icr);
  const cocBand = ragFor("coc", m.cocPct);
  const overall = overallFrom(gyBand, icrBand, cocBand);

  return (
    <div className="card">
      <div className="text-base font-semibold">Overall Score</div>

      <div className="mt-2 flex items-center gap-3">
        <div
          className={
            "inline-flex items-center justify-center w-16 h-16 rounded-full ring-2 font-bold text-lg " +
            ringClass(overall)
          }
          aria-label={`Overall ${overall}`}
          title={`Overall ${overall}`}
        >
          {overall}
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-300">
          <div>
            Yield: <b>{m.grossYieldPct.toFixed(1)}%</b> ({gyBand})
          </div>
          <div>
            ICR: <b>{m.icr.toFixed(2)}×</b> @ {m.stressUsedPct.toFixed(2)}% ({icrBand})
          </div>
          <div>
            CoC: <b>{m.cocPct.toFixed(1)}%</b> ({cocBand})
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Overall takes the most conservative band across Yield, ICR, and CoC. Use the tiles and “Why” panel to see drivers.
      </p>
    </div>
  );
}
