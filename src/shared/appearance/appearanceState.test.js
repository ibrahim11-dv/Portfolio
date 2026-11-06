import test from 'node:test';
import assert from 'node:assert/strict';
import { APPEARANCE_KEY, COLOR_WALLPAPERS, DEFAULT_APPEARANCE, readAppearance, resolveTheme, resolveWallpaper } from './appearanceState.js';

const images = { light: '/light.png', dark: '/dark.png', custom: 'blob:personal' };
test('all six solid wallpapers use a background color and no image in either theme', () => {
  for (const theme of ['light', 'dark']) for (const [wallpaper, , color] of COLOR_WALLPAPERS) {
    const result = resolveWallpaper({ ...DEFAULT_APPEARANCE, wallpaper }, theme, images);
    assert.equal(result.image, 'none');
    assert.equal(result.color, color);
    assert.equal(result.solid, true);
  }
});
test('adaptive images follow theme while fixed and personal images stay independent', () => {
  for (const theme of ['light', 'dark']) {
    assert.equal(resolveWallpaper(DEFAULT_APPEARANCE, theme, images).image, `url("/${theme}.png")`);
    assert.equal(resolveWallpaper({ wallpaper: 'ubuntu-light' }, theme, images).image, 'url("/light.png")');
    assert.equal(resolveWallpaper({ wallpaper: 'ubuntu-dark' }, theme, images).image, 'url("/dark.png")');
    assert.equal(resolveWallpaper({ wallpaper: 'custom', fit: 'contain' }, theme, images).size, 'contain');
    assert.equal(resolveWallpaper({ wallpaper: 'custom' }, theme, images).image, 'url("blob:personal")');
    assert.equal(resolveWallpaper({ wallpaper: 'custom' }, theme, { ...images, custom: null }).image, `url("/${theme}.png")`);
  }
});

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
