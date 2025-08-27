import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import * as api from "../lib/api";
const LS_KEY = "lexlot:selectedDocId";
export default function DocumentInsights() {
    const [docs, setDocs] = React.useState([]);
    const [selected, setSelected] = React.useState(() => localStorage.getItem(LS_KEY));
    const [busy, setBusy] = React.useState(false);
    const load = React.useCallback(async () => {
        setBusy(true);
        try {
            const list = await api.docs();
            const slim = list.map((d) => ({ id: d.id, name: d.name }));
            setDocs(slim);
            if (slim.length) {
                const keep = slim.find((d) => d.id === selected)?.id ?? slim[0].id;
                if (keep !== selected) {
                    setSelected(keep);
                    localStorage.setItem(LS_KEY, keep);
                }
                const meta = slim.find((d) => d.id === keep);
                window.dispatchEvent(new CustomEvent("document:selected", { detail: { id: keep, meta } }));
                window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail: { docId: keep, meta } }));
            }
            else {
                setSelected(null);
                localStorage.removeItem(LS_KEY);
            }
        }
        finally {
            setBusy(false);
        }
    }, [selected]);
    React.useEffect(() => { load(); }, [load]);
    React.useEffect(() => {
        const again = () => load();
        window.addEventListener("document:uploaded", again);
        window.addEventListener("lexlot:docsChanged", again);
        return () => {
            window.removeEventListener("document:uploaded", again);
            window.removeEventListener("lexlot:docsChanged", again);
        };
    }, [load]);
    const choose = (id) => {
        setSelected(id);
        localStorage.setItem(LS_KEY, id);
        const meta = docs.find((d) => d.id === id);
        window.dispatchEvent(new CustomEvent("document:selected", { detail: { id, meta } }));
        window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail: { docId: id, meta } }));
    };
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Documents" }), _jsx("button", { className: "btn btn-sm", onClick: load, disabled: busy, children: busy ? "…" : "Refresh" })] }), docs.length === 0 ? (_jsx("div", { className: "text-sm text-slate-500", children: "No documents yet. Upload PDFs above." })) : (_jsx("div", { className: "flex flex-wrap gap-2", children: docs.map((d) => {
                    const active = d.id === selected;
                    return (_jsx("button", { type: "button", onClick: () => choose(d.id), className: `px-2 py-1 rounded-full border text-sm ${active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"}`, title: d.name, children: d.name }, d.id));
                }) })), selected && (_jsxs("div", { className: "text-xs text-slate-500 mt-2", children: ["Selected: ", _jsx("b", { children: docs.find((d) => d.id === selected)?.name ?? selected })] }))] }));
}
