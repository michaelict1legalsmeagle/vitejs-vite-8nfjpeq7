// src/components/FinanceCheck.tsx
import React from "react";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion, fmtPct } from "../lib/metrics";

type Rag = "GREEN" | "AMBER" | "RED";

const ICR_THRESH = { green: 1.25, amber: 1.10 }; // >=1.25 GREEN, 1.10–1.25 AMBER, else RED
const LTV_THRESH = { green: 75, amber: 80 };     // <=75% GREEN, 75–80% AMBER, else RED

function ragIcR(v: number): Rag {
  if (v >= ICR_THRESH.green) return "GREEN";
  if (v >= ICR_THRESH.amber) return "AMBER";
  return "RED";
}

function ragLtv(vPct: number): Rag {
  if (vPct <= LTV_THRESH.green) return "GREEN";
  if (vPct <= LTV_THRESH.amber) return "AMBER";
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

function Line({ label, value, band, hint }: { label: string; value: string; band?: Rag; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-sm font-medium flex items-center">
        {value}
        {band && <RagPill band={band} />}
      </div>
      {hint ? <div className="col-span-2 text-xs text-slate-500 ml-2">{hint}</div> : null}
    </div>
  );
}

export default function FinanceCheck() {
  const { values } = useDealValues((s) => s);
  const m = computeMetricsWithRegion(values);

  const price = Math.max(Number(values.price ?? 0), 0);
  const loan = Math.max(Number(values.loan ?? 0), 0);
  const ltvPct = price > 0 ? (loan * 100) / price : 0;

  const icrBand = ragIcR(m.icr);
  const ltvBand = ragLtv(ltvPct);

  return (
    <div className="card">
      <div className="text-base font-semibold mb-2">Finance Check</div>

      <Line
        label="Stress rate used"
        value={`${m.stressUsedPct.toFixed(2)}%`}
        hint={values.lender ? "Lender floor in effect" : "Region floor in effect"}
      />

      <div className="mt-1 border-t border-slate-200 dark:border-slate-700 pt-2">
        <Line
          label="ICR (rent ÷ stressed IO)"
          value={`${m.icr.toFixed(2)}×`}
          band={icrBand}
          hint={`GREEN ≥ ${ICR_THRESH.green}× • AMBER ${ICR_THRESH.amber}–${ICR_THRESH.green}×`}
        />
        <Line
          label="LTV"
          value={`${ltvPct.toFixed(1)}%`}
          band={ltvBand}
          hint={`GREEN ≤ ${LTV_THRESH.green}% • AMBER ≤ ${LTV_THRESH.amber}%`}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Checks are indicative. Lender criteria vary by product/borrower profile; confirm on DIP.
      </p>
    </div>
  );
}
