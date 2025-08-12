import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;
const ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: ORIGIN }));
app.get("/health", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// --- tiny TTL cache (in-memory) ---
const cache = new Map();
const getCache = (k) => {
  const v = cache.get(k);
  if (!v) return null;
  if (Date.now() > v.exp) { cache.delete(k); return null; }
  return v.val;
};
const setCache = (k, val, ttlMs = 60_000) => cache.set(k, { val, exp: Date.now() + ttlMs });

// helper: fetch JSON with basic error handling
async function j(url, init) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`Upstream ${r.status}: ${await r.text()}`);
  return r.json();
}

// ---------- GEO ----------
app.get("/geo/postcode/:pc", async (req, res) => {
  try {
    const pc = req.params.pc.trim();
    const key = `pc:${pc}`;
    const hit = getCache(key);
    if (hit) return res.json(hit);
    const data = await j(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    const out = {
      postcode: data.result.postcode,
      lat: data.result.latitude,
      lng: data.result.longitude,
      outcode: data.result.outcode,
      admin_district: data.result.admin_district,
      lsoa: data.result.lsoa
    };
    setCache(key, out, 10 * 60 * 1000);
    res.json(out);
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// ---------- POLICE CRIME (last N months combined) ----------
app.get("/police/crime", async (req, res) => {
  try {
    const { postcode, months = 3 } = req.query;
    if (!postcode) return res.status(400).json({ error: "postcode required" });
    const geo = await j(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    const lat = geo.result.latitude, lng = geo.result.longitude;

    // latest available month list
    const dates = await j("https://data.police.uk/api/crimes-street-dates");
    const latest = dates?.[0]?.date; // YYYY-MM
    if (!latest) return res.status(502).json({ error: "police api dates unavailable" });

    // build YYYY-MM list for N months
    const list = [];
    const [y, m] = latest.split("-").map(Number);
    const n = Math.max(1, Math.min(12, Number(months)));
    for (let i = 0; i < n; i++) {
      const d = new Date(y, m - 1 - i, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    // fetch crimes for each month
    const all = [];
    for (const d of list) {
      const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${d}`;
      const monthCrimes = await j(url);
      all.push(...monthCrimes);
    }

    // aggregate simple counts by category
    const byCat = {};
    for (const c of all) byCat[c.category] = (byCat[c.category] || 0) + 1;

    res.json({
      centre: { lat, lng, postcode: geo.result.postcode },
      months: n,
      total: all.length,
      byCategory: byCat
      // NOTE: Per-1k requires population baseline (not included here).
    });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// ---------- FLOOD: areas near + active warnings near ----------
async function floodAreasNear(lat, lng, distKm = 10) {
  const url = `https://environment.data.gov.uk/flood-monitoring/id/floodAreas?lat=${lat}&long=${lng}&dist=${distKm}`;
  const data = await j(url); // items[]
  return data.items || [];
}
async function floodStationsNear(lat, lng, distKm = 10) {
  const url = `https://environment.data.gov.uk/flood-monitoring/id/stations?lat=${lat}&long=${lng}&dist=${distKm}`;
  const data = await j(url);
  return data.items || [];
}
async function floodWarnings() {
  const data = await j("https://environment.data.gov.uk/flood-monitoring/id/floods");
  return data.items || []; // active alerts/warnings with floodAreaID & severity
}

app.get("/flood/summary", async (req, res) => {
  try {
    const { postcode, lat, lng, dist = 10 } = req.query;
    let _lat = Number(lat), _lng = Number(lng);
    if (postcode) {
      const geo = await j(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      _lat = geo.result.latitude; _lng = geo.result.longitude;
    }
    if (!(_lat && _lng)) return res.status(400).json({ error: "postcode or lat,lng required" });

    const [areas, stations, warnings] = await Promise.all([
      floodAreasNear(_lat, _lng, Number(dist)),
      floodStationsNear(_lat, _lng, Number(dist)),
      floodWarnings()
    ]);

    const areaCodes = new Set(areas.map(a => a.notation || a.code || a.fwdCode || a.id).filter(Boolean));
    const nearbyWarnings = warnings.filter(w => areaCodes.has(w.floodAreaID));

    // derive a simple risk word
    let risk = "Very Low";
    if (nearbyWarnings.some(w => w.severity === 1)) risk = "High";
    else if (nearbyWarnings.some(w => w.severity === 2)) risk = "Medium";
    else if (nearbyWarnings.some(w => w.severity === 3)) risk = "Low";
    else if (areas.length > 0) risk = "Low"; // in mapped flood area but no active warning

    res.json({
      centre: { lat: _lat, lng: _lng },
      areasCount: areas.length,
      stationsCount: stations.length,
      activeWarnings: nearbyWarnings.length,
      risk,
      areas,
      stations,
      warnings: nearbyWarnings
    });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// ---------- LAND REGISTRY PPD via SPARQL ----------
function sparqlBody(query) {
  return new URLSearchParams({ query }).toString();
}
async function lrQuery(query) {
  const resp = await fetch("http://landregistry.data.gov.uk/landregistry/query", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "accept": "application/sparql-results+json"
    },
    body: sparqlBody(query)
  });
  if (!resp.ok) throw new Error(`HMLR SPARQL ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

app.get("/lr/ppd", async (req, res) => {
  try {
    const { postcode, months = 12, limit = 200 } = req.query;
    if (!postcode) return res.status(400).json({ error: "postcode required" });

    const since = (() => {
      const d = new Date(); d.setMonth(d.getMonth() - Math.min(24, Number(months)));
      return d.toISOString().slice(0,10);
    })();

    const pc = String(postcode).toUpperCase().replace(/\s+/g, " ").trim();

    const q = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
SELECT ?paon ?street ?town ?postcode ?amount ?date
WHERE {
  ?tx a lrppi:TransactionRecord ;
      lrppi:pricePaid ?amount ;
      lrppi:transactionDate ?date ;
      lrppi:propertyAddress ?addr .
  ?addr lrcommon:postcode ?postcode .
  OPTIONAL { ?addr lrcommon:paon ?paon . }
  OPTIONAL { ?addr lrcommon:street ?street . }
  OPTIONAL { ?addr lrcommon:town ?town . }
  FILTER (UCASE(STR(?postcode)) = "${pc}")
  FILTER (?date >= "${since}"^^xsd:date)
}
ORDER BY DESC(?date)
LIMIT ${Math.min(500, Number(limit))}
`.trim();

    const data = await lrQuery(q);
    const rows = (data?.results?.bindings || []).map(b => ({
      paon: b.paon?.value || null,
      street: b.street?.value || null,
      town: b.town?.value || null,
      postcode: b.postcode?.value || pc,
      amount: Number(b.amount?.value || 0),
      date: b.date?.value || null
    }));

    // recent stats (last 12 months regardless of query months)
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 12);
    const recent = rows.filter(r => r.date && new Date(r.date) >= cutoff);
    const prices = recent.map(r => r.amount).sort((a,b) => a-b);
    const median = prices.length
      ? (prices.length % 2
          ? prices[(prices.length - 1) / 2]
          : Math.round((prices[prices.length/2 - 1] + prices[prices.length/2]) / 2))
      : null;

    res.json({ count: rows.length, medianLast12m: median, recentCount12m: recent.length, transactions: rows });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

app.listen(PORT, () => {
  console.log(`lexlot-proxy listening on :${PORT}`);
});
