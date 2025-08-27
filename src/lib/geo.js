const MAP = [
    { rx: /^(E|EC|SE|SW|W|WC|N|NW|HA|UB|TW|EN|IG|RM|CR|BR|DA|SM|KT|WD)\d/i, region: "LONDON" },
    // crude catch-all for demo
    { rx: /^[A-Z]{1,2}\d/i, region: "NORTH_WEST" }
];
export function postcodeToRegion(pc) {
    const s = (pc || "").toUpperCase().replace(/\s+/g, "");
    for (const m of MAP)
        if (m.rx.test(s))
            return m.region;
    return "NORTH_WEST";
}
