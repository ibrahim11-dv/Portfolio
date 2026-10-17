import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleDotDashed, Grid2X2, MonitorDot, UserRound, X } from 'lucide-react';
import './DesktopIntroduction.css';

const STEPS = [
  {
    title: 'Découvrez mon univers',
    text: 'Présentation, Projets, Compétences, Parcours et Contact sont des applications indépendantes. Double-cliquez sur ordinateur ; touchez une fois sur mobile.',
    selectors: ['[data-intro-app="presentation"]', '[data-intro-app="projects"]', '[data-intro-app="skills"]', '[data-intro-app="journey"]', '[data-intro-app="contact"]'],
    icon: UserRound,
  },
  {
    title: 'Retrouvez vos applications',
    text: 'Le dock donne accès aux favoris et aux fenêtres ouvertes. La grille rassemble toutes les applications.',
    selectors: ['[data-intro-target="dock"]', '[data-intro-target="app-grid"]'],
    icon: Grid2X2,
  },
  {
    title: 'Gardons le contact',
    text: 'Le CV se lit directement dans le bureau ; Contact permet de retrouver l’adresse e-mail et GitHub.',
    selectors: ['[data-intro-app="cv"]', '[data-intro-app="contact"]'],
    icon: MonitorDot,
  },
];

function isReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
}

function readTargets(selectors) {
  return selectors.flatMap((selector) => [...document.querySelectorAll(selector)])
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
}

function focusable(root) {
  return [...root.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length);
}

export default function DesktopIntroduction({ phase, step, onBootComplete, onSkip, onExplore, onStartGuide, onPrevious, onNext, onOpenPresentation }) {
  const panelRef = useRef(null);
  const [rectangles, setRectangles] = useState([]);
  const guide = phase === 'guide';
  const current = STEPS[step] || STEPS[0];
  const StepIcon = current.icon;

  useEffect(() => {
    if (phase !== 'boot') return undefined;
    const timer = window.setTimeout(onBootComplete, isReducedMotion() ? 0 : 1050);
    return () => window.clearTimeout(timer);
  }, [onBootComplete, phase]);

  useLayoutEffect(() => {
    if (phase === 'done' || phase === 'boot') return undefined;
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector('[data-introduction-primary]')?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [phase, step]);

  useLayoutEffect(() => {
    if (!guide) return undefined;
    let frame;
    function measure() {
      const targets = readTargets(current.selectors);
      targets[0]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: isReducedMotion() ? 'instant' : 'smooth' });
      frame = requestAnimationFrame(() => setRectangles(readTargets(current.selectors).map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      })));
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [current, guide]);

  function keys(event) {
    if (event.key === 'Escape' && phase === 'presentation') { event.preventDefault(); onExplore(); return; }
    if (event.key === 'Escape' && guide) { event.preventDefault(); onExplore(); return; }
    if (event.key !== 'Tab') return;
    const controls = focusable(panelRef.current);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  if (phase === 'done') return null;

  if (phase === 'boot') return <section className="ib-introduction ib-introduction--boot" aria-label="Démarrage d’IbrahimOS" onKeyDown={(event) => { if (event.key === 'Tab') { event.preventDefault(); event.currentTarget.querySelector('button')?.focus(); } }}>
    <div className="ib-introduction__boot-mark" aria-hidden="true"><span /><span /><span /><span /></div>
    <div className="ib-introduction__boot-copy"><strong>IbrahimOS</strong><span>Bienvenue sur le bureau d’Ibrahim</span></div>
    <CircleDotDashed className="ib-introduction__spinner" size={25} aria-hidden="true" />
    <button className="ib-introduction__skip" type="button" onClick={onSkip} autoFocus>Passer l’introduction</button>
  </section>;

  return <section className={`ib-introduction ib-introduction--${phase}`} aria-live="polite" onKeyDown={keys}>
    <div className="ib-introduction__shade" aria-hidden="true" />
    {guide && rectangles.map((rect, index) => <span key={`${rect.left}-${rect.top}-${index}`} className="ib-introduction__target" aria-hidden="true"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />)}
    <section ref={panelRef} className="ib-introduction__panel" role="dialog" aria-modal="true" aria-labelledby="ib-introduction-title" aria-describedby="ib-introduction-description">
      <button className="ib-introduction__close" type="button" onClick={onExplore} aria-label={guide ? 'Passer la visite' : 'Explorer librement'}><X size={18} /></button>
      {phase === 'presentation' ? <>
        <span className="ib-introduction__eyebrow"><span aria-hidden="true">●</span> IBRAHIMOS / ACCUEIL</span>
        <h1 id="ib-introduction-title">Bienvenue dans mon espace de travail</h1>
        <div id="ib-introduction-description" className="ib-introduction__copy">
          <p>Je suis Ibrahim Chehlafi, développeur Full-Stack à Perpignan, à la recherche d’un stage en développement informatique.</p>
          <p>J’ai imaginé ce portfolio comme un bureau : chaque application vous permet de découvrir une partie de mon univers, de mes compétences ou de mon parcours.</p>
          <p>Vous pouvez explorer librement, ouvrir mon CV ou suivre une courte visite.</p>
        </div>
        <div className="ib-introduction__actions">
          <button data-introduction-primary className="ib-introduction__primary" type="button" onClick={onStartGuide}>Découvrir le bureau <ArrowRight size={17} /></button>
          <button type="button" className="ib-introduction__secondary" onClick={onExplore}>Explorer librement</button>
        </div>
      </> : <>
        <span className="ib-introduction__eyebrow"><StepIcon size={14} aria-hidden="true" /> VISITE DU BUREAU</span>
        <p className="ib-introduction__progress">Étape {step + 1} sur {STEPS.length}</p>
        <h2 id="ib-introduction-title">{current.title}</h2>
        <p id="ib-introduction-description" className="ib-introduction__guide-copy">{current.text}</p>
        <div className="ib-introduction__actions ib-introduction__actions--guide">
          <button type="button" className="ib-introduction__secondary" onClick={onExplore}>Passer la visite</button>
          <span className="ib-introduction__nav">
            {step > 0 && <button type="button" className="ib-introduction__icon-button" onClick={onPrevious} aria-label="Étape précédente"><ArrowLeft size={17} /></button>}
            {step < STEPS.length - 1 ? <button data-introduction-primary className="ib-introduction__primary" type="button" onClick={onNext}>Suivant <ArrowRight size={17} /></button> : <button data-introduction-primary className="ib-introduction__primary" type="button" onClick={onOpenPresentation}>Ouvrir Présentation <ArrowRight size={17} /></button>}
          </span>
        </div>
      </>}
    </section>
  </section>;
}
