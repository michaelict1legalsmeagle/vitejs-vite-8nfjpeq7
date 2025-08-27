import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useDeals } from "@/store/useSavedDeals";
import { downloadCSV } from "@/lib/csv"; // already in your repo
export default function DealTable() {
    const { items, clear, remove, rename } = useDeals();
    function exportCsv() {
        const rows = items.map((d) => ({
            id: d.id,
            name: d.name,
            score: d.score ?? "",
            overall: d.overall ?? "",
            created: new Date(d.createdAt).toISOString(),
        }));
        const csv = toCsv(rows);
        downloadCSV(csv, "saved_deals.csv");
    }
    return (_jsxs("section", { className: "rounded-xl border bg-white", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [_jsx("div", { className: "text-sm font-semibold", children: "Saved Deals" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: exportCsv, className: "rounded border px-3 py-1.5 text-xs hover:bg-slate-50", title: "Export CSV", children: "Export CSV" }), _jsx("button", { onClick: clear, className: "rounded border px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50", title: "Clear all", children: "Clear" })] })] }), _jsx("div", { className: "border-t overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-slate-50 text-slate-600", children: _jsxs("tr", { children: [_jsx(Th, { children: "Name" }), _jsx(Th, { children: "Score" }), _jsx(Th, { children: "Overall" }), _jsx(Th, { children: "Created" }), _jsx(Th, { className: "text-right", children: "Actions" })] }) }), _jsx("tbody", { children: items.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-4 py-6 text-center text-slate-500", children: "No saved deals yet \u2014 add inputs, then use the Save box above." }) })) : (items.map((d) => _jsx(Row, { d: d, onRemove: () => remove(d.id), onRename: (n) => rename(d.id, n) }, d.id))) })] }) })] }));
}
/* helpers */
function Row({ d, onRemove, onRename, }) {
    const [editing, setEditing] = React.useState(false);
    const [val, setVal] = React.useState(d.name);
    function saveName() {
        const n = val.trim() || d.name;
        onRename(n);
        setEditing(false);
    }
    return (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "px-4 py-2", children: editing ? (_jsx("input", { value: val, onChange: (e) => setVal(e.target.value), onBlur: saveName, onKeyDown: (e) => e.key === "Enter" && saveName(), className: "w-full rounded border px-2 py-1 text-sm", autoFocus: true })) : (_jsx("button", { className: "text-left hover:underline", onClick: () => setEditing(true), title: "Rename", children: d.name })) }), _jsx("td", { className: "px-4 py-2", children: typeof d.score === "number" ? d.score : "—" }), _jsx("td", { className: "px-4 py-2", children: d.overall ? (_jsx("span", { className: `rounded px-2 py-0.5 text-xs ${d.overall === "GREEN"
                        ? "bg-green-100 text-green-800"
                        : d.overall === "AMBER"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"}`, children: d.overall })) : ("—") }), _jsx("td", { className: "px-4 py-2", children: new Date(d.createdAt).toLocaleString() }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsx("button", { onClick: onRemove, className: "rounded border px-2 py-1 text-xs text-rose-700 hover:bg-rose-50", title: "Delete", children: "Delete" }) })] }));
}
function Th({ children, className = "", }) {
    return _jsx("th", { className: `px-4 py-2 text-left font-medium ${className}`, children: children });
}
function toCsv(rows) {
    if (!rows.length)
        return "id,name,score,overall,created\n";
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(",")];
    for (const r of rows) {
        lines.push(headers
            .map((h) => {
            const v = r[h] ?? "";
            const needsQuote = /[",\n]/.test(String(v));
            return needsQuote ? `"${String(v).replace(/"/g, '""')}"` : String(v);
        })
            .join(","));
    }
    return lines.join("\n");
}
