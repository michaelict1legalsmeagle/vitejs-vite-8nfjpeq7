import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import useDealValues from "../store/useDealValues";
import { computeMetricsWithRegion } from "../lib/metrics";
import { regionFromPostcode } from "../lib/region";
export default function StatusPanel() {
    const values = useDealValues((s) => s.values);
    const m = computeMetricsWithRegion(values);
    const region = regionFromPostcode(values.postcode);
    const lender = values.lender?.trim() || "";
    const stressSource = lender ? "Lender floor" : "Region floor";
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "text-base font-semibold", children: "Status" }), _jsxs("div", { className: "mt-2 text-sm text-slate-300/90", children: [_jsxs("div", { className: "mb-2", children: [_jsx("span", { className: "text-slate-400", children: "Scenario:" }), " ", _jsx("span", { className: "font-medium", children: values.scenario || "—" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-slate-400", children: "Region" }), _jsx("div", { className: "font-medium", children: region }), _jsxs("div", { className: "text-xs text-slate-400 mt-0.5", children: ["Postcode: ", values.postcode || "—"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-slate-400", children: "Lender" }), _jsx("div", { className: "font-medium", children: lender || "(Generic)" }), _jsxs("div", { className: "text-xs text-slate-400 mt-0.5", children: ["Stress used: ", _jsxs("span", { className: "font-mono", children: [m.stressUsedPct.toFixed(2), "%"] }), " ", _jsxs("span", { className: "opacity-80", children: ["(", stressSource, ")"] })] })] })] }), _jsxs("div", { className: "mt-3 text-xs text-slate-400", children: ["Live store: ", _jsx("code", { children: "useDealValues" }), " \u2022 Saves: ", _jsx("code", { children: "useSavedDeals" })] })] })] }));
}
