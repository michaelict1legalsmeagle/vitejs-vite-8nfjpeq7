// src/App.tsx
import React from "react";

// ⬇️ Adjust ONLY if your paths differ
import ScenarioChips from "./components/ScenarioChips";
import MetricsPanel from "./components/MetricsPanel";
import Inputs from "./components/Inputs";            // keep your existing Inputs card
import SaveBar from "./components/SaveBar";          // your existing Save/Export bar
import { useApp } from "./store/useApp";
import { useDealValues } from "./store/useDealValues";
import { regionFromPostcode } from "./lib/region";

export default function App() {
  // read scenario + deal values for status row (read-only)
  const scenario = useApp((s) => s.scenario);
  const values = useDealValues((s) => s.values);

  // very light derived labels for the status bar (no compute-path changes)
  const postcode = (values as any)?.postcode ?? "";
  const region = regionFromPostcode(String(postcode || ""));
  const lender = (values as any)?.lender ?? "Generic";
  const stress = (values as any)?.stressRate ?? (values as any)?.rate ?? "";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Deal Scorer — UI</h1>
          <div className="flex items-center gap-3">
            <ScenarioChips />
          </div>
        </div>
      </header>

      {/* Status bar */}
      <section className="mx-auto max-w-7xl px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <StatusPill label="Scenario" value={String(scenario).toLowerCase()} />
          <StatusPill label="Region" value={region} />
          <StatusPill label="Lender" value={String(lender)} />
          <StatusPill label="Stress used" value={String(stress || "—")} />
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 pb-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Inputs card (your existing component) */}
          <section className="rounded-2xl border p-4">
            <h2 className="mb-3 text-base font-semibold">Inputs</h2>
            <Inputs />
          </section>

          {/* Right: Tiles + explainer (kept exactly as your MetricsPanel renders) */}
          <section className="rounded-2xl border p-4">
            <h2 className="mb-3 text-base font-semibold">Finance • Score • Metrics</h2>
            <MetricsPanel />
          </section>
        </div>

        {/* Save / Export */}
        <div className="mt-6">
          <SaveBar />
        </div>
      </main>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500">{label}:</span>
      <span className="px-2 py-0.5 rounded-full border text-xs">{value || "—"}</span>
    </div>
  );
}
