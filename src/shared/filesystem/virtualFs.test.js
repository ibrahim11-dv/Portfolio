import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_FILES, ROOT, canDeletePath, canModifyPath, displayPath, listDirectory, normalizePath, readTrash, removePath, renamePath, restoreFromTrash, trashPaths, writeFiles } from './virtualFs.js';

test('normalizes terminal paths from the current directory', () => {
  assert.equal(normalizePath('../Documents/./about.txt', `${ROOT}/Desktop`), `${ROOT}/Documents/about.txt`);
  assert.equal(normalizePath('/'), '/');
  assert.equal(displayPath(ROOT), '~');
  assert.equal(displayPath(`${ROOT}/Documents`), '~/Documents');
});

test('lists files and inferred directories like a file manager', () => {
  const entries = listDirectory(INITIAL_FILES, ROOT);
  assert.deepEqual(entries, [['Desktop', 'dir'], ['Documents', 'dir'], ['Downloads', 'dir'], ['Music', 'dir'], ['Pictures', 'dir'], ['Projets', 'dir'], ['Videos', 'dir']]);
  assert.ok(listDirectory(INITIAL_FILES, `${ROOT}/Documents`).some(([name, type]) => name === 'CV.pdf' && type === 'file'));
  assert.ok(listDirectory(INITIAL_FILES, `${ROOT}/Projets`).some(([name, type]) => name === 'ParcVision' && type === 'dir'));
});

test('all portfolio originals and their ancestors resist deletion and renaming', () => {
  const paths = new Set(['/', '/home', ROOT, ...Object.keys(INITIAL_FILES)]);
  Object.keys(INITIAL_FILES).forEach((path) => {
    const parts = path.split('/').filter(Boolean);
    parts.forEach((_, index) => paths.add(`/${parts.slice(0, index + 1).join('/')}`));
  });
  for (const path of paths) {
    assert.equal(canDeletePath(INITIAL_FILES, path), false, path);
    assert.equal(canModifyPath(INITIAL_FILES, path), false, path);
    assert.equal(removePath(INITIAL_FILES, path), INITIAL_FILES, path);
    assert.equal(renamePath(INITIAL_FILES, path, 'Renamed'), INITIAL_FILES, path);
  }
  assert.equal(trashPaths(INITIAL_FILES, [...paths]), INITIAL_FILES);
});

test('persistence restores protected content while saving visitor content', () => {
  const original = Object.keys(INITIAL_FILES).find((path) => typeof INITIAL_FILES[path] === 'string');
  const visitor = `${ROOT}/Desktop/Visitor.txt`;
  const next = writeFiles({ ...INITIAL_FILES, [original]: 'overwritten', [visitor]: 'mine' });
  assert.equal(next[original], INITIAL_FILES[original]);
  assert.equal(next[visitor], 'mine');
  const omitted = writeFiles({ [visitor]: 'still mine' });
  assert.equal(omitted[original], INITIAL_FILES[original]);
});

test('visitor folders can be trashed and restored without removing originals', () => {
  const folder = `${ROOT}/Desktop/Visitor folder`;
  const note = `${folder}/Note.txt`;
  const files = { ...INITIAL_FILES, [folder]: null, [note]: 'visitor' };
  const next = trashPaths(files, [folder, `${ROOT}/Documents`]);
  assert.equal(Object.hasOwn(next, note), false);
  assert.equal(next[`${ROOT}/Documents/CV.pdf`], INITIAL_FILES[`${ROOT}/Documents/CV.pdf`]);
  assert.equal(readTrash()[folder].files[note], 'visitor');
  const restored = restoreFromTrash(next, folder);
  assert.equal(restored[note], 'visitor');
  assert.equal(Object.hasOwn(readTrash(), folder), false);
});

test('renaming a visitor directory updates its children and rejects collisions', () => {
  const folder = `${ROOT}/Desktop/Visitor folder`;
  const files = { ...INITIAL_FILES, [folder]: null, [`${folder}/Note.txt`]: 'visitor' };
  const next = renamePath(files, folder, 'New name');
  assert.equal(next[`${ROOT}/Desktop/New name/Note.txt`], 'visitor');
  assert.equal(Object.hasOwn(next, folder), false);
  assert.equal(renamePath(files, folder, 'Bienvenue.txt'), files);
});
