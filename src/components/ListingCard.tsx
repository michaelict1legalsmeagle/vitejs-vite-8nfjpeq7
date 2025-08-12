import React from "react";
import { usePack } from "../store/usePack";

function currencySymbol(code: "GBP" | "EUR" | "USD" | null) {
  if (code === "GBP") return "£";
  if (code === "EUR") return "€";
  if (code === "USD") return "$";
  return "";
}

export default function ListingCard() {
  const listing = usePack((s) => s.listing);

  if (!listing) {
    return (
      <div className="card">
        <div className="text-sm opacity-70">
          No listing extracted yet. Click <b>Analyze</b> or run extraction later to display
          auction house, guide price and the official lot link.
        </div>
      </div>
    );
  }

  const l = listing.listing;
  const sym = currencySymbol(l.guide_price_currency);

  let guideDisplay = "—";
  if (l.guide_price_lower && l.guide_price_upper) {
    guideDisplay = `${sym}${l.guide_price_lower.toLocaleString()} – ${sym}${l.guide_price_upper.toLocaleString()}`;
  } else if (l.guide_price_lower) {
    guideDisplay = `${sym}${l.guide_price_lower.toLocaleString()}`;
  } else if (l.guide_price_text) {
    guideDisplay = l.guide_price_text;
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-xs opacity-60">Auction House</div>
          <div className="text-lg font-semibold">
            {l.auction_house_name ?? "—"}
          </div>
          {listing.lot?.title && (
            <div className="text-sm opacity-80">{listing.lot.title}</div>
          )}
        </div>

        <div>
          <div className="text-xs opacity-60">Guide Price</div>
          <div className="text-lg font-semibold">{guideDisplay}</div>
        </div>

        <div className="flex items-center gap-2">
          {l.auction_house_url ? (
            <a
              href={l.auction_house_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              🔗 Open lot page
            </a>
          ) : (
            <span className="text-xs opacity-60">No lot URL</span>
          )}
        </div>
      </div>

      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="card">
          <div className="text-xs opacity-60">Auction Date</div>
          <div>{l.auction_event_date ?? listing.dates.auction ?? "—"}</div>
        </div>
        <div className="card">
          <div className="text-xs opacity-60">Confidence</div>
          <div>{Math.round((listing.confidence ?? 0) * 100)}%</div>
        </div>
      </div>
    </div>
  );
}
