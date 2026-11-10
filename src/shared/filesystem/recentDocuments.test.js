import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberDocument, availableRecentDocuments } from './recentDocuments.js';

test('recent documents move to the front without duplicates and stay bounded', () => {
  const recent = Array.from({ length: 20 }, (_, i) => `/file-${i}`);
  assert.deepEqual(rememberDocument(['/a', '/b'], '/b'), ['/b', '/a']);
  assert.equal(rememberDocument(recent, '/new').length, 20);
  assert.equal(recent[0], '/file-0');
});

test('removed files and folders are absent from recent documents', () => {
  assert.deepEqual(availableRecentDocuments(['/gone', '/file', '/dir'], { '/file': '', '/dir': null }), ['/file']);
});
