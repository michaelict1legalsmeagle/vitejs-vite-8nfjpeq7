import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/ChecklistPanel.tsx
import React from "react";
import { useStore } from "../state";
import { checklist as runChecklist } from "../lib/api";
function Chip({ s }) {
    const cls = s === "PASS" ? "bg-emerald-600 text-white" :
        s === "FLAG" ? "bg-amber-500 text-white" :
            "bg-slate-600 text-white";
    return _jsx("span", { className: `px-2 py-0.5 rounded text-xs ${cls}`, children: s });
}
function Spinner({ className = "" }) {
    return (_jsxs("svg", { className: `animate-spin h-4 w-4 ${className}`, viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-90", fill: "currentColor", d: "M4 12a8 8 0 0 1 8-8v4A4 4 0 0 0 8 12H4z" })] }));
}
export default function ChecklistPanel() {
    const s = useStore();
    const selectedId = s.selectedDocId || "";
    const [rows, setRows] = React.useState([]);
    const [score, setScore] = React.useState(0);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState(null);
    const [feedback, setFeedback] = React.useState("");
    // prevent overlapping runs
    const inFlight = React.useRef(false);
    const run = React.useCallback(async (docIdParam) => {
        const docId = docIdParam || selectedId;
        if (!docId) {
            setErr("Select a document first.");
            return;
        }
        if (inFlight.current)
            return;
        inFlight.current = true;
        setErr(null);
        setFeedback("");
        setBusy(true);
        try {
            const out = await runChecklist(docId);
            setRows(out.items || []);
            setScore(out.score || 0);
            setFeedback("Checklist complete ✓");
            window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Checklist complete ✓" } }));
        }
        catch (e) {
            setErr(e?.message || "Checklist failed");
            setFeedback("");
        }
        finally {
            setBusy(false);
            inFlight.current = false;
        }
    }, [selectedId]);
    // Auto‑run when switching docs via store
    React.useEffect(() => {
        if (selectedId)
            run(selectedId);
    }, [selectedId, run]);
    // Also listen to broadcast events so panels stay in sync even without the store
    React.useEffect(() => {
        const onSelect = (e) => {
            const detail = e.detail ?? {};
            const id = detail.docId ?? detail.id ?? null;
            if (id)
                run(id);
        };
        window.addEventListener("lexlot:docSelected", onSelect);
        window.addEventListener("document:selected", onSelect);
        return () => {
            window.removeEventListener("lexlot:docSelected", onSelect);
            window.removeEventListener("document:selected", onSelect);
        };
    }, [run]);
    const counts = React.useMemo(() => {
        const c = { PASS: 0, FLAG: 0, MISS: 0 };
        for (const r of rows)
            c[r.status] = (c[r.status] || 0) + 1;
        return c;
    }, [rows]);
    const pin = (snippet) => {
        if (!snippet)
            return;
        window.dispatchEvent(new CustomEvent("lexlot:pinEvidence", { detail: { snippet } }));
    };
    // Visibly active state even when disabled
    const btnState = busy || !selectedId
        ? "opacity-90 ring-1 ring-accent/30"
        : "hover:brightness-110";
    return (_jsxs("div", { className: "card p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold", children: "Pack Checklist" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "badge badge-outline", children: ["Score: ", score] }), _jsxs("button", { className: `btn btn-accent btn-sm gap-2 ${btnState}`, onClick: () => run(), disabled: busy || !selectedId, "aria-disabled": busy || !selectedId, "aria-busy": busy, title: "Re-run Checklist", children: [busy ? _jsx(Spinner, {}) : null, busy ? "Checking…" : "Re‑run"] })] })] }), _jsx("div", { className: "text-xs text-slate-600 dark:text-slate-300", "aria-live": "polite", children: rows.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("b", { children: counts.PASS }), " pass \u00B7 ", _jsx("b", { children: counts.FLAG }), " flag \u00B7 ", _jsx("b", { children: counts.MISS }), " miss", feedback ? _jsxs(_Fragment, { children: [" \u2014 ", feedback] }) : null] })) : (_jsx(_Fragment, { children: "Detects core docs (Title, Contracts, Searches, EPC, Leasehold, Tenancy, Planning, Addenda)." })) }), _jsx("div", { className: "overflow-auto border border-slate-200 dark:border-slate-800 rounded", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/40", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left p-2 w-40", children: "Item" }), _jsx("th", { className: "text-left p-2 w-24", children: "Status" }), _jsx("th", { className: "text-left p-2 w-24", children: "Score" }), _jsx("th", { className: "text-left p-2", children: "Evidence" }), _jsx("th", { className: "text-right p-2 w-28", children: "Actions" })] }) }), _jsxs("tbody", { children: [rows.map((r) => (_jsxs("tr", { className: "border-t border-slate-200 dark:border-slate-800 align-top", children: [_jsx("td", { className: "p-2", children: r.label }), _jsx("td", { className: "p-2", children: _jsx(Chip, { s: r.status }) }), _jsxs("td", { className: "p-2", children: [r.score, "%"] }), _jsx("td", { className: "p-2", children: r.evidence ? (_jsx("div", { className: "text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap", children: r.evidence })) : (_jsx("span", { className: "text-slate-500 text-xs", children: "\u2014" })) }), _jsx("td", { className: "p-2 text-right", children: r.evidence ? (_jsx("button", { className: "btn btn-ghost btn-xs", onClick: () => pin(r.evidence), children: "Pin evidence" })) : null })] }, r.itemId))), rows.length === 0 && !busy && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "p-3 text-center text-xs text-slate-500", children: "No results yet. Click \u201CRe\u2011run\u201D." }) }))] })] }) }), err && _jsx("div", { className: "text-xs text-red-600 dark:text-red-400", children: err })] }));
}
