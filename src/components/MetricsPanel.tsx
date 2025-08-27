// src/components/MetricsPanel.tsx
import React from "react";
import useDealValues from "../store/useDealValues";
import {
  computeMetricsWithRegion,
  fmtCurrency,
  fmtPct,
} from "../lib/metrics";

// --- RAG thresholds (kept identical to Explainer + tiles) ---
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

function RagPill({ band }: { band: Rag }) {
  const cls =
    band === "GREEN"
      ? "bg-emerald-600 text-white"
      : band === "AMBER"
      ? "bg-amber-400 text-black"
      : "bg-red-600 text-white";
  return (
    <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-[11px] ${cls}`}>
      {band}
    </span>
  );
}

function Tile({
  title,
  value,
  sub,
  band,
}: {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  band?: Rag;
}) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold flex items-center">
        {value}
        {band && <RagPill band={band} />}
      </div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

export default function MetricsPanel() {
  const { values } = useDealValues((s) => s);
  const m = computeMetricsWithRegion(values);

  const gyBand = ragFor("yield", m.grossYieldPct);
  const icrBand = ragFor("icr", m.icr);
  const cocBand = ragFor("coc", m.cocPct);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Gross Yield */}
      <Tile
        title="Gross Yield"
        value={`${m.grossYieldPct.toFixed(1)}%`}
        sub={<span>(Annual rent ÷ price)</span>}
        band={gyBand}
      />

      {/* ICR */}
      <Tile
        title="ICR"
        value={`${m.icr.toFixed(2)}×`}
        sub={
          <>
            Rent ÷ stressed interest @ <b>{m.stressUsedPct.toFixed(2)}%</b>
          </>
        }
        band={icrBand}
      />

      {/* Cash-on-Cash */}
      <Tile
        title="Cash-on-Cash"
        value={`${m.cocPct.toFixed(1)}%`}
        sub={
          <>
            Cash in {fmtCurrency(m.cashInvested)}
          </>
        }
        band={cocBand}
      />

      {/* Monthly Debt Service */}
      <Tile
        title="Monthly Debt Service"
        value={fmtCurrency(m.monthlyDebtService)}
        sub={<>Annual {fmtCurrency(m.annualDebtService)}</>}
      />

      {/* Annual Cashflow */}
      <Tile
        title="Annual Cashflow"
        value={fmtCurrency(m.annualCashflow)}
        sub={<>{values.product === "REPAY" ? "After repayments" : "After interest"}</>}
      />

      {/* Product */}
      <Tile
        title="Product"
        value={values.product || "—"}
        sub={
          <>
            {values.rate ?? "—"}% • {values.term ?? "—"} years
          </>
        }
      />
    </section>
  );
}
