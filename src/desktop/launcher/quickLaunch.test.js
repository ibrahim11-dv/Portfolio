import test from 'node:test';
import assert from 'node:assert/strict';
import { quickLaunchResults } from './quickLaunch.js';
import { findReusableWindow } from '../../shared/sessionState.js';
import { ROOT } from '../../shared/filesystem/virtualFs.js';

test('file search finds accented names and implicit folders, never document contents', () => {
  const files = { [`${ROOT}/Documents/Études/Résumé.txt`]: 'secret-content', [`${ROOT}/Documents/Vide`]: null };
  const options = { files, scope: 'files' };
  assert.equal(quickLaunchResults('resume', [], options)[0].name, 'Résumé.txt');
  assert.equal(quickLaunchResults('secret-content', [], options).length, 0);
  assert.equal(quickLaunchResults('vide', [], options)[0].directory, true);
  assert.ok(quickLaunchResults('etudes', [], options).some((item) => item.directory && item.name === 'Études'));
  assert.equal(quickLaunchResults('resume', [], { files })[0].path, `${ROOT}/Documents/Études/Résumé.txt`);
});

test('recent scope preserves recency and hides files removed from the filesystem', () => {
  const first = `${ROOT}/Documents/Z.txt`, second = `${ROOT}/Documents/A.txt`;
  const files = { [first]: '', [second]: '' };
  assert.deepEqual(quickLaunchResults('', [], { files, recent: [first, '/gone', second], scope: 'recent' }).map((item) => item.path), [first, second]);
});

test('actions and application scopes remain separate', () => {
  const commands = [{ command: 'desktop', name: 'Afficher le bureau' }];
  assert.equal(quickLaunchResults('bureau', [], { commands, scope: 'actions' })[0].command, 'desktop');
  assert.ok(quickLaunchResults('', [], { commands, scope: 'apps' }).every((item) => item.appId));
});

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
