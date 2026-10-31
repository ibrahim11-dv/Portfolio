import { useState } from 'react';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Copy, FileText, FolderGit2, GitBranch, Globe2, GraduationCap, Mail, MapPin, Search, Terminal } from 'lucide-react';
import { PROFILE, PROJECTS } from './portfolioData';
import { ProjectArtwork } from './ProjectReport';
import { CVAction } from './PortfolioActions';
import { SKILL_CAPABILITIES } from './skillCapabilities';
import Certificates from './Certificates';
import { gmailComposeUrl } from './desktopLinks';

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

export function SkillsView({ onSelectProject }) {
  return <>
    <SectionHeading eyebrow="COMPÉTENCES / 03" title="Mes compétences techniques." description="Les outils que j’utilise et ce que je sais faire avec, du développement des interfaces à la gestion des données et des accès." />
    <div className="skill-capabilities">{SKILL_CAPABILITIES.map((capability, index) => <article className="skill-capability" key={capability.id}>
      <div className="skill-capability__body">
        <span className="portfolio-app__eyebrow">{String(index + 1).padStart(2, '0')} / {capability.domain}</span>
        <h2>{capability.title}</h2>
        <Tags items={capability.technologies} />
        <ul className="skill-capability__practice">{capability.practices.map((practice) => <li key={practice}>{practice}</li>)}</ul>
        <div className="skill-capability__links"><span>Exemples d’utilisation</span>{capability.projects.map((id) => { const project = PROJECTS.find((item) => item.id === id); return <button key={id} onClick={() => onSelectProject(id)} aria-label={`Voir un exemple : ${project.name}`}>{project.name}<ArrowUpRight size={15} aria-hidden="true" /></button>; })}</div>
      </div>
    </article>)}</div>
    <details className="skills-inventory"><summary>Toutes les technologies et méthodes</summary><div className="portfolio-app__skills-list">{PROFILE.skills.map((group, index) => <section className="portfolio-app__skill-group" key={group.category}><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{group.category}</h2><Tags items={group.items} className="is-large" /></div></section>)}</div></details>
    <section className="portfolio-app__languages"><div><Globe2 size={19} /><span>LANGUES</span></div><Tags items={PROFILE.languages} className="is-large" /></section>
  </>;
}

export function JourneyView() {
  return <>
    <SectionHeading eyebrow="PARCOURS / 04" title="Parcours" description="Une trajectoire orientée développement logiciel et applications web." action={<CVAction className="portfolio-app__utility-link"><FileText size={15} />Lire le CV</CVAction>} />
    <section className="portfolio-app__chronicle"><h2><BriefcaseBusiness size={18} />Expériences</h2>{PROFILE.experience.map((item, index) => <article key={`${item.title}-${index}`}><span>{item.period}</span><div><h3>{item.title}</h3><strong>{item.organization}</strong><p>{item.description}</p></div></article>)}</section>
    <section className="portfolio-app__chronicle"><h2><GraduationCap size={18} />Formation</h2>{PROFILE.education.map((item, index) => <article key={`${item.title}-${index}`}><span>{item.period}</span><div><h3>{item.title}</h3><strong>{item.school}</strong></div></article>)}</section>
    <Certificates />
  </>;
}

export function ContactView() {
  const [copyStatus, setCopyStatus] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  async function copyEmail() {
    try { await navigator.clipboard.writeText(PROFILE.email); setCopyFailed(false); setCopyStatus('Adresse e-mail copiée.'); }
    catch { setCopyFailed(true); setCopyStatus('Sélectionnez l’adresse ci-dessous, puis copiez-la manuellement.'); }
  }
  return <div className="contact-page">
    <SectionHeading eyebrow="CONTACT" title="Contactez-moi." description="À la recherche d’un stage en développement informatique. Échangeons sur votre équipe et vos projets." />
    <section className="contact-email" aria-labelledby="contact-email-title">
      <h2 id="contact-email-title"><Mail size={21} aria-hidden="true" />Par e-mail</h2>
      <a className="contact-email__address" href={gmailComposeUrl(PROFILE.email)} target="_blank" rel="noopener noreferrer" title="Écrire dans Gmail · nouvel onglet">{PROFILE.email}</a>
      <div className="contact-email__actions">
        <a className="contact-email__write" href={gmailComposeUrl(PROFILE.email)} target="_blank" rel="noopener noreferrer" aria-label="Écrire un e-mail dans Gmail (nouvel onglet)"><Mail size={18} />Écrire un e-mail<ArrowUpRight size={16} aria-hidden="true" /></a>
        <button onClick={copyEmail}><Copy size={18} />Copier l’adresse</button>
      </div>
      <p className="contact-email__status" role="status">{copyStatus}</p>
      {copyFailed && <label className="contact-email__fallback">Adresse à copier<input readOnly value={PROFILE.email} onFocus={(event) => event.target.select()} /></label>}
    </section>
    <section className="contact-resources" aria-labelledby="contact-resources-title">
      <h2 id="contact-resources-title">Retrouvez-moi aussi ici</h2>
      {PROFILE.linkedin && <a href={PROFILE.linkedin} target="_blank" rel="noreferrer"><Globe2 size={24} aria-hidden="true" /><span><strong>LinkedIn</strong><small>Mon profil professionnel · nouvel onglet</small></span><ArrowUpRight size={20} aria-hidden="true" /></a>}
      {PROFILE.github && <a href={PROFILE.github} target="_blank" rel="noreferrer"><GitBranch size={24} aria-hidden="true" /><span><strong>GitHub</strong><small>Mes dépôts et mon code · nouvel onglet</small></span><ArrowUpRight size={20} aria-hidden="true" /></a>}
      <CVAction><FileText size={24} aria-hidden="true" /><span><strong>Lire mon CV</strong><small>Ouvrir le document dans IbrahimOS</small></span><ArrowRight size={20} aria-hidden="true" /></CVAction>
      <CVAction download className="contact-resources__download"><FileText size={18} />Télécharger le CV en PDF</CVAction>
    </section>
    <footer className="contact-identity"><ProfileAvatar /><div><strong>{PROFILE.name}</strong><span>{PROFILE.role}</span><span><MapPin size={15} aria-hidden="true" />{PROFILE.location}</span></div></footer>
  </div>;
}
