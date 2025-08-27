import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import lenderRules from "@/data/lenderRules.json";
import regionBands from "@/data/regionBands.json";
import defaults from "@/data/defaults.json";
import policy from "@/data/policy.json";
import { resolveContext } from "@/lib/resolveContext.fast";
import { resolveBands } from "@/lib/resolveBands";
import { bandify, points, composite } from "@/lib/scoring";
import { useDeal } from "@/store/useSavedDeals";
import { usePrefs } from "@/store/usePrefs";
import { useLender } from "@/store/useLender";
import { toAnnual, grossYield, netYield, ltv as ltvPct, ioMonthly, pmtMonthly, icr as icrCalc, breakEvenOcc, cashOnCash, roi5Years, } from "@/lib/finance";
import { calcSdlt, sdltImpactPct } from "@/lib/sdlt";
const SCENARIOS = [
    { key: "BASE", label: "Base" },
    { key: "RATE_UP_200", label: "+200bps" },
    { key: "VOID_2M", label: "Void +2m" },
    { key: "COSTS_UP_15", label: "Costs +15%" },
    { key: "RENT_DOWN_10", label: "Rent −10%" },
];
const METRICS = ["gross", "net", "coc", "icr", "roi5", "breakeven", "ltv", "sdlt"];
function applyScenario(d, s) {
    switch (s) {
        case "BASE": return { ...d };
        case "RATE_UP_200": return { ...d, rate: d.rate + 0.02 };
        case "VOID_2M": {
            const adjusted = ((12 - 2) / 12) * (d.rentMonthly * 12) / 12;
            return { ...d, rentMonthly: adjusted };
        }
        case "COSTS_UP_15": return { ...d, costsAnnual: Math.round(d.costsAnnual * 1.15) };
        case "RENT_DOWN_10": return { ...d, rentMonthly: d.rentMonthly * 0.9 };
    }
}
function confidenceBump(outcomes) {
    const greens = Object.values(outcomes).filter((c) => c === "GREEN").length;
    if (greens >= 3)
        return +5;
    if (greens <= 1)
        return -5;
    return 0;
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
export default function InsightsPanel() {
    const { values: deal } = useDeal();
    const { values: user } = usePrefs();
    const lenderId = useLender((s) => s.lenderId);
    const [active, setActive] = React.useState("BASE");
    // Compute scenario results (overall + score) and active context for explainer
    const { results, activeCtx, activeValues } = React.useMemo(() => {
        const map = {};
        let activeCtxLocal = null;
        let activeValuesLocal = METRICS.reduce((o, k) => ({ ...o, [k]: 0 }), {});
        for (const { key } of SCENARIOS) {
            const d = applyScenario(deal, key);
            const ctx = resolveContext(d.postcode ?? deal.postcode, { ...user }, lenderId, {
                tenancy: user.tenancy,
                lenderRules: lenderRules,
                policy: policy,
                regionBands: regionBands,
                defaults: defaults
            });
            const rentA = toAnnual(d.rentMonthly);
            const gy = grossYield(d.price, rentA);
            const ny = netYield(d.price, rentA, d.costsAnnual);
            const ltv = ltvPct(d.loan, d.price);
            const stressedMonthly = ioMonthly((ctx.lender?.stressRate ?? d.rate), d.loan);
            const icr = icrCalc(d.rentMonthly, stressedMonthly);
            const actualMonthly = d.product === "Repay"
                ? pmtMonthly(d.rate, d.termYears, d.loan)
                : ioMonthly(d.rate, d.loan);
            const mortgageAnnual = actualMonthly * 12;
            const be = breakEvenOcc(d.costsAnnual, mortgageAnnual, rentA);
            const sdlt = calcSdlt({ price: d.price, surcharge3pc: true });
            const sdltPct = sdltImpactPct(d.price, sdlt);
            const netCashAnnual = Math.max(0, rentA - d.costsAnnual - mortgageAnnual);
            const cashInvested = Math.max(1, d.price - d.loan + sdlt);
            const coc = cashOnCash(netCashAnnual, cashInvested);
            const roi5 = roi5Years({
                annualNetCash: netCashAnnual,
                monthlyPayment: d.product === "Repay" ? actualMonthly : 0,
                rateAnnual: d.rate,
                termYears: d.termYears,
                loan: d.loan,
                price: d.price,
                growthAnnual: 0.02,
                cashInvested
            });
            const values = { gross: gy, net: ny, coc, icr, roi5, breakeven: be, ltv, sdlt: sdltPct };
            const perMetric = Object.fromEntries(METRICS.map((k) => {
                const band = resolveBands(k, ctx);
                const colour = bandify(values[k], band);
                return [k, { value: values[k], band: colour, points: points(colour) }];
            }));
            const { score, overall } = composite(perMetric, user.weights);
            map[key] = { score, overall };
            if (key === active) {
                activeCtxLocal = ctx;
                activeValuesLocal = values;
            }
        }
        return { results: map, activeCtx: activeCtxLocal, activeValues: activeValuesLocal };
    }, [deal, user, lenderId, active]);
    const conf = confidenceBump(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.overall])));
    return (_jsxs("section", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center gap-2 flex-wrap", children: SCENARIOS.map(({ key, label }) => {
                    const r = results[key];
                    const toneCls = r?.overall === "GREEN" ? "bg-green-100 text-green-800 border-green-300" :
                        r?.overall === "AMBER" ? "bg-amber-100 text-amber-800 border-amber-300" :
                            "bg-red-100 text-red-800 border-red-300";
                    const activeTone = key === active ? "ring-2 ring-offset-2 ring-slate-400" : "";
                    return (_jsxs("button", { onClick: () => setActive(key), className: `px-3 py-1.5 rounded-full border text-sm ${toneCls} ${activeTone}`, title: `Score: ${r?.score ?? "—"}`, children: [label, " \u00B7 ", r?.overall ?? "—"] }, key));
                }) }), _jsxs("div", { className: "text-sm opacity-70", children: ["Confidence adjustment preview: ", conf >= 0 ? `+${conf}` : conf, " points"] }), activeCtx && (_jsxs("div", { className: "rounded-xl border p-4 space-y-3", children: [_jsxs("div", { className: "font-semibold", children: ["Why this rating? \u2014 ", SCENARIOS.find(s => s.key === active)?.label] }), _jsx("div", { className: "grid md:grid-cols-2 gap-2 text-sm", children: METRICS.map((k) => {
                            const b = resolveBands(k, activeCtx);
                            const colour = bandify(activeValues[k] ?? 0, b);
                            return (_jsxs("div", { className: "border rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "font-medium", children: label(k) }), _jsx("span", { className: `text-xs ${tone(colour)}`, children: colour })] }), _jsxs("div", { className: "text-xs opacity-70 mt-1", children: ["Source: ", _jsx("b", { children: b.source }), " \u00B7 Thresholds: G\u2265", fmt(k, b.green), " \u00B7 A\u2265", fmt(k, b.amber), " ", b.invert ? "(lower=better)" : ""] })] }, k));
                        }) }), _jsx("div", { className: "text-xs opacity-70", children: "Lender floors are enforced for ICR/LTV based on selected product and tax band. Regional bands derive from your postcode. User targets override all other sources per metric." })] }))] }));
}
