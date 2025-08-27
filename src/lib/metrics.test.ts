import { describe, it, expect } from "vitest";
import { computeMetricsWithRegion } from "./metrics";

const base = {
  price: 200000,
  rent: 1000,          // per month
  loan: 150000,
  rate: 5.5,
  term: 25,
  costs: 5000,
  product: "IO" as const,
  postcode: "B3 2JR",
  scenario: "Base",
  lender: "",
  includeSdlt: false
};

describe("metrics core", () => {
  it("computes gross yield correctly", () => {
    const m = computeMetricsWithRegion(base);
    // 1000*12 / 200000 = 0.06 → 6%
    expect(Number(m.grossYieldPct.toFixed(2))).toBeCloseTo(6.00, 2);
  });

  it("ICR uses region floor when no lender", () => {
    const m = computeMetricsWithRegion({ ...base, rate: 4.0 });
    expect(m.stressUsedPct).toBeGreaterThanOrEqual(4.0);
    expect(m.icr).toBeGreaterThan(0);
  });

  it("ICR uses lender floor when lender provided", () => {
    const m = computeMetricsWithRegion({ ...base, lender: "NatWest", rate: 4.0 });
    expect(m.stressUsedPct).toBeGreaterThanOrEqual(7.0);
  });

  it("cash-on-cash reacts to SDLT toggle", () => {
    const a = computeMetricsWithRegion({ ...base, includeSdlt: false });
    const b = computeMetricsWithRegion({ ...base, includeSdlt: true });
    expect(b.cashInvested).toBeGreaterThan(a.cashInvested);
    // CoC should generally drop if cash-in rises and cashflow unchanged
    expect(b.cocPct).toBeLessThan(a.cocPct);
  });
});
