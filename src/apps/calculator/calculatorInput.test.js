import test from 'node:test';
import assert from 'node:assert/strict';
import { eraseCalculation } from './calculatorInput.js';

test('erase removes the selection or the character before the caret', () => {
  assert.deepEqual(eraseCalculation('12+34', 2, 2), { expression: '1+34', cursor: 1 });
  assert.deepEqual(eraseCalculation('12+34', 3, 5), { expression: '12+', cursor: 3 });
  assert.deepEqual(eraseCalculation('12+34', 0, 5), { expression: '', cursor: 0 });
});
test('erase at the start leaves text intact and empty calculations remain empty', () => {
  assert.deepEqual(eraseCalculation('12', 0), { expression: '12', cursor: 0 });
  assert.deepEqual(eraseCalculation(''), { expression: '', cursor: 0 });
  assert.deepEqual(eraseCalculation('12'), { expression: '1', cursor: 1 });
});
