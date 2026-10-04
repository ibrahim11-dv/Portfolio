import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as settle } from 'node:timers/promises';
import { observeBattery } from './battery.js';

test('keeps the 0% fallback when the API is unavailable', async () => {
  let state = { percentage: 0, charging: false };
  const stop = observeBattery({}, (next) => { state = next; });
  await settle();
  assert.deepEqual(state, { percentage: 0, charging: false });
  stop();
});

test('handles browser denial and synchronous API failure', async () => {
  for (const getBattery of [() => Promise.reject(new Error('Denied')), () => { throw new Error('Blocked'); }]) {
    let state;
    const stop = observeBattery({ getBattery }, (next) => { state = next; });
    await settle();
    assert.deepEqual(state, { percentage: 0, charging: false });
    stop();
  }
});

test('reads the device level, tracks updates and removes listeners on cleanup', async () => {
  const battery = Object.assign(new EventTarget(), { level: 0.734, charging: false });
  const states = [];
  const stop = observeBattery({ getBattery: async () => battery }, (state) => states.push(state));
  await settle();
  assert.deepEqual(states.at(-1), { percentage: 73, charging: false });
  battery.level = 0.2;
  battery.dispatchEvent(new Event('levelchange'));
  assert.deepEqual(states.at(-1), { percentage: 20, charging: false });
  battery.charging = true;
  battery.dispatchEvent(new Event('chargingchange'));
  assert.deepEqual(states.at(-1), { percentage: 20, charging: true });
  const count = states.length;
  stop();
  battery.dispatchEvent(new Event('levelchange'));
  assert.equal(states.length, count);
});

test('does not update an unmounted component after a delayed battery response', async () => {
  let resolve;
  const pending = new Promise((done) => { resolve = done; });
  const states = [];
  const stop = observeBattery({ getBattery: () => pending }, (state) => states.push(state));
  await settle();
  stop();
  resolve(Object.assign(new EventTarget(), { level: 0.8, charging: false }));
  await settle();
  assert.deepEqual(states, []);
});

test('uses 0% for an invalid battery level', async () => {
  for (const level of [NaN, Infinity, -1, 2, undefined]) {
    let state;
    const battery = Object.assign(new EventTarget(), { level, charging: true });
    const stop = observeBattery({ getBattery: async () => battery }, (next) => { state = next; });
    await settle();
    assert.deepEqual(state, { percentage: 0, charging: false });
    stop();
  }
});
