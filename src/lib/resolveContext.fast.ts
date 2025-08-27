import { postcodeToRegion } from "./geo";
import lenderRules from "../data/lenderRules.json";
import defaults from "../data/defaults.json";
import regionBands from "../data/regionBands.json";
import { useSettings } from "../store/useSettings";
import { usePrefs } from "../store/usePrefs";

type Product = { code:"BTL_IO"|"BTL_Repay"; maxLtv:number; icrBasic:number; icrHigher:number; stressRate:number };
type Lender = { lenderId:string; name:string; products:Product[] };

export type Ctx = {
  regionId: string;
  tenancy: "single"|"hmo";
  lender: { maxLtv:number; icrFloor:number; stressRate:number };
  userTargets: Partial<Record<string, number>>;
  defaults: any;
  regionBands: any[];
};

export function buildContext(postcode: string): Ctx {
  const settings = useSettings.getState();
  const prefs = usePrefs.getState();

  const regionId = postcodeToRegion(postcode);
  const lender = (lenderRules as Lender[]).find(l => l.lenderId === settings.lenderId) ?? (lenderRules as Lender[])[0];
  const prod   = lender.products.find(p => p.code === settings.product) ?? lender.products[0];
  const icrFloor = settings.taxBand === "higher" ? prod.icrHigher : prod.icrBasic;

  return {
    regionId,
    tenancy: settings.tenancy,
    lender: { maxLtv: prod.maxLtv, icrFloor, stressRate: prod.stressRate },
    userTargets: { ...(prefs.targets || {}) },
    defaults,
    regionBands: regionBands as any[],
  };
}
