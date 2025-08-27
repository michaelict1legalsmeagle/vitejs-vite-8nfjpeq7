import React from "react";
import type { DocMeta, AuditFinding, ChecklistItem } from "./api";

type Density = "comfortable" | "compact";
type Theme = "light" | "dark";
type Risk = "high" | "medium" | "low";

type State = {
  docs: DocMeta[];
  selectedDocId: string | null;
  selectedDoc: DocMeta | null;

  finderQuery: string;
  findHTML: string;
  findHits: any[];

  auditRisk: Risk;
  auditFindings: AuditFinding[];

  checklistItems: ChecklistItem[];
  checklistScore: number;

  evidence: string[];

  density: Density;
  theme: Theme;

  setDocs(docs: DocMeta[]): void;
  selectDoc(id: string | null): void;

  setFinder(q: string, html?: string, hits?: any[]): void;

  setAudit(risk: Risk, findings: AuditFinding[]): void;

  setChecklist(items: ChecklistItem[], score: number): void;

  pushEvidence(snippet: string): void;

  setDensity(d: Density): void;
  setTheme(t: Theme): void;
};

const Ctx = React.createContext<State | null>(null);

export function Provider({ children }: { children: React.ReactNode }) {
  const [docs, setDocs] = React.useState<DocMeta[]>([]);
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(
    typeof localStorage !== "undefined" ? localStorage.getItem("selDocId") : null
  );

  const selectedDoc = React.useMemo(
    () => docs.find((d) => d.docId === selectedDocId) ?? null,
    [docs, selectedDocId]
  );

  const [finderQuery, setFinderQuery] = React.useState(
    typeof localStorage !== "undefined" ? localStorage.getItem("finderQ") || "" : ""
  );
  const [findHTML, setFindHTML] = React.useState("");
  const [findHits, setFindHits] = React.useState<any[]>([]);

  const [auditRisk, setAuditRisk] = React.useState<Risk>("high");
  const [auditFindings, setAuditFindings] = React.useState<AuditFinding[]>([]);

  const [checklistItems, setChecklistItems] = React.useState<ChecklistItem[]>([]);
  const [checklistScore, setChecklistScore] = React.useState(0);

  const [evidence, setEvidence] = React.useState<string[]>([]);

  const [density, setDensity] = React.useState<Density>(
    (typeof localStorage !== "undefined" && (localStorage.getItem("density") as Density)) || "comfortable"
  );
  const [theme, setTheme] = React.useState<Theme>(
    (typeof localStorage !== "undefined" && (localStorage.getItem("theme") as Theme)) || "light"
  );

  React.useEffect(() => {
    if (selectedDocId) localStorage.setItem("selDocId", selectedDocId);
    else localStorage.removeItem("selDocId");
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
  const setDocsCb = React.useCallback((d: DocMeta[]) => setDocs(d), []);
  const selectDoc = React.useCallback((id: string | null) => setSelectedDocId(id), []);
  const setFinder = React.useCallback((q: string, html = "", hits: any[] = []) => {
    setFinderQuery(q);
    setFindHTML(html);
    setFindHits(hits);
  }, []);
  const setAudit = React.useCallback((risk: Risk, findings: AuditFinding[]) => {
    setAuditRisk(risk);
    setAuditFindings(findings);
  }, []);
  const setChecklist = React.useCallback((items: ChecklistItem[], score: number) => {
    setChecklistItems(items);
    setChecklistScore(score);
  }, []);
  const pushEvidence = React.useCallback((snippet: string) => {
    setEvidence((prev) => (prev.includes(snippet) ? prev : [snippet, ...prev]));
  }, []);
  const setDensityCb = React.useCallback((d: Density) => setDensity(d), []);
  const setThemeCb = React.useCallback((t: Theme) => setTheme(t), []);

  const value = React.useMemo<State>(
    () => ({
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
    }),
    [
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
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("Store not available");
  return v;
}
