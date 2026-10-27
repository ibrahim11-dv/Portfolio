import test from 'node:test';
import assert from 'node:assert/strict';
import { applyProjectRequest, projectIdFromSearch, searchWithProject } from './projectRoute.js';

const ids = ['citadel', 'learnxcompile', 'parcvision'];

test('history restores the original collection after multiple reports and a closed window', () => {
  const collection = { projectId: null, scroll: 480, filters: { query: 'java', group: 'main' }, returnTo: { scroll: 0, id: null } };
  const first = applyProjectRequest(collection, 'citadel');
  const next = applyProjectRequest(first, 'learnxcompile');
  const restored = applyProjectRequest(next, null);
  assert.equal(restored.projectId, null);
  assert.equal(restored.scroll, 480);
  assert.equal(restored.returnTo.id, 'citadel');
  assert.equal(restored.filters, collection.filters);
  assert.equal(applyProjectRequest(next, undefined), next);
  assert.equal(applyProjectRequest(next, 'learnxcompile'), next);
});

test('project URLs only resolve known project identifiers', () => {
  assert.equal(projectIdFromSearch('?project=citadel', ids), 'citadel');
  assert.equal(projectIdFromSearch('?theme=dark&project=learnxcompile', ids), 'learnxcompile');
  assert.equal(projectIdFromSearch('?project=unknown', ids), null);
  assert.equal(projectIdFromSearch('', ids), null);
});

test('project URLs preserve unrelated query parameters and remove the report on return', () => {
  assert.equal(searchWithProject('?theme=dark', 'citadel'), '?theme=dark&project=citadel');
  assert.equal(searchWithProject('?theme=dark&project=citadel', null), '?theme=dark');
  assert.equal(searchWithProject('?project=citadel', 'learnxcompile'), '?project=learnxcompile');
});
