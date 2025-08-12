// Local extractor stub (no AI) for Auction House Guide Price + Weblink
// Path: src/ai/extractListing.ts

import { z } from "zod";
import DataExtractionSchema, { type DataExtraction } from "./schemas/dataExtraction";

// -------------------------
// Helpers
// -------------------------

const AGGREGATOR_HOST_SNIPPETS = [
  "rightmove",
  "zoopla",
  "onthemarket",
  "gumtree",
  "propertylink",
  "primelocation",
  "facebook",
  "x.com",
  "twitter",
  "linkedin",
  "instagram",
  "youtube",
  "tiktok",
  "reddit",
  "news",
  "blog"
];

const KNOWN_AUCTION_HOST_SNIPPETS = [
  "savills",
  "allsop",
  "sdlauctions",
  "barnardmarcus",
  "auctionhouse",
  "cliveemson",
  "iamsold",
  "bidx1",
  "strettons",
  "harmers",
  "bondwolfe",
  "networkauctions",
  "dedmangray",
  "maggsandallen",
  "johnpye",
  "underthehammer",
  "agentauction",
  "shonki",
  "eddisons",
  "auction"
];

function toHostname(u: string): string | null {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function pickOfficialLotUrl(candidates: string[], contextText: string): string | null {
  if (!candidates?.length) return null;

  const inlineUrls = Array.from(contextText.matchAll(/https?:\/\/[^\s)]+/gi)).map(m => m[0]);
  const all = [...candidates, ...inlineUrls];

  let best: { url: string; score: number } | null = null;

  for (const raw of all) {
    let score = 0;
    const host = toHostname(raw);
    if (!host) continue;

    const lower = raw.toLowerCase();

    if (AGGREGATOR_HOST_SNIPPETS.some(s => host.includes(s))) score -= 5;

    if (KNOWN_AUCTION_HOST_SNIPPETS.some(s => host.includes(s))) score += 4;

    if (/[/-]lot[/-]?\d+/i.test(lower)) score += 4;
    if (lower.includes("/lot/")) score += 3;
    if (lower.includes("/lots/")) score += 2;
    if (lower.includes("auction")) score += 1;
    if (lower.endsWith(".pdf")) score -= 1;

    if (!best || score > best.score) best = { url: raw, score };
  }

  if (best?.url?.startsWith("http://")) {
    try {
      const u = new URL(best.url);
      u.protocol = "https:";
      return u.toString();
    } catch {
      return best.url;
    }
  }

  return best?.url ?? null;
}

type GuideParsed = {
  currency: "GBP" | "EUR" | "USD" | null;
  lower: number | null;
  upper: number | null;
  text: string | null;
  notes: string | null;
};

function parseGuidePrice(context: string): GuideParsed {
  const text = context || "";
  const clean = text.replace(/\u00A0/g, " ");

  const guideLineRegex = /(?:^|\n|\r|\.|\s)(?:guide(?:\s*price)?|gp|guide\s*price\s*\(plus\s*fees\))[:\s]*([^\n\r]+)/gi;

  let bestLine: string | null = null;
  let m: RegExpExecArray | null;

  while ((m = guideLineRegex.exec(clean))) {
    const line = (m[0] || "").trim();
    if (/[£€$]|\d/.test(line)) {
      bestLine = line;
      break;
    }
  }

  if (!bestLine) {
    const moneyLine = Array.from(clean.split(/\n|\r/)).find(
      l => /guide/i.test(l) && /[£€$]\s*\d/.test(l)
    );
    bestLine = moneyLine ?? null;
  }

  if (!bestLine) {
    return { currency: null, lower: null, upper: null, text: null, notes: "Guide price not found." };
  }

  const originalText = bestLine;

  let currency: GuideParsed["currency"] = null;
  if (/[£]/.test(bestLine)) currency = "GBP";
  else if (/[€]/.test(bestLine)) currency = "EUR";
  else if (/\$/.test(bestLine)) currency = "USD";

  const norm = bestLine.replace(/[–—]/g, "-").toLowerCase();

  const rangeMatch = norm.match(/([£€$]?\s*\d{1,3}(?:[,.\s]\d{3})+|\d+)\s*-\s*([£€$]?\s*\d{1,3}(?:[,.\s]\d{3})+|\d+)/i);
  const inExcessMatch = norm.match(/(?:in\s+excess\s+of|excess\s+of)\s*([£€$]?\s*\d{1,3}(?:[,.\s]\d{3})+|\d+)/i);
  const singleMatch = norm.match(/([£€$]?\s*\d{1,3}(?:[,.\s]\d{3})+|\d+)/);

  function toNum(s: string): number {
    return Number(s.replace(/[^\d.]/g, "").replace(/(\.\d{3})+(?!\d)/g, ""));
  }

  let lower: number | null = null;
  let upper: number | null = null;
  let notes: string | null = null;

  if (rangeMatch) {
    lower = toNum(rangeMatch[1]);
    upper = toNum(rangeMatch[2]);
  } else if (inExcessMatch) {
    lower = toNum(inExcessMatch[1]);
    upper = null;
  } else if (singleMatch) {
    if (/starting\s+price|opening\s+bid|current\s+bid|estimate/i.test(bestLine)) {
      return {
        currency,
        lower: null,
        upper: null,
        text: originalText,
        notes: "Starting/opening/bid/estimate detected; no explicit guide price."
      };
    }
    lower = toNum(singleMatch[1]);
    upper = null;
  }

  if (/tbc|poa/i.test(bestLine)) {
    return { currency, lower: null, upper: null, text: originalText, notes: "Guide price is TBC/POA." };
  }

  return { currency, lower: lower ?? null, upper: upper ?? null, text: originalText, notes: null };
}

function boolPresence(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some(n => h.includes(n.toLowerCase()));
}

// -------------------------
// Main extractor (stub)
// -------------------------

export type ExtractInput = {
  contextText: string;
  sourceUrls: string[];
  lotMetadata?: {
    lot_number?: string | null;
    address?: string | null;
    title?: string | null;
    postcode?: string | null;
    auction_house_name?: string | null;
    auction_event_date?: string | null; // "YYYY-MM-DD" if known
  };
};

export function extractListing(input: ExtractInput): DataExtraction {
  const ctx = input.contextText || "";
  const urls = Array.isArray(input.sourceUrls) ? input.sourceUrls.filter(Boolean) : [];

  const auction_house_url = pickOfficialLotUrl(urls, ctx);

  let auction_house_name: string | null = input.lotMetadata?.auction_house_name ?? null;
  if (!auction_house_name && auction_house_url) {
    const host = toHostname(auction_house_url) ?? "";
    const brand = KNOWN_AUCTION_HOST_SNIPPETS.find(s => host.includes(s));
    auction_house_name = brand ? brand.replace(/auctions?|auctionhouse/i, "").replace(/-/g, " ").trim() || brand : null;
    if (auction_house_name) {
      auction_house_name = auction_house_name
        .split(/\s+/)
        .map(t => (t ? t[0].toUpperCase() + t.slice(1) : t))
        .join(" ");
    }
  }

  const g = parseGuidePrice(ctx);

  const documents = {
    special_conditions_present: boolPresence(ctx, ["special conditions"]),
    addendum_present: boolPresence(ctx, ["addendum"]),
    contract_present: boolPresence(ctx, ["contract for sale", "contract"]),
    title_register_present: boolPresence(ctx, ["title register", "oc1", "register of title"]),
    title_plan_present: boolPresence(ctx, ["title plan", "tp1", "plan"]),
    leases_present: boolPresence(ctx, ["lease", "ast", "tenancy agreement"])
  };

  const auctionDateMeta = input.lotMetadata?.auction_event_date ?? null;
  const auctionDateInline = (ctx.match(/\b(20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/) || [])[0] ?? null;

  const base: DataExtraction = {
    lot: {
      lot_number: input.lotMetadata?.lot_number ?? null,
      address: input.lotMetadata?.address ?? null,
      title: input.lotMetadata?.title ?? null,
      postcode: input.lotMetadata?.postcode ?? null
    },
    listing: {
      auction_house_name,
      auction_house_url,
      auction_event_date: auctionDateMeta ?? auctionDateInline,
      guide_price_currency: g.currency,
      guide_price_lower: g.lower,
      guide_price_upper: g.upper,
      guide_price_text: g.text
    },
    documents,
    dates: {
      auction: auctionDateMeta ?? auctionDateInline,
      completion: null,
      other: []
    },
    financials_detected: {
      buyer_pays_seller_legal_fees: boolPresence(ctx, ["buyer to pay seller's legal fees", "buyer pays seller's legal costs"]),
      buyer_premium: null,
      admin_fee: null,
      ground_rent_note: null,
      service_charge_note: null
    },
    issues: {
      top: [],
      risk_register: [],
      missing_or_uncertain: []
    },
    notes: g.notes,
    confidence: computeConfidence({ ctx, g, auction_house_url })
  };

  return DataExtractionSchema.parse(base);
}

export function tryExtractListing(input: ExtractInput): { ok: true; data: DataExtraction } | { ok: false; error: z.ZodError | Error } {
  try {
    const data = extractListing(input);
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err };
  }
}

function computeConfidence(params: { ctx: string; g: GuideParsed; auction_house_url: string | null }): number {
  let c = 0.4;
  if (params.auction_house_url) c += 0.3;
  if (params.g.text) c += 0.2;
  if (params.g.lower !== null) c += 0.05;
  if (params.g.upper !== null) c += 0.05;
  return Math.max(0, Math.min(1, Number(c.toFixed(2))));
}
