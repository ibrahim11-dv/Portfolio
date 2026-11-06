import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeletePath, DIRECTORY_MARKER, INITIAL_FILES, ROOT, transferPaths } from './virtualFs.js';
import { endFileDrag, MIME_FILES, readFileDrag, writeFileDrag } from './dragDrop.js';

const source = `${ROOT}/Downloads/Visitor`;
const destination = `${ROOT}/Documents`;
const protectedDocument = Object.keys(INITIAL_FILES).find((path) => path.startsWith(`${ROOT}/Documents/`) && INITIAL_FILES[path] !== DIRECTORY_MARKER);
const visitorFiles = () => ({ ...INITIAL_FILES, [source]: DIRECTORY_MARKER, [`${source}/Notes.txt`]: 'visitor text', [`${source}/Nested/More.txt`]: 'more' });

test('moves a visitor folder recursively without changing its contents', () => {
  const files = visitorFiles();
  const result = transferPaths(files, [source], destination);
  assert.equal(result.changed, true);
  assert.deepEqual(result.paths, [`${destination}/Visitor`]);
  assert.equal(result.files[`${destination}/Visitor/Notes.txt`], 'visitor text');
  assert.equal(result.files[`${destination}/Visitor/Nested/More.txt`], 'more');
  assert.equal(Object.hasOwn(result.files, source), false);
  assert.equal(files[`${source}/Notes.txt`], 'visitor text');
});

test('copies protected documents even when move is requested', () => {
  const result = transferPaths(INITIAL_FILES, [protectedDocument], `${ROOT}/Downloads`, { copy: false });
  assert.equal(result.changed, true);
  assert.equal(result.files[protectedDocument], INITIAL_FILES[protectedDocument]);
  assert.equal(result.files[result.paths[0]], INITIAL_FILES[protectedDocument]);
  assert.equal(canDeletePath(result.files, protectedDocument), false);
  assert.equal(canDeletePath(result.files, result.paths[0]), true);
});

test('mixed selections move visitor files and copy protected originals', () => {
  const files = visitorFiles();
  const result = transferPaths(files, [protectedDocument, `${source}/Notes.txt`], `${ROOT}/Pictures`);
  assert.equal(result.paths.length, 2);
  assert.equal(result.files[protectedDocument], files[protectedDocument]);
  assert.equal(Object.hasOwn(result.files, `${source}/Notes.txt`), false);
  assert.equal(result.files[`${ROOT}/Pictures/Notes.txt`], 'visitor text');
});

test('name collisions receive new names without overwriting existing trees', () => {
  const files = { ...visitorFiles(), [`${destination}/Visitor/Existing.txt`]: 'keep' };
  const result = transferPaths(files, [source], destination, { copy: true });
  assert.deepEqual(result.paths, [`${destination}/Visitor 2`]);
  assert.equal(result.files[`${destination}/Visitor/Existing.txt`], 'keep');
  assert.equal(result.files[`${destination}/Visitor 2/Notes.txt`], 'visitor text');
  assert.equal(result.files[`${source}/Notes.txt`], 'visitor text');
});

test('rejects copying or moving a folder into itself and descendants', () => {
  const files = visitorFiles();
  for (const target of [source, `${source}/Nested`]) {
    const result = transferPaths(files, [source], target, { copy: true });
    assert.equal(result.changed, false);
    assert.equal(result.files, files);
    assert.match(result.message, /lui-même/);
  }
});

test('nested multi-selection transfers the parent once', () => {
  const result = transferPaths(visitorFiles(), [source, `${source}/Notes.txt`, source], destination);
  assert.equal(result.paths.length, 1);
  assert.equal(result.files[`${destination}/Visitor/Notes.txt`], 'visitor text');
});

test('move to the current folder is a no-op, while explicit copy duplicates it', () => {
  const files = visitorFiles();
  const result = transferPaths(files, [`${source}/Notes.txt`], source);
  assert.equal(result.changed, false);
  const copy = transferPaths(files, [`${source}/Notes.txt`], source, { copy: true });
  assert.deepEqual(copy.paths, [`${source}/Notes 2.txt`]);
  assert.equal(copy.files[`${source}/Notes.txt`], 'visitor text');
});

test('missing targets and missing sources do not create orphan paths', () => {
  const files = visitorFiles();
  assert.equal(transferPaths(files, [source], `${ROOT}/Missing`).changed, false);
  assert.equal(transferPaths(files, [`${ROOT}/Missing`], destination).changed, false);
});

test('multi-source file name collisions are resolved within one transaction', () => {
  const files = { ...visitorFiles(), [`${ROOT}/Downloads/Notes.txt`]: 'other text' };
  const result = transferPaths(files, [`${source}/Notes.txt`, `${ROOT}/Downloads/Notes.txt`], destination);
  assert.deepEqual(result.paths, [`${destination}/Notes.txt`, `${destination}/Notes 2.txt`]);
  assert.equal(result.files[`${destination}/Notes.txt`], 'visitor text');
  assert.equal(result.files[`${destination}/Notes 2.txt`], 'other text');
});

test('drag payload supports restricted dragover data and clears at drag end', () => {
  const data = new Map();
  const transfer = { types: [MIME_FILES], setData: (type, value) => data.set(type, value), getData: (type) => data.get(type) || '' };
  writeFileDrag(transfer, [source, source, `${ROOT}/Missing`], visitorFiles());
  assert.deepEqual(readFileDrag(transfer), [source]);
  assert.deepEqual(readFileDrag({ ...transfer, getData: () => '' }), [source]);
  endFileDrag();
  assert.deepEqual(readFileDrag({ ...transfer, getData: () => '' }), []);
  assert.deepEqual(readFileDrag({ types: ['text/plain'], getData: () => '/etc/passwd' }), []);
});
