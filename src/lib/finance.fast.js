export const toAnnual = (m) => m * 12;
export const clampPos = (n) => (Number.isFinite(n) && n > 0 ? n : 0);
export function grossYield(price, rentAnnual) {
    return price > 0 ? rentAnnual / price : 0;
}
export function netYield(price, rentAnnual, opCostsAnnual) {
    return price > 0 ? (rentAnnual - opCostsAnnual) / price : 0;
}
export function pmtMonthly(rateAnnual, termYears, loan) {
    const r = rateAnnual / 12;
    const n = Math.max(1, Math.round(termYears * 12));
    if (r === 0)
        return loan / n;
    const num = r * loan * Math.pow(1 + r, n);
    const den = Math.pow(1 + r, n) - 1;
    return num / den;
}
export function ioMonthly(rateAnnual, loan) {
    return (rateAnnual * loan) / 12;
}
export function ltv(loan, price) {
    return price > 0 ? loan / price : 0;
}
export function icr(rentMonthly, stressedMortgageMonthly) {
    return stressedMortgageMonthly > 0 ? rentMonthly / stressedMortgageMonthly : 0;
}
export function breakEvenOcc(opCostsAnnual, mortgageAnnual, potentialRentAnnual) {
    return potentialRentAnnual > 0 ? (opCostsAnnual + mortgageAnnual) / potentialRentAnnual : 1;
}
export function cashOnCash(netCashFlowAnnual, cashInvested) {
    return cashInvested > 0 ? netCashFlowAnnual / cashInvested : 0;
}
export function calcSdltSimple(price, surcharge3pc = true) {
    // Simplified bands (ENG/WAL); fine for MVP.
    const bands = [
        { upTo: 250000, rate: 0.0 },
        { upTo: 925000, rate: 0.05 },
        { upTo: 1500000, rate: 0.10 },
        { upTo: null, rate: 0.12 },
    ];
    let tax = 0, prev = 0;
    for (const b of bands) {
        const cap = b.upTo ?? price;
        if (price <= prev)
            break;
        const slice = Math.min(price, cap) - prev;
        if (slice > 0)
            tax += slice * b.rate;
        prev = cap;
    }
    if (surcharge3pc)
        tax += price * 0.03;
    return tax;
}
export function sdltImpactPct(price, sdlt) {
    return price > 0 ? sdlt / price : 0;
}
/** One-shot compute of all metrics for today’s screen. */
export function computeMetrics(d) {
    const rentA = toAnnual(d.rentMonthly);
    const gy = grossYield(d.price, rentA);
    const ny = netYield(d.price, rentA, d.costsAnnual);
    const loanPayMonthly = d.product === "Repay"
        ? pmtMonthly(d.rate, d.termYears, d.loan)
        : ioMonthly(d.rate, d.loan);
    const mortgageAnnual = loanPayMonthly * 12;
    const be = breakEvenOcc(d.costsAnnual, mortgageAnnual, rentA);
    const ltvPct = ltv(d.loan, d.price);
    const stressedMonthly = ioMonthly(Math.max(d.rate, 0.055), d.loan); // default stress 5.5%
    const icrX = icr(d.rentMonthly, stressedMonthly);
    const sdlt = calcSdltSimple(d.price, true);
    const sdltPct = sdltImpactPct(d.price, sdlt);
    const netCashAnnual = Math.max(0, rentA - d.costsAnnual - mortgageAnnual);
    const cashInvested = Math.max(1, d.price - d.loan + sdlt);
    const coc = cashOnCash(netCashAnnual, cashInvested);
    // Rough 5y ROI: cash flow only; skip equity/growth today (keep code brutally simple)
    const roi5 = (netCashAnnual * 5) / cashInvested;
    return {
        gross: gy,
        net: ny,
        coc,
        icr: icrX,
        roi5,
        breakeven: be,
        ltv: ltvPct,
        sdlt: sdltPct,
    };
}
