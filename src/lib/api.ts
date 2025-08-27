// src/lib/api.ts
// Client-side shim that maps your backend contract to the UI's expectations.

export type DocMeta = {
  id: string;           // backend id
  docId: string;        // convenience alias for components
  name: string;
  pages?: number;
  words?: number;
  createdAt: number;
  size?: number;
  mime?: string;
};

export type FindHit = {
  start: number;
  end: number;
  snippet: string;
  before: string;
  after: string;
};

export type AuditFinding = {
  severity: "high" | "medium" | "low";
  category?: string;
  issue?: string;
  snippet?: string;
  score?: number;
};

export type ChecklistItem = {
  itemId: string;
  label: string;
  status: "PASS" | "FLAG" | "MISS";
  score: number;        // 0–100
  evidence?: string;    // short excerpt
};

/* ---------------- API base detection (robust) ---------------- */

function trimSlash(s: string) {
  return s.replace(/\/+$/, "");
}

// Allow overrides:
// - Vite: VITE_API_BASE="http://localhost:4000/api"
// - Runtime: window.__API_BASE__ = "/api"
const RUNTIME_BASE =
  (typeof window !== "undefined" && (window as any).__API_BASE__) || undefined;

const VITE_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_BASE) ||
  undefined;

// Heuristic:
// - If explicitly set -> use it
// - If running on localhost -> hit Node directly
// - Otherwise -> use same-origin proxy path "/api"
const computedBase = (() => {
  const explicit = (VITE_BASE || RUNTIME_BASE)?.toString();
  if (explicit) return trimSlash(explicit);

  const host = typeof location !== "undefined" ? location.hostname : "";
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:4000/api";
  }
  return "/api";
})();

const BASE = trimSlash(computedBase);

// join helper that avoids double slashes
const j = (path: string) => `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

// Basic fetch guard
const ok = async (res: Response) => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

/* ---------------- health ---------------- */

export async function health() {
  return ok(await fetch(j("/health")));
}

/* ---------------- docs ---------------- */

export async function docs(): Promise<DocMeta[]> {
  const jn = await ok(await fetch(j("/docs")));
  const out: DocMeta[] = (jn.docs || []).map((d: any) => ({
    id: String(d.id),
    docId: String(d.id),
    name: d.name,
    pages: d.pages,
    words: d.words,
    createdAt: d.createdAt,
    size: d.size,
    mime: d.mime,
  }));
  return out;
}

export async function listDocs(): Promise<{ ok: true; docs: DocMeta[] }> {
  const mapped = await docs();
  return { ok: true, docs: mapped };
}

/* ---------------- upload (multipart + JSON fallback) ---------------- */

export async function uploadFiles(files: File[]): Promise<{ ok: true; docs: DocMeta[] }> {
  const fd = new FormData();
  files.forEach(f => fd.append("files", f)); // field name must be "files"
  const jn = await ok(await fetch(j("/upload"), { method: "POST", body: fd }));
  const docsOut: DocMeta[] = (jn.docs || []).map((d: any) => ({
    id: String(d.id),
    docId: String(d.id),
    name: d.name,
    pages: d.pages,
    words: d.words,
    createdAt: d.createdAt,
    size: d.size,
    mime: d.mime,
  }));
  return { ok: true, docs: docsOut };
}

export async function uploadText(name: string, text: string) {
  await ok(await fetch(j("/upload"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, text })
  }));
  const full = await docs();
  return { ok: true, docs: full };
}

/* ---------------- find ---------------- */

function escapeHTML(s: string) {
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

export async function find(docId: string, q: string): Promise<{ ok: true; hits: FindHit[]; html: string }> {
  const u = new URL(j("/find"), window.location.href);
  u.searchParams.set("docId", docId);
  u.searchParams.set("q", q);
  const jn = await ok(await fetch(u.toString()));

  const hits: FindHit[] = (jn.matches || []).map((m: any) => {
    const start = m.index ?? 0;
    const match = String(m.match || "");
    return {
      start,
      end: start + match.length,
      before: String(m.before || ""),
      snippet: match,
      after: String(m.after || ""),
    };
  });

  const html = hits.length
    ? hits
        .map(h => `${escapeHTML(h.before)}<mark>${escapeHTML(h.snippet)}</mark>${escapeHTML(h.after)}`)
        .join("<hr/>")
    : "";

  return { ok: true, hits, html };
}

/* ---------------- audit ---------------- */

export async function audit(docId: string, risk: "high" | "medium" | "low") {
  const jn = await ok(await fetch(j("/audit"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docId, risk })
  }));

  const findings: AuditFinding[] = Array.isArray(jn.findings)
    ? jn.findings.map((f: any) => ({
        severity: (String(f.severity || "low").toLowerCase() as any),
        category: f.category ?? undefined,
        issue: f.issue ?? undefined,
        snippet: f.snippet ?? undefined,
        score: typeof f.score === "number" ? f.score : undefined,
      }))
    : [];

  return {
    ok: true as const,
    findings,
    totalScore: Number(jn.totalScore || 0),
    count: Number(jn.count || findings.length || 0),
  };
}

/* ---------------- checklist ---------------- */

export async function checklist(docId: string) {
  const jn = await ok(await fetch(j("/checklist/run"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docIds: [docId] })
  }));

  const items: ChecklistItem[] = (jn.results || []).map((r: any) => {
    const statusRaw = String(r.status || "missing").toLowerCase();
    const uiStatus: "PASS" | "FLAG" | "MISS" =
      statusRaw === "present" ? "PASS" : statusRaw === "unclear" ? "FLAG" : "MISS";

    const score = Math.round((Number(r.calibratedScore ?? 0) || 0) * 100);
    const ev =
      Array.isArray(r.evidence) && r.evidence.length
        ? String(r.evidence[0].excerpt || "")
        : undefined;

    return {
      itemId: String(r.itemId || r.id || ""),
      label: String(r.label || ""),
      status: uiStatus,
      score,
      evidence: ev,
    };
  });

  const score =
    items.length > 0
      ? Math.round(items.reduce((a, b) => a + (b.score || 0), 0) / items.length)
      : 0;

  return { ok: true as const, items, score };
}

/* -------- optional raw endpoints (debug) -------- */

export async function checklistSchemaRaw() {
  return ok(await fetch(j("/checklist/schema")));
}
export async function checklistRunRaw(docIds: string[]) {
  return ok(await fetch(j("/checklist/run"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docIds })
  }));
}
