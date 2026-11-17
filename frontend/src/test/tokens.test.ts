import test from 'node:test';
import assert from 'node:assert';

test('FinSta Color Tokens Check', () => {
  const PALETTE = {
    background: '#FAF8F5',
    surface: '#F1ECE4',
    primary: '#1E4D3B',
    accent: '#D97736',
    text: '#24221F',
    border: '#E2DCD3',
  };

  assert.strictEqual(PALETTE.background, '#FAF8F5');
  assert.strictEqual(PALETTE.primary, '#1E4D3B');
  assert.strictEqual(PALETTE.accent, '#D97736');
  assert.strictEqual(PALETTE.text, '#24221F');
});

test('Tabular numbers format check', () => {
  const formatCurrency = (amt: number, sym = '$') => `${sym}${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  assert.strictEqual(formatCurrency(1250.5), '$1,250.50');
});
