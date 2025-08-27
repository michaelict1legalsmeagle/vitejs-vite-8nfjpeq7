import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useMetrics } from "../store/useMetrics";
import { usePack } from "../store/usePack";
function Stat({ label, value, sub }) {
    return (_jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center", children: [_jsx("div", { className: "text-xl font-semibold", children: value }), _jsx("div", { className: "text-xs opacity-70 mt-1", children: label }), sub && _jsx("div", { className: "text-[11px] opacity-60 mt-1", children: sub })] }));
}
export default function AreaComps() {
    const { metrics, comps, loading, error, fetchDemo, clear, compareYield } = useMetrics();
    const analysis = usePack((s) => s.analysis);
    const listing = usePack((s) => s.listing);
    const [postcode, setPostcode] = useState(listing?.lot?.postcode ?? "E1 6AN");
    const [guide, setGuide] = useState(listing?.listing?.guide_price_lower ?? analysis?.investor.guidePrice ?? 200000);
    const [rent, setRent] = useState(analysis?.investor.estRentPm ?? 1000);
    const { subjectYieldPct, areaYieldPct, deltaPct } = compareYield(guide || 0, rent || 0);
    const sold = useMemo(() => comps.filter(c => c.type === "sold").slice(0, 6), [comps]);
    const forsale = useMemo(() => comps.filter(c => c.type === "for_sale").slice(0, 4), [comps]);
    const torent = useMemo(() => comps.filter(c => c.type === "to_rent").slice(0, 4), [comps]);
    const exportArea = () => {
        const payload = { metrics, comps, inputs: { postcode, guide, rent } };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lexlot-area-${(postcode || "demo").replace(/\s+/g, "_")}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Area data exported ✓" } }));
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [_jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: "Postcode" }), _jsx("input", { className: "rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900", value: postcode, onChange: (e) => setPostcode(e.currentTarget.value), placeholder: "E1 6AN" })] }), _jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: "Guide price (\u00A3)" }), _jsx("input", { type: "number", className: "rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900", value: guide ?? "", onChange: (e) => setGuide(parseInt(e.currentTarget.value || "0", 10)) })] }), _jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: "Est. monthly rent (\u00A3)" }), _jsx("input", { type: "number", className: "rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900", value: rent ?? "", onChange: (e) => setRent(parseInt(e.currentTarget.value || "0", 10)) })] }), _jsxs("div", { className: "flex gap-2 ml-auto", children: [_jsx("button", { className: "btn", onClick: () => fetchDemo(postcode || "E1 6AN"), disabled: loading, children: "\uD83D\uDD0E Fetch demo" }), _jsx("button", { className: "btn", onClick: clear, children: "\uD83E\uDDF9 Clear" }), _jsx("button", { className: "btn", onClick: exportArea, children: "\uD83D\uDCE4 Export Area JSON" })] })] }), loading && _jsx("div", { className: "text-sm opacity-70", children: "Loading area metrics\u2026" }), error && _jsxs("div", { className: "text-sm text-red-600", children: ["Error: ", error] }), !metrics && !loading && (_jsxs("div", { className: "text-sm opacity-70", children: ["Enter a postcode (e.g., ", _jsx("b", { children: "E1 6AN" }), ") and click ", _jsx("b", { children: "Fetch demo" }), " to populate area stats and comparables."] })), metrics && (_jsxs("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-3", children: [_jsx(Stat, { label: "Median sale (12m)", value: `£${metrics.lrMedianPrice12m.toLocaleString()}`, sub: `${metrics.lrTransactions12m} transactions` }), _jsx(Stat, { label: "5y price trend", value: `${metrics.priceTrend5yPct}%` }), _jsx(Stat, { label: "Avg rent (2-bed)", value: `£${metrics.avgRentPm2bed.toLocaleString()}/m` }), _jsx(Stat, { label: "Area gross yield", value: `${metrics.grossYieldAvgPct}%` }), _jsx(Stat, { label: "EPC (avg)", value: metrics.epcAvg }), _jsx(Stat, { label: "Flood risk", value: metrics.floodRisk }), _jsx(Stat, { label: "Crime / 1k", value: metrics.crimePer1k }), _jsx(Stat, { label: "Your est. yield", value: subjectYieldPct != null ? `${subjectYieldPct}%` : "—", sub: areaYieldPct != null && deltaPct != null ? `vs area ${areaYieldPct}% (${deltaPct > 0 ? "+" : ""}${deltaPct}pp)` : undefined })] })), metrics && (_jsxs("div", { className: "grid lg:grid-cols-3 gap-4", children: [_jsx(CompCard, { title: "Sold comparables (12m)", items: sold }), _jsx(CompCard, { title: "On market (for sale)", items: forsale }), _jsx(CompCard, { title: "To let (monthly rent)", items: torent })] }))] }));
}
function CompCard({ title, items }) {
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { className: "font-semibold mb-2", children: title }), items.length === 0 ? (_jsx("div", { className: "text-sm opacity-70", children: "No data." })) : (_jsx("ul", { className: "space-y-2 text-sm", children: items.map((c) => (_jsxs("li", { className: "rounded-lg border border-slate-200 dark:border-slate-800 p-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "font-medium truncate", children: c.address }), c.distanceKm != null && _jsxs("div", { className: "text-xs opacity-60", children: [c.distanceKm, " km"] })] }), _jsxs("div", { className: "text-xs opacity-70", children: [c.postcode, " \u00B7 ", c.source, c.date ? ` · ${c.date}` : ""] }), _jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "font-semibold", children: c.type === "to_rent" ? `£${c.price.toLocaleString()}/m` : `£${c.price.toLocaleString()}` }), c.ppsf && _jsxs("span", { className: "text-xs opacity-70", children: ["\u00A3", c.ppsf, "/sqft"] }), c.epc && _jsxs("span", { className: "text-xs opacity-70", children: ["EPC ", c.epc] }), c.url && (_jsx("a", { className: "text-xs underline", href: c.url, target: "_blank", rel: "noreferrer", children: "Link" }))] })] }, c.id))) }))] }));
}
