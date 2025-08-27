// src/components/MetricsPanel.tsx
import React from "react";
import { useDealValues } from "../store/useDealValues";   // you already had this
import { useApp } from "../store/useApp";                 // <-- NEW: read scenario here
import { buildContext } from "../lib/context";            // keep your existing import
import { computeMetrics } from "../lib/metrics";          // keep your existing import

export default function MetricsPanel() {
  // Values already live in the deal-values store
  const values = useDealValues((s) => s.values);

  // 🔴 The fix: also subscribe to scenario so pill clicks re-render this panel
  const scenario = useApp((s) => s.scenario);

  // Pass BOTH values + scenario through your existing compute pipeline
  const ctx = React.useMemo(() => buildContext({ values, scenario }), [values, scenario]);
  const metrics = React.useMemo(() => computeMetrics(ctx), [ctx]);

  // --- Optional, temporary debug (remove when happy):
  // console.log("MetricsPanel render →", { scenario });

  // Expose for console inspection if you want:
  // @ts-ignore
  if (typeof window !== "undefined") (window as any).__lastMetrics = metrics;

  // ▼▼▼ KEEP YOUR EXISTING MARKUP BELOW THIS LINE (unchanged) ▼▼▼
  // Paste the original JSX that renders your tiles, using `metrics` as before.
  // Example placeholder (DELETE this block and keep your real tiles):
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* Your existing tiles go here, unchanged, e.g.:
          <OverallScoreCard metrics={metrics} />
          <FinanceCheckCard metrics={metrics} />
          <GrossYieldTile value={metrics.grossYield} />
          <ICRTile value={metrics.icr} />
          <MdseTile value={metrics.mdse} />
          <CashflowTile value={metrics.annualCashflow} />
          <CoCTile value={metrics.coc} />
          <ProductTile value={metrics.productLabel} />
          <WhyThisRatingTable rows={metrics.explainer} />
      */}
    </div>
  );
  // ▲▲▲ KEEP YOUR EXISTING MARKUP ABOVE THIS LINE (unchanged) ▲▲▲
}
