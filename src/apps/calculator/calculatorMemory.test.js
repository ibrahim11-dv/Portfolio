import test from 'node:test';
import assert from 'node:assert/strict';
import { updateMemory } from './calculatorMemory.js';

test('memory accumulates evaluated expressions, decimals and negative values', () => {
  assert.equal(updateMemory(null, '2 * 3'), '6');
  assert.equal(updateMemory('6', '10', true), '-4');
  assert.equal(updateMemory('0.1', '0,2'), '0.3');
  assert.equal(updateMemory('0', '-2', true), '2');
});
test('invalid calculations cannot produce a new memory value', () => {
  assert.throws(() => updateMemory('42', '1/0'));
  assert.throws(() => updateMemory('42', 'hello'));
  assert.equal(updateMemory('42', '0'), '42');
});
