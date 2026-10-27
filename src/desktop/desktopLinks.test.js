import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE } from './portfolioData.js';
import { socialDesktopShortcuts } from './desktopLinks.js';

test('social desktop shortcuts use the professional URLs and prefill Gmail', () => {
  const shortcuts = socialDesktopShortcuts(PROFILE);
  assert.deepEqual(shortcuts.map(({ id, name }) => ({ id, name })), [
    { id: '@github', name: 'GitHub' },
    { id: '@linkedin', name: 'LinkedIn' },
    { id: '@gmail', name: 'Gmail' },
  ]);
  assert.equal(shortcuts[0].external, PROFILE.github);
  assert.equal(shortcuts[1].external, PROFILE.linkedin);
  assert.equal(shortcuts[2].external, `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(PROFILE.email)}`);
  assert.ok(shortcuts.every((shortcut) => shortcut.protected));
});
