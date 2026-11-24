import test from 'node:test';
import assert from 'node:assert/strict';
import { recordCalculation, formatCalculationHistory } from './calculatorSession.js';

test('a launcher calculation preserves memory and does not mutate its session', () => {
  const session = { memory: '-4', expression: '8', history: [{ expression: '4+4', result: '8' }] };
  const next = recordCalculation(session, '2*3', '6');
  assert.equal(next.memory, '-4');
  assert.equal(next.expression, '6');
  assert.deepEqual(next.history, [{ expression: '2*3', result: '6' }, ...session.history]);
  assert.equal(session.history.length, 1);
  assert.equal(session.expression, '8');
});
test('calculation history is bounded and a first launch needs no session', () => {
  assert.deepEqual(recordCalculation(undefined, '1+1', '2'), { expression: '2', history: [{ expression: '1+1', result: '2' }] });
  const next = recordCalculation({ memory: '0', history: Array.from({length: 20}, (_, i) => ({ expression: String(i), result: String(i) })) }, '9+9', '18');
  assert.equal(next.history.length, 20);
  assert.equal(next.memory, '0');
  assert.equal(next.history.at(-1).result, '18');
});

test('text export orders calculations chronologically without changing history', () => {
  const history = [{ expression: '2 × 3', result: '6' }, { expression: '0,1+0,2', result: '0.3' }];
  assert.equal(formatCalculationHistory(history), 'IbrahimOS — Historique de calculs\nDu plus ancien au plus récent\n\n0,1+0,2 = 0.3\n2 × 3 = 6\n');
  assert.equal(history[0].result, '6');
  assert.equal(formatCalculationHistory([]).includes('undefined'), false);
});
