import React from "react";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion, fmtPct } from "../lib/metrics";

// --- RAG bands (keep identical to tiles) ---
const BANDS = {
  yield: { green: 7, amber: 5 },     // >=7% GREEN, 5–7% AMBER, else RED
  icr:   { green: 1.25, amber: 1.10 }, // >=1.25x GREEN, 1.10–1.25x AMBER, else RED
  coc:   { green: 10, amber: 6 },    // >=10% GREEN, 6–10% AMBER, else RED
};

type Rag = "GREEN" | "AMBER" | "RED";
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

function Badge({ band }: { band: Rag }) {
  const cls =
    band === "GREEN"
      ? "bg-emerald-600 text-white"
      : band === "AMBER"
      ? "bg-amber-400 text-black"
      : "bg-red-600 text-white";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${cls}`}>
      {band}
    </span>
  );
}

export default function ExplainerPanel() {
  const { values } = useDealValues((s) => s);
  const m = computeMetricsWithRegion(values);

  const gyBand = ragFor("yield", m.grossYieldPct);
  const icrBand = ragFor("icr", m.icr);
  const cocBand = ragFor("coc", m.cocPct);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">Why this rating?</h2>
        <div className="text-xs text-slate-500">
          Scenario: <span className="font-medium">{values.scenario || "—"}</span>{" "}
          • Postcode: <span className="font-medium">{values.postcode || "—"}</span>{" "}
          • Region: <span className="font-medium">{m.region}</span>{" "}
          • Stress used: <span className="font-medium">{m.stressUsedPct.toFixed(2)}%</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2">Metric</th>
              <th className="text-left py-2">Your value</th>
              <th className="text-center py-2">Green</th>
              <th className="text-center py-2">Amber</th>
              <th className="text-center py-2">Red</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2">Gross yield</td>
              <td className="py-2">
                {fmtPct(m.grossYieldPct)} &nbsp; <Badge band={gyBand} />
              </td>
              <td className="py-2 text-center">{">= "}{BANDS.yield.green}%</td>
              <td className="py-2 text-center">
                {BANDS.yield.amber}%–{BANDS.yield.green}%
              </td>
              <td className="py-2 text-center">{"< "} {BANDS.yield.amber}%</td>
            </tr>

            <tr className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2">ICR (stressed)</td>
              <td className="py-2">
                {m.icr.toFixed(2)}× &nbsp; <Badge band={icrBand} />
                <span className="ml-2 text-xs text-slate-500">
                  @ {m.stressUsedPct.toFixed(2)}%
                </span>
              </td>
              <td className="py-2 text-center">{">= "}{BANDS.icr.green}×</td>
              <td className="py-2 text-center">
                {BANDS.icr.amber}×–{BANDS.icr.green}×
              </td>
              <td className="py-2 text-center">{"< "} {BANDS.icr.amber}×</td>
            </tr>

            <tr>
              <td className="py-2">Cash-on-Cash</td>
              <td className="py-2">
                {fmtPct(m.cocPct)} &nbsp; <Badge band={cocBand} />
              </td>
              <td className="py-2 text-center">{">= "}{BANDS.coc.green}%</td>
              <td className="py-2 text-center">
                {BANDS.coc.amber}%–{BANDS.coc.green}%
              </td>
              <td className="py-2 text-center">{"< "} {BANDS.coc.amber}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Thresholds are MVP defaults. Region-specific bands and lender rules can override these as we wire more data sources.
      </p>
    </div>
  );
}
