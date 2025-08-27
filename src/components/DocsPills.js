import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/DocsPills.tsx
import React from "react";
import { useStore } from "../state";
export default function DocsPills() {
    const s = useStore();
    const [q, setQ] = React.useState("");
    const docs = s.docs.filter(d => !q || d.name.toLowerCase().includes(q.toLowerCase()));
    const handleSelect = (docId) => {
        if (docId === s.selectedDocId)
            return; // no-op if already selected
        const meta = s.docs.find(d => d.docId === docId) || null;
        s.selectDoc(docId);
        const detail = { id: docId, docId, meta };
        // New-style event
        window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail }));
        // Legacy/back-compat event
        window.dispatchEvent(new CustomEvent("document:selected", { detail }));
    };
    return (_jsxs("div", { children: [_jsx("input", { id: "docs-search", className: "input input-sm w-full mb-2", placeholder: "Search documents\u2026", value: q, onChange: (e) => setQ(e.target.value) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [docs.map((d) => {
                        const active = d.docId === s.selectedDocId;
                        return (_jsx("button", { "data-docid": d.docId, className: `px-3 py-1 rounded-full border ${active ? "bg-primary text-primary-content" : "bg-base-200"}`, onClick: () => handleSelect(d.docId), title: `${d.pages ?? "?"} pages • ${d.words ?? "?"} words`, "aria-pressed": active, children: d.name }, d.docId));
                    }), !docs.length && (_jsx("div", { className: "text-slate-500 text-sm", children: "No documents yet." }))] })] }));
}
