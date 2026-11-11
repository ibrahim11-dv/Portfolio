import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from './calculator.js';

test('calculator respects precedence, parentheses, signs and decimal comma', () => {
  assert.equal(calculate('2 + 3 × 4'), '14');
  assert.equal(calculate('(2 + 3) × 4'), '20');
  assert.equal(calculate('-2 × -(3 + 1)'), '8');
  assert.equal(calculate('0,1 + 0,2'), '0.3');
  assert.equal(calculate('12 / 3 / 2'), '2');
  assert.equal(calculate('1e-7 * 10'), '0.000001');
});

test('percentage means one hundredth and supports explicit markup calculations', () => {
  assert.equal(calculate('10%'), '0.1');
  assert.equal(calculate('250 × 20%'), '50');
  assert.equal(calculate('250 × (1 + 20%)'), '300');
});

test('invalid, oversized and executable inputs fail safely', () => {
  for (const input of ['', '1/0', '0/0', '1e309', '2+', '(2+3', '2(3)', '1..2', 'Math.random()', 'alert(1)', '1'.repeat(201)]) assert.throws(() => calculate(input), Error, input);
});
