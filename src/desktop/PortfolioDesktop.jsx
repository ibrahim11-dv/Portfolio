import { ArrowUpRight, Download, FolderGit2, Mail, Terminal } from 'lucide-react';
import { useState } from 'react';
import './PortfolioDesktop.css';
import { CVAction, PortfolioActions } from './PortfolioActions';

export default function PortfolioDesktop({ profile, onOpen, onOpenCV, onNotify }) {
  const [collapsed, setCollapsed] = useState(false);
  function toggleWelcome(event) {
    const root = event.currentTarget.closest('.portfolio-desktop');
    setCollapsed((value) => !value);
    requestAnimationFrame(() => root?.querySelector('button')?.focus({ preventScroll: true }));
  }
  return (
    <PortfolioActions onOpenCV={onOpenCV} onNotify={onNotify}><div className="portfolio-desktop">
      {collapsed ? <button className="portfolio-desktop__restore" onClick={toggleWelcome}>Accueil du portfolio</button> : <aside className="portfolio-desktop__welcome" aria-label="Point d’entrée du portfolio IbrahimOS">
        <div className="portfolio-desktop__system-line"><Terminal size={14} aria-hidden="true" /><span>IBRAHIMOS / PORTFOLIO</span><i aria-label="Système disponible" /></div>
        <div className="portfolio-desktop__identity">
          <span className="portfolio-desktop__index">01</span>
          <div><h1>{profile.name}</h1><p>{profile.role}</p></div>
        </div>
        <p className="portfolio-desktop__availability">{profile.availability}</p>
        <p className="portfolio-desktop__location">{profile.location}</p>
        <p className="portfolio-desktop__focus">Spring Boot · Laravel · React<br />Architecture applicative · Interfaces métier</p>
        <div className="portfolio-desktop__actions">
          <button type="button" className="is-primary" onClick={() => onOpen('portfolio', { section: 'projects' })}><FolderGit2 size={16} />Voir les projets sélectionnés</button>
          <CVAction>Lire le CV</CVAction>
          <button type="button" onClick={() => onOpen('portfolio', { section: 'profile' })}>Ouvrir le portfolio <ArrowUpRight size={15} /></button>
        </div>
        <div className="portfolio-desktop__links">
          {profile.cvUrl && <CVAction download><Download size={14} />Télécharger le CV</CVAction>}
          {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" title="Ouvrir GitHub dans un nouvel onglet">GitHub <ArrowUpRight size={13} /></a>}
          {profile.email && <a href={`mailto:${profile.email}`}><Mail size={14} />Contact</a>}
        </div>
        <button className="portfolio-desktop__explore" onClick={toggleWelcome}>Afficher le bureau</button>
      </aside>}
    </div></PortfolioActions>
  );
}
