import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/KeywordFinder.tsx
import React from "react";
import { useStore } from "../state";
function useDebounced(value, delay = 250) {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}
export default function KeywordFinder() {
    const s = useStore();
    const [q, setQ] = React.useState("");
    const dq = useDebounced(q, 200);
    const [docId, setDocId] = React.useState(s.selectedDocId || null);
    const [hits, setHits] = React.useState([]);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState(null);
    // stay in sync with Pills / external selection
    React.useEffect(() => setDocId(s.selectedDocId || null), [s.selectedDocId]);
    React.useEffect(() => {
        const onSel = (e) => {
            const d = e.detail || {};
            const id = d.id || d.docId || null;
            if (id)
                setDocId(String(id));
        };
        window.addEventListener("lexlot:docSelected", onSel);
        window.addEventListener("document:selected", onSel);
        return () => {
            window.removeEventListener("lexlot:docSelected", onSel);
            window.removeEventListener("document:selected", onSel);
        };
    }, []);
    const find = React.useCallback(async () => {
        setErr(null);
        setHits([]);
        if (!docId) {
            setErr("Select a document first.");
            return;
        }
        const query = dq.trim();
        if (!query)
            return;
        setBusy(true);
        try {
            const u = new URL("/api/find", window.location.origin);
            u.searchParams.set("docId", docId);
            u.searchParams.set("q", query);
            const r = await fetch(u.toString());
            const j = (await r.json());
            if (!r.ok || !("ok" in j) || !j.ok) {
                setErr(`Find failed${!r.ok ? ` (HTTP ${r.status})` : ""}`);
                return;
            }
            setHits(j.matches || []);
        }
        catch (e) {
            setErr(e?.message || "Find failed");
        }
        finally {
            setBusy(false);
        }
    }, [docId, dq]);
    // auto-find as the query settles or doc changes
    React.useEffect(() => { void find(); }, [find]);
    return (_jsxs("div", { className: "card p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("div", { className: "text-sm opacity-80", children: "Keyword Finder" }), _jsx("button", { className: "btn btn-ghost btn-xs", onClick: () => { setQ(""); setHits([]); setErr(null); }, title: "Reset", children: "Reset" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { id: "finder-input", className: "input input-sm w-full", placeholder: "Type a word or phrase, then Enter\u2026", value: q, onChange: (e) => setQ(e.currentTarget.value), onKeyDown: (e) => { if (e.key === "Enter")
                            void find(); }, spellCheck: false }), _jsx("button", { className: "btn btn-sm", onClick: () => void find(), disabled: busy || !docId, children: busy ? "…" : "Find" }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => window.dispatchEvent(new Event("lexlot:docsChanged")), children: "Refresh" })] }), _jsxs("div", { className: "text-xs text-slate-400", "aria-live": "polite", children: ["Doc: ", _jsx("b", { children: docId ? docId : "—" }), " \u00B7 Hits: ", _jsx("b", { children: hits.length }), err ? _jsxs("span", { className: "text-red-400", children: [" \u2014 ", err] }) : null] }), _jsx("div", { className: "border rounded p-2 max-h-64 overflow-auto text-sm", children: hits.length === 0 ? (_jsx("div", { className: "text-slate-400", children: "No matches found." })) : (_jsx("ul", { className: "space-y-2", children: hits.map((m, i) => (_jsxs("li", { className: "leading-relaxed", children: [_jsxs("span", { className: "text-slate-400 mr-2", children: ["p.", m.page] }), _jsxs("code", { className: "text-xs", children: [_jsx("span", { className: "opacity-70", children: m.before }), _jsx("mark", { className: "px-0.5 rounded", children: m.match }), _jsx("span", { className: "opacity-70", children: m.after })] })] }, `${m.index}-${i}`))) })) })] }));
}
