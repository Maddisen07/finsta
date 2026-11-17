import test from 'node:test';
import assert from 'node:assert';

test('EMI Formula Verification', () => {
  const P = 100000;
  const annualRate = 6.0;
  const tenureMonths = 120; // 10 years
  const r = (annualRate / 12) / 100;
  const compound = Math.pow(1 + r, tenureMonths);
  const emi = P * r * compound / (compound - 1);

  assert.ok(emi > 1100 && emi < 1120, `Expected EMI around 1110, got ${emi}`);
  assert.strictEqual(Math.round(emi), 1110);
});

test('SIP Compounding Growth Verification', () => {
  const monthly = 500;
  const annualRate = 10.0;
  const years = 10;
  const months = years * 12;
  const i = (annualRate / 12) / 100;

  let totalValue = 0;
  for (let m = 0; m < months; m++) {
    totalValue = (totalValue + monthly) * (1 + i);
  }

  const totalInvested = monthly * months; // 60,000
  assert.strictEqual(totalInvested, 60000);
  assert.ok(totalValue > 100000, `Expected total value > 100,000, got ${totalValue}`);
});

test('50/30/20 Budget Splitter Check', () => {
  const income = 5000;
  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  assert.strictEqual(needs, 2500);
  assert.strictEqual(wants, 1500);
  assert.strictEqual(savings, 1000);
  assert.strictEqual(needs + wants + savings, income);
});

test('Three-Tier Model Format Validation', () => {
  const opinionResponse = `
### My view:
Renting is not dead money; it is buying housing flexibility and capping your monthly risk.

### The counter-argument:
Buying a home builds forced equity through amortization and hedges long-term rent inflation.

### When this view changes:
If you plan to stay anchored in the same home for 7+ years with mortgage costs under 28% of income, buying becomes superior.
`;

  assert.ok(opinionResponse.includes('My view:'));
  assert.ok(opinionResponse.includes('The counter-argument:'));
  assert.ok(opinionResponse.includes('When this view changes:'));
});
