/**
 * Standard reducing-balance EMI.
 *
 *   EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
 *
 * where P is the principal, r the monthly rate (annual ÷ 12 ÷ 100) and n the
 * number of monthly instalments. This is the same formula every bank and NBFC in
 * India uses; the only reason two calculators disagree is rounding.
 *
 * Verified by hand against a worked example:
 *   P = 1,00,000, annual rate 9.7%, n = 36
 *   r = 0.097 / 12 = 0.00808333…
 *   (1 + r)^36 = 1.336048…
 *   EMI = 100000 × 0.00808333 × 1.336048 / 0.336048 = 3213.79…  → ₹3,214
 *   Total payable = 3213.79 × 36 = 1,15,696.5  → total interest ≈ ₹15,697
 * See lib/emi.test.mjs for the executable version of this check.
 */

export type EmiInput = {
  /** On-road price in ₹. */
  price: number;
  /** Down payment in ₹. */
  downPayment: number;
  /** Tenure in months. */
  months: number;
  /** Annual interest rate, as a percentage (e.g. 9.7). */
  annualRate: number;
};

export type EmiResult = {
  principal: number;
  /** Unrounded monthly instalment — round only at the display edge. */
  emi: number;
  totalPayable: number;
  totalInterest: number;
};

export function calculateEmi({ price, downPayment, months, annualRate }: EmiInput): EmiResult {
  const principal = Math.max(0, price - downPayment);

  if (principal === 0 || months <= 0) {
    return { principal, emi: 0, totalPayable: 0, totalInterest: 0 };
  }

  const r = annualRate / 12 / 100;

  // A zero-interest loan is a straight division; the general formula divides by 0.
  if (r === 0) {
    const emi = principal / months;
    return { principal, emi, totalPayable: principal, totalInterest: 0 };
  }

  const growth = Math.pow(1 + r, months);
  const emi = (principal * r * growth) / (growth - 1);
  const totalPayable = emi * months;

  return {
    principal,
    emi,
    totalPayable,
    totalInterest: totalPayable - principal,
  };
}

/** Defaults used for the homepage teaser and the model-page EMI strip. */
export const EMI_DEFAULTS = {
  annualRate: 9.7,
  months: 36,
  downPaymentRatio: 0.2,
  tenureOptions: [12, 24, 36, 48],
  rateMin: 7,
  rateMax: 18,
};

/** Indicative monthly figure for a vehicle, on the shared default assumptions. */
export function indicativeEmi(onRoadTotal: number): number {
  return calculateEmi({
    price: onRoadTotal,
    downPayment: Math.round(onRoadTotal * EMI_DEFAULTS.downPaymentRatio),
    months: EMI_DEFAULTS.months,
    annualRate: EMI_DEFAULTS.annualRate,
  }).emi;
}
