import { ArrowRight, FileText, FolderGit2, GitBranch, Globe2, Mail, MapPin, Terminal } from 'lucide-react';
import { PROFILE, PROJECTS } from '../../../data/portfolioData';
import { CVAction } from '../PortfolioActions';
import ProfileAvatar from '../components/ProfileAvatar';

export default function ProfileView({ navigate, onSelectProject }) {
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
