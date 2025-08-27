import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
const Ctx = React.createContext(null);
export function Provider({ children }) {
    const [docs, setDocs] = React.useState([]);
    const [selectedDocId, setSelectedDocId] = React.useState(typeof localStorage !== "undefined" ? localStorage.getItem("selDocId") : null);
    const selectedDoc = React.useMemo(() => docs.find((d) => d.docId === selectedDocId) ?? null, [docs, selectedDocId]);
    const [finderQuery, setFinderQuery] = React.useState(typeof localStorage !== "undefined" ? localStorage.getItem("finderQ") || "" : "");
    const [findHTML, setFindHTML] = React.useState("");
    const [findHits, setFindHits] = React.useState([]);
    const [auditRisk, setAuditRisk] = React.useState("high");
    const [auditFindings, setAuditFindings] = React.useState([]);
    const [checklistItems, setChecklistItems] = React.useState([]);
    const [checklistScore, setChecklistScore] = React.useState(0);
    const [evidence, setEvidence] = React.useState([]);
    const [density, setDensity] = React.useState((typeof localStorage !== "undefined" && localStorage.getItem("density")) || "comfortable");
    const [theme, setTheme] = React.useState((typeof localStorage !== "undefined" && localStorage.getItem("theme")) || "light");
    React.useEffect(() => {
        if (selectedDocId)
            localStorage.setItem("selDocId", selectedDocId);
        else
            localStorage.removeItem("selDocId");
    }, [selectedDocId]);
    React.useEffect(() => {
        localStorage.setItem("finderQ", finderQuery || "");
    }, [finderQuery]);
    React.useEffect(() => {
        localStorage.setItem("density", density);
    }, [density]);
    React.useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("theme", theme);
    }, [theme]);
    // stable callbacks
    const setDocsCb = React.useCallback((d) => setDocs(d), []);
    const selectDoc = React.useCallback((id) => setSelectedDocId(id), []);
    const setFinder = React.useCallback((q, html = "", hits = []) => {
        setFinderQuery(q);
        setFindHTML(html);
        setFindHits(hits);
    }, []);
    const setAudit = React.useCallback((risk, findings) => {
        setAuditRisk(risk);
        setAuditFindings(findings);
    }, []);
    const setChecklist = React.useCallback((items, score) => {
        setChecklistItems(items);
        setChecklistScore(score);
    }, []);
    const pushEvidence = React.useCallback((snippet) => {
        setEvidence((prev) => (prev.includes(snippet) ? prev : [snippet, ...prev]));
    }, []);
    const setDensityCb = React.useCallback((d) => setDensity(d), []);
    const setThemeCb = React.useCallback((t) => setTheme(t), []);
    const value = React.useMemo(() => ({
        docs,
        selectedDocId,
        selectedDoc,
        finderQuery,
        findHTML,
        findHits,
        auditRisk,
        auditFindings,
        checklistItems,
        checklistScore,
        evidence,
        density,
        theme,
        setDocs: setDocsCb,
        selectDoc,
        setFinder,
        setAudit,
        setChecklist,
        pushEvidence,
        setDensity: setDensityCb,
        setTheme: setThemeCb,
    }), [
        docs,
        selectedDocId,
        selectedDoc,
        finderQuery,
        findHTML,
        findHits,
        auditRisk,
        auditFindings,
        checklistItems,
        checklistScore,
        evidence,
        density,
        theme,
        setDocsCb,
        selectDoc,
        setFinder,
        setAudit,
        setChecklist,
        pushEvidence,
        setDensityCb,
        setThemeCb,
    ]);
    return _jsx(Ctx.Provider, { value: value, children: children });
}
export function useStore() {
    const v = React.useContext(Ctx);
    if (!v)
        throw new Error("Store not available");
    return v;
}
