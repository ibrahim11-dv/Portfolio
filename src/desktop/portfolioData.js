import { PROJECTS, projectMarkdown } from './projectCatalog.js';
export { PROJECTS };

// Profile: supplied CV. Projects: public GitHub source inspected on 4 October 2026.
export const PROFILE = {
  name: 'Ibrahim Chehlafi',
  portrait: '/portrait.jpg',
  role: 'Développeur Full-Stack',
  location: 'Perpignan, France',
  bio: 'Étudiant en Licence Informatique à l’Université de Perpignan Via Domitia, je conçois des applications web avec Spring Boot, Laravel et React. J’aime construire des solutions utiles, de l’architecture aux interfaces, avec un intérêt particulier pour l’intelligence artificielle.',
  email: 'ibrahim.chehlafi.07@gmail.com',
  github: 'https://github.com/ibrahim11-dv',
  cvUrl: '/cv.pdf',
  cvSize: 243850,
  availability: 'À la recherche d’un stage en développement informatique',
  skills: [
    { category: 'Backend & API', items: ['Spring Boot', 'Spring Security', 'Spring Data JPA', 'Laravel', 'Node.js', 'API REST', 'JWT'] },
    { category: 'Frontend', items: ['React', 'JavaScript', 'HTML / CSS', 'Blade', 'Bootstrap', 'Tailwind CSS'] },
    { category: 'Données & outils', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Git / GitHub'] },
    { category: 'Langages', items: ['Java', 'PHP', 'JavaScript', 'Python', 'C', 'C++'] },
    { category: 'IA & conception', items: ['Scikit-Learn', 'Pandas', 'NumPy', 'Tesseract OCR', 'UML', 'Merise', 'Architecture N-tier', 'MVC', 'Agile'] },
  ],
  education: [
    { title: 'Licence Informatique Générale · L3', school: 'Université de Perpignan Via Domitia', period: '2026 – 2027' },
    { title: 'DUT Génie Informatique · Développement logiciel', school: 'École Supérieure de Technologie d’Oujda · Mention Très Bien, 17,48 / 20', period: '2024 – 2026' },
    { title: 'Baccalauréat Sciences Physiques · Mention Bien', school: 'Lycée Mouad Bno Jabal, Oujda', period: '2024' },
  ],
  experience: [
    { title: 'Stagiaire Développeur Full-Stack', organization: 'ZAI-CONCEPT INFO · Errachidia', period: 'Avril – Juin 2026', description: 'ParcVision : plateforme de gestion de flotte et d’archivage intelligent. Architecture Spring Boot, PostgreSQL, authentification JWT, OCR Tesseract, cartographie Leaflet et tableaux de bord.' },
    { title: 'Projet de fin d’études · PFE-ESTO', organization: 'École Supérieure de Technologie d’Oujda', period: '2025 – 2026', description: 'Portail académique multi-rôles avec Laravel et Eloquent : notes, modules, procès-verbaux, contrôle d’accès RBAC et journal d’audit.' },
    { title: 'Stagiaire Développement Web', organization: 'Préfecture d’Oujda-Angad · DSIC', period: 'Juin 2025', description: 'Système de gestion des stagiaires en PHP / MySQL, avec génération automatique d’attestations PDF.' },
  ],
  certifications: ['freeCodeCamp · Back End Development and APIs', 'freeCodeCamp · Front End Libraries', 'Simplilearn · Git Training'],
  languages: ['Français · DELF B2', 'Anglais · C1', 'Arabe · langue maternelle'],
};

export const HOME = '/home/ibrahim';
export const CV_DOCUMENT = 'Curriculum vitæ d’Ibrahim Chehlafi. Ouvrez ce document pour afficher le PDF original.\n';
export const PORTFOLIO_FILES = {
  [`${HOME}/Downloads`]: null,
  [`${HOME}/Music`]: null,
  [`${HOME}/Pictures`]: null,
  [`${HOME}/Pictures/Portrait.jpg`]: JSON.stringify({ type: 'ubuntu-image', version: 1, src: '/portrait.jpg', mime: 'image/jpeg', size: 36092 }),
  [`${HOME}/Videos`]: null,
  [`${HOME}/Documents/À propos.md`]: `# ${PROFILE.name}\n\n${PROFILE.role}\n${PROFILE.location}\n\n${PROFILE.bio}\n\n${PROFILE.availability}\n\nGitHub : ${PROFILE.github}\nContact : ${PROFILE.email}\n`,
  [`${HOME}/Documents/Compétences.md`]: `# Compétences\n\n${PROFILE.skills.map((group) => `## ${group.category}\n${group.items.join(' · ')}`).join('\n\n')}\n`,
  [`${HOME}/Documents/Parcours.md`]: `# Parcours\n\n${PROFILE.experience.map((item) => `## ${item.title}\n${item.organization} · ${item.period}\n\n${item.description}`).join('\n\n')}\n\n# Formation\n\n${PROFILE.education.map((item) => `${item.title}\n${item.school} · ${item.period}`).join('\n\n')}\n`,
  [`${HOME}/Documents/CV.pdf`]: CV_DOCUMENT,
  [`${HOME}/Desktop/Bienvenue.txt`]: 'Bienvenue sur le bureau d’Ibrahim Chehlafi.\n\nOuvrez Portfolio pour découvrir mon parcours, ou le dossier Projets pour lire mes réalisations.\n\nDans le terminal : whoami, projects, skills, contact, cv.\n',
  ...Object.fromEntries(PROJECTS.map((project) => [`${HOME}/Projets/${project.name}/README.md`, projectMarkdown(project)])),
};
