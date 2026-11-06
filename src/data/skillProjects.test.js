import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from './portfolioData.js';
import { projectsForSkill } from './skillProjects.js';

test('maps core skills to matching portfolio projects across collections', () => {
  const springProjects = projectsForSkill('Spring Boot', PROJECTS).map((p) => p.id);
  assert.ok(springProjects.includes('parcvision'));
  assert.ok(springProjects.includes('citadel'));

  const phpProjects = projectsForSkill('PHP', PROJECTS).map((p) => p.id);
  assert.ok(phpProjects.includes('intern-management'));
  assert.ok(phpProjects.includes('pfe-esto'));

  assert.deepEqual(projectsForSkill('', PROJECTS), []);
});

test('catalog leads with ParcVision and supplies readable project summaries', () => {
  const mainIds = PROJECTS.filter((p) => p.group === 'main').map((p) => p.id);
  assert.equal(mainIds[0], 'parcvision');
  for (const id of ['intern-management', 'citadel', 'learnxcompile']) assert.ok(mainIds.includes(id));
  assert.ok(PROJECTS.some((p) => p.group === 'other'));
  assert.equal(new Set(PROJECTS.map((p) => p.id)).size, PROJECTS.length);
  for (const project of PROJECTS) {
    assert.ok(project.tagline && project.description && project.report?.outcome, project.id);
    assert.ok(Array.isArray(project.stack) && project.stack.length > 0, project.id);
  }
});
