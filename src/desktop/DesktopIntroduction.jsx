import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Grid2X2, MonitorDot, UserRound, X } from 'lucide-react';
import { INTRODUCTION_STEPS } from './introJourney';
import './DesktopIntroduction.css';

const STEP_ICONS = [UserRound, Grid2X2, MonitorDot];

function UbuntuMark() {
  return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <circle cx="50" cy="50" r="29" stroke="currentColor" strokeWidth="9" strokeDasharray="48 12.74" transform="rotate(12 50 50)" />
    {[0, 120, 240].map((angle) => <g key={angle} transform={`rotate(${angle} 50 50)`}><circle cx="88" cy="50" r="11" fill="currentColor" /></g>)}
  </svg>;
}

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
  const dialogRef = useRef(null);
  const [rectangles, setRectangles] = useState([]);
  const guide = phase === 'guide';
  const current = INTRODUCTION_STEPS[step] || INTRODUCTION_STEPS[0];
  const StepIcon = STEP_ICONS[step] || STEP_ICONS[0];
  const completeBoot = useEffectEvent(onBootComplete);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (phase !== 'done' && dialog && !dialog.open) dialog.showModal();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'boot') return undefined;
    const timer = window.setTimeout(() => completeBoot(), isReducedMotion() ? 0 : 1500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useLayoutEffect(() => {
    if (phase === 'done' || phase === 'boot') return undefined;
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector('[data-introduction-primary]')?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [phase, step]);

  useLayoutEffect(() => {
    if (!guide) return undefined;
    let frame;
    const surface = document.querySelector('.desktop-items');
    const previousScroll = surface ? { top: surface.scrollTop, left: surface.scrollLeft } : null;
    function reveal() {
      if (innerWidth <= 620 && surface && step !== 1) {
        const targets = readTargets(current.selectors);
        if (targets.length) surface.scrollTo({ top: Math.min(...targets.map((target) => target.offsetTop)) - 8, behavior: 'instant' });
      }
    }
    function measure() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRectangles(readTargets(current.selectors).map((element) => {
        const rect = element.getBoundingClientRect();
        const panel = panelRef.current?.getBoundingClientRect();
        const bottom = innerWidth <= 620 && step !== 1 ? panel?.top - 10 : innerHeight;
        return { left: rect.left, top: Math.max(32, rect.top), width: rect.width, height: Math.min(rect.bottom, bottom) - Math.max(32, rect.top) };
      }).filter((rect) => rect.height > 30 && rect.left >= 0 && rect.left < innerWidth)));
    }
    reveal();
    measure();
    const observer = new ResizeObserver(measure);
    if (panelRef.current) observer.observe(panelRef.current);
    readTargets(current.selectors).forEach((target) => observer.observe(target));
    function resized() { reveal(); measure(); }
    const positions = new MutationObserver(resized);
    readTargets(current.selectors).forEach((target) => positions.observe(target, { attributes: true, attributeFilter: ['style'] }));
    window.addEventListener('resize', resized);
    function settled(event) { if (event.target.matches('.desktop-items__item')) { reveal(); measure(); } }
    window.addEventListener('transitionend', settled);
    window.addEventListener('scroll', measure, true);
    return () => { positions.disconnect(); observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', resized); window.removeEventListener('transitionend', settled); window.removeEventListener('scroll', measure, true); if (surface && previousScroll) surface.scrollTo({ ...previousScroll, behavior: 'instant' }); };
  }, [current, guide, step]);

  function keys(event) {
    event.stopPropagation();
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

  if (phase === 'boot') return <dialog ref={dialogRef} className="ib-introduction ib-introduction--boot" aria-label="Démarrage d’IbrahimOS" onCancel={(event) => { event.preventDefault(); onSkip(); }} onKeyUp={(event) => event.stopPropagation()} onKeyDown={(event) => { event.stopPropagation(); if (event.key === 'Tab') { event.preventDefault(); event.currentTarget.querySelector('button')?.focus(); } }}>
    <div className="ib-introduction__boot-center">
      <div className="ib-introduction__boot-copy"><strong>IbrahimOS</strong><span>Le portfolio d’Ibrahim Chehlafi</span></div>
      <span className="ib-introduction__spinner" role="status" aria-label="Ouverture du bureau"><span aria-hidden="true" /></span>
    </div>
    <div className="ib-introduction__ubuntu-signature" aria-label="Bureau inspiré d’Ubuntu"><span>ubuntu</span><UbuntuMark /></div>
    <button className="ib-introduction__skip" type="button" onClick={onSkip} autoFocus>Accéder au bureau</button>
  </dialog>;

  return <dialog ref={dialogRef} className={`ib-introduction ib-introduction--${phase}`} aria-labelledby="ib-introduction-title" onCancel={(event) => { event.preventDefault(); onExplore(); }} onKeyDown={keys} onKeyUp={(event) => event.stopPropagation()}>
    <div className="ib-introduction__shade" aria-hidden="true" />
    {guide && rectangles.map((rect, index) => <span key={`${rect.left}-${rect.top}-${index}`} className="ib-introduction__target" aria-hidden="true"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />)}
    <section ref={panelRef} className="ib-introduction__panel" aria-describedby="ib-introduction-description">
      <button className="ib-introduction__close" type="button" onClick={onExplore} aria-label={guide ? 'Passer la visite' : 'Explorer librement'}><X size={18} /></button>
      {phase === 'presentation' ? <>
        <div className="ib-introduction__welcome-mark"><UbuntuMark /></div>
        <span className="ib-introduction__eyebrow">Bienvenue dans IbrahimOS</span>
        <h1 id="ib-introduction-title">Bonjour, bienvenue dans le portfolio d’Ibrahim.</h1>
        <div id="ib-introduction-description" className="ib-introduction__copy">
          <p>Je suis Ibrahim Chehlafi, développeur Full-Stack à Perpignan, à la recherche d’un stage en développement informatique.</p>
          <p>Ce bureau inspiré d’Ubuntu est mon portfolio. Ouvrez les applications pour découvrir mes projets, mes compétences, mon parcours et mon CV.</p>
          <p>Une courte visite vous montre où les trouver. Vous pouvez aussi entrer directement et explorer à votre rythme.</p>
        </div>
        <div className="ib-introduction__actions">
          <button data-introduction-primary className="ib-introduction__primary" type="button" onClick={onStartGuide}>Me guider <ArrowRight size={17} /></button>
          <button type="button" className="ib-introduction__secondary" onClick={onExplore}>Entrer dans le bureau</button>
        </div>
      </> : <>
        <span className="ib-introduction__eyebrow"><StepIcon size={14} aria-hidden="true" /> VISITE DU BUREAU</span>
        <p className="ib-introduction__progress">Étape {step + 1} sur {INTRODUCTION_STEPS.length}</p>
        <h2 id="ib-introduction-title">{current.title}</h2>
        <p id="ib-introduction-description" className="ib-introduction__guide-copy">{current.text}</p>
        <div className="ib-introduction__actions ib-introduction__actions--guide">
          <button type="button" className="ib-introduction__secondary" onClick={onExplore}>{step === INTRODUCTION_STEPS.length - 1 ? 'Explorer librement' : 'Passer la visite'}</button>
          <span className="ib-introduction__nav">
            {step > 0 && <button type="button" className="ib-introduction__icon-button" onClick={onPrevious} aria-label="Étape précédente"><ArrowLeft size={17} /></button>}
            {step < INTRODUCTION_STEPS.length - 1 ? <button data-introduction-primary className="ib-introduction__primary" type="button" onClick={onNext}>Suivant <ArrowRight size={17} /></button> : <button data-introduction-primary className="ib-introduction__primary" type="button" onClick={onOpenPresentation}>Ouvrir Présentation <ArrowRight size={17} /></button>}
          </span>
        </div>
      </>}
    </section>
  </dialog>;
}
