import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  FileText,
  GitBranch,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { PROJECTS } from './portfolioData';
import { PROJECT_MEDIA } from './projectMedia';
import ProjectGallery from './ProjectGallery';
import { CVAction } from './PortfolioActions';
import './ProjectReport.css';
import { PROJECT_PRESENTATION } from './projectPresentation';

export function ProjectArtwork({ project, step = 0, compact = false }) {
  const cover = PROJECT_MEDIA[project.id]?.[0];
  if (compact && cover) return <div className="project-art project-art--capture is-compact" aria-hidden="true"><img src={cover.src} alt="" loading="lazy" decoding="async" /><span>CAPTURE DU PROJET</span></div>;
  const flow = PROJECT_PRESENTATION[project.id]?.flow;
  if (flow) return <div className={`project-art project-flow ${compact ? 'is-compact' : ''}`} aria-label={`Schéma explicatif : ${project.name}`}><span>SCHÉMA EXPLICATIF</span><ol>{flow.map((label, index) => <li key={label} className={index === step ? 'is-current' : ''}><small>0{index + 1}{index === step ? ' · ÉTAPE ACTIVE' : ''}</small><strong>{label}</strong>{index < flow.length - 1 && <ArrowRight size={18} aria-hidden="true" />}</li>)}</ol></div>;
  return <div className={`project-art project-art--pending ${compact ? 'is-compact' : ''}`}><div className="project-art__code"><Code2 size={52} strokeWidth={1} /><span>LearnXcompile</span><small>DOCUMENTATION EN COURS</small></div></div>;
}

function ProjectTour({ project }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const id = useId();
  const steps = project.report.steps;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    function changed() {
      setReducedMotion(query.matches);
      if (query.matches) setPlaying(false);
    }
    function hide() {
      if (document.hidden) setPlaying(false);
    }
    query.addEventListener('change', changed);
    document.addEventListener('visibilitychange', hide);
    return () => {
      query.removeEventListener('change', changed);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) return undefined;
    const timer = setTimeout(() => {
      if (step === steps.length - 1) setPlaying(false);
      else setStep(step + 1);
    }, 5000);
    return () => clearTimeout(timer);
  }, [playing, reducedMotion, step, steps.length]);

  function choose(index) {
    setPlaying(false);
    setStep(index);
  }

  return <section className="project-tour" aria-labelledby={`${id}-title`}>
    <div className="project-tour__heading">
      <div>
        <span className="project-report__eyebrow">PARCOURS ILLUSTRATIF / 02</span>
        <h2 id={`${id}-title`}>Le flux du projet.</h2>
      </div>
      {!reducedMotion && <button className="project-tour__play" onClick={() => {
        if (!playing && step === steps.length - 1) setStep(0);
        setPlaying(!playing);
      }} aria-pressed={playing}>{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Pause' : 'Lire le parcours'}</button>}
    </div>
    <ProjectArtwork project={project} step={step} />
    <p className="project-tour__disclaimer">Illustration de fonctionnement · données d’exemple · aucun service externe appelé</p>
    <div className="project-tour__steps" aria-label="Étapes du parcours">
      {steps.map((item, index) => <button key={item.title} aria-current={index === step ? 'step' : undefined} aria-controls={`${id}-detail`} onClick={() => choose(index)}>
        <span>{index < step ? <Check size={13} /> : `0${index + 1}`}</span>{item.title}
      </button>)}
    </div>
    <div id={`${id}-detail`} className="project-tour__detail" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
      <div key={step} className="project-tour__copy">
        <span>{steps[step].label}</span>
        <h3>{steps[step].title}</h3>
        <p>{steps[step].text}</p>
        <code>{steps[step].output}</code>
      </div>
      <div className="project-tour__controls">
        <button disabled={step === 0} onClick={() => choose(step - 1)} aria-label="Étape précédente"><ArrowLeft size={17} /></button>
        <span>{step + 1} / {steps.length}</span>
        <button onClick={() => choose(step === steps.length - 1 ? 0 : step + 1)} aria-label={step === steps.length - 1 ? 'Recommencer le parcours' : 'Étape suivante'}>{step === steps.length - 1 ? <RotateCcw size={17} /> : <ArrowRight size={17} />}</button>
      </div>
    </div>
  </section>;
}

function ReportSummary({ project }) {
  const summary = PROJECT_PRESENTATION[project.id];
  return <section className="project-report__summary" aria-label="Synthèse d’ingénierie">
    <div><span>PROBLÈME</span><p>{summary.problem}</p></div>
    <div><span>CONTRIBUTION</span><p>{summary.contribution}</p></div>
    <div><span>DÉCISION TECHNIQUE</span><p>{summary.decision}</p></div>
    <div><span>RÉSULTAT</span><p>{summary.result}</p></div>
  </section>;
}

export default function ProjectReport({ project, onBack, onSelectProject }) {
  const reportRef = useRef(null);
  const [chapter, setChapter] = useState('context');
  const report = project.report;

  useEffect(() => {
    const root = reportRef.current.closest('.portfolio-app__content');
    function track() {
      const top = root.getBoundingClientRect().top + 110;
      const sections = [...reportRef.current.querySelectorAll('[data-chapter]')];
      const current = sections.filter((item) => item.getBoundingClientRect().top <= top).at(-1);
      setChapter(current?.dataset.chapter || 'context');
    }
    root.addEventListener('scroll', track, { passive: true });
    return () => root.removeEventListener('scroll', track);
  }, [project.id]);

  useEffect(() => {
    const element = reportRef.current;
    if (!report || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { root: element.closest('.portfolio-app__content'), threshold: 0.05 });
    element.classList.add('is-observing');
    element.querySelectorAll('[data-chapter]').forEach((chapter) => observer.observe(chapter));
    return () => {
      observer.disconnect();
      element.classList.remove('is-observing');
    };
  }, [project.id, report]);

  const nextProject = PROJECTS[(PROJECTS.findIndex((item) => item.id === project.id) + 1) % PROJECTS.length];
  const links = project.github ? [{ label: 'CODE SOURCE', href: project.github, icon: GitBranch }] : [];

  function jump(section) {
    const element = reportRef.current.querySelector(`[data-chapter="${section}"]`);
    element?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    element?.focus({ preventScroll: true });
  }

  return <article className="project-report" ref={reportRef} style={{ '--project-accent': '#8fd8cf' }}>
    <header className="project-report__hero">
      <div className="project-report__hero-top"><span>DOSSIER / {String(PROJECTS.findIndex((item) => item.id === project.id) + 1).padStart(2, '0')}</span><span>{project.group === 'main' ? 'PROJET PRINCIPAL' : 'AUTRE PROJET'}</span></div>
      <div className="project-report__hero-grid">
        <div>
          <span className="project-report__eyebrow">{project.category} · {project.context}</span>
          <h1>{project.name}</h1>
          <p className="project-report__tagline">{project.tagline}</p>
          <p className="project-report__intro">{project.description}</p>
        </div>
      </div>
      <dl className="project-report__metadata">
        <div><dt>CONTEXTE</dt><dd>{project.context}</dd></div>
        <div><dt>PÉRIODE</dt><dd>{project.period}</dd></div>
        <div><dt>RÔLE</dt><dd>{project.role}</dd></div>
        <div><dt>STATUT</dt><dd>{project.status}</dd></div>
        <div><dt>PREUVE</dt><dd>{project.evidence}</dd></div>
      </dl>
      {project.stack.length > 0 && <div className="project-report__stack project-report__stack--hero" aria-label="Stack technique">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>}
      <div className="project-report__hero-links">
        {links.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" title="Ouvrir le code source dans un nouvel onglet"><Icon size={15} />{label}<ArrowUpRight size={14} /></a>)}
        {project.group === 'main' && <CVAction><FileText size={15} />Lire le CV</CVAction>}
      </div>
    </header>

    {!report ? <section className="project-report__pending">
      <span className="project-report__eyebrow">ARCHIVE PARTIEL</span>
      <h2>Documentation en cours.</h2>
      <p>Aucun dépôt ou document source de LearnXcompile n’a été fourni pour l’instant. Cette fiche reste volontairement limitée aux informations disponibles ; elle sera complétée lorsque les éléments du projet seront documentés.</p>
      <button onClick={onBack}>Retour aux projets <ArrowRight size={16} /></button>
    </section> : <>
      <nav className="project-report__chapters" aria-label="Chapitres du rapport">
        {[['context', '01', 'Synthèse'], ...(PROJECT_MEDIA[project.id] ? [['screens', '↗', 'Captures']] : []), ['tour', '02', 'Flux'], ['architecture', '03', 'Architecture'], ['decisions', '04', 'Décisions'], ['outcome', '05', 'Bilan']].map(([id, number, label]) => <button key={id} aria-current={chapter === id ? 'location' : undefined} onClick={() => { setChapter(id); jump(id); }}><small>{number}</small>{label}</button>)}
      </nav>
      <section className="project-report__chapter project-report__chapter--summary" data-chapter="context" tabIndex={-1}>
        <span className="project-report__eyebrow">SYNTHÈSE D’INGÉNIERIE / 01</span>
        <h2>Ce qui a été construit.</h2>
        <ReportSummary project={project} />
        <details className="project-report__context-detail"><summary>Comprendre le contexte et la solution</summary><p>{report.problem}</p><p>{report.solution}</p></details>
        <div className="project-report__features">{project.highlights.map((item) => <span key={item}><Check size={14} />{item}</span>)}</div>
      </section>
      {PROJECT_MEDIA[project.id] && <div className="project-report__chapter" data-chapter="screens" tabIndex={-1}><ProjectGallery key={project.id} project={project} images={PROJECT_MEDIA[project.id]} /></div>}
      <div className="project-report__chapter" data-chapter="tour" tabIndex={-1}><ProjectTour project={project} /></div>
      <section className="project-report__chapter" data-chapter="architecture" tabIndex={-1}>
        <span className="project-report__eyebrow">ARCHITECTURE / 03</span>
        <h2>Les composants du système.</h2>
        <ol className="project-report__architecture">{report.architecture.map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      </section>
      <section className="project-report__chapter" data-chapter="decisions" tabIndex={-1}>
        <span className="project-report__eyebrow">DÉCISIONS / 04</span>
        <h2>Choix et compromis.</h2>
        <div className="project-report__decisions">{report.decisions.map(([title, text], index) => <div key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div>
      </section>
      <section className="project-report__chapter project-report__outcome" data-chapter="outcome" tabIndex={-1}>
        <span className="project-report__eyebrow">BILAN / 05</span>
        <h2>Résultat et périmètre.</h2>
        <p>{report.outcome}</p>
        <details><summary>Sources, limites et niveau de preuve</summary><p>{report.boundaries}</p></details>
        <div className="project-report__sources">
          <span>SOURCES CONSULTABLES</span>
          {report.sources.map((source) => project.github && <a key={source.path} href={`${project.github}/blob/${project.branch || 'main'}/${source.path}`} target="_blank" rel="noreferrer" title="Ouvrir le code source dans un nouvel onglet">{source.label}<ArrowUpRight size={14} /></a>)}
          {project.group === 'main' && <CVAction><FileText size={14} />Lire le CV</CVAction>}
        </div>
      </section>
    </>}
    <footer className="project-report__next">
      <button onClick={onBack}><ArrowLeft size={16} />Retour aux projets</button>
      <button onClick={() => onSelectProject(nextProject.id)}><span>PROJET SUIVANT<strong>{nextProject.name}</strong></span><ArrowRight size={21} /></button>
    </footer>
  </article>;
}
