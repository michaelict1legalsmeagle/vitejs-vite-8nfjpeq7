import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ---------------- inline fake API state ----------------
const DOCS: any[] = [];
let seq = 1;
const now = () => Date.now();

function addDoc(name: string, text = "", extra: any = {}) {
  // ✅ ensure the filename is always searchable
  const safeText =
    (text && text.trim().length > 0
      ? text
      : "demo content with keywords: flood, risk, rent, title, escalation, drainage, planning, epc") +
    `\n\n[filename: ${name}]`; // 👈 inject filename into text

  const words = (safeText.match(/\b\w+\b/g) || []).length;
  const pages = Math.max(1, Math.ceil(words / 400));

  const d = {
    id: String(seq++),
    name,
    text: safeText,
    createdAt: now(),
    words,
    pages,
    ...extra,
  };
  DOCS.push(d);
  return d;
}
const listDocs = () => DOCS.map(({ text, ...rest }) => rest);
const getDoc = (id: string) => DOCS.find((d) => d.id === String(id));

// ---------------- vite config ----------------
export default defineConfig({
  plugins: [react()],

  // 👉 Add path alias for "@/..."
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5173",
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (_proxyReq, req: any, res: any) => {
            const url = req.url || "";
            res.setHeader("Content-Type", "application/json");

            // --- health ---
            if (url.startsWith("/api/health")) {
              res.end(JSON.stringify({ ok: true, ts: now() }));
              return;
            }

            // --- docs ---
            if (url.startsWith("/api/docs") && req.method === "GET") {
              res.end(JSON.stringify({ ok: true, docs: listDocs() }));
              return;
            }

            // --- uploads (StackBlitz-friendly) ---
            if (url.startsWith("/api/uploads") && req.method === "POST") {
              let body = "";
              req.on("data", (c: Buffer) => (body += c));
              req.on("end", () => {
                try {
                  const j = JSON.parse(body || "{}");
                  const names: string[] = Array.isArray(j.names) ? j.names : [];
                  const added = names.map((n) =>
                    addDoc(
                      String(n),
                      // ✅ seed text + filename
                      "stub content: flood, risk, rent, title, contract, epc, drainage, planning"
                    )
                  );
                  res.end(
                    JSON.stringify({
                      ok: true,
                      docs: listDocs(),
                      ids: added.map((d) => d.id),
                    })
                  );
                } catch (e: any) {
                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({ ok: false, error: e?.message || "bad json" })
                  );
                }
              });
              return;
            }

            // --- upload (disabled in StackBlitz env) ---
            if (url.startsWith("/api/upload") && req.method === "POST") {
              res.statusCode = 415;
              res.end(
                JSON.stringify({
                  ok: false,
                  error: "File uploads disabled in this environment",
                })
              );
              return;
            }

            // --- find ---
            if (url.startsWith("/api/find") && req.method === "GET") {
              const u = new URL(req.url!, "http://x");
              const docId = u.searchParams.get("docId");
              const q = (u.searchParams.get("q") || "").trim();
              const d = getDoc(docId || "");
              if (!d) {
                res.statusCode = 404;
                res.end(JSON.stringify({ ok: false, total: 0, matches: [] }));
                return;
              }
              if (!q) {
                res.end(JSON.stringify({ ok: true, total: 0, matches: [] }));
                return;
              }

              const text = d.text || "";
              const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const rx = new RegExp(esc(q), "gi");

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
              res.end(JSON.stringify({ ok: true, total: matches.length, matches }));
              return;
            }

            // --- audit (demo) ---
            if (url.startsWith("/api/audit") && req.method === "POST") {
              let body = "";
              req.on("data", (c: Buffer) => (body += c));
              req.on("end", () => {
                const { docId, risk = "high" } = JSON.parse(body || "{}");
                const d = getDoc(docId || "");
                if (!d) {
                  res.statusCode = 404;
                  res.end(
                    JSON.stringify({
                      ok: false,
                      findings: [],
                      totalScore: 0,
                      count: 0,
                    })
                  );
                  return;
                }
                const base = [
                  {
                    severity: "high",
                    score: 10,
                    category: "Legal",
                    issue: "Ground rent escalation",
                    snippet: "… rent doubles every 10 years …",
                  },
                  {
                    severity: "medium",
                    score: 6,
                    category: "Fees",
                    issue: "Admin fee unclear",
                    snippet: "… reasonable admin charges …",
                  },
                  {
                    severity: "low",
                    score: 3,
                    category: "Data",
                    issue: "Missing plan page",
                    snippet: "… title plan not attached …",
                  },
                ];
                const map: Record<string, number> = { high: 3, medium: 2, low: 1 };
                const order = map[risk] ?? 3;
                const keep = base.filter((f) => map[f.severity] <= order);
                const totalScore = keep.reduce((a, b) => a + b.score, 0);
                res.end(
                  JSON.stringify({
                    ok: true,
                    findings: keep,
                    totalScore,
                    count: keep.length,
                  })
                );
              });
              return;
            }

            // --- checklist (stub) ---
            if (url.startsWith("/api/checklist/run") && req.method === "POST") {
              let body = "";
              req.on("data", (c: Buffer) => (body += c));
              req.on("end", () => {
                const { docIds = [] } = JSON.parse(body || "{}");
                const pool =
                  Array.isArray(docIds) && docIds.length
                    ? DOCS.filter((d) => docIds.includes(d.id))
                    : DOCS;
                const results = pool.map((d) => ({
                  itemId: "title_register",
                  label: "Title — Register",
                  status: d.name.toLowerCase().includes("title")
                    ? "present"
                    : "missing",
                  calibratedScore: 0.85,
                  evidence: [
                    {
                      docId: d.id,
                      type: "filename",
                      reason: "contains 'title'",
                      excerpt: d.name,
                    },
                  ],
                }));
                res.end(JSON.stringify({ ok: true, results }));
              });
              return;
            }

            // fallback
            res.statusCode = 404;
            res.end(JSON.stringify({ ok: false, error: "unknown api route" }));
          });
        },
      },
    },
  },
});
