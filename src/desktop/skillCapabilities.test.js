import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILL_CAPABILITIES } from './skillCapabilities.js';
import { PROJECTS } from './projectCatalog.js';

test('every capability explains skills and links to existing project evidence', () => {
  assert.equal(SKILL_CAPABILITIES.length, 4);
  assert.equal(new Set(SKILL_CAPABILITIES.map((item) => item.id)).size, 4);
  for (const capability of SKILL_CAPABILITIES) {
    assert.ok(capability.technologies.length > 0);
    assert.ok(capability.practices.length > 0);
    for (const id of capability.projects) {
      const project = PROJECTS.find((item) => item.id === id);
      assert.ok(project?.report?.outcome, `${capability.id}: ${id}`);
    }
  }
});
