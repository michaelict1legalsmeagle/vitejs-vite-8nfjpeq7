// Lightweight local "API" for Area Metrics & Comparables (stubbed).
// Swap implementations later with real endpoints (Land Registry, EPC, EA flood, Police, Zoopla).
function seed(postcode) {
    let h = 0;
    for (const ch of postcode.toUpperCase())
        h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return () => {
        // xorshift-ish
        h ^= h << 13;
        h ^= h >>> 17;
        h ^= h << 5;
        const u = (h >>> 0) / 0xffffffff;
        return Math.min(0.9999, Math.max(0.0001, u));
    };
}
function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}
function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
}
function near(n, pct, rng) {
    const delta = (rng() * 2 - 1) * pct;
    return Math.round(n * (1 + delta));
}
function round(n, dp = 1) {
    const f = Math.pow(10, dp);
    return Math.round(n * f) / f;
}
function toISORecentMonths(rng, maxMonths = 12) {
    const d = new Date();
    d.setMonth(d.getMonth() - Math.floor(rng() * maxMonths));
    return d.toISOString().slice(0, 10);
}
export async function fetchAreaDemo(postcode) {
    const rng = seed(postcode || "DEMO");
    // Base medians (loosely UK-ish)
    const lrMedianBase = 240000 + Math.floor(rng() * 300000);
    const rent2Base = 900 + Math.floor(rng() * 900);
    const areaYield = clamp(round(((rent2Base * 12) / lrMedianBase) * 100, 1), 3, 10);
    const metrics = {
        postcode: postcode.toUpperCase(),
        lrMedianPrice12m: near(lrMedianBase, 0.1, rng),
        lrTransactions12m: 120 + Math.floor(rng() * 400),
        priceTrend5yPct: round((rng() * 40 - 5), 1), // -5%..+35%
        avgRentPm2bed: near(rent2Base, 0.12, rng),
        grossYieldAvgPct: areaYield,
        epcAvg: pick(rng, ["B", "C", "C", "C", "D", "D", "E"]),
        floodRisk: pick(rng, ["Very Low", "Low", "Low", "Medium", "High"]),
        crimePer1k: round(30 + rng() * 80, 1),
    };
    const street = pick(rng, ["High St", "Church Rd", "Station Rd", "Victoria Rd", "London Rd", "Park Ave", "King St"]);
    const area = metrics.postcode.split(" ")[0];
    const comps = [];
    const make = (type) => {
        const id = Math.random().toString(36).slice(2, 8).toUpperCase();
        const beds = Math.random() < 0.7 ? 2 : pick(rng, [1, 3, 4]);
        const sqft = Math.random() < 0.6 ? 450 + Math.floor(rng() * 800) : null;
        const sold = type === "sold";
        const rent = type === "to_rent";
        const basePrice = metrics.lrMedianPrice12m;
        const price = rent
            ? near(metrics.avgRentPm2bed, 0.25, rng)
            : near(basePrice, 0.25, rng);
        const ppsf = !rent && sqft ? Math.round(price / sqft) : null;
        return {
            id,
            address: `${Math.floor(rng() * 180) + 10} ${street}, ${area}`,
            postcode: metrics.postcode,
            type,
            beds,
            price,
            date: sold ? toISORecentMonths(rng, 12) : toISORecentMonths(rng, 3),
            source: pick(rng, ["Land Registry", "Zoopla", "Rightmove", "OnTheMarket"]),
            url: "https://example.com/prop/" + id,
            epc: pick(rng, [null, "B", "C", "C", "D", "E"]),
            sqft,
            ppsf,
            distanceKm: round(rng() * 2.5, 2),
        };
    };
    // 5 sold, 3 for sale, 3 to rent
    for (let i = 0; i < 5; i++)
        comps.push(make("sold"));
    for (let i = 0; i < 3; i++)
        comps.push(make("for_sale"));
    for (let i = 0; i < 3; i++)
        comps.push(make("to_rent"));
    return { metrics, comps };
}
