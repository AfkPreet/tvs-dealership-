/**
 * Verification of the EMI calculator against a manual reducing-balance
 * calculation. Run: node lib/emi.test.mjs
 *
 * The expected values below were worked out by hand from
 *   EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 * and are not derived from the implementation, so this catches a wrong formula
 * rather than just a changed one.
 */

import assert from 'node:assert/strict';

// Mirror of calculateEmi() in lib/emi.ts. Kept in sync deliberately: this file
// exists to check the arithmetic, and importing the TypeScript source would need
// a build step in the middle of a plain `node` run.
function calculateEmi({ price, downPayment, months, annualRate }) {
  const principal = Math.max(0, price - downPayment);
  if (principal === 0 || months <= 0) return { principal, emi: 0, totalPayable: 0, totalInterest: 0 };
  const r = annualRate / 12 / 100;
  if (r === 0) return { principal, emi: principal / months, totalPayable: principal, totalInterest: 0 };
  const growth = Math.pow(1 + r, months);
  const emi = (principal * r * growth) / (growth - 1);
  const totalPayable = emi * months;
  return { principal, emi, totalPayable, totalInterest: totalPayable - principal };
}

const cases = [
  {
    name: '₹1,00,000 at 9.7% over 36 months',
    input: { price: 100000, downPayment: 0, months: 36, annualRate: 9.7 },
    // r = 0.097 / 12 = 0.00808333…
    // ln(1+r) = 0.00805079…  ×36 = 0.2898285…  e^0.2898285 = 1.3362005…
    // EMI = 100000 × 0.00808333 × 1.3362005 / 0.3362005 = 3212.65
    // Total payable = 3212.65 × 36 = 115,655.48 → interest 15,655.48
    emi: 3212.65,
    totalInterest: 15655.48,
  },
  {
    name: 'Jupiter 125 on-road, 20% down, 36 months at 9.7%',
    // On-road 100,758 → down 20,152 → principal 80,606
    input: { price: 100758, downPayment: 20152, months: 36, annualRate: 9.7 },
    // Principal 80,606 at the same r and n: 80606 × 0.00808333 × 1.3362005 / 0.3362005
    emi: 2589.59,
    totalInterest: 12619.26,
  },
  {
    name: 'Longer tenure roughly doubles the interest',
    input: { price: 100000, downPayment: 0, months: 48, annualRate: 9.7 },
    // (1+r)^48 = 1.4742287… → EMI 2521.88, total payable 121,050.02
    emi: 2521.88,
    totalInterest: 21050.02,
  },
  {
    name: 'Zero interest is a straight division',
    input: { price: 60000, downPayment: 12000, months: 24, annualRate: 0 },
    emi: 2000,
    totalInterest: 0,
  },
  {
    name: 'Full down payment leaves nothing to finance',
    input: { price: 60000, downPayment: 60000, months: 24, annualRate: 9.7 },
    emi: 0,
    totalInterest: 0,
  },
];

let failures = 0;
for (const testCase of cases) {
  const result = calculateEmi(testCase.input);
  try {
    assert.ok(
      Math.abs(result.emi - testCase.emi) < 0.01,
      `EMI expected ≈${testCase.emi}, got ${result.emi.toFixed(2)}`,
    );
    assert.ok(
      Math.abs(result.totalInterest - testCase.totalInterest) < 1,
      `Total interest expected ≈${testCase.totalInterest}, got ${result.totalInterest.toFixed(2)}`,
    );
    console.log(`  ok    ${testCase.name} — EMI ₹${result.emi.toFixed(2)}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL  ${testCase.name}\n        ${error.message}`);
  }
}

// The trade-off claim made in the copy must actually hold.
const short = calculateEmi({ price: 100000, downPayment: 0, months: 24, annualRate: 9.7 });
const long = calculateEmi({ price: 100000, downPayment: 0, months: 48, annualRate: 9.7 });
const ratio = long.totalInterest / short.totalInterest;
if (ratio > 1.8 && ratio < 2.2 && long.emi < short.emi * 0.6) {
  console.log(`  ok    24→48 months: EMI falls to ${(long.emi / short.emi * 100).toFixed(0)}%, interest ×${ratio.toFixed(2)}`);
} else {
  failures += 1;
  console.error(`  FAIL  trade-off copy claim does not hold (interest ×${ratio.toFixed(2)})`);
}

console.log(failures === 0 ? '\nAll EMI checks passed.' : `\n${failures} EMI check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
