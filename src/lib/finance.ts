// Pure finance maths used by the calculator + scoring.

export type DealInputs = {
  price: number;
  rentMonthly: number;
  loan: number;
  rate: number;       // nominal annual, e.g. 0.055
  termYears: number;  // amortisation term
  costsAnnual: number;
  product?: "IO" | "Repay";
};

export const toAnnual = (m: number) => m * 12;

export function grossYield(price: number, rentAnnual: number) {
  if (!price) return 0;
  return rentAnnual / price;
}

export function netYield(price: number, rentAnnual: number, opCostsAnnual: number) {
  if (!price) return 0;
  return (rentAnnual - opCostsAnnual) / price;
}

// PMT for repayment mortgage (monthly payment)
// r = monthly rate, n = total months, PV = principal (loan)
export function pmtMonthly(rateAnnual: number, termYears: number, loan: number) {
  const r = rateAnnual / 12;
  const n = Math.max(1, Math.round(termYears * 12));
  if (r === 0) return loan / n;
  const num = r * loan * Math.pow(1 + r, n);
  const den = Math.pow(1 + r, n) - 1;
  return num / den;
}

// interest-only monthly payment
export function ioMonthly(rateAnnual: number, loan: number) {
  return (rateAnnual * loan) / 12;
}

export function ltv(loan: number, price: number) {
  if (!price) return 0;
  return loan / price;
}

// ICR = rentMonthly / stressedMortgageMonthly
export function icr(rentMonthly: number, stressedMortgageMonthly: number) {
  if (!stressedMortgageMonthly) return 0;
  return rentMonthly / stressedMortgageMonthly;
}

// Break-even occupancy % = (opCostsAnnual + mortgageAnnual) / potentialRentAnnual
export function breakEvenOcc(opCostsAnnual: number, mortgageAnnual: number, potentialRentAnnual: number) {
  if (!potentialRentAnnual) return 1;
  return (opCostsAnnual + mortgageAnnual) / potentialRentAnnual;
}

// Cash-on-Cash % = netCashFlowAnnual / cashInvested
export function cashOnCash(netCashFlowAnnual: number, cashInvested: number) {
  if (!cashInvested) return 0;
  return netCashFlowAnnual / cashInvested;
}

// 5-year ROI (simple model): sum of net cash flow + equity gain (principal repaid) + price growth (optional)
// divided by initial cash invested.
export function roi5Years(params: {
  annualNetCash: number;  // after op costs + mortgage interest/principal
  monthlyPayment: number; // repayment monthly (0 for IO)
  rateAnnual: number;
  termYears: number;
  loan: number;
  price: number;
  growthAnnual?: number;  // optional capital growth rate
  cashInvested: number;
}) {
  const { annualNetCash, monthlyPayment, rateAnnual, termYears, loan, price, growthAnnual = 0, cashInvested } = params;
  if (!cashInvested) return 0;

  // Principal repaid over 5 years (approx): for repayment only.
  let principalRepaid5 = 0;
  if (monthlyPayment > 0) {
    const r = rateAnnual / 12;
    const n = Math.round(termYears * 12);
    const m = Math.min(60, n); // 5 years max
    let bal = loan;
    for (let i = 0; i < m; i++) {
      const interest = bal * r;
      const principal = Math.max(0, monthlyPayment - interest);
      bal = Math.max(0, bal - principal);
      principalRepaid5 += principal;
    }
  }

  // Simple compounded capital growth over 5 years on price
  const priceAfter5 = price * Math.pow(1 + growthAnnual, 5);
  const capitalGain = Math.max(0, priceAfter5 - price);

  const totalNetCash5 = annualNetCash * 5;
  const totalReturn = totalNetCash5 + principalRepaid5 + capitalGain;

  return totalReturn / cashInvested;
}
