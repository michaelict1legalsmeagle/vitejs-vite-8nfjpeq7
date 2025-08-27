import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        const rows = items.map((d) => {
            const snap = d.metrics;
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
    const fileInputRef = React.useRef(null);
    const restoreJSON = (mode) => {
        const input = fileInputRef.current;
        if (!input)
            return;
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file)
                return;
            try {
                const text = await file.text();
                importAll(text, mode);
            }
            finally {
                input.value = "";
            }
        };
        input.click();
    };
    // Load saved into live
    const loadSaved = (id) => {
        const deal = items.find((d) => d.id === id);
        if (!deal)
            return;
        setValues({ ...deal.values });
    };
    // PDF export (print dialog)
    const exportCurrentPDF = () => {
        openDealPrintWindow(values, metrics);
    };
    return (_jsx("div", { className: "card", children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("input", { className: "input", placeholder: "Deal name", value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => e.key === "Enter" && onSave() }), _jsx("button", { className: "btn btn-primary", onClick: onSave, children: "Save deal" }), _jsxs("div", { className: "ml-auto flex flex-wrap gap-2", children: [_jsx("button", { className: "btn btn-sm btn-outline", onClick: exportCurrentCSV, children: "export current (CSV)" }), _jsx("button", { className: "btn btn-sm btn-outline", onClick: exportAllSaves, disabled: items.length === 0, title: items.length ? "" : "No saved deals yet", children: "export saves (CSV)" }), _jsx("button", { className: "btn btn-sm btn-outline", onClick: exportCurrentPDF, children: "export current (PDF)" }), _jsx("button", { className: "btn btn-sm btn-outline", onClick: backupJSON, children: "backup (JSON)" }), _jsxs("div", { className: "inline-flex gap-1", children: [_jsx("button", { className: "btn btn-sm btn-outline", onClick: () => restoreJSON("merge"), children: "restore (merge)" }), _jsx("button", { className: "btn btn-sm btn-outline", onClick: () => restoreJSON("replace"), children: "restore (replace)" })] })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "application/json", className: "hidden" })] }), _jsxs("div", { className: "text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1", children: [_jsxs("span", { children: ["Yield ", fmtPct(metrics.grossYieldPct)] }), _jsxs("span", { children: ["ICR ", metrics.icr.toFixed(2), "\u00D7 @ ", metrics.stressUsedPct.toFixed(2), "%"] }), _jsxs("span", { children: ["CoC ", fmtPct(metrics.cocPct)] }), _jsxs("span", { children: ["Cash in ", fmtCurrency(metrics.cashInvested)] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-slate-500 mb-1", children: "Saved deals" }), items.length === 0 ? (_jsx("div", { className: "text-xs text-slate-400", children: "None yet" })) : (_jsx("div", { className: "flex flex-wrap gap-2", children: items.map((d) => (_jsxs("div", { className: "flex items-center gap-2 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800", title: new Date(d.createdAt).toLocaleString(), children: [_jsx("input", { className: "bg-transparent text-sm w-40 outline-none", value: d.name, onChange: (e) => rename(d.id, e.target.value) }), _jsx("button", { className: "text-xs underline", onClick: () => loadSaved(d.id), title: "Apply this saved deal to the live inputs", children: "load" }), _jsx("button", { className: "text-xs text-red-600 hover:underline", onClick: () => remove(d.id), children: "delete" })] }, d.id))) }))] }), items.length > 0 && (_jsx("div", { className: "text-right", children: _jsx("button", { className: "btn btn-sm btn-outline text-red-600", onClick: clear, title: "Remove all saved deals", children: "clear all" }) }))] }) }));
}
