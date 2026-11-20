import test from 'node:test';
import assert from 'node:assert/strict';
import { addBookmark, BOOKMARKS_KEY, createBookmarkStore, MAX_BOOKMARKS, sanitizeBookmarks } from './folderBookmarks.js';
import { isDirectory, ROOT } from '../../shared/filesystem/virtualFs.js';

test('bookmarks accept only normalized absolute virtual paths and remove duplicates', () => {
  assert.deepEqual(sanitizeBookmarks([null, {}, 'trash', 'https://example.com', 'relative', '/a/../b', '/b', '/', '/bad\u0000']), ['/b', '/']);
  assert.deepEqual(sanitizeBookmarks({ path: '/b' }), []);
  assert.equal(sanitizeBookmarks(Array.from({ length: 30 }, (_, n) => `/folder-${n}`)).length, MAX_BOOKMARKS);
});

test('only existing explicit or implicit directories can be added, without mutating files', () => {
  const files = { [`${ROOT}/Empty`]: null, [`${ROOT}/Projects/readme.md`]: 'protected content' };
  const original = { ...files };
  let result = addBookmark([], `${ROOT}/Empty`, files);
  assert.deepEqual(result.paths, [`${ROOT}/Empty`]);
  result = addBookmark(result.paths, `${ROOT}/Projects`, files);
  assert.equal(result.paths.length, 2);
  assert.deepEqual(addBookmark(result.paths, `${ROOT}/Projects/`, files).paths, result.paths);
  for (const path of [`${ROOT}/Projects/readme.md`, `${ROOT}/Missing`, 'trash']) assert.ok(addBookmark([], path, files).error);
  assert.deepEqual(files, original);
});

test('full lists refuse new entries but allow existing entries', () => {
  const paths = Array.from({ length: MAX_BOOKMARKS }, (_, n) => `/folder-${n}`);
  const files = Object.fromEntries([...paths, '/extra'].map((path) => [path, null]));
  assert.ok(addBookmark(paths, '/extra', files).error);
  assert.equal(addBookmark(paths, paths[0], files).error, undefined);
});

test('bookmarks survive reopening, synchronize external changes and preserve unavailable paths', () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  let notifications = 0;
  const store = createBookmarkStore(() => storage, () => notifications++);
  assert.equal(store.write(['/demo']).persisted, true);
  assert.equal(notifications, 1);
  assert.deepEqual(createBookmarkStore(() => storage).read(), ['/demo']);
  assert.equal(isDirectory({}, '/demo'), false);
  assert.deepEqual(store.read(), ['/demo']);
  assert.equal(isDirectory({ '/demo': null }, '/demo'), true);
  storage.setItem(BOOKMARKS_KEY, JSON.stringify(['/external']));
  assert.deepEqual(store.read(), ['/external']);
  data.delete(BOOKMARKS_KEY);
  assert.deepEqual(store.read(), []);
});

test('failed storage writes keep the new session state instead of reviving stale favorites', () => {
  let fail = false;
  let raw = JSON.stringify(['/old']);
  const store = createBookmarkStore(() => ({ getItem: () => raw, setItem: (_, value) => { if (fail) throw new Error('quota'); raw = value; } }));
  assert.deepEqual(store.read(), ['/old']);
  fail = true;
  assert.equal(store.write(['/new']).persisted, false);
  assert.deepEqual(store.read(), ['/new']);
  store.write([]);
  assert.deepEqual(store.read(), []);
  fail = false;
  assert.equal(store.write(['/recovered']).persisted, true);
  assert.deepEqual(store.read(), ['/recovered']);
  const blocked = createBookmarkStore(() => { throw new Error('denied'); });
  assert.deepEqual(blocked.read(), []);
  blocked.write(['/session']);
  assert.deepEqual(blocked.read(), ['/session']);
});
