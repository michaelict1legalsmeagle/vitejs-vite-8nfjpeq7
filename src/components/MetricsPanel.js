import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion, fmtCurrency, } from "../lib/metrics";
// --- RAG thresholds (kept identical to Explainer + tiles) ---
const BANDS = {
    yield: { green: 7, amber: 5 }, // >=7% GREEN, 5–7% AMBER, else RED
    icr: { green: 1.25, amber: 1.10 }, // >=1.25x GREEN, 1.10–1.25x AMBER, else RED
    coc: { green: 10, amber: 6 }, // >=10% GREEN, 6–10% AMBER, else RED
};
function ragFor(metric, v) {
    const t = BANDS[metric];
    if (metric === "icr") {
        if (v >= t.green)
            return "GREEN";
        if (v >= t.amber)
            return "AMBER";
        return "RED";
    }
    if (v >= t.green)
        return "GREEN";
    if (v >= t.amber)
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
function Tile({ title, value, sub, band, }) {
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "text-sm text-slate-500", children: title }), _jsxs("div", { className: "mt-1 text-2xl font-semibold flex items-center", children: [value, band && _jsx(RagPill, { band: band })] }), sub ? _jsx("div", { className: "mt-1 text-xs text-slate-500", children: sub }) : null] }));
}
export default function MetricsPanel() {
    const { values } = useDealValues((s) => s);
    const m = computeMetricsWithRegion(values);
    const gyBand = ragFor("yield", m.grossYieldPct);
    const icrBand = ragFor("icr", m.icr);
    const cocBand = ragFor("coc", m.cocPct);
    return (_jsxs("section", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsx(Tile, { title: "Gross Yield", value: `${m.grossYieldPct.toFixed(1)}%`, sub: _jsx("span", { children: "(Annual rent \u00F7 price)" }), band: gyBand }), _jsx(Tile, { title: "ICR", value: `${m.icr.toFixed(2)}×`, sub: _jsxs(_Fragment, { children: ["Rent \u00F7 stressed interest @ ", _jsxs("b", { children: [m.stressUsedPct.toFixed(2), "%"] })] }), band: icrBand }), _jsx(Tile, { title: "Cash-on-Cash", value: `${m.cocPct.toFixed(1)}%`, sub: _jsxs(_Fragment, { children: ["Cash in ", fmtCurrency(m.cashInvested)] }), band: cocBand }), _jsx(Tile, { title: "Monthly Debt Service", value: fmtCurrency(m.monthlyDebtService), sub: _jsxs(_Fragment, { children: ["Annual ", fmtCurrency(m.annualDebtService)] }) }), _jsx(Tile, { title: "Annual Cashflow", value: fmtCurrency(m.annualCashflow), sub: _jsx(_Fragment, { children: values.product === "REPAY" ? "After repayments" : "After interest" }) }), _jsx(Tile, { title: "Product", value: values.product || "—", sub: _jsxs(_Fragment, { children: [values.rate ?? "—", "% \u2022 ", values.term ?? "—", " years"] }) })] }));
}
