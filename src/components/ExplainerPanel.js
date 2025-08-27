import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion, fmtPct } from "../lib/metrics";
// --- RAG bands (keep identical to tiles) ---
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
function Badge({ band }) {
    const cls = band === "GREEN"
        ? "bg-emerald-600 text-white"
        : band === "AMBER"
            ? "bg-amber-400 text-black"
            : "bg-red-600 text-white";
    return (_jsx("span", { className: `inline-block px-2 py-0.5 rounded-full text-[11px] ${cls}`, children: band }));
}
export default function ExplainerPanel() {
    const { values } = useDealValues((s) => s);
    const m = computeMetricsWithRegion(values);
    const gyBand = ragFor("yield", m.grossYieldPct);
    const icrBand = ragFor("icr", m.icr);
    const cocBand = ragFor("coc", m.cocPct);
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h2", { className: "text-base font-semibold", children: "Why this rating?" }), _jsxs("div", { className: "text-xs text-slate-500", children: ["Scenario: ", _jsx("span", { className: "font-medium", children: values.scenario || "—" }), " ", "\u2022 Postcode: ", _jsx("span", { className: "font-medium", children: values.postcode || "—" }), " ", "\u2022 Region: ", _jsx("span", { className: "font-medium", children: m.region }), " ", "\u2022 Stress used: ", _jsxs("span", { className: "font-medium", children: [m.stressUsedPct.toFixed(2), "%"] })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-700", children: [_jsx("th", { className: "text-left py-2", children: "Metric" }), _jsx("th", { className: "text-left py-2", children: "Your value" }), _jsx("th", { className: "text-center py-2", children: "Green" }), _jsx("th", { className: "text-center py-2", children: "Amber" }), _jsx("th", { className: "text-center py-2", children: "Red" })] }) }), _jsxs("tbody", { children: [_jsxs("tr", { className: "border-b border-slate-100 dark:border-slate-800", children: [_jsx("td", { className: "py-2", children: "Gross yield" }), _jsxs("td", { className: "py-2", children: [fmtPct(m.grossYieldPct), " \u00A0 ", _jsx(Badge, { band: gyBand })] }), _jsxs("td", { className: "py-2 text-center", children: [">= ", BANDS.yield.green, "%"] }), _jsxs("td", { className: "py-2 text-center", children: [BANDS.yield.amber, "%\u2013", BANDS.yield.green, "%"] }), _jsxs("td", { className: "py-2 text-center", children: ["< ", " ", BANDS.yield.amber, "%"] })] }), _jsxs("tr", { className: "border-b border-slate-100 dark:border-slate-800", children: [_jsx("td", { className: "py-2", children: "ICR (stressed)" }), _jsxs("td", { className: "py-2", children: [m.icr.toFixed(2), "\u00D7 \u00A0 ", _jsx(Badge, { band: icrBand }), _jsxs("span", { className: "ml-2 text-xs text-slate-500", children: ["@ ", m.stressUsedPct.toFixed(2), "%"] })] }), _jsxs("td", { className: "py-2 text-center", children: [">= ", BANDS.icr.green, "\u00D7"] }), _jsxs("td", { className: "py-2 text-center", children: [BANDS.icr.amber, "\u00D7\u2013", BANDS.icr.green, "\u00D7"] }), _jsxs("td", { className: "py-2 text-center", children: ["< ", " ", BANDS.icr.amber, "\u00D7"] })] }), _jsxs("tr", { children: [_jsx("td", { className: "py-2", children: "Cash-on-Cash" }), _jsxs("td", { className: "py-2", children: [fmtPct(m.cocPct), " \u00A0 ", _jsx(Badge, { band: cocBand })] }), _jsxs("td", { className: "py-2 text-center", children: [">= ", BANDS.coc.green, "%"] }), _jsxs("td", { className: "py-2 text-center", children: [BANDS.coc.amber, "%\u2013", BANDS.coc.green, "%"] }), _jsxs("td", { className: "py-2 text-center", children: ["< ", " ", BANDS.coc.amber, "%"] })] })] })] }) }), _jsx("p", { className: "mt-3 text-xs text-slate-500", children: "Thresholds are MVP defaults. Region-specific bands and lender rules can override these as we wire more data sources." })] }));
}
