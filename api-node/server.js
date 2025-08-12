// api-node/server.js  (ESM)
import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // v3 ESM

// ---------- config ----------
const ORIGIN = process.env.CORS_ORIGIN || "*";
const PORT = process.env.PORT || 8080;

// API endpoints we call (all public)
const POSTCODES = "https://api.postcodes.io/postcodes";
const POLICE = "https://data.police.uk/api";
const EA_FLOOD = "https://environment.data.gov.uk/flood-monitoring";
const LR_SPARQL = "https://landregistry.data.gov.uk/landregistry/query";

// ---------- helpers ----------
const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

const UA = "LexLotProxy/1.0 (+https://example.com)";
const TIMEOUT_MS = 15000;

async function fetchJSON(url, opts = {}) {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(), opts.timeout || TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: ctl.signal,
      headers: {
        "user-agent": UA,
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upstream ${res.status}: ${text?.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

function monthsBack(n) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7)); // YYYY-MM
  }
  return out;
}

function ok(res, data) {
  res.set("cache-control", "public, max-age=300");
  return res.json(data);
}

function bad(res, code, msg) {
  return res.status(code).json({ error: msg });
}

// ---------- routes ----------

// Health
app.get("/health", (_req, res) => ok(res, { ok: true, ts: new Date().toISOString() }));

// Geocode by postcode (Postcodes.io)
app.get("/geo/postcode/:pc", async (req, res) => {
  try {
    const pc = encodeURIComponent(req.params.pc);
    const data = await fetchJSON(`${POSTCODES}/${pc}`);
    const r = data?.result;
    if (!r) return bad(res, 404, "Postcode not found");
    return ok(res, {
      postcode: r.postcode,
      lat: r.latitude,
      lng: r.longitude,
      outcode: r.outcode,
      lsoa: r.lsoa,
      admin_district: r.admin_district,
      country: r.country,
    });
  } catch (e) {
    return bad(res, 502, e.message || "geo lookup failed");
  }
});

// Police: crimes in last N months at a location (aggregated)
app.get("/police/crime", async (req, res) => {
  try {
    let { postcode, lat, lng, months = "3" } = req.query;
    const m = Math.max(1, Math.min(12, parseInt(months, 10) || 3));

    if ((!lat || !lng) && postcode) {
      const geo = await fetchJSON(`${POSTCODES}/${encodeURIComponent(postcode)}`);
      lat = geo?.result?.latitude;
      lng = geo?.result?.longitude;
    }
    if (!lat || !lng) return bad(res, 400, "Provide lat,lng or postcode");

    const monthsList = monthsBack(m);
    const all = [];
    for (const mm of monthsList) {
      const url = `${POLICE}/crimes-at-location?date=${mm}&lat=${lat}&lng=${lng}`;
      const arr = await fetchJSON(url);
      all.push(...arr);
    }
    const byCat = {};
    for (const c of all) byCat[c.category] = (byCat[c.category] || 0) + 1;

    return ok(res, {
      months: m,
      total: all.length,
      byCategory: Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count })),
    });
  } catch (e) {
    return bad(res, 502, e.message || "police fetch failed");
  }
});

// EA Flood Monitoring: nearby flood areas (simple risk-ish summary)
app.get("/flood/summary", async (req, res) => {
  try {
    let { postcode, lat, lng, dist = "5" } = req.query;

    if ((!lat || !lng) && postcode) {
      const geo = await fetchJSON(`${POSTCODES}/${encodeURIComponent(postcode)}`);
      lat = geo?.result?.latitude;
      lng = geo?.result?.longitude;
    }
    if (!lat || !lng) return bad(res, 400, "Provide lat,lng or postcode");

    const url = `${EA_FLOOD}/id/floodAreas?lat=${lat}&long=${lng}&dist=${encodeURIComponent(
      dist
    )}`;
    const data = await fetchJSON(url);
    const areas = data?.items || [];

    // minimal summary: count + nearest area name
    const summary = {
      countNearby: areas.length,
      sample: areas.slice(0, 3).map((a) => ({
        id: a?.notation,
        area: a?.label,
        river: a?.riverOrSea,
        t: a?.tidal ? "tidal" : "fluvial",
      })),
    };
    return ok(res, summary);
  } catch (e) {
    return bad(res, 502, e.message || "flood fetch failed");
  }
});

// HM Land Registry: recent sold comps by postcode via SPARQL
// NOTE: public SPARQL endpoint; availability can vary.
app.get("/lr/ppd", async (req, res) => {
  try {
    const { postcode, months = "12", limit = "50" } = req.query;
    if (!postcode) return bad(res, 400, "postcode is required");

    // normalize: remove spaces and uppercase for filter
    const pcNorm = String(postcode).replace(/\s+/g, "").toUpperCase();
    const m = Math.max(1, Math.min(60, parseInt(months, 10) || 12));
    const since = monthsBack(m).slice(-1)[0] + "-01"; // oldest month first day

    const sparql = `
PREFIX  lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX  xsd:   <http://www.w3.org/2001/XMLSchema#>

SELECT ?price ?date ?paon ?saon ?street ?locality ?town ?postcode
WHERE {
  ?tx  a lrppi:TransactionRecord ;
       lrppi:pricePaid ?price ;
       lrppi:transactionDate ?date ;
       lrppi:propertyAddress ?addr .
  ?addr lrppi:postcode ?postcode ;
        lrppi:paon ?paon .
  OPTIONAL { ?addr lrppi:saon ?saon }
  OPTIONAL { ?addr lrppi:street ?street }
  OPTIONAL { ?addr lrppi:locality ?locality }
  OPTIONAL { ?addr lrppi:town ?town }
  FILTER ( REPLACE(UCASE(STR(?postcode)), "\\\\s+", "") = "${pcNorm}" )
  FILTER ( ?date >= "${since}"^^xsd:dateTime )
}
ORDER BY DESC(?date)
LIMIT ${parseInt(limit, 10) || 50}
    `.trim();

    const r = await fetch(LR_SPARQL, {
      method: "POST",
      headers: {
        "accept": "application/sparql-results+json",
        "content-type": "application/sparql-query",
        "user-agent": UA,
      },
      body: sparql,
      timeout: TIMEOUT_MS,
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`LR ${r.status}: ${t.slice(0, 200)}`);
    }
    const json = await r.json();
    const rows = json?.results?.bindings || [];

    // shape into a lighter array
    const items = rows.map((b) => ({
      price: Number(b.price.value),
      date: b.date.value,
      paon: b.paon?.value || "",
      saon: b.saon?.value || "",
      street: b.street?.value || "",
      locality: b.locality?.value || "",
      town: b.town?.value || "",
      postcode: b.postcode?.value || postcode,
    }));

    // Fallback: if empty, return demo-ish placeholder so UI keeps working
    if (!items.length) {
      return ok(res, {
        source: "land-registry",
        items: [],
        note: "No recent PP entries for postcode or endpoint returned none.",
      });
    }
    return ok(res, { source: "land-registry", items });
  } catch (e) {
    // Safe fallback demo data (so UI can still calculate yields)
    return ok(res, {
      source: "fallback-demo",
      items: [
        {
          price: 265000,
          date: new Date().toISOString().slice(0, 10),
          paon: "12",
          street: "Example Street",
          town: "Sampletown",
          postcode: req.query.postcode,
        },
        {
          price: 278500,
          date: new Date(Date.now() - 864e5 * 30).toISOString().slice(0, 10),
          paon: "Flat 2",
          street: "Example Road",
          town: "Sampletown",
          postcode: req.query.postcode,
        },
      ],
      note: `LR fetch failed: ${e.message}`,
    });
  }
});

// ---------- start ----------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy up on ${PORT}  (CORS_ORIGIN=${ORIGIN})`);
});
