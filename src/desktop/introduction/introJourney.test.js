import test from 'node:test';
import assert from 'node:assert/strict';
import { INTRODUCTION_STEPS, INTRODUCTION_STORAGE_KEY, INTRODUCTION_VERSION, completeIntroduction, guideStepAfter, hasStoredIntroduction, initialIntroductionPhase, transitionIntroduction } from './introJourney.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), values };
}

test('the introduction is stored with a versioned local marker', () => {
  const storage = memoryStorage();
  assert.equal(hasStoredIntroduction(storage), false);
  assert.equal(completeIntroduction(storage), true);
  assert.equal(storage.values.get(INTRODUCTION_STORAGE_KEY), INTRODUCTION_VERSION);
  assert.equal(hasStoredIntroduction(storage), true);
  assert.equal(initialIntroductionPhase(storage), 'done');
});

test('unavailable storage does not prevent the visitor from finishing the introduction', () => {
  const unavailable = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(hasStoredIntroduction(unavailable), false);
  assert.equal(completeIntroduction(unavailable), false);
});

test('a denied localStorage property still allows completing and replaying the visit', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
  try {
    assert.equal(hasStoredIntroduction(), false);
    assert.equal(completeIntroduction(), false);
    assert.equal(initialIntroductionPhase(), 'done');
    assert.deepEqual(transitionIntroduction({ phase: 'done', step: 0 }, 'replay'), { phase: 'boot', step: 0 });
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});

test('a late boot callback cannot reopen an introduction that was skipped', () => {
  const state = transitionIntroduction({ phase: 'boot', step: 0 }, 'skip');
  assert.deepEqual(transitionIntroduction(state, 'boot-complete'), { phase: 'done', step: 0 });
});

test('guided visit navigation stays within the three steps', () => {
  assert.equal(guideStepAfter(0, -1), 0);
  assert.equal(guideStepAfter(1, 1), 2);
  assert.equal(guideStepAfter(2, 1), 2);
});

test('the introduction follows boot, presentation, guide and completion states', () => {
  let state = { phase: 'boot', step: 0 };
  state = transitionIntroduction(state, 'boot-complete');
  assert.deepEqual(state, { phase: 'presentation', step: 0 });
  state = transitionIntroduction(state, 'start-guide');
  assert.deepEqual(state, { phase: 'guide', step: 0 });
  state = transitionIntroduction(state, 'next');
  assert.equal(state.step, 1);
  state = transitionIntroduction(state, 'previous');
  assert.equal(state.step, 0);
  assert.deepEqual(transitionIntroduction(state, 'explore'), { phase: 'done', step: 0 });
});

test('all tour steps keep a visible target and the final action completes the tour', () => {
  assert.equal(INTRODUCTION_STEPS.length, 3);
  assert.ok(INTRODUCTION_STEPS.every((step) => step.selectors.length > 0 && step.title && step.text));
  assert.deepEqual(transitionIntroduction({ phase: 'guide', step: 2 }, 'open-presentation'), { phase: 'done', step: 0 });
});
