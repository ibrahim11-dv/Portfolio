import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./variables.css', import.meta.url), 'utf8');
function tokens(block) {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map((m) => [m[1], m[2]]));
}
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((c) => parseInt(c, 16) / 255)
    .map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
test('shared light and dark palettes preserve AA text contrast', () => {
  const light = tokens(css.split('html[data-desktop-theme="dark"]')[0]);
  const dark = { ...light, ...tokens(css.split('html[data-desktop-theme="dark"]')[1]) };
  for (const [name, palette] of [['light', light], ['dark', dark]]) {
    for (const [foreground, background] of [
      ['--app-ink', '--app-surface'], ['--app-muted', '--app-surface'],
      ['--app-muted', '--app-panel'], ['--app-accent', '--app-surface'],
      ['--brand-on-action', '--brand-action'], ['--brand-shell-muted', '--brand-shell-panel'],
    ]) {
      const values = [luminance(palette[foreground]), luminance(palette[background])].sort((a, b) => b - a);
      assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${name}: ${foreground} on ${background}`);
    }
  }
});
