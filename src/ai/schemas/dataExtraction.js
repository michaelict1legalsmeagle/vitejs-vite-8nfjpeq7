// Zod schema for the Data Extraction output (strict JSON shape)
// Path: src/ai/schemas/dataExtraction.ts
import { z } from "zod";
// Helpers
const IsoDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format")
    .nullable();
const Currency = z.enum(["GBP", "EUR", "USD"]).nullable();
const NullableStr = z.string().nullable();
const NullableNum = z.number().finite().nullable();
const Issue = z.object({
    severity: z.enum(["red", "amber", "green"]),
    title: z.string(),
    note: NullableStr,
    estCost: NullableNum
});
export const DataExtractionSchema = z.object({
    lot: z.object({
        lot_number: NullableStr,
        address: NullableStr,
        title: NullableStr,
        postcode: NullableStr
    }),
    listing: z.object({
        auction_house_name: NullableStr,
        auction_house_url: NullableStr, // keep as string|null; URL validation can be added if needed
        auction_event_date: IsoDate,
        guide_price_currency: Currency,
        guide_price_lower: NullableNum,
        guide_price_upper: NullableNum,
        guide_price_text: NullableStr
    }),
    documents: z.object({
        special_conditions_present: z.boolean(),
        addendum_present: z.boolean(),
        contract_present: z.boolean(),
        title_register_present: z.boolean(),
        title_plan_present: z.boolean(),
        leases_present: z.boolean()
    }),
    dates: z.object({
        auction: IsoDate,
        completion: IsoDate,
        other: z.array(z.string())
    }),
    financials_detected: z.object({
        buyer_pays_seller_legal_fees: z.boolean(),
        buyer_premium: NullableNum,
        admin_fee: NullableNum,
        ground_rent_note: NullableStr,
        service_charge_note: NullableStr
    }),
    issues: z.object({
        top: z.array(Issue),
        risk_register: z.array(Issue),
        missing_or_uncertain: z.array(z.string())
    }),
    notes: NullableStr,
    confidence: z.number().min(0).max(1)
});
export function validateDataExtraction(input) {
    return DataExtractionSchema.parse(input);
}
export function safeValidateDataExtraction(input) {
    return DataExtractionSchema.safeParse(input);
}
export default DataExtractionSchema;
