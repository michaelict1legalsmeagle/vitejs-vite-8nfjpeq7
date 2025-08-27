import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { audit, docs as fetchDocs, } from "../lib/api";
function severityClass(s) {
    const k = (s || "").toLowerCase();
    if (k === "high")
        return "badge-high";
    if (k === "medium")
        return "badge-medium";
    if (k === "low")
        return "badge-low";
    return "text-xs px-2 py-0.5 rounded bg-slate-600 text-white";
}
function Spinner({ className = "" }) {
    return (_jsxs("svg", { className: `animate-spin h-4 w-4 ${className}`, viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-90", fill: "currentColor", d: "M4 12a8 8 0 0 1 8-8v4A4 4 0 0 0 8 12H4z" })] }));
}
export default function AuditPanel() {
    const [options, setOptions] = React.useState([]);
    const [docId, setDocId] = React.useState(null);
    const [docName, setDocName] = React.useState(null);
    const [risk, setRisk] = React.useState("high");
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState(null);
    const [feedback, setFeedback] = React.useState("");
    const [findings, setFindings] = React.useState([]);
    const [totalScore, setTotalScore] = React.useState(0);
    // ---- fetch docs & keep current selection when possible
    const refreshDocs = React.useCallback(async () => {
        const list = await fetchDocs(); // returns DocMeta[] with docId
        const arr = Array.isArray(list) ? [...list] : [];
        arr.sort((a, b) => ((b.createdAt ?? 0) - (a.createdAt ?? 0)) ||
            a.name.localeCompare(b.name));
        setOptions(arr);
        if (arr.length === 0) {
            setDocId(null);
            setDocName(null);
            return;
        }
        const stillExists = docId && arr.some(d => d.docId === docId);
        const nextId = stillExists ? docId : arr[0].docId;
        setDocId(nextId);
        setDocName(arr.find(d => d.docId === nextId)?.name ?? null);
    }, [docId]);
    React.useEffect(() => { void refreshDocs(); }, [refreshDocs]);
    // ---- react to external selection events from pills
    React.useEffect(() => {
        const onSelect = (e) => {
            const detail = e.detail ?? {};
            const id = detail.docId ?? detail.id ?? null;
            if (!id)
                return;
            const meta = detail.meta || options.find(o => o.docId === id);
            setDocId(id);
            setDocName(meta?.name || null);
            setFindings([]);
            setErr(null);
            setFeedback("");
            setTotalScore(0);
        };
        window.addEventListener("document:selected", onSelect);
        window.addEventListener("lexlot:docSelected", onSelect);
        return () => {
            window.removeEventListener("document:selected", onSelect);
            window.removeEventListener("lexlot:docSelected", onSelect);
        };
    }, [options]);
    // ---- refresh options on upload events
    React.useEffect(() => {
        const onUploaded = () => void refreshDocs();
        window.addEventListener("document:uploaded", onUploaded);
        window.addEventListener("lexlot:docsChanged", onUploaded);
        return () => {
            window.removeEventListener("document:uploaded", onUploaded);
            window.removeEventListener("lexlot:docsChanged", onUploaded);
        };
    }, [refreshDocs]);
    const handlePick = (id) => {
        const meta = options.find(o => o.docId === id) || null;
        setDocId(id || null);
        setDocName(meta?.name || null);
        setFindings([]);
        setErr(null);
        setFeedback("");
        setTotalScore(0);
        const detail = { id, docId: id, meta };
        window.dispatchEvent(new CustomEvent("lexlot:docSelected", { detail }));
        window.dispatchEvent(new CustomEvent("document:selected", { detail }));
    };
    const runAudit = async () => {
        setErr(null);
        setFindings([]);
        setTotalScore(0);
        setFeedback("");
        const id = docId ?? options[0]?.docId;
        if (!id) {
            setErr("No documents available. Upload a PDF first.");
            return;
        }
        try {
            setLoading(true);
            const res = await audit(id, risk);
            setFindings(res.findings || []);
            setTotalScore(res.totalScore || 0);
            setFeedback(`Audit complete — ${(res.findings?.length ?? 0)} finding(s).`);
            window.dispatchEvent(new CustomEvent("lexlot:toast", { detail: { message: "Audit complete ✓" } }));
        }
        catch (e) {
            setErr(e?.message || "Audit failed");
            setFeedback("");
        }
        finally {
            setLoading(false);
        }
    };
    const selectId = "audit-doc-select";
    const currentId = docId && options.some((o) => o.docId === docId)
        ? docId
        : (options[0]?.docId || "");
    // visible-but-disabled style (keeps blue button present)
    const btnState = loading || !currentId
        ? "opacity-90 ring-1 ring-primary/30"
        : "hover:brightness-110";
    const pin = (snippet) => {
        if (!snippet)
            return;
        window.dispatchEvent(new CustomEvent("lexlot:pinEvidence", { detail: { snippet } }));
    };
    return (_jsxs("div", { className: "card p-4 space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("div", { className: "font-semibold", children: "Risk & Conditions Audit" }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { htmlFor: selectId, className: "text-sm", children: "Doc:" }), _jsxs("select", { id: selectId, className: "relative z-10 pointer-events-auto ml-0 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-2 py-1 min-w-[14rem]", value: currentId, onChange: (e) => handlePick(e.target.value), children: [options.length === 0 && _jsx("option", { value: "", children: "No documents" }), options.map((d) => (_jsx("option", { value: d.docId, children: d.name }, d.docId)))] })] }), _jsxs("label", { className: "text-sm", children: ["Risk:", _jsxs("select", { className: "ml-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-2 py-1", value: risk, onChange: (e) => setRisk(e.target.value), children: [_jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] })] }), _jsxs("button", { id: "audit-run", "data-action": "run-audit", "data-hotkey": "Mod+Enter", className: `btn btn-primary gap-2 ${btnState}`, onClick: runAudit, disabled: loading || !currentId, "aria-disabled": loading || !currentId, "aria-busy": loading, title: "Run Audit (\u2318/Ctrl+Enter)", children: [loading ? _jsx(Spinner, {}) : null, loading ? "Running…" : "Run Audit"] })] })] }), _jsx("div", { className: "text-xs", "aria-live": "polite", children: err ? (_jsx("span", { className: "text-red-600 dark:text-red-400", children: err })) : currentId ? (_jsxs("span", { className: "text-slate-600 dark:text-slate-300", children: ["Using: ", _jsx("b", { children: docName || currentId }), " \u00B7 Total Score: ", _jsx("b", { children: totalScore }), " \u00B7 Findings: ", _jsx("b", { children: findings.length }), feedback ? _jsxs(_Fragment, { children: [" \u2014 ", feedback] }) : null] })) : (_jsx("span", { className: "text-slate-500", children: "No document selected." })) }), _jsx("div", { className: "overflow-auto border border-slate-200 dark:border-slate-800 rounded", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/40", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left p-2", children: "Severity" }), _jsx("th", { className: "text-left p-2", children: "Category" }), _jsx("th", { className: "text-left p-2", children: "Issue" }), _jsx("th", { className: "text-left p-2", children: "Excerpt" }), _jsx("th", { className: "text-right p-2", children: "Score" }), _jsx("th", { className: "text-right p-2", children: "Actions" })] }) }), _jsxs("tbody", { children: [findings.map((f, i) => {
                                    const sev = f.severity || f.risk;
                                    const cat = f.category ?? "";
                                    const issue = f.issue ?? f.title ?? "";
                                    const snip = f.snippet ?? f.where?.snippet ?? "";
                                    const sc = f.score ?? "";
                                    return (_jsxs("tr", { className: "border-t border-slate-200 dark:border-slate-800 align-top", children: [_jsx("td", { className: "p-2", children: _jsx("span", { className: severityClass(sev), children: sev }) }), _jsx("td", { className: "p-2", children: cat }), _jsx("td", { className: "p-2", children: issue }), _jsx("td", { className: "p-2", children: _jsx("code", { className: "text-xs whitespace-pre-wrap break-words", children: snip }) }), _jsx("td", { className: "p-2 text-right", children: sc }), _jsx("td", { className: "p-2 text-right", children: snip ? (_jsx("button", { className: "btn btn-ghost btn-xs", onClick: () => pin(snip), children: "Pin evidence" })) : null })] }, i));
                                }), findings.length === 0 && !loading && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "p-3 text-center text-xs text-slate-500", children: "No findings yet. Choose a doc & risk level, then click \u201CRun Audit\u201D." }) }))] })] }) })] }));
}
