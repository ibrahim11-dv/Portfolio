import test from 'node:test';
import assert from 'node:assert/strict';
import { desktopVisibilityAction } from './desktopVisibility.js';

test('show desktop hides only visible windows in the current workspace', () => {
  const windows = [{ id: 'a', workspace: 0 }, { id: 'b', workspace: 0, minimized: true }, { id: 'c', workspace: 1 }];
  assert.deepEqual(desktopVisibilityAction(windows, 0), { type: 'hide', ids: ['a'] });
  assert.deepEqual(desktopVisibilityAction(windows, 2), { type: 'hide', ids: [] });
});

test('restore ignores windows closed, moved or already restored', () => {
  const windows = [{ id: 'a', workspace: 0, minimized: true }, { id: 'b', workspace: 1, minimized: true }, { id: 'c', workspace: 0 }];
  assert.deepEqual(desktopVisibilityAction(windows, 0, ['a', 'b', 'c', 'closed']), { type: 'restore', ids: ['a'] });
  assert.deepEqual(desktopVisibilityAction(windows, 0, ['b', 'c']), { type: 'hide', ids: ['c'] });
});
