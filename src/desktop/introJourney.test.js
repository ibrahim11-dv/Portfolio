import test from 'node:test';
import assert from 'node:assert/strict';
import { INTRODUCTION_STORAGE_KEY, INTRODUCTION_VERSION, completeIntroduction, guideStepAfter, hasStoredIntroduction, initialIntroductionPhase } from './introJourney.js';

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

test('guided visit navigation stays within the three steps', () => {
  assert.equal(guideStepAfter(0, -1), 0);
  assert.equal(guideStepAfter(1, 1), 2);
  assert.equal(guideStepAfter(2, 1), 2);
});
