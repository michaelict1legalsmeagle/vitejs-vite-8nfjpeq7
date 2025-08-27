// src/components/SaveBar.tsx
import React from "react";
import useDealValues from "../store/useDealValues";
import useSavedDeals from "../store/useSavedDeals";
import { computeMetricsWithRegion, fmtCurrency, fmtPct } from "../lib/metrics";
import { downloadCSV, toCSV } from "../lib/export";
import { openDealPrintWindow } from "../lib/printPdf";

export default function SaveBar() {
  // live values
  const { values, setValues } = useDealValues((s) => s);
  const metrics = computeMetricsWithRegion(values);

  // saved deals store
  const { items, add, rename, remove, clear, importAll } = useSavedDeals((s) => s);

  const [name, setName] = React.useState("My deal");

  const onSave = () => {
    const label = name.trim() || "Untitled deal";
    add(label, values);
  };

  // CSV: current
  const exportCurrentCSV = () => {
    const row = {
      name: name.trim() || "Live deal",
      scenario: values.scenario ?? "",
      postcode: values.postcode ?? "",
      region: metrics.region,
      lender: values.lender ?? "",
      include_sdlt: !!values.includeSdlt,
      price: values.price ?? "",
      rent_pm: values.rent ?? "",
      loan: values.loan ?? "",
      rate_pct: values.rate ?? "",
      term_years: values.term ?? "",
      costs: values.costs ?? "",
      product: values.product ?? "",
      stress_used_pct: metrics.stressUsedPct.toFixed(2),
      gross_yield_pct: metrics.grossYieldPct.toFixed(2),
      icr_x: metrics.icr.toFixed(2),
      cash_in: metrics.cashInvested,
      annual_cashflow: metrics.annualCashflow,
      coc_pct: metrics.cocPct.toFixed(2),
      sdlt_included: metrics.sdltIncluded,
    };
    const csv = toCSV([row]);
    downloadCSV(`deal-current-${Date.now()}.csv`, csv);
  };

  // CSV: all saves (prefer snapshot metrics)
  const exportAllSaves = () => {
    const rows = items.map((d: any) => {
      const snap = (d as any).metrics;
      return {
        id: d.id,
        name: d.name,
        saved_at_iso: new Date(d.createdAt).toISOString(),
        scenario: d.values?.scenario ?? "",
        postcode: d.values?.postcode ?? "",
        lender: d.values?.lender ?? "",
        include_sdlt: !!d.values?.includeSdlt,
        price: d.values?.price ?? "",
        rent_pm: d.values?.rent ?? "",
        loan: d.values?.loan ?? "",
        rate_pct: d.values?.rate ?? "",
        term_years: d.values?.term ?? "",
        costs: d.values?.costs ?? "",
        product: d.values?.product ?? "",
        region: snap?.region ?? "",
        stress_used_pct: snap ? snap.stressUsedPct.toFixed(2) : "",
        gross_yield_pct: snap ? snap.grossYieldPct.toFixed(2) : "",
        icr_x: snap ? snap.icr.toFixed(2) : "",
        cash_in: snap ? snap.cashInvested : "",
        annual_cashflow: snap ? snap.annualCashflow : "",
        coc_pct: snap ? snap.cocPct.toFixed(2) : "",
        sdlt_included: snap ? snap.sdltIncluded : "",
      };
    });
    const csv = toCSV(rows);
    downloadCSV(`deals-saved-${Date.now()}.csv`, csv);
  };

  // JSON backup/restore
  const backupJSON = () => {
    const payload = JSON.stringify({ version: 1, items }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deals-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const restoreJSON = (mode: "replace" | "merge") => {
    const input = fileInputRef.current;
    if (!input) return;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        importAll(text, mode);
      } finally {
        input.value = "";
      }
    };
    input.click();
  };

  // Load saved into live
  const loadSaved = (id: string) => {
    const deal = items.find((d: any) => d.id === id);
    if (!deal) return;
    setValues({ ...deal.values });
  };

  // PDF export (print dialog)
  const exportCurrentPDF = () => {
    openDealPrintWindow(values as any, metrics as any);
  };

  return (
    <div className="card">
      <div className="flex flex-col gap-3">
        {/* Save input + buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input"
            placeholder="Deal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave()}
          />
          <button className="btn btn-primary" onClick={onSave}>
            Save deal
          </button>

          {/* Export actions */}
          <div className="ml-auto flex flex-wrap gap-2">
            <button className="btn btn-sm btn-outline" onClick={exportCurrentCSV}>
              export current (CSV)
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={exportAllSaves}
              disabled={items.length === 0}
              title={items.length ? "" : "No saved deals yet"}
            >
              export saves (CSV)
            </button>
            <button className="btn btn-sm btn-outline" onClick={exportCurrentPDF}>
              export current (PDF)
            </button>
            <button className="btn btn-sm btn-outline" onClick={backupJSON}>
              backup (JSON)
            </button>
            <div className="inline-flex gap-1">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => restoreJSON("merge")}
              >
                restore (merge)
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => restoreJSON("replace")}
              >
                restore (replace)
              </button>
            </div>
          </div>

          {/* hidden file input for restore */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
          />
        </div>

        {/* Tiny summary */}
        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>Yield {fmtPct(metrics.grossYieldPct)}</span>
          <span>ICR {metrics.icr.toFixed(2)}× @ {metrics.stressUsedPct.toFixed(2)}%</span>
          <span>CoC {fmtPct(metrics.cocPct)}</span>
          <span>Cash in {fmtCurrency(metrics.cashInvested)}</span>
        </div>

        {/* Saved list */}
        <div>
          <div className="text-xs text-slate-500 mb-1">Saved deals</div>
          {items.length === 0 ? (
            <div className="text-xs text-slate-400">None yet</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  title={new Date(d.createdAt).toLocaleString()}
                >
                  <input
                    className="bg-transparent text-sm w-40 outline-none"
                    value={d.name}
                    onChange={(e) => rename(d.id, e.target.value)}
                  />
                  <button
                    className="text-xs underline"
                    onClick={() => loadSaved(d.id)}
                    title="Apply this saved deal to the live inputs"
                  >
                    load
                  </button>
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => remove(d.id)}
                  >
                    delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="text-right">
            <button
              className="btn btn-sm btn-outline text-red-600"
              onClick={clear}
              title="Remove all saved deals"
            >
              clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
