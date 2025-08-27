import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePack } from "../store/usePack";
export default function DeepDive() {
    const analysis = usePack((s) => s.analysis);
    if (!analysis)
        return _jsx("p", { className: "text-sm opacity-70", children: "Analyze first to populate the risk register." });
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-xl font-semibold", children: "RAG Risk Register" }), _jsx("ul", { className: "space-y-2", children: analysis.riskRegister.map((r) => (_jsxs("li", { className: "card flex items-start gap-2", children: [_jsx("span", { className: `mt-1 h-2 w-2 rounded-full ${r.severity === "red" ? "bg-red-500" : r.severity === "amber" ? "bg-amber-500" : "bg-emerald-500"}` }), _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium", children: r.title }), r.note && _jsx("div", { className: "opacity-70", children: r.note }), typeof r.estCost === "number" && _jsxs("div", { children: ["Est. \u00A3", r.estCost.toLocaleString()] })] })] }, r.id))) })] }));
}
