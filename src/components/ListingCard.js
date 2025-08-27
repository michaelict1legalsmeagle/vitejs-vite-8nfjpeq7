import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePack } from "../store/usePack";
function currencySymbol(code) {
    if (code === "GBP")
        return "£";
    if (code === "EUR")
        return "€";
    if (code === "USD")
        return "$";
    return "";
}
export default function ListingCard() {
    const listing = usePack((s) => s.listing);
    if (!listing) {
        return (_jsx("div", { className: "card", children: _jsxs("div", { className: "text-sm opacity-70", children: ["No listing extracted yet. Click ", _jsx("b", { children: "Analyze" }), " or run extraction later to display auction house, guide price and the official lot link."] }) }));
    }
    const l = listing.listing;
    const sym = currencySymbol(l.guide_price_currency);
    let guideDisplay = "—";
    if (l.guide_price_lower && l.guide_price_upper) {
        guideDisplay = `${sym}${l.guide_price_lower.toLocaleString()} – ${sym}${l.guide_price_upper.toLocaleString()}`;
    }
    else if (l.guide_price_lower) {
        guideDisplay = `${sym}${l.guide_price_lower.toLocaleString()}`;
    }
    else if (l.guide_price_text) {
        guideDisplay = l.guide_price_text;
    }
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs opacity-60", children: "Auction House" }), _jsx("div", { className: "text-lg font-semibold", children: l.auction_house_name ?? "—" }), listing.lot?.title && (_jsx("div", { className: "text-sm opacity-80", children: listing.lot.title }))] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs opacity-60", children: "Guide Price" }), _jsx("div", { className: "text-lg font-semibold", children: guideDisplay })] }), _jsx("div", { className: "flex items-center gap-2", children: l.auction_house_url ? (_jsx("a", { href: l.auction_house_url, target: "_blank", rel: "noopener noreferrer", className: "btn", children: "\uD83D\uDD17 Open lot page" })) : (_jsx("span", { className: "text-xs opacity-60", children: "No lot URL" })) })] }), _jsxs("div", { className: "mt-3 grid sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "text-xs opacity-60", children: "Auction Date" }), _jsx("div", { children: l.auction_event_date ?? listing.dates.auction ?? "—" })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "text-xs opacity-60", children: "Confidence" }), _jsxs("div", { children: [Math.round((listing.confidence ?? 0) * 100), "%"] })] })] })] }));
}
