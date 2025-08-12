import React from "react";
import { usePack } from "../store/usePack";
import NpsSummary from "./NpsSummary";

export default function RawJson() {
  const analysis = usePack((s) => s.analysis);
  const listing  = usePack((s) => s.listing);

  const combined = { listing, analysis };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(combined, null, 2));
      window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Copied ✓" } }));
    } catch {
      window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Copy failed" } }));
    }
  };

  return (
    <div className="space-y-4">
      <NpsSummary />

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Machine-readable output</h2>
          <button className="btn" onClick={copy}>📋 Copy</button>
        </div>
        <p className="text-sm opacity-70 mb-3">
          This shows the current in-memory <code>listing</code> and <code>analysis</code>.
        </p>
        <pre className="text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto">
{JSON.stringify(combined, null, 2)}
        </pre>
      </div>
    </div>
  );
}
