import { PROJECTS } from './portfolioData.js';

const SKILL_ALIASES = {
  'Spring Boot': ['Spring Boot'],
  'Spring Security': ['Spring Security'],
  'Spring Data JPA': ['Spring Data JPA', 'JPA'],
  Laravel: ['Laravel'],
  'Node.js': ['Node.js'],
  'API REST': ['API REST', 'Express', 'Spring Boot'],
  JWT: ['JWT'],
  React: ['React'],
  JavaScript: ['JavaScript', 'React', 'Node.js'],
  'HTML / CSS': ['HTML / CSS', 'Bootstrap', 'Blade'],
  Blade: ['Blade'],
  Bootstrap: ['Bootstrap', 'Spring Boot'],
  PostgreSQL: ['PostgreSQL'],
  MySQL: ['MySQL'],
  'Git / GitHub': ['Git'],
  Java: ['Java', 'Spring Boot', 'Android SDK'],
  PHP: ['PHP', 'Laravel'],
  Python: ['Python'],
  'C++': ['C++'],
  'Tesseract OCR': ['Tesseract OCR'],
  'Architecture N-tier': ['Spring Boot'],
  MVC: ['Laravel', 'Spring Boot'],
};

function normalizeToken(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function projectMatchesSkill(project, skill) {
  if (!project || !skill) return false;
  const targets = (SKILL_ALIASES[skill] || [skill]).map(normalizeToken);
  const haystack = [
    ...(project.stack || []),
    project.name,
    project.description,
    project.technicalFocus,
  ].map(normalizeToken);
  return targets.some((target) =>
    haystack.some((entry) => entry === target || entry.includes(target)),
  );
}

export function projectsForSkill(skill, projects = PROJECTS) {
  if (!skill) return [];
  return projects.filter((project) => projectMatchesSkill(project, skill));
}
