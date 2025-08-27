import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion } from "../lib/metrics";
const ICR_THRESH = { green: 1.25, amber: 1.10 }; // >=1.25 GREEN, 1.10–1.25 AMBER, else RED
const LTV_THRESH = { green: 75, amber: 80 }; // <=75% GREEN, 75–80% AMBER, else RED
function ragIcR(v) {
    if (v >= ICR_THRESH.green)
        return "GREEN";
    if (v >= ICR_THRESH.amber)
        return "AMBER";
    return "RED";
}
function ragLtv(vPct) {
    if (vPct <= LTV_THRESH.green)
        return "GREEN";
    if (vPct <= LTV_THRESH.amber)
        return "AMBER";
    return "RED";
}
function RagPill({ band }) {
    const cls = band === "GREEN"
        ? "bg-emerald-600 text-white"
        : band === "AMBER"
            ? "bg-amber-400 text-black"
            : "bg-red-600 text-white";
    return (_jsx("span", { className: `ml-2 inline-block px-2 py-0.5 rounded-full text-[11px] ${cls}`, children: band }));
}
function Line({ label, value, band, hint }) {
    return (_jsxs("div", { className: "flex items-center justify-between py-1.5", children: [_jsx("div", { className: "text-sm text-slate-500", children: label }), _jsxs("div", { className: "text-sm font-medium flex items-center", children: [value, band && _jsx(RagPill, { band: band })] }), hint ? _jsx("div", { className: "col-span-2 text-xs text-slate-500 ml-2", children: hint }) : null] }));
}
export default function FinanceCheck() {
    const { values } = useDealValues((s) => s);
    const m = computeMetricsWithRegion(values);
    const price = Math.max(Number(values.price ?? 0), 0);
    const loan = Math.max(Number(values.loan ?? 0), 0);
    const ltvPct = price > 0 ? (loan * 100) / price : 0;
    const icrBand = ragIcR(m.icr);
    const ltvBand = ragLtv(ltvPct);
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "text-base font-semibold mb-2", children: "Finance Check" }), _jsx(Line, { label: "Stress rate used", value: `${m.stressUsedPct.toFixed(2)}%`, hint: values.lender ? "Lender floor in effect" : "Region floor in effect" }), _jsxs("div", { className: "mt-1 border-t border-slate-200 dark:border-slate-700 pt-2", children: [_jsx(Line, { label: "ICR (rent \u00F7 stressed IO)", value: `${m.icr.toFixed(2)}×`, band: icrBand, hint: `GREEN ≥ ${ICR_THRESH.green}× • AMBER ${ICR_THRESH.amber}–${ICR_THRESH.green}×` }), _jsx(Line, { label: "LTV", value: `${ltvPct.toFixed(1)}%`, band: ltvBand, hint: `GREEN ≤ ${LTV_THRESH.green}% • AMBER ≤ ${LTV_THRESH.amber}%` })] }), _jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Checks are indicative. Lender criteria vary by product/borrower profile; confirm on DIP." })] }));
}
