import { ArrowUpRight, Download, FolderGit2, Mail, Terminal } from 'lucide-react';
import './PortfolioDesktop.css';

export default function PortfolioDesktop({ profile, onOpen }) {
  return (
    <div className="portfolio-desktop">
      <aside className="portfolio-desktop__welcome" aria-label="Point d’entrée du portfolio IbrahimOS">
        <div className="portfolio-desktop__system-line"><Terminal size={14} aria-hidden="true" /><span>IBRAHIMOS / PORTFOLIO</span><i aria-label="Système disponible" /></div>
        <div className="portfolio-desktop__identity">
          <span className="portfolio-desktop__index">01</span>
          <div><h1>{profile.name}</h1><p>{profile.role}</p></div>
        </div>
        <p className="portfolio-desktop__availability">{profile.availability}</p>
        <p className="portfolio-desktop__focus">Spring Boot · Laravel · React<br />Architecture applicative · Interfaces métier</p>
        <div className="portfolio-desktop__actions">
          <button type="button" className="is-primary" onClick={() => onOpen('portfolio', { section: 'projects' })}><FolderGit2 size={16} />Voir une sélection</button>
          <button type="button" onClick={() => onOpen('portfolio', { section: 'profile' })}>Ouvrir le portfolio <ArrowUpRight size={15} /></button>
        </div>
        <div className="portfolio-desktop__links">
          {profile.cvUrl && <a href={profile.cvUrl} download><Download size={14} />CV</a>}
          {profile.github && <a href={profile.github} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} /></a>}
          {profile.email && <a href={`mailto:${profile.email}`}><Mail size={14} />Contact</a>}
        </div>
      </aside>
    </div>
  );
}
