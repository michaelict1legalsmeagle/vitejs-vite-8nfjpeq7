// src/devApi.ts
// In-browser API shim that intercepts window.fetch for /api/* calls.
// No proxy, no node server, no ports. Works reliably in StackBlitz/Vite dev.

type Doc = {
  id: string;            // internal id
  docId: string;         // public id for UI compatibility
  name: string;
  text?: string;
  createdAt: number;
  words?: number;
  pages?: number;
  size?: number;
  mime?: string;
};

let SEQ = 1;
const now = () => Date.now();
const DOCS: Doc[] = [];

function addDoc(name: string, text = "", extra: Partial<Doc> = {}): Doc {
  const words =
    typeof text === "string" && text.length
      ? (text.match(/\b\w+\b/g) || []).length
      : undefined;
  const pages =
    typeof words === "number" ? Math.max(1, Math.ceil(words / 400)) : undefined;

  const id = String(SEQ++);
  const d: Doc = {
    id,
    docId: id, // expose as docId for UI compatibility
    name,
    text,
    createdAt: now(),
    words,
    pages,
    ...extra,
  };
  DOCS.push(d);
  return d;
}

const listDocs = () =>
  DOCS.map(({ text, ...rest }) => ({
    ...rest, // includes id + docId internally, UI should use docId
  }));

const getDoc = (id?: string | null) =>
  DOCS.find((d) => d.id === String(id ?? "") || d.docId === String(id ?? ""));

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // CORS is usually unnecessary for same-origin dev, but harmless:
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function parseBodyJSON(init?: RequestInit): Promise<any> {
  if (!init?.body) return {};
  try {
    if (init.body instanceof Blob) {
      const t = await (init.body as Blob).text();
      return JSON.parse(t || "{}");
    }
    if (typeof init.body === "string") {
      return JSON.parse(init.body || "{}");
    }
  } catch {
    /* ignore */
  }
  return {};
}

async function parseFormData(init?: RequestInit): Promise<FormData | null> {
  if (!(init?.body instanceof FormData)) return null;
  return init.body as FormData;
}

function escapeRx(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function installDevApi() {
  // Avoid double-install
  if ((window as any).__devApiInstalled) return;
  (window as any).__devApiInstalled = true;

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;

    if (!url.includes("/api/")) {
      return realFetch(input as any, init);
    }

    // --- Health --------------------------------------------------------------
    if (url.includes("/api/health")) {
      return jsonResponse({ ok: true, service: "devApi", ts: now() }, 200);
    }

    // --- Docs: GET /api/docs -------------------------------------------------
    if (url.includes("/api/docs") && (!init || (init.method ?? "GET").toUpperCase() === "GET")) {
      return jsonResponse({ ok: true, docs: listDocs() }, 200);
    }

    // --- Upload: POST /api/upload (multipart or JSON) ------------------------
    if (url.includes("/api/upload") && (init?.method ?? "POST").toUpperCase() === "POST") {
      const fd = await parseFormData(init);
      if (fd) {
        const files = fd.getAll("files").filter(Boolean) as File[];
        if (files.length === 0) {
          return jsonResponse({ ok: false, error: "No files received" }, 400);
        }
        for (const f of files) {
          addDoc(f.name || `file-${now()}`, "", {
            size: f.size,
            mime: f.type,
          });
        }
        return jsonResponse({ ok: true, added: files.length, docs: listDocs() }, 200);
      }

      // JSON fallback: {name, text?}
      const j = await parseBodyJSON(init);
      if (j?.name) {
        const d = addDoc(String(j.name), String(j.text ?? ""));
        const { text, ...meta } = d;
        return jsonResponse({ ok: true, id: d.docId, doc: meta }, 200);
      }

      return jsonResponse({ ok: false, error: "Unsupported upload body" }, 415);
    }

    // --- Bulk uploads: POST /api/uploads {names:[]} --------------------------
    if (url.includes("/api/uploads") && (init?.method ?? "POST").toUpperCase() === "POST") {
      const j = await parseBodyJSON(init);
      const names: string[] = Array.isArray(j?.names) ? j.names : [];
      if (names.length === 0) {
        return jsonResponse({ ok: false, error: "names[] required" }, 400);
      }
      const added = names.slice(0, 20).map((n) => addDoc(String(n)));
      return jsonResponse({ ok: true, ids: added.map((d) => d.docId), docs: listDocs() }, 200);
    }

    // --- Finder: GET /api/find?docId=&q= ------------------------------------
    if (url.includes("/api/find") && (!init || (init.method ?? "GET").toUpperCase() === "GET")) {
      const u = new URL(url, location.origin);
      const docId = u.searchParams.get("docId");
      const q = (u.searchParams.get("q") || "").trim();
      const d = getDoc(docId);
      if (!d) return jsonResponse({ ok: false, total: 0, matches: [] }, 404);
      if (!q) return jsonResponse({ ok: true, total: 0, matches: [] }, 200);

      const text = (d.text || "").toString();
      const rx = new RegExp(escapeRx(q), "gi");
      const matches: any[] = [];
      let m: RegExpExecArray | null;
      while ((m = rx.exec(text)) && matches.length < 50) {
        const i = m.index;
        matches.push({
          page: 1 + Math.floor(i / 1800),
          before: text.slice(Math.max(0, i - 60), i),
          match: m[0],
          after: text.slice(i + m[0].length, i + m[0].length + 60),
          index: i,
        });
      }
      return jsonResponse({ ok: true, total: matches.length, matches }, 200);
    }

    // --- Audit: POST /api/audit ---------------------------------------------
    if (url.includes("/api/audit") && (init?.method ?? "POST").toUpperCase() === "POST") {
      const j = await parseBodyJSON(init);
      const d = getDoc(j?.docId);
      if (!d) return jsonResponse({ ok: false, findings: [], totalScore: 0, count: 0 }, 404);

      const base = [
        { severity: "high",   score: 10, category: "Legal",  issue: "Ground rent escalation", snippet: "… rent doubles every 10 years …" },
        { severity: "medium", score: 6,  category: "Fees",   issue: "Admin fee unclear",       snippet: "… reasonable admin charges …" },
        { severity: "low",    score: 3,  category: "Data",   issue: "Missing plan page",        snippet: "… title plan not attached …" }
      ];
      const map: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const order = map[String(j?.risk ?? "high")] ?? 3;
      const keep = base.filter((f) => map[f.severity] <= order);
      const totalScore = keep.reduce((a, b) => a + b.score, 0);

      return jsonResponse({ ok: true, findings: keep, totalScore, count: keep.length }, 200);
    }

    // --- Checklist schema: GET /api/checklist/schema -------------------------
    if (url.includes("/api/checklist/schema")) {
      const ITEMS = [
        { id: "title_register", label: "Title — Register" },
        { id: "title_plan", label: "Title — Plan" },
        { id: "contract_general", label: "Contract — General" },
        { id: "epc", label: "EPC & Compliance — EPC" },
        { id: "tenancy", label: "Tenancy — AST/Lease" },
        { id: "addendum", label: "Auctioneer Addendum(s)" }
      ];
      return jsonResponse({ ok: true, items: ITEMS }, 200);
    }

    // --- Checklist run: POST /api/checklist/run ------------------------------
    if (url.includes("/api/checklist/run") && (init?.method ?? "POST").toUpperCase() === "POST") {
      const j = await parseBodyJSON(init);
      const docIds: string[] = Array.isArray(j?.docIds) ? j.docIds : [];
      const pool = docIds.length ? DOCS.filter((d) => docIds.includes(d.docId) || docIds.includes(d.id)) : DOCS;

      const RULES = [
        { id: "title_register",  label: "Title — Register",            kw: ["register", "title register", "official copy"] },
        { id: "title_plan",      label: "Title — Plan",                kw: ["title plan", "tp1", "plan of title"] },
        { id: "contract_general",label: "Contract — General",          kw: ["contract", "conditions of sale"] },
        { id: "epc",             label: "EPC & Compliance — EPC",      kw: ["epc", "energy performance"] },
        { id: "tenancy",         label: "Tenancy — AST/Lease",         kw: ["ast", "tenancy agreement"] },
        { id: "addendum",        label: "Auctioneer Addendum(s)",      kw: ["addendum"] }
      ];

      const results = RULES.map((rule) => {
        let best: { score: number; ev: any[] } = { score: 0, ev: [] };
        for (const d of pool) {
          const name = d.name.toLowerCase();
          const hit = rule.kw.some((k) => name.includes(k));
          const score = hit ? 0.9 : 0;
          const ev = hit
            ? [{ docId: d.docId, type: "filename", reason: "contains keyword", excerpt: d.name }]
            : [];
          if (score > best.score) best = { score, ev };
        }
        const status = best.score >= 0.65 ? "present" : best.ev.length ? "unclear" : "missing";
        return {
          itemId: rule.id,
          label: rule.label,
          status,
          calibratedScore: Number(best.score.toFixed(2)),
          evidence: best.ev,
        };
      });

      return jsonResponse({ ok: true, results }, 200);
    }

    // --- Unknown -------------------------------------------------------------
    return jsonResponse({ ok: false, error: "unknown api route" }, 404);
  };
}
