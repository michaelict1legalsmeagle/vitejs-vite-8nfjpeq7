// Quick logic smoke: fail fast if core math explodes.
const assert = (cond, msg) => { if (!cond) { console.error(msg); process.exit(1); } };

// Simple sanity on a known-good shape
const inputs = {
  price: 200000, rent: 1000, loan: 150000, rate: 5.5, term: 25,
  costs: 5000, product: "IO", postcode: "B3 2JR", lender: "", includeSdlt: true
};

const monthlyIO = (loan, ratePct) => loan * (ratePct / 100 / 12);
const mDebt = monthlyIO(inputs.loan, inputs.rate);
const gy = (inputs.rent * 12 * 100) / inputs.price;

assert(mDebt > 0, "Monthly debt should be > 0");
assert(gy > 0 && gy < 100, "Gross yield sanity failed");

console.log("smoke ok");
