// api-node/server.mjs
import express from "express";
import cors from "cors";
import multer from "multer";
import pdfParse from "pdf-parse";

// --- app + middleware -------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// --- in-memory docs store ---------------------------------------------------
/** @type {{ id:string, name:string, text?:string, createdAt:number, words?:number, pages?:number, size?:number, mime?:string }[]} */
const DOCS = [];
let seq = 1;
const now = () => Date.now();

const addDoc = (name, text = "", extra = {}) => {
  const words =
    typeof text === "string" && text.length
      ? (text.match(/\b\w+\b/g) || []).length
      : undefined;
  const pages =
    typeof words === "number" ? Math.max(1, Math.ceil(words / 400)) : undefined;

  const d = {
    id: String(seq++),
    name,
    text, // keep for demo search; real PDFs may omit text (needs OCR)
    createdAt: now(),
    words,
    pages,
    ...extra,
  };
  DOCS.push(d);
  return d;
};

const listDocs = () => DOCS.map(({ text, ...rest }) => rest); // hide text in list
const getDoc  = (id) => DOCS.find((d) => d.id === String(id));

// --- helpers ----------------------------------------------------------------
async function extractFromPdfBuffer(buf) {
  try {
    const result = await Promise.race([
      pdfParse(buf),
      new Promise((_, rej) => setTimeout(() => rej(new Error("pdf-parse timeout")), 8000)),
    ]);
    const text = String(result.text || "").trim();
    const words = text ? (text.match(/\b\w+\b/g) || []).length : undefined;
    const pages = Number.isFinite(result.numpages) ? Number(result.numpages) : undefined;
    return { text, words, pages };
  } catch {
    return { text: "", words: undefined, pages: undefined };
  }
}

// --- health + docs ----------------------------------------------------------
app.get("/api/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "api", ts: now(), count: DOCS.length })
);

app.get("/api/docs", (_req, res) =>
  res.status(200).json({ ok: true, docs: listDocs() })
);

// --- UPLOAD: multipart + JSON fallback -------------------------------------
const upload = multer({ storage: multer.memoryStorage() });

// one entrypoint that branches on content-type
app.post("/api/upload", (req, res, next) => {
  const ct = String(req.headers["content-type"] || "");
  const isMultipart = /multipart\/form-data/i.test(ct);
  if (!isMultipart) return next(); // → JSON fallback below

  upload.array("files")(req, res, async (err) => {
    if (err) return res.status(400).json({ ok: false, error: String(err) });

    const files = /** @type {{originalname?:string, filename?:string, size:number, mimetype?:string, buffer:Buffer}[]} */ (req.files || []);
    if (!files.length)
      return res.status(400).json({ ok: false, error: "No files received" });

    let parsed = 0;
    for (const f of files) {
      const name = f.originalname || f.filename || `file-${Date.now()}`;
      const baseExtra = { size: f.size, mime: f.mimetype };

      // Only attempt to parse PDFs up to 15MB
      if (/application\/pdf/i.test(f.mimetype || "") && f.size <= 15 * 1024 * 1024) {
        const { text, words, pages } = await extractFromPdfBuffer(f.buffer);
        addDoc(name, text, { ...baseExtra, words, pages });
        parsed += text ? 1 : 0;
      } else {
        addDoc(name, "", baseExtra);
      }
    }

    console.log(`[upload] files=${files.length} parsedText=${parsed} totalDocs=${DOCS.length}`);
    return res.status(200).json({ ok: true, added: files.length, docs: listDocs() });
  });
});

// JSON fallback: {name, text?}
app.post("/api/upload", (req, res) => {
  const { name, text = "" } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: "name required" });
  const d = addDoc(String(name), String(text));
  console.log(`[upload:json] name="${name}" id=${d.id} totalDocs=${DOCS.length}`);
  res.status(200).json({ ok: true, id: d.id, doc: { ...d, text: undefined } });
});

// optional multi-name JSON upload: {names:[]}
app.post("/api/uploads", (req, res) => {
  const { names } = req.body || {};
  if (!Array.isArray(names) || names.length === 0)
    return res.status(400).json({ ok: false, error: "names[] required" });
  const added = names.slice(0, 20).map((n) => addDoc(String(n)));
  console.log(`[uploads] count=${added.length} totalDocs=${DOCS.length}`);
  res.status(200).json({ ok: true, ids: added.map((d) => d.id), docs: listDocs() });
});

// --- finder -----------------------------------------------------------------
app.get("/api/find", (req, res) => {
  const { docId, q } = req.query;
  const d = getDoc(docId);
  if (!d) return res.status(404).json({ ok: false, total: 0, matches: [] });

  const query = String(q || "").trim();
  if (!query) return res.status(200).json({ ok: true, total: 0, matches: [] });

  const text = (d.text || "").toString();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(esc(query), "gi");

  const matches = [];
  let m;
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
  res.status(200).json({ ok: true, total: matches.length, matches });
});

// --- audit (demo) -----------------------------------------------------------
app.post("/api/audit", (req, res) => {
  const { docId, risk = "high" } = req.body || {};
  const d = getDoc(docId);
  if (!d) return res.status(404).json({ ok: false, findings: [], totalScore: 0, count: 0 });

  const base = [
    { severity: "high",   score: 10, category: "Legal",  issue: "Ground rent escalation", snippet: "… rent doubles every 10 years …" },
    { severity: "medium", score: 6,  category: "Fees",   issue: "Admin fee unclear",       snippet: "… reasonable admin charges …" },
    { severity: "low",    score: 3,  category: "Data",   issue: "Missing plan page",        snippet: "… title plan not attached …" },
  ];
  const order = risk === "high" ? 3 : risk === "medium" ? 2 : 1;
  const map = { high: 3, medium: 2, low: 1 };
  const keep = base.filter((f) => map[f.severity] <= order);
  const totalScore = keep.reduce((a, b) => a + b.score, 0);
  res.status(200).json({ ok: true, findings: keep, totalScore, count: keep.length });
});

// --- analyze (yield demo) ---------------------------------------------------
app.post("/api/analyze", (req, res) => {
  const { guidePrice, rentPcm } = req.body || {};
  const gp = Number(guidePrice);
  const rp = Number(rentPcm);
  if (!Number.isFinite(gp) || !Number.isFinite(rp) || gp <= 0)
    return res.status(400).json({ ok: false, error: "guidePrice and rentPcm required" });
  const grossYieldPct = Math.round(((rp * 12) / gp) * 1000) / 10;
  res.status(200).json({ ok: true, guidePrice: gp, rentPcm: rp, grossYieldPct });
});

// --- CHECKLIST (rules + calibration + conformal-ish) -----------------------
const CHECKLIST = [
  { id: "title_register",   label: "Title — Register",    kw: ["register","title register","official copy of register"], rx: /(^|\b)(OC\d*|title\s*register)/i },
  { id: "title_plan",       label: "Title — Plan",        kw: ["title plan","plan of title"], rx: /\b(title\s*plan|tp1|plan of title)\b/i },
  { id: "contract_general", label: "Contract — General",  kw: ["contract","conditions of sale"], rx: /\b(contract|conditions of sale)\b/i },
  { id: "contract_special", label: "Contract — Special",  kw: ["special conditions","sc"], rx: /\b(special\s+conditions|special\s+cond\.)\b/i },
  { id: "memorandum",       label: "Contract — Memorandum", kw: ["memorandum of sale","auction contract"], rx: /\b(memorandum\s+of\s+sale|auction\s+contract)\b/i },
  { id: "search_local",     label: "Search — Local",      kw: ["local search","llc1","con29"], rx: /\b(local\s+search|llc1|con29)\b/i },
  { id: "search_water",     label: "Search — Water",      kw: ["water search","drainage"], rx: /\b(water\s+search|drainage|sewerage)\b/i },
  { id: "search_env",       label: "Search — Environmental", kw: ["environmental search","contaminated land"], rx: /\b(environmental\s+search|contaminated\s+land)\b/i },
  { id: "epc",              label: "EPC & Compliance — EPC", kw: ["epc","energy performance"], rx: /\b(epc|energy\s+performance)\b/i },
  { id: "gas_eicr",         label: "EPC & Compliance — Gas/EICR", kw: ["gas safety","eicr"], rx: /\b(gas\s+safety|eicr)\b/i },
  { id: "ta6",              label: "Seller Forms — TA6",  kw: ["ta6","property information form"], rx: /\b(ta6|property\s+information\s+form)\b/i },
  { id: "ta10",             label: "Seller Forms — TA10", kw: ["ta10","fittings and contents"], rx: /\b(ta10|fittings\s+and\s+contents)\b/i },
  { id: "ta7",              label: "Seller Forms — TA7",  kw: ["ta7","leasehold information"], rx: /\b(ta7|leasehold\s+information)\b/i },
  { id: "lease",            label: "Leasehold — Lease",   kw: ["lease","underlease"], rx: /\b(lease|underlease)\b/i },
  { id: "lpe1",             label: "Leasehold — LPE1",    kw: ["lpe1"], rx: /\b(lpe1)\b/i },
  { id: "service_charges",  label: "Leasehold — Service Charges", kw: ["service charge","budget","accounts"], rx: /\b(service\s+charge|budget|accounts)\b/i },
  { id: "tenancy",          label: "Tenancy — AST/Lease", kw: ["ast","assured shorthold","tenancy agreement"], rx: /\b(ast|assured\s+shorthold|tenancy\s+agreement)\b/i },
  { id: "rent_schedule",    label: "Tenancy — Rent Schedule", kw: ["rent schedule","rent roll"], rx: /\b(rent\s+schedule|rent\s+roll)\b/i },
  { id: "deposit",          label: "Tenancy — Deposit",   kw: ["deposit protection","tds","mydeposits"], rx: /\b(deposit\s+protection|tds|mydeposits)\b/i },
  { id: "planning",         label: "Planning/Building",   kw: ["planning permission","building regs","enforcement"], rx: /\b(planning\s+permission|building\s+reg(ulation)?s|enforcement)\b/i },
  { id: "other",            label: "Other — Warranties/Indemnities/Probate", kw: ["warranty","indemnity","probate","asbestos","fire risk"], rx: /\b(warrant(y|ies)|indemnity|probate|asbestos|fire\s+risk)\b/i },
  { id: "addendum",         label: "Auctioneer Addendum(s)", kw: ["addendum"], rx: /\b(addendum|addenda)\b/i },
];

const CAL = { a: 1.4, b: -1.2 }; // demo Platt params
const platt = (s) => 1 / (1 + Math.exp(-(CAL.a * (s ?? 0) + CAL.b)));

const getDocText = (d) => (d.text || "").toString();

function ruleScore(item, doc) {
  const name = (doc.name || "").toString();
  const text = getDocText(doc);
  let s = 0;
  if (item.rx?.test(name)) s += 0.6;
  if (item.kw?.some((k) => name.toLowerCase().includes(k))) s += 0.25;
  if (text && item.kw?.some((k) => text.toLowerCase().includes(k))) s += 0.35;
  return Math.min(1, s);
}

function collectEvidence(item, doc) {
  const out = [];
  const name = (doc.name || "").toString();
  if (item.rx?.test(name)) out.push({ docId: doc.id, type: "filename", reason: "regex match", excerpt: name });
  const text = getDocText(doc);
  if (text) {
    for (const k of (item.kw || [])) {
      const i = text.toLowerCase().indexOf(k.toLowerCase());
      if (i >= 0) {
        out.push({
          docId: doc.id,
          type: "text",
          reason: `keyword "${k}"`,
          excerpt: text.slice(Math.max(0, i - 60), i + k.length + 60),
          index: i,
        });
        break;
      }
    }
  }
  return out;
}

app.get("/api/checklist/schema", (_req, res) => {
  res.json({ ok: true, items: CHECKLIST.map(({ id, label }) => ({ id, label })) });
});

app.post("/api/checklist/run", (req, res) => {
  try {
    const { docIds } = req.body || {};
    const pool = Array.isArray(docIds) && docIds.length
      ? DOCS.filter((d) => docIds.includes(d.id))
      : DOCS.slice();

    const results = CHECKLIST.map((item) => {
      let best = { score: 0, ev: [] };
      for (const d of pool) {
        const s = ruleScore(item, d);
        const ev = s > 0 ? collectEvidence(item, d) : [];
        if (s > best.score) best = { score: s, ev };
      }
      const p = platt(best.score);
      const status = best.ev.length === 0 ? "missing" : p >= 0.65 ? "present" : "unclear";
      return {
        itemId: item.id,
        label: item.label,
        status,
        // CRITICAL: keep this a number (fixes 500s downstream)
        calibratedScore: parseFloat(p.toFixed(3)),
        evidence: best.ev.slice(0, 3),
      };
    });

    res.json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// --- start ------------------------------------------------------------------
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`);
});
