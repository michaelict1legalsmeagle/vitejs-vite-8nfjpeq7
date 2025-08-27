import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { analyze } from "../lib/api";
export default function DealSummary() {
    const [guidePrice, setGuidePrice] = React.useState("200000");
    const [rentPcm, setRentPcm] = React.useState("1200");
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState(null);
    const [result, setResult] = React.useState(null);
    async function run() {
        setErr(null);
        setResult(null);
        const gp = Number(guidePrice.replace(/[, ]/g, ""));
        const rp = Number(rentPcm.replace(/[, ]/g, ""));
        if (!Number.isFinite(gp) || !Number.isFinite(rp) || gp <= 0) {
            setErr("Enter a valid guide price and monthly rent.");
            return;
        }
        try {
            setBusy(true);
            const res = await analyze(gp, rp);
            setResult({ guidePrice: res.guidePrice, rentPcm: res.rentPcm, grossYieldPct: res.grossYieldPct });
        }
        catch (e) {
            setErr(e?.message ?? "Analyze failed");
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "card mb-4", "aria-live": "polite", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-semibold", children: "Deal Summary" }), _jsx("button", { className: "btn btn-primary", onClick: run, disabled: busy, children: busy ? "Calculating…" : "Analyze" })] }), _jsxs("div", { className: "grid gap-2 md:grid-cols-3", children: [_jsxs("label", { className: "text-sm", children: ["Guide Price (\u00A3)", _jsx("input", { className: "input mt-1", inputMode: "numeric", value: guidePrice, onChange: (e) => setGuidePrice(e.target.value) })] }), _jsxs("label", { className: "text-sm", children: ["Rent (pcm \u00A3)", _jsx("input", { className: "input mt-1", inputMode: "numeric", value: rentPcm, onChange: (e) => setRentPcm(e.target.value) })] }), _jsx("div", { className: "text-sm mt-5", children: result ? (_jsxs("div", { className: "flex gap-6", children: [_jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "Yield:" }), " ", _jsxs("b", { children: [result.grossYieldPct.toFixed(1), "%"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "Guide:" }), " \u00A3", result.guidePrice.toLocaleString()] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500", children: "Rent:" }), " \u00A3", result.rentPcm.toLocaleString(), "/mo"] })] })) : (_jsx("div", { className: "text-slate-500", children: "Enter figures then click Analyze." })) })] }), err && _jsx("div", { className: "text-xs text-red-600 mt-2", children: err })] }));
}
