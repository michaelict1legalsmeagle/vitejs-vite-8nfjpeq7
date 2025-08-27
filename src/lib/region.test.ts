import { describe, it, expect } from "vitest";
import { regionFromPostcode } from "./region";

describe("regionFromPostcode", () => {
  it.each([
    // Scotland (broad coverage)
    ["EH1 1AA", "Scotland"],
    ["TD9 0AA", "Scotland"],
    ["G74 0AA", "Scotland"],
    ["PA1 1AA", "Scotland"],
    ["KA1 1AA", "Scotland"],
    ["AB10 1AA", "Scotland"],
    ["DD1 1AA", "Scotland"],
    ["KY16 9AJ", "Scotland"],
    ["PH1 5HQ", "Scotland"],
    ["IV2 3AA", "Scotland"],
    ["KW1 4AA", "Scotland"],
    ["HS1 2XX", "Scotland"],
    ["ZE1 0AA", "Scotland"],
    ["FK7 0AA", "Scotland"],
    ["DG1 1AA", "Scotland"],
    ["ML1 1AA", "Scotland"], // Lanarkshire (previously missing)
  ])("maps %s → %s", (pc, expected) => {
    expect(regionFromPostcode(pc)).toBe(expected);
  });

  it.each([
    // Wales
    ["CF10 1AA", "Wales"],
    ["SA1 1AA", "Wales"],
    ["NP20 1AA", "Wales"],
    ["LL30 1AA", "Wales"],
    ["CH7 1AA", "Wales"],
    ["CH8 8AA", "Wales"],
    ["LD1 5AA", "Wales"],
  ])("maps %s → %s", (pc, expected) => {
    expect(regionFromPostcode(pc)).toBe(expected);
  });

  it.each([
    // Northern Ireland
    ["BT1 1AA", "Northern Ireland"],
    ["BT47 2AA", "Northern Ireland"],
    ["BT99 9ZZ", "Northern Ireland"],
  ])("maps %s → %s", (pc, expected) => {
    expect(regionFromPostcode(pc)).toBe(expected);
  });

  it.each([
    // England fallback
    ["B3 2JR", "England"],
    ["M1 1AA", "England"],
    ["L1 8JQ", "England"],
    ["SW1A 1AA", "England"],
    ["NE1 1AA", "England"],
    ["SR1 1AA", "England"],
  ])("maps %s → %s", (pc, expected) => {
    expect(regionFromPostcode(pc)).toBe(expected);
  });

  it.each([
    // Formatting robustness
    ["eh1   1aa", "Scotland"],
    [" cf10-1aa ", "Wales"],
    ["bt1\t1aa", "Northern Ireland"],
  ])("normalises %s → %s", (pc, expected) => {
    expect(regionFromPostcode(pc)).toBe(expected);
  });

  it.each([
    ["", "Unknown"],
    ["   ", "Unknown"],
    ["XYZ", "Unknown"],
    ["12345", "Unknown"],
  ])("returns Unknown for %s", (pc, expected) => {
    expect(regionFromPostcode(pc)).toBe(expected);
  });
});
