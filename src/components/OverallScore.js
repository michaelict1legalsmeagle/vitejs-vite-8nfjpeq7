import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion } from "../lib/metrics";
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
function overallFrom(...bands) {
    if (bands.includes("RED"))
        return "RED";
    if (bands.includes("AMBER"))
        return "AMBER";
    return "GREEN";
}
function ringClass(band) {
    // Subtle, non-layout-changing ring/background for the headline score
    if (band === "GREEN")
        return "ring-emerald-600/40 bg-emerald-600/10 text-emerald-600";
    if (band === "AMBER")
        return "ring-amber-400/50 bg-amber-400/15 text-amber-600";
    return "ring-red-600/40 bg-red-600/10 text-red-600";
}
export default function OverallScore() {
    const { values } = useDealValues((s) => s);
    const m = computeMetricsWithRegion(values);
    const gyBand = ragFor("yield", m.grossYieldPct);
    const icrBand = ragFor("icr", m.icr);
    const cocBand = ragFor("coc", m.cocPct);
    const overall = overallFrom(gyBand, icrBand, cocBand);
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "text-base font-semibold", children: "Overall Score" }), _jsxs("div", { className: "mt-2 flex items-center gap-3", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full ring-2 font-bold text-lg " +
                            ringClass(overall), "aria-label": `Overall ${overall}`, title: `Overall ${overall}`, children: overall }), _jsxs("div", { className: "text-sm text-slate-600 dark:text-slate-300", children: [_jsxs("div", { children: ["Yield: ", _jsxs("b", { children: [m.grossYieldPct.toFixed(1), "%"] }), " (", gyBand, ")"] }), _jsxs("div", { children: ["ICR: ", _jsxs("b", { children: [m.icr.toFixed(2), "\u00D7"] }), " @ ", m.stressUsedPct.toFixed(2), "% (", icrBand, ")"] }), _jsxs("div", { children: ["CoC: ", _jsxs("b", { children: [m.cocPct.toFixed(1), "%"] }), " (", cocBand, ")"] })] })] }), _jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Overall takes the most conservative band across Yield, ICR, and CoC. Use the tiles and \u201CWhy\u201D panel to see drivers." })] }));
}
