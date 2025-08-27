// src/lib/context.ts
// Minimal context builder that threads `scenario` through to the resolver.

import type { Bands } from "./resolveBands";

export type Scenario = "DEFAULT" | "USER" | "LENDER" | "REGION";

export type Context = {
  values: Record<string, any>;
  scenario: Scenario;
  tables: {
    default: Bands;
    user?: Bands;
    lender?: Bands;
    region?: Bands;
  };
  // any other fields you already use can be included; this keeps them intact
} & Record<string, any>;

export function buildContext(input: Partial<Context> & { values: Record<string, any>; scenario?: Scenario }): Context {
  return {
    scenario: input.scenario ?? "DEFAULT",
    values: input.values,
    tables: input.tables as Context["tables"],
    ...input, // preserve any existing fields your pipeline expects
  } as Context;
}
