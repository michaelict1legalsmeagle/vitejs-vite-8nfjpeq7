import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import rules from "../data/lenderRules.json";
import { useSettings } from "../store/useSettings.ts";
export default function LenderSelect() {
    const lenderId = useSettings(s => s.lenderId);
    const product = useSettings(s => s.product);
    const taxBand = useSettings(s => s.taxBand);
    const set = useSettings(s => s.set);
    const lender = rules.find(l => l.lenderId === lenderId) ?? rules[0];
    const prod = lender.products.find(p => p.code === product) ?? lender.products[0];
    return (_jsxs("div", { className: "bg-white shadow rounded-2xl p-4", children: [_jsx("div", { className: "text-sm font-semibold mb-2", children: "Finance Settings" }), _jsxs("div", { className: "grid sm:grid-cols-3 gap-3 text-sm", children: [_jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: "Lender" }), _jsx("select", { className: "border rounded-lg px-2 py-1.5", value: lenderId, onChange: (e) => set({ lenderId: e.target.value }), children: rules.map(l => (_jsx("option", { value: l.lenderId, children: l.name }, l.lenderId))) })] }), _jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: "Product" }), _jsx("select", { className: "border rounded-lg px-2 py-1.5", value: product, onChange: (e) => set({ product: e.target.value }), children: lender.products.map(p => (_jsx("option", { value: p.code, children: p.label }, p.code))) })] }), _jsxs("label", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs opacity-70", children: "Tax Band" }), _jsxs("select", { className: "border rounded-lg px-2 py-1.5", value: taxBand, onChange: (e) => set({ taxBand: e.target.value }), children: [_jsx("option", { value: "basic", children: "Basic" }), _jsx("option", { value: "higher", children: "Higher" })] })] })] }), _jsxs("div", { className: "text-[11px] opacity-60 mt-2", children: ["Max LTV ", Math.round(prod.maxLtv * 100), "% \u00B7 ICR floor ", ((taxBand === "higher") ? prod.icrHigher : prod.icrBasic).toFixed(2), "\u00D7 \u00B7 Stress ", (prod.stressRate * 100).toFixed(2), "%"] })] }));
}
