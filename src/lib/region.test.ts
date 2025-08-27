import { describe, it, expect } from "vitest";
import { regionFromPostcode } from "./region";

describe("region mapping", () => {
  it("maps Birmingham to a defined England region", () => {
    const r = regionFromPostcode("B3 2JR");
    expect(r).not.toBe("Unknown");
    expect(typeof r).toBe("string");
  });

  it("Welsh postcodes map to Wales", () => {
    const r = regionFromPostcode("CF10 1EP");
    expect(r).toBe("Wales");
  });

  it("Scottish postcodes map to Scotland", () => {
    const r = regionFromPostcode("EH1 1YZ");
    expect(r).toBe("Scotland");
  });
});
