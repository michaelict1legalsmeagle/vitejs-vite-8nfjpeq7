import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
const NPS_KEY = "lexlot_nps_v1";
function readRecords() {
    try {
        const raw = localStorage.getItem(NPS_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        return Array.isArray(obj.records) ? obj.records : [];
    }
    catch {
        return [];
    }
}
function exportRecords(recs) {
    const blob = new Blob([JSON.stringify(recs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lexlot-nps-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
export default function NpsSummary() {
    const [recs, setRecs] = useState([]);
    useEffect(() => {
        setRecs(readRecords());
    }, []);
    const stats = useMemo(() => {
        const total = recs.length;
        const promoters = recs.filter((r) => r.score >= 9).length;
        const passives = recs.filter((r) => r.score >= 7 && r.score <= 8).length;
        const detractors = recs.filter((r) => r.score <= 6).length;
        const nps = total ? Math.round(((promoters / total) - (detractors / total)) * 100) : 0;
        return { total, promoters, passives, detractors, nps };
    }, [recs]);
    const clearAll = () => {
        try {
            const raw = localStorage.getItem(NPS_KEY);
            if (raw) {
                const obj = JSON.parse(raw);
                localStorage.setItem(NPS_KEY, JSON.stringify({ ...obj, records: [] }));
            }
        }
        catch { }
        setRecs([]);
    };
    const refresh = () => setRecs(readRecords());
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: "NPS Summary (local)" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn", onClick: refresh, children: "\u21BB Refresh" }), _jsx("button", { className: "btn", onClick: () => exportRecords(recs), children: "\u2B07 Export" }), _jsx("button", { className: "btn", onClick: clearAll, children: "\uD83D\uDDD1 Clear" })] })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4", children: [_jsx(Stat, { label: "Total", value: stats.total }), _jsx(Stat, { label: "Promoters (9\u201310)", value: stats.promoters }), _jsx(Stat, { label: "Passives (7\u20138)", value: stats.passives }), _jsx(Stat, { label: "Detractors (0\u20136)", value: stats.detractors }), _jsx(Stat, { label: "NPS", value: `${stats.nps}`, suffix: "" })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2", children: "Recent responses" }), recs.length === 0 && _jsx("div", { className: "text-sm opacity-70", children: "No responses yet." }), _jsx("ul", { className: "space-y-2", children: recs.slice().reverse().slice(0, 8).map((r) => (_jsxs("li", { className: "rounded-lg border border-slate-200 dark:border-slate-800 p-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "font-semibold", children: ["Score ", r.score] }), _jsx("div", { className: "opacity-70 text-xs", children: new Date(r.ts).toLocaleString() })] }), r.note && _jsx("div", { className: "mt-1 text-sm opacity-90", children: r.note }), _jsx("div", { className: "mt-1 text-[11px] opacity-60 truncate", children: r.page })] }, r.id))) })] })] }));
}
function Stat({ label, value, suffix = "" }) {
    return (_jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center", children: [_jsxs("div", { className: "text-2xl font-semibold", children: [value, suffix] }), _jsx("div", { className: "text-xs opacity-70 mt-1", children: label })] }));
}
