import { postcodeToRegion } from "./geo";
import lenderRules from "../data/lenderRules.json";
import defaults from "../data/defaults.json";
import regionBands from "../data/regionBands.json";
import { useSettings } from "../store/useSettings";
import { usePrefs } from "../store/usePrefs";
export function buildContext(postcode) {
    const settings = useSettings.getState();
    const prefs = usePrefs.getState();
    const regionId = postcodeToRegion(postcode);
    const lender = lenderRules.find(l => l.lenderId === settings.lenderId) ?? lenderRules[0];
    const prod = lender.products.find(p => p.code === settings.product) ?? lender.products[0];
    const icrFloor = settings.taxBand === "higher" ? prod.icrHigher : prod.icrBasic;
    return {
        regionId,
        tenancy: settings.tenancy,
        lender: { maxLtv: prod.maxLtv, icrFloor, stressRate: prod.stressRate },
        userTargets: { ...(prefs.targets || {}) },
        defaults,
        regionBands: regionBands,
    };
}
