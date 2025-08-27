import { describe, it, expect } from "vitest";
import { dealSchema } from "./validation";

describe("deal input validation & coercion", () => {
  it("coerces £ strings, clamps, and cleans postcode", () => {
    const out = dealSchema.parse({
      price: "£250,000",
      rent: "1,100",
      loan: "200000",
      rate: "6.25%",
      term: 120,            // clamp to 50
      costs: "-5",          // clamp to 0
      product: "IO",
      postcode: "b3   2jr",
      includeSdlt: "true"
    });
    expect(out.price).toBe(250000);
    expect(out.rent).toBe(1100);
    expect(out.rate).toBeCloseTo(6.25);
    expect(out.term).toBe(50);
    expect(out.costs).toBe(0);
    expect(out.postcode).toBe("B3 2JR");
    expect(out.includeSdlt).toBe(true);
  });
});
