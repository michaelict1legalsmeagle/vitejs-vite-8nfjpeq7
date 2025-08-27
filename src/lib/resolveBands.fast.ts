// src/lib/resolveBands.ts
// Pick threshold/band tables based on the active scenario.
// Explicit scenario wins; otherwise fall back to default.

export type Bands = { [k: string]: any };

export type Ctx = {
  scenario?: "DEFAULT" | "USER" | "LENDER" | "REGION";
  tables: {
    default: Bands;
    user?: Bands;
    lender?: Bands;
    region?: Bands;
  };
  // other ctx fields are ignored here
};

export function resolveBands(ctx: Ctx): Bands {
  const s = ctx.scenario ?? "DEFAULT";

  if (s === "USER"   && ctx.tables.user)   return ctx.tables.user!;
  if (s === "LENDER" && ctx.tables.lender) return ctx.tables.lender!;
  if (s === "REGION" && ctx.tables.region) return ctx.tables.region!;

  return ctx.tables.default;
}
