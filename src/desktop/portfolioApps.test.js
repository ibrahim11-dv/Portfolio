import test from 'node:test';
import assert from 'node:assert/strict';
import { DESKTOP_APPS, DOCK_APPS, PORTFOLIO_APP_IDS, migrateFavorites, resolveAppId, readAppShortcut } from './apps.js';
import { findReusableWindow } from './recruiterJourney.js';

test('legacy portfolio destinations resolve to the independent applications', () => {
  for (const section of ['profile', 'projects', 'skills', 'journey', 'contact']) {
    assert.equal(resolveAppId('portfolio', section), section === 'profile' ? 'presentation' : section);
  }
  assert.equal(resolveAppId('portfolio'), 'presentation');
  assert.equal(readAppShortcut(JSON.stringify({ type: 'ubuntu-app-shortcut', version: 1, appId: 'portfolio' })).id, 'presentation');
});
test('default dock migrates while custom ordering and deliberate empty favorites survive', () => {
  assert.deepEqual(migrateFavorites(['portfolio', 'files', 'terminal', 'editor']), DOCK_APPS);
  assert.deepEqual(migrateFavorites(['terminal', 'portfolio', 'presentation', 'editor']), ['terminal', 'presentation', 'editor']);
  assert.deepEqual(migrateFavorites([]), []);
  assert.deepEqual(migrateFavorites(null), DOCK_APPS);
});
test('separate applications have distinct identities and reuse their own windows across workspaces', () => {
  const apps = DESKTOP_APPS.filter((app) => PORTFOLIO_APP_IDS.includes(app.id));
  assert.equal(apps.length, 5);
  assert.equal(new Set(apps.map((app) => app.icon)).size, 5);
  const windows = apps.map((app, index) => ({ id: app.id, appId: app.id, workspace: index % 2, minimized: true, zIndex: index }));
  for (const app of apps) assert.equal(findReusableWindow(windows, app.id).id, app.id);
  assert.equal(DESKTOP_APPS.some((app) => app.id === 'portfolio'), false);
});
