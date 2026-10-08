import test from 'node:test';
import assert from 'node:assert/strict';
import { findReusableWindow, normalizeReadingState, rememberCollection } from './recruiterJourney.js';

test('reopening CV reuses its minimized window across workspaces', () => {
  const cv = { id: 'cv', appId: 'cv', minimized: true, workspace: 2, zIndex: 10 };
  const windows = [{ id: 'portfolio', appId: 'portfolio', zIndex: 12 }, cv];
  assert.equal(findReusableWindow(windows, 'cv'), cv);
  assert.equal(findReusableWindow(windows, 'cv', undefined, true), null);
  assert.equal(windows[1].minimized, true);
});
test('file-specific windows are preferred over newer unrelated documents', () => {
  const windows = [{ id: 'a', appId: 'cv', filePath: '/a', zIndex: 2 }, { id: 'b', appId: 'cv', filePath: '/b', zIndex: 3 }];
  assert.equal(findReusableWindow(windows, 'cv', '/a').id, 'a');
  assert.equal(findReusableWindow(windows, 'portfolio'), null);
});
test('reading state round-trips position and preferences without accepting invalid values', () => {
  const state = { page: 2, scrollRatio: .65, zoom: 1.5, rotation: 90, sidebar: true, continuous: true, dual: false, night: true };
  assert.deepEqual(normalizeReadingState(state), state);
  assert.deepEqual(normalizeReadingState({ page: -1, scrollRatio: Infinity, zoom: 'wrong', rotation: 45 }).page, 1);
  assert.equal(normalizeReadingState({ scrollRatio: 9 }).scrollRatio, 1);
  assert.equal(normalizeReadingState({ zoom: NaN }).zoom, 'fit-width');
});
test('collection snapshots preserve independent search, filters and return positions', () => {
  const main = { group: 'main', query: 'Spring', category: 'Application métier' };
  const first = rememberCollection({}, main, 412);
  const second = rememberCollection(first, { group: 'other', query: 'réact', category: 'all' }, 95);
  assert.deepEqual(second.main, { ...main, scroll: 412 });
  assert.equal(second.other.scroll, 95);
  assert.equal(first.other, undefined);
});
