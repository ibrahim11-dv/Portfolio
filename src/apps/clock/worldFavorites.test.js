import test from 'node:test';
import assert from 'node:assert/strict';
import { clockReducer, INITIAL_CLOCK, findWorldCities } from './clockState.js';

test('favorite cities toggle without duplicates or changing timers', () => {
  const added = clockReducer(INITIAL_CLOCK, { type: 'toggle-city-favorite', id: 'tokyo' });
  assert.deepEqual(added.favoriteCities, ['tokyo']);
  assert.equal(added.timer, INITIAL_CLOCK.timer);
  assert.deepEqual(clockReducer(added, { type: 'toggle-city-favorite', id: 'tokyo' }).favoriteCities, []);
  assert.equal(clockReducer(added, { type: 'toggle-city-favorite', id: 'unknown' }), added);
});
test('world search ignores accents and keeps favorites first within results', () => {
  assert.equal(findWorldCities('  MONTREAL ')[0].id, 'montreal');
  assert.equal(findWorldCities('', ['tokyo'])[0].id, 'tokyo');
  assert.equal(findWorldCities('France', ['tokyo'])[0].id, 'perpignan');
  assert.deepEqual(findWorldCities('not-a-city'), []);
});
