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

test('main project catalog highlights deployed internship and includes tldr summaries', () => {
  const mainIds = PROJECTS.filter((p) => p.group === 'main').map((p) => p.id);
  assert.deepEqual(mainIds.slice(0, 3), ['parcvision', 'intern-management', 'citadel']);
  assert.equal(PROJECTS.find((p) => p.id === 'youtube-downloader')?.group, 'other');
  for (const project of PROJECTS) {
    assert.ok(project.tldr?.built && project.tldr?.result && Array.isArray(project.tldr?.stack));
  }
});
