export type Tenancy = "single" | "hmo" | "dev";

export type MetricKey =
  | "gross"
  | "net"
  | "coc"
  | "icr"
  | "roi5"
  | "breakeven"
  | "ltv"
  | "sdlt";

export type Band = { green: number; amber: number; invert?: boolean };
export type MetricColour = "GREEN" | "AMBER" | "RED";
export type MetricResult = { value: number; band: MetricColour; points: 100 | 70 | 40 };
