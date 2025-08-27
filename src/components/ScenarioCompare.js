import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ScenarioCompare.tsx
import React from "react";
import useSavedDeals from "../store/useSavedDeals";
import { fmtCurrency, fmtPct } from "../lib/metrics";
export default function ScenarioCompare() {
    const { items } = useSavedDeals((s) => s);
    const [aId, setAId] = React.useState("");
    const [bId, setBId] = React.useState("");
    const a = items.find((d) => d.id === aId);
    const b = items.find((d) => d.id === bId);
    if (items.length < 2) {
        return null; // hide until there are at least 2 saves
    }
    return (_jsxs("div", { className: "card mt-4", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: _jsx("h2", { className: "text-sm font-semibold", children: "Scenario Comparison" }) }), _jsxs("div", { className: "flex gap-4 mb-3", children: [_jsxs("select", { className: "input flex-1", value: aId, onChange: (e) => setAId(e.target.value), children: [_jsx("option", { value: "", children: "Select A" }), items.map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] }), _jsxs("select", { className: "input flex-1", value: bId, onChange: (e) => setBId(e.target.value), children: [_jsx("option", { value: "", children: "Select B" }), items.map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] })] }), (a && b) && (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-700", children: [_jsx("th", { className: "text-left py-1", children: "Metric" }), _jsx("th", { className: "text-right py-1", children: a.name }), _jsx("th", { className: "text-right py-1", children: b.name })] }) }), _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { className: "py-1", children: "Gross Yield" }), _jsx("td", { className: "text-right", children: fmtPct(a.metrics.grossYieldPct) }), _jsx("td", { className: "text-right", children: fmtPct(b.metrics.grossYieldPct) })] }), _jsxs("tr", { children: [_jsx("td", { className: "py-1", children: "ICR" }), _jsxs("td", { className: "text-right", children: [a.metrics.icr.toFixed(2), "\u00D7"] }), _jsxs("td", { className: "text-right", children: [b.metrics.icr.toFixed(2), "\u00D7"] })] }), _jsxs("tr", { children: [_jsx("td", { className: "py-1", children: "CoC" }), _jsx("td", { className: "text-right", children: fmtPct(a.metrics.cocPct) }), _jsx("td", { className: "text-right", children: fmtPct(b.metrics.cocPct) })] }), _jsxs("tr", { children: [_jsx("td", { className: "py-1", children: "Cash In" }), _jsx("td", { className: "text-right", children: fmtCurrency(a.metrics.cashInvested) }), _jsx("td", { className: "text-right", children: fmtCurrency(b.metrics.cashInvested) })] }), _jsxs("tr", { children: [_jsx("td", { className: "py-1", children: "Annual Cashflow" }), _jsx("td", { className: "text-right", children: fmtCurrency(a.metrics.annualCashflow) }), _jsx("td", { className: "text-right", children: fmtCurrency(b.metrics.annualCashflow) })] })] })] }))] }));
}
