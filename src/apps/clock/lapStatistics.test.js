import test from 'node:test';
import assert from 'node:assert/strict';
import { lapStatistics } from './lapStatistics.js';

test('lap statistics compare individual durations rather than cumulative times', () => {
  assert.deepEqual(lapStatistics([3000, 5000, 9000]), { durations: [3000, 2000, 4000], average: 3000, fastest: 2000, slowest: 4000 });
});
test('empty, single and tied laps are supported without changing the source', () => {
  assert.deepEqual(lapStatistics([]), { durations: [], average: 0, fastest: null, slowest: null });
  assert.equal(lapStatistics([1250]).average, 1250);
  const laps = [1000, 2000];
  const stats = lapStatistics(laps);
  assert.equal(stats.fastest, stats.slowest);
  assert.deepEqual(laps, [1000, 2000]);
});
