import React from "react";
import { usePrefs } from "@/store/usePrefs";

type Row = {
  key:
    | "gross"
    | "net"
    | "coc"
    | "icr"
    | "roi5"
    | "breakeven"
    | "ltv"
    | "sdlt";
  label: string;
  hint: string; // unit guide
  asPercent?: boolean; // show % vs raw
};

const ROWS: Row[] = [
  { key: "gross", label: "Gross Yield", hint: "%", asPercent: true },
  { key: "net", label: "Net Yield", hint: "%", asPercent: true },
  { key: "coc", label: "Cash-on-Cash", hint: "%", asPercent: true },
  { key: "icr", label: "ICR (min)", hint: "×" },
  { key: "roi5", label: "ROI (5y)", hint: "%", asPercent: true },
  { key: "breakeven", label: "Break-even (max)", hint: "%", asPercent: true },
  { key: "ltv", label: "LTV (max)", hint: "%", asPercent: true },
  { key: "sdlt", label: "SDLT Impact (max)", hint: "%", asPercent: true },
];

export default function UserTargets() {
  const targets = usePrefs((s) => s.values.targets);
  const setTarget = usePrefs((s) => s.setTarget);
  const reset = usePrefs((s) => s.resetTargets);

  return (
    <section className="rounded-xl border bg-white px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">User Targets (override)</div>
        <button
          className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
          onClick={() => reset()}
          title="Clear all overrides"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {ROWS.map((r) => {
          const v = targets?.[r.key];
          const display = r.asPercent
            ? v != null
              ? String((v * 100).toFixed(2))
              : ""
            : v != null
            ? String(v)
            : "";

          return (
            <label key={r.key} className="text-xs flex flex-col gap-1">
              <span className="opacity-70">{r.label}</span>
              <div className="flex items-center gap-1">
                <input
                  className="w-full rounded border px-2 py-1"
                  placeholder={r.asPercent ? "e.g. 8.0" : r.hint === "×" ? "e.g. 1.45" : "e.g. 0.50"}
                  value={display}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) {
                      setTarget(r.key, null);
                      return;
                    }
                    const num = Number(raw);
                    if (!Number.isFinite(num)) return;
                    const val = r.asPercent ? num / 100 : num;
                    setTarget(r.key, val);
                  }}
                />
                <span className="opacity-60">{r.hint}</span>
              </div>
            </label>
          );
        })}
      </div>

      <p className="text-[11px] mt-2 opacity-60">
        Enter a value to override thresholds for that metric. Percent inputs are the target for 🟢 Green
        (e.g. Net ≥ 6%). For “max” metrics (LTV, Break-even, SDLT) lower is better.
      </p>
    </section>
  );
}
