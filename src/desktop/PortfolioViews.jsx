import { useState } from 'react';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, Copy, FileText, FolderGit2, GitBranch, Globe2, GraduationCap, Mail, MapPin, Search, Terminal } from 'lucide-react';
import { PROFILE, PROJECTS } from './portfolioData';
import { ProjectArtwork } from './ProjectReport';
import { CVAction } from './PortfolioActions';

function ProfileAvatar({ className = '' }) {
  const initials = PROFILE.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('');
  return <div className={`portfolio-app__avatar ${className}`} aria-hidden="true">{PROFILE.portrait ? <img src={PROFILE.portrait} alt="" /> : initials}</div>;
}

function Tags({ items = [], className = '' }) {
  return <div className={`portfolio-app__tags ${className}`}>{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

function SectionHeading({ eyebrow, title, description, action }) {
  return <header className="portfolio-app__section-heading">
    <div><span className="portfolio-app__eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action}
  </header>;
}

function ProjectCard({ project, index, onSelect, featured = false }) {
  return <button data-project-id={project.id} className={`portfolio-app__case-file ${featured ? 'is-featured' : ''} ${project.pending ? 'is-pending' : ''}`} onClick={() => onSelect(project.id)}>
    <div className="portfolio-app__case-head"><span>DOSSIER {String(index + 1).padStart(2, '0')}</span><span>{project.status}</span></div>
    <ProjectArtwork project={project} compact />
    <div className="portfolio-app__case-body">
      <div className="portfolio-app__case-title"><h2>{project.name}</h2><ArrowUpRight size={18} /></div>
      <p>{project.tagline}</p>
      <span className="portfolio-app__case-focus">{project.context} · {project.period}</span>
      <Tags items={project.stack.slice(0, 4)} />
      <span className="portfolio-app__case-action">{project.pending ? 'Documentation en cours' : 'Voir le projet'} <ArrowRight size={15} /></span>
    </div>
  </button>;
}

export function ProfileView({ navigate, onSelectProject }) {
  const mainCount = PROJECTS.filter((project) => project.group === 'main' && !project.pending).length;
  const schoolManagementProject = PROJECTS.find((project) => project.id === 'pfe-esto');
  return <>
    <section className="portfolio-app__profile-screen">
      <div className="portfolio-app__profile-index"><span>PROFIL / 01</span><i /><span>DISPONIBLE POUR UN STAGE</span></div>
      <div className="portfolio-app__profile-grid">
        <div className="portfolio-app__profile-copy">
          <p className="portfolio-app__kicker"><Terminal size={14} />ibrahim@ibrahimos:~$ <b>whoami</b><i /></p>
          <h1>Ibrahim<br />Chehlafi</h1>
          <p className="portfolio-app__profile-role">{PROFILE.role}</p>
          <p className="portfolio-app__profile-availability">{PROFILE.availability}</p>
          <p className="portfolio-app__profile-location">{PROFILE.location} · Spring Boot · Laravel · React</p>
          <div className="portfolio-app__profile-actions">
            <button className="is-primary" onClick={() => navigate('projects')}><FolderGit2 size={16} />Voir les projets</button>
            <CVAction><FileText size={16} />Lire le CV</CVAction>
            {PROFILE.github && <a href={PROFILE.github} target="_blank" rel="noreferrer" title="Ouvrir dans un nouvel onglet"><GitBranch size={16} />GitHub</a>}
            {PROFILE.linkedin && <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" title="Ouvrir LinkedIn dans un nouvel onglet"><Globe2 size={16} />LinkedIn</a>}
            <button onClick={() => navigate('contact')}><Mail size={16} />Contact</button>
          </div>
          <p className="portfolio-app__profile-bio">{PROFILE.bio}</p>
          {schoolManagementProject && <button className="portfolio-app__profile-project" onClick={() => onSelectProject(schoolManagementProject.id)}>
            <span>PROJET DE FIN D’ÉTUDES</span>
            <strong>{schoolManagementProject.name}</strong>
            <small>Laravel · MySQL · Portail académique multi-rôles</small>
            <ArrowRight size={17} aria-hidden="true" />
          </button>}
        </div>
        <div className="portfolio-app__profile-portrait-panel"><ProfileAvatar className="portfolio-app__profile-avatar" /><span>IC / 2026</span><i /></div>
      </div>
      <dl className="portfolio-app__profile-readouts">
        <div><dt>LOCALISATION</dt><dd><MapPin size={14} />{PROFILE.location}</dd></div>
        <div><dt>FOCUS</dt><dd>Applications web structurées</dd></div>
        <div><dt>PROJETS</dt><dd>{mainCount} projets documentés</dd></div>
        <div><dt>STACK</dt><dd>Spring Boot · Laravel · React</dd></div>
      </dl>
    </section>
    <section className="portfolio-app__profile-note">
      <span className="portfolio-app__eyebrow">NOTE / 02</span><h2>Construire des outils qui donnent de la clarté aux opérations métier.</h2>
      <p>Je travaille de l’architecture aux interfaces : données, API, sécurité et interactions lisibles. Mes stages et projets académiques m’ont appris à transformer un besoin de terrain en application cohérente.</p>
      <div><span><b>INTÉRÊTS</b>Open source · IA · échecs</span><span><b>HORS ÉCRAN</b>Callisthénie · boxe</span></div>
    </section>
  </>;
}

export function ProjectsView({ onSelectProject, filters, setFilters }) {
  const { query, category, group } = filters;
  const update = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const collection = PROJECTS.filter((project) => project.group === group);
  const categories = [...new Set(collection.map((project) => project.category))];
  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const filtered = collection.filter((project) => (category === 'all' || category === project.category)
    && normalize(`${project.name} ${project.description} ${project.stack.join(' ')} ${project.technicalFocus}`).includes(normalize(query.trim())));
  return <>
    <SectionHeading eyebrow="PROJETS / 02" title="Ce que j’ai construit" description="Explorez les interfaces et les fonctionnalités. Les détails techniques restent à portée de clic." />
    <div className="portfolio-app__collections" aria-label="Collections de projets">
      {[['main', 'Projets principaux'], ['other', 'Autres projets']].map(([id, label]) => <button key={id} aria-pressed={group === id} onClick={() => update({ group: id, category: 'all', query: '' })}><span>{id === 'main' ? 'A' : 'B'}</span>{label}<b>{PROJECTS.filter((project) => project.group === id).length}</b></button>)}
    </div>
    <p className="portfolio-app__collection-intro">Recherche par nom, technologie ou domaine dans les {group === 'main' ? 'projets principaux' : 'autres projets'}.</p>
    {(query || category !== 'all') && <div className="portfolio-app__active-filters"><span>{query && `Recherche : « ${query} »`}{category !== 'all' && ` · Catégorie : ${category}`}</span><button onClick={() => update({ query: '', category: 'all' })}>Effacer les filtres</button></div>}
    <div className="portfolio-app__project-tools"><label className="portfolio-app__search"><Search size={16} /><input type="search" placeholder="Rechercher un projet ou une technologie" value={query} onChange={(event) => update({ query: event.target.value })} aria-label="Rechercher dans cette collection" /></label><span className="portfolio-app__result-count" role="status">{String(filtered.length).padStart(2, '0')} RÉSULTATS</span></div>
    <div className="portfolio-app__filters" aria-label="Catégories de projets"><button className={category === 'all' ? 'is-active' : ''} onClick={() => update({ category: 'all' })} aria-pressed={category === 'all'}>TOUS</button>{categories.map((item) => <button key={item} className={category === item ? 'is-active' : ''} onClick={() => update({ category: item })} aria-pressed={category === item}>{item}</button>)}</div>
    {filtered.length ? <div className="portfolio-app__case-list">{filtered.map((project) => <ProjectCard key={project.id} project={project} index={PROJECTS.indexOf(project)} onSelect={onSelectProject} featured={group === 'main' && ['citadel', 'learnxcompile', 'parcvision'].includes(project.id)} />)}</div> : <div className="portfolio-app__empty"><Search size={31} /><h2>Aucun projet trouvé</h2><p>Aucun résultat pour « {query || category} » dans les {group === 'main' ? 'projets principaux' : 'autres projets'}{category !== 'all' ? `, catégorie ${category}` : ''}. Essayez une autre technologie ou effacez les filtres.</p><button onClick={() => update({ query: '', category: 'all' })}>Réinitialiser</button></div>}
  </>;
}

export function SkillsView() {
  return <>
    <SectionHeading eyebrow="COMPÉTENCES / 03" title="Compétences" description="Technologies et méthodes utilisées à travers les projets, les stages et la formation." />
    <div className="portfolio-app__skills-list">{PROFILE.skills.map((group, index) => <section className="portfolio-app__skill-group" key={group.category}><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{group.category}</h2><Tags items={group.items} className="is-large" /></div></section>)}</div>
    <section className="portfolio-app__languages"><div><Globe2 size={19} /><span>LANGUES</span></div><Tags items={PROFILE.languages} className="is-large" /></section>
  </>;
}

export function JourneyView() {
  return <>
    <SectionHeading eyebrow="PARCOURS / 04" title="Parcours" description="Une trajectoire orientée développement logiciel et applications web." action={<CVAction className="portfolio-app__utility-link"><FileText size={15} />Lire le CV</CVAction>} />
    <section className="portfolio-app__chronicle"><h2><BriefcaseBusiness size={18} />Expériences</h2>{PROFILE.experience.map((item, index) => <article key={`${item.title}-${index}`}><span>{item.period}</span><div><h3>{item.title}</h3><strong>{item.organization}</strong><p>{item.description}</p></div></article>)}</section>
    <section className="portfolio-app__chronicle"><h2><GraduationCap size={18} />Formation</h2>{PROFILE.education.map((item, index) => <article key={`${item.title}-${index}`}><span>{item.period}</span><div><h3>{item.title}</h3><strong>{item.school}</strong></div></article>)}</section>
    <section className="portfolio-app__certifications"><span>CERTIFICATIONS</span>{PROFILE.certifications.map((item) => <p key={item}><Check size={15} />{item}</p>)}</section>
  </>;
}

export function ContactView() {
  const [copyStatus, setCopyStatus] = useState('');
  async function copyEmail() { try { await navigator.clipboard.writeText(PROFILE.email); setCopyStatus('Adresse copiée.'); } catch { setCopyStatus('Copie automatique indisponible. Sélectionnez l’adresse ci-dessous et copiez-la.'); } }
  return <>
    <SectionHeading eyebrow="CONTACT / 05" title="Parlons du prochain projet." description="Disponible pour échanger au sujet d’un stage en développement logiciel." />
    <section className="portfolio-app__contact-sheet"><div className="portfolio-app__contact-signature"><ProfileAvatar /><div><h2>{PROFILE.name}</h2><p>{PROFILE.role}</p><span><MapPin size={14} />{PROFILE.location}</span></div></div><div className="portfolio-app__contact-actions">
      <a href={`mailto:${PROFILE.email}`}><span>EMAIL</span><strong>{PROFILE.email}</strong><ArrowUpRight size={17} /></a>
      {PROFILE.github && <a href={PROFILE.github} target="_blank" rel="noreferrer" title="Ouvrir dans un nouvel onglet"><span>GITHUB</span><strong>ibrahim11-dv</strong><ArrowUpRight size={17} /></a>}
      {PROFILE.linkedin && <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" title="Ouvrir LinkedIn dans un nouvel onglet"><span>LINKEDIN</span><strong>Ibrahim Chehlafi</strong><ArrowUpRight size={17} /></a>}
      <CVAction><span>CV</span><strong>Lire le CV</strong><FileText size={16} /></CVAction>
    </div><div className="portfolio-app__contact-copy"><button onClick={copyEmail}><Copy size={15} />Copier l’adresse</button><span role="status">{copyStatus}</span>{copyStatus.startsWith('Copie automatique') && <input readOnly aria-label="Adresse email à copier" value={PROFILE.email} onFocus={(event) => event.target.select()} />}</div></section>
  </>;
}

