import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_FILES, ROOT, displayPath, listDirectory, normalizePath } from './virtualFs.js';

test('normalizes terminal paths from the current directory', () => {
  assert.equal(normalizePath('../Documents/./about.txt', `${ROOT}/Desktop`), `${ROOT}/Documents/about.txt`);
  assert.equal(normalizePath('/'), '/');
  assert.equal(displayPath(ROOT), '~');
  assert.equal(displayPath(`${ROOT}/Documents`), '~/Documents');
});

test('lists files and inferred directories like a file manager', () => {
  const entries = listDirectory(INITIAL_FILES, ROOT);
  assert.deepEqual(entries, [['Desktop', 'dir'], ['Documents', 'dir'], ['README.md', 'file']]);
  assert.deepEqual(listDirectory(INITIAL_FILES, `${ROOT}/Documents`), [['about.txt', 'file'], ['todo.txt', 'file']]);
});
