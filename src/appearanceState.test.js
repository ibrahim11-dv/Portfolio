import test from 'node:test';
import assert from 'node:assert/strict';
import { APPEARANCE_KEY, DEFAULT_APPEARANCE, readAppearance, resolveTheme } from './appearanceState.js';

function storage(values = {}) { return { getItem: (key) => values[key] ?? null }; }

test('defaults to the system theme and adaptive Ubuntu wallpaper', () => {
  assert.deepEqual(readAppearance(storage()), DEFAULT_APPEARANCE);
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

test('migrates the former dark boolean and validates saved appearance values', () => {
  assert.equal(readAppearance(storage({ 'portfolio.desktop.preferences.v1': JSON.stringify({ dark: true }) })).theme, 'dark');
  const saved = readAppearance(storage({ [APPEARANCE_KEY]: JSON.stringify({ version: 1, theme: 'light', wallpaper: 'invalid', fit: 'wrong' }) }));
  assert.deepEqual(saved, { ...DEFAULT_APPEARANCE, theme: 'light' });
});

test('falls back safely when storage cannot be read', () => {
  assert.deepEqual(readAppearance({ getItem() { throw new Error('blocked'); } }), DEFAULT_APPEARANCE);
});
