// src/api/area.live.ts
export type FloodRisk = "Very Low" | "Low" | "Medium" | "High";
export type AreaMetrics = {
  postcode: string;
  lrMedianPrice12m: number | null;
  lrTransactions12m: number;
  priceTrend5yPct: number | null;   // placeholder: null for now
  avgRentPm2bed: number | null;     // TODO: add portal integration later
  grossYieldAvgPct: number | null;  // derived if avgRentPm2bed present
  epcAvg: "A"|"B"|"C"|"D"|"E"|"F"|"G" | null; // TODO
  floodRisk: FloodRisk;
  crimePer1k: number | null;        // needs population baseline (future)
};
export type Comparable = {
  id: string;
  address: string;
  postcode: string;
  type: "sold";
  beds: number | null;
  price: number;
  date?: string;
  source: string;
  url?: string;
  epc?: string | null;
  sqft?: number | null;
  ppsf?: number | null;
  distanceKm?: number | null;
};

const API_BASE = (import.meta as any).env?.VITE_PROXY_BASE || (window as any).__LEXLOT_API__ || "http://localhost:8080";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

export async function fetchAreaLive(postcode: string): Promise<{ metrics: AreaMetrics; comps: Comparable[] }> {
  const pc = encodeURIComponent(postcode.trim().toUpperCase());
  const [geo, ppd, flood, crime] = await Promise.all([
    get(`/geo/postcode/${pc}`),
    get(`/lr/ppd?postcode=${pc}&months=12&limit=200`),
    get(`/flood/summary?postcode=${pc}&dist=10`),
    get(`/police/crime?postcode=${pc}&months=3`)
  ]);

  // derive a few metrics
  const lrMedian = ppd.medianLast12m ?? null;
  const txCount = ppd.recentCount12m ?? 0;

  // comparables from latest solds (thin)
  const comps: Comparable[] = (ppd.transactions || []).slice(0, 12).map((t: any, i: number) => ({
    id: `${t.postcode}-${t.date}-${i}`,
    address: [t.paon, t.street, t.town].filter(Boolean).join(", "),
    postcode: t.postcode,
    type: "sold",
    beds: null,
    price: t.amount,
    date: t.date,
    source: "HM Land Registry",
    url: undefined,
    epc: null,
    sqft: null,
    ppsf: null,
    distanceKm: null
  }));

  const metrics: AreaMetrics = {
    postcode: geo.postcode,
    lrMedianPrice12m: lrMedian,
    lrTransactions12m: txCount,
    priceTrend5yPct: null,       // TODO (UKHPI time series)
    avgRentPm2bed: null,         // TODO (portal/partner)
    grossYieldAvgPct: null,      // TODO when avgRent is present
    epcAvg: null,                // TODO (EPC register)
    floodRisk: flood.risk as FloodRisk,
    crimePer1k: null             // TODO (needs population baseline)
  };

  return { metrics, comps };
}
