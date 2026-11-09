import test from 'node:test';
import assert from 'node:assert/strict';
import { quickLaunchResults } from './quickLaunch.js';
import { findReusableWindow } from '../../shared/sessionState.js';

test('quick launch handles accents and multiple search words', () => {
  assert.equal(quickLaunchResults('editeur texte', [])[0].appId, 'editor');
  assert.equal(quickLaunchResults('inexistant', []).length, 0);
});

test('quick launch distinguishes instances and finds minimized windows on other workspaces', () => {
  const windows = [
    { id: 'editor', appId: 'editor', filePath: '/Documents/notes.txt', zIndex: 2, workspace: 0 },
    { id: 'editor-2', appId: 'editor', filePath: '/Documents/lettre.txt', zIndex: 8, workspace: 2, minimized: true },
  ];
  const results = quickLaunchResults('editeur bureau 3', windows);
  assert.equal(results.length, 1);
  assert.equal(results[0].windowId, 'editor-2');
  assert.match(results[0].detail, /Réduite/);
  assert.equal(quickLaunchResults('', windows)[0].windowId, 'editor-2');
  assert.equal(quickLaunchResults('notes', windows)[0].windowId, 'editor');
  assert.equal(windows[0].id, 'editor');
});

test('window manager is reusable through the standard app launch path', () => {
  const results = quickLaunchResults('gestionnaire', []);
  assert.equal(results[0].appId, 'windows');
  const existing = { id: 'windows', appId: 'windows', minimized: true, workspace: 2 };
  assert.equal(findReusableWindow([existing], results[0].appId), existing);
});
