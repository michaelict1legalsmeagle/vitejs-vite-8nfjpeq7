import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import lenderRules from "@/data/lenderRules.json";
import regionBands from "@/data/regionBands.json";
import defaults from "@/data/defaults.json";
import policy from "@/data/policy.json";
import { resolveContext } from "@/lib/resolveContext.fast";
import { resolveBands } from "@/lib/resolveBands";
import { bandify } from "@/lib/scoring";
import { useDeal } from "@/store/useSavedDeals";
import { usePrefs } from "@/store/usePrefs";
import { useLender } from "@/store/useLender";
const METRICS = ["gross", "net", "coc", "icr", "roi5", "breakeven", "ltv", "sdlt"];
export default function Explainer() {
    const deal = useDeal((s) => s.values);
    const vals = useDeal((s) => s.metrics);
    const user = usePrefs((s) => s.values);
    const lenderId = useLender((s) => s.lenderId);
    const ctx = resolveContext(deal.postcode, { ...user }, lenderId, {
        tenancy: user.tenancy,
        lenderRules: lenderRules,
        policy: policy,
        regionBands: regionBands,
        defaults: defaults
    });
    return (_jsxs("section", { className: "rounded-xl border p-4 space-y-3", children: [_jsx("div", { className: "font-semibold", children: "Why this rating?" }), _jsx("div", { className: "grid md:grid-cols-2 gap-2 text-sm", children: METRICS.map((k) => {
                    const b = resolveBands(k, ctx);
                    const colour = bandify(vals[k] ?? 0, b);
                    return (_jsxs("div", { className: "border rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "font-medium", children: label(k) }), _jsx("span", { className: `text-xs ${tone(colour)}`, children: colour })] }), _jsxs("div", { className: "text-xs opacity-70 mt-1", children: ["Source: ", _jsx("b", { children: b.source }), " \u00B7 Thresholds: G\u2265", fmt(k, b.green), " \u00B7 A\u2265", fmt(k, b.amber), " ", b.invert ? "(lower=better)" : ""] })] }, k));
                }) }), _jsx("div", { className: "text-xs opacity-70", children: "Lender floors are enforced for ICR/LTV based on selected product and tax band. Regional bands derive from your postcode. User targets override all other sources per metric." })] }));
}
function label(k) {
    switch (k) {
        case "gross": return "Gross Yield";
        case "net": return "Net Yield";
        case "coc": return "Cash-on-Cash";
        case "icr": return "ICR (Stress)";
        case "roi5": return "ROI (5y)";
        case "breakeven": return "Break-even Occupancy";
        case "ltv": return "LTV";
        case "sdlt": return "SDLT Impact";
        default: return k.toUpperCase();
    }
}
function fmt(metric, v) {
    if (["gross", "net", "coc", "roi5", "sdlt"].includes(metric))
        return (v * 100).toFixed(2) + "%";
    if (metric === "ltv" || metric === "breakeven")
        return (v * 100).toFixed(1) + "%";
    if (metric === "icr")
        return v.toFixed(2) + "×";
    return String(v);
}
function tone(colour) {
    return colour === "GREEN" ? "text-green-600" : colour === "AMBER" ? "text-amber-600" : "text-red-600";
}
