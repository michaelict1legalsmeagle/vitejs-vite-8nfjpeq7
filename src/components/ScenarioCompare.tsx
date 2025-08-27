// src/components/ScenarioCompare.tsx
import React from "react";
import useSavedDeals from "../store/useSavedDeals";
import { fmtCurrency, fmtPct } from "../lib/metrics";

export default function ScenarioCompare() {
  const { items } = useSavedDeals((s) => s);

  const [aId, setAId] = React.useState<string>("");
  const [bId, setBId] = React.useState<string>("");

  const a = items.find((d) => d.id === aId);
  const b = items.find((d) => d.id === bId);

  if (items.length < 2) {
    return null; // hide until there are at least 2 saves
  }

  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Scenario Comparison</h2>
      </div>
      <div className="flex gap-4 mb-3">
        <select className="input flex-1" value={aId} onChange={(e) => setAId(e.target.value)}>
          <option value="">Select A</option>
          {items.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select className="input flex-1" value={bId} onChange={(e) => setBId(e.target.value)}>
          <option value="">Select B</option>
          {items.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {(a && b) && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-1">Metric</th>
              <th className="text-right py-1">{a.name}</th>
              <th className="text-right py-1">{b.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">Gross Yield</td>
              <td className="text-right">{fmtPct(a.metrics.grossYieldPct)}</td>
              <td className="text-right">{fmtPct(b.metrics.grossYieldPct)}</td>
            </tr>
            <tr>
              <td className="py-1">ICR</td>
              <td className="text-right">{a.metrics.icr.toFixed(2)}×</td>
              <td className="text-right">{b.metrics.icr.toFixed(2)}×</td>
            </tr>
            <tr>
              <td className="py-1">CoC</td>
              <td className="text-right">{fmtPct(a.metrics.cocPct)}</td>
              <td className="text-right">{fmtPct(b.metrics.cocPct)}</td>
            </tr>
            <tr>
              <td className="py-1">Cash In</td>
              <td className="text-right">{fmtCurrency(a.metrics.cashInvested)}</td>
              <td className="text-right">{fmtCurrency(b.metrics.cashInvested)}</td>
            </tr>
            <tr>
              <td className="py-1">Annual Cashflow</td>
              <td className="text-right">{fmtCurrency(a.metrics.annualCashflow)}</td>
              <td className="text-right">{fmtCurrency(b.metrics.annualCashflow)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
