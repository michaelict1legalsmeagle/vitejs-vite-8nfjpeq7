// src/components/StatusPanel.tsx
import React from "react";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion } from "../lib/metrics";
import { regionFromPostcode } from "../lib/region";

export default function StatusPanel() {
  const values = useDealValues((s) => s.values);
  const m = computeMetricsWithRegion(values);

  const region = regionFromPostcode(values.postcode);
  const lender = values.lender?.trim() || "";
  const stressSource = lender ? "Lender floor in effect" : "Region floor in effect";

  return (
    <div className="card">
      <div className="text-base font-semibold">Status</div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300/90">
        <div className="mb-2">
          <span className="text-slate-500">Scenario:</span>{" "}
          <span className="font-medium">{values.scenario || "Conservative"}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-slate-500">Region</div>
            <div className="font-medium">{region}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Postcode: {values.postcode || "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Lender</div>
            <div className="font-medium">{lender || "(Generic)"}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Stress used: <span className="font-mono">{m.stressUsedPct.toFixed(2)}%</span>{" "}
              <span className="opacity-80">({stressSource})</span>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Live store: <code>useDealValues</code> • Saves: <code>useSavedDeals</code>
        </div>
      </div>
    </div>
  );
}
