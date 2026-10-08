import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Columns2, Copy, Download, FileText, Grid2X2, Info, List, Maximize, Menu, Minus, MoreVertical, Moon, PanelLeft, Plus, RotateCw, Search, X } from 'lucide-react';
import { getDocument, GlobalWorkerOptions, TextLayer } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import { PROFILE } from './portfolioData';
import './DocumentViewer.css';
import { normalizeReadingState } from './recruiterJourney';

GlobalWorkerOptions.workerSrc = pdfWorker;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function PdfPage({ pdf, number, scale, rotation, query = '', thumbnail = false, onNavigate, onReady }) {
  const canvasRef = useRef(null);
  const textRef = useRef(null);
  const textLayerRef = useRef(null);
  const [dimensions, setDimensions] = useState(null);
  const [links, setLinks] = useState([]);
  const [rendered, setRendered] = useState(0);
  const [error, setError] = useState('');
  const [canvasReady, setCanvasReady] = useState(false);
  const readyRef = useRef(onReady);
  useEffect(() => { readyRef.current = onReady; }, [onReady]);
  useEffect(() => {
    let cancelled = false;
    let renderTask;
    let textLayer;
    const canvas = canvasRef.current;
    const text = textRef.current;
    async function render() {
      try {
        const page = await pdf.getPage(number);
        if (cancelled) return;
        const viewport = page.getViewport({ scale, rotation });
        const density = thumbnail ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * density);
        canvas.height = Math.ceil(viewport.height * density);
        setDimensions({ width: viewport.width, height: viewport.height });
        renderTask = page.render({ canvas, viewport, transform: density === 1 ? null : [density, 0, 0, density, 0, 0] });
        await renderTask.promise;
        if (!cancelled) { setError(''); setCanvasReady(true); if (!thumbnail) readyRef.current?.(); }
        if (cancelled || thumbnail) return;
        const content = await page.getTextContent();
        if (cancelled) return;
        text.replaceChildren();
        textLayer = new TextLayer({ textContentSource: content, container: text, viewport });
        textLayerRef.current = textLayer;
        await textLayer.render();
        if (cancelled) return;
        setRendered((value) => value + 1);
        const annotations = await page.getAnnotations();
        if (cancelled) return;
        setLinks(annotations.filter((item) => item.subtype === 'Link' && item.rect?.length === 4 && (item.dest || /^(https?:|mailto:|tel:)/i.test(item.url || ''))).map((item) => {
          const [x1, y1] = viewport.convertToViewportPoint(item.rect[0], item.rect[1]);
          const [x2, y2] = viewport.convertToViewportPoint(item.rect[2], item.rect[3]);
          return { ...item, box: { left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) } };
        }));
      } catch (failure) {
        if (!cancelled && failure.name !== 'RenderingCancelledException') {
          console.error('Document page rendering failed:', failure);
          setError('Cette page ne peut pas être affichée.');
        }
      }
    }
    render();
    return () => { cancelled = true; renderTask?.cancel(); textLayer?.cancel(); };
  }, [pdf, number, scale, rotation, thumbnail]);

  useEffect(() => {
    const layer = textLayerRef.current;
    if (!layer) return;
    layer.textDivs.forEach((span, index) => {
      const value = layer.textContentItemsStr[index];
      span.textContent = value;
      const needle = query.trim().toLocaleLowerCase();
      if (!needle) return;
      const lowered = value.toLocaleLowerCase();
      let cursor = 0;
      let match = lowered.indexOf(needle);
      if (match < 0) return;
      span.replaceChildren();
      while (match >= 0) {
        span.append(document.createTextNode(value.slice(cursor, match)));
        const mark = document.createElement('mark');
        mark.textContent = value.slice(match, match + needle.length);
        span.append(mark);
        cursor = match + needle.length;
        match = lowered.indexOf(needle, cursor);
      }
      span.append(document.createTextNode(value.slice(cursor)));
    });
  }, [query, rendered]);

  return <div className={`papers-page ${thumbnail ? 'is-thumbnail' : ''}`} data-pdf-page={thumbnail ? undefined : number} style={{ ...dimensions, '--total-scale-factor': scale, '--scale-factor': scale, '--user-unit': 1 }}>
    <canvas ref={canvasRef} className={canvasReady ? 'is-ready' : undefined} aria-hidden="true" style={dimensions || undefined} />
    {!canvasReady && !thumbnail && !error && <span className="papers-page__render-status" role="status">Rendu de la page {number}…</span>}
    {!thumbnail && <><div ref={textRef} className="textLayer" /><div className="papers-page__links">{links.map((link) => link.url ? <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" title="Ouvrir dans un nouvel onglet" style={link.box} aria-label={link.url} /> : <button key={link.id} style={link.box} aria-label="Suivre le lien dans le document" onClick={() => onNavigate(link.dest)} />)}</div></>}
    {error && <span className="papers-page__error" role="alert">{error}</span>}
  </div>;
}

function Outline({ items, onNavigate }) {
  return <ul className="papers-outline">{items.map((item, index) => <li key={`${index}-${item.title}`}><button onClick={() => onNavigate(item.dest)}>{item.title}</button>{item.items?.length > 0 && <Outline items={item.items} onNavigate={onNavigate} />}</li>)}</ul>;
}

export default function DocumentViewer({ url = PROFILE.cvUrl, filename = 'CV.pdf', onOpenCopy, onOpenFiles, onBack, backLabel = 'Retour au portfolio', onContact, onNotify, initialReadingState, onReadingState }) {
  const [saved] = useState(() => normalizeReadingState(initialReadingState || {}));
  const [documentState, setDocumentState] = useState({ pdf: null, pages: [], outline: [], metadata: null, error: '' });
  const [sidebar, setSidebar] = useState(saved.sidebar);
  const [sidebarMode, setSidebarMode] = useState('thumbnails');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(saved.page);
  const [pageDraft, setPageDraft] = useState(null);
  const [zoom, setZoom] = useState(saved.zoom);
  const [rotation, setRotation] = useState(saved.rotation);
  const [continuous, setContinuous] = useState(saved.continuous);
  const [dual, setDual] = useState(saved.dual);
  const [night, setNight] = useState(saved.night);
  const [retry, setRetry] = useState(0);
  const [indexing, setIndexing] = useState(true);
  const [notice, setNotice] = useState('');
  const [menu, setMenu] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [viewport, setViewport] = useState({ width: 540, height: 560 });
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const pageRef = useRef(null);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const dialogRef = useRef(null);
  const ratioRef = useRef(saved.scrollRatio);
  const lastViewport = useRef(viewport);
  const restoreRef = useRef(true);
  const stateCallback = useRef(onReadingState);
  useEffect(() => { stateCallback.current = onReadingState; }, [onReadingState]);
  const { pdf, pages, outline, metadata, error } = documentState;

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    let cancelled = false;
    const task = getDocument({ url, isEvalSupported: false });
    async function load() {
      try {
        const loaded = await task.promise;
        const first = await loaded.getPage(1);
        const bounds = first.getViewport({ scale: 1 });
        if (cancelled) return;
        setDocumentState({ pdf: loaded, pages: Array.from({ length: loaded.numPages }, (_, i) => ({ number: i + 1, text: '', width: bounds.width, height: bounds.height, annotations: [] })), outline: [], metadata: null, error: '' });
        const summaries = await Promise.all(Array.from({ length: loaded.numPages }, async (_, index) => {
          const page = await loaded.getPage(index + 1);
          const [content, annotations] = await Promise.all([page.getTextContent(), page.getAnnotations()]);
          const bounds = page.getViewport({ scale: 1 });
          return { number: index + 1, text: content.items.map((item) => item.str || '').join(' '), width: bounds.width, height: bounds.height, annotations: annotations.filter((item) => ['Text', 'FreeText', 'Highlight', 'Underline', 'StrikeOut', 'Ink'].includes(item.subtype)) };
        }));
        const [toc, info] = await Promise.all([loaded.getOutline().catch(() => []), loaded.getMetadata().catch(() => ({ info: null }))]);
        if (!cancelled) { setDocumentState({ pdf: loaded, pages: summaries, outline: toc || [], metadata: info.info, error: '' }); setIndexing(false); }
      } catch (failure) {
        if (!cancelled) {
          setIndexing(false);
          setDocumentState((current) => current.pdf
            ? { ...current, searchError: 'La recherche n’a pas pu être préparée. Le document reste lisible.' }
            : { pdf: null, pages: [], outline: [], metadata: null, error: failure.name === 'PasswordException' ? 'Ce document est protégé par un mot de passe.' : 'Impossible d’ouvrir ce document.' });
        }
      }
    }
    load();
    return () => { cancelled = true; task.destroy(); };
  }, [url, retry]);

  useEffect(() => {
    stateCallback.current?.({ page: currentPage, scrollRatio: ratioRef.current, zoom, rotation, sidebar, continuous, dual, night });
  }, [currentPage, zoom, rotation, sidebar, continuous, dual, night]);
  const restorePosition = useCallback(() => {
    if (!restoreRef.current) return;
    requestAnimationFrame(() => {
      const area = scrollRef.current;
      if (!area) return;
      area.scrollTop = ratioRef.current * Math.max(0, area.scrollHeight - area.clientHeight);
      restoreRef.current = false;
    });
  }, []);

  useEffect(() => {
    if (rootRef.current?.closest('.is-active-window') && !document.querySelector('dialog[open]')) rootRef.current.focus({ preventScroll: true });
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (sidebarMode === 'search' && sidebar) searchRef.current?.focus();
  }, [sidebarMode, sidebar]);
  useEffect(() => {
    const update = () => { const active = document.fullscreenElement === rootRef.current; setFullscreen(active); if (!active) setPresentation(false); };
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector('button:not(:disabled)')?.focus();
    const dismiss = (event) => { if (!menuRef.current?.contains(event.target)) setMenu(null); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [menu]);
  useEffect(() => {
    if (!dialog) return;
    dialogRef.current?.showModal();
    dialogRef.current?.querySelector('button')?.focus();
  }, [dialog]);

  const base = pages[0] || { width: 595, height: 842 };
  const pageWidth = rotation % 180 ? base.height : base.width;
  const pageHeight = rotation % 180 ? base.width : base.height;
  const widthScale = Math.max(.15, (viewport.width - 48) / ((dual && !presentation ? 2 : 1) * pageWidth));
  const fitScale = Math.max(.15, Math.min(widthScale, (viewport.height - 36) / pageHeight));
  const scale = presentation || zoom === 'fit-page' ? fitScale : zoom === 'fit-width' ? widthScale : zoom === 'automatic' ? Math.min(1, widthScale) : zoom;
  useLayoutEffect(() => { restoreRef.current = true; }, [scale, rotation, pdf]);
  useLayoutEffect(() => {
    const resized = lastViewport.current.width !== viewport.width || lastViewport.current.height !== viewport.height;
    lastViewport.current = viewport;
    if (!resized || typeof zoom !== 'number') return;
    restoreRef.current = true;
    restorePosition();
  }, [viewport, zoom, restorePosition]);
  const hits = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    return pages.flatMap((page) => {
      const results = [];
      const text = page.text.toLocaleLowerCase();
      let index = text.indexOf(needle);
      while (index >= 0) { results.push({ page: page.number, snippet: page.text.slice(Math.max(0, index - 35), index + needle.length + 65), index }); index = text.indexOf(needle, index + needle.length); }
      return results;
    });
  }, [pages, query]);

  function goToPage(number) {
    restoreRef.current = false;
    const target = clamp(Number(number) || 1, 1, pages.length || 1);
    setCurrentPage(target);
    setPageDraft(null);
    if (rootRef.current?.clientWidth < 720) setSidebar(false);
    requestAnimationFrame(() => scrollRef.current?.querySelector(`[data-pdf-page="${target}"]`)?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' }));
  }
  async function goToDestination(destination) {
    if (!pdf || !destination) return;
    try {
      const target = typeof destination === 'string' ? await pdf.getDestination(destination) : destination;
      if (target) goToPage(typeof target[0] === 'number' ? target[0] + 1 : await pdf.getPageIndex(target[0]) + 1);
    } catch { /* An invalid document link does not leave the current page. */ }
  }
  function changeZoom(direction) { setZoom(clamp(Math.round(scale * (direction > 0 ? 1.2 : 1 / 1.2) * 100) / 100, .15, 5)); }
  function saveCopy() { const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setMenu(null); setNotice('Téléchargement demandé.'); onNotify?.('Téléchargement demandé.'); }
  async function enterFullscreen(slideshow = false) {
    setMenu(null);
    try {
      if (document.fullscreenElement === rootRef.current) await document.exitFullscreen();
      else { await rootRef.current.requestFullscreen(); setPresentation(slideshow); }
    } catch { setDialog('fullscreen-error'); }
  }
  function keyboard(event) {
    if (event.metaKey || event.altKey && !(event.key === 'Enter' && !event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    const editing = event.target.matches('input, textarea');
    if (event.ctrlKey && key === 'f') { event.preventDefault(); setSidebar(true); setSidebarMode('search'); searchRef.current?.focus(); return; }
    if (event.ctrlKey && key === 'l') { event.preventDefault(); pageRef.current?.focus(); pageRef.current?.select(); return; }
    if (event.ctrlKey && key === 's') { event.preventDefault(); saveCopy(); return; }
    if (event.altKey && event.key === 'Enter') { event.preventDefault(); setDialog('properties'); return; }
    if (event.key === 'Escape') { setMenu(null); if (sidebarMode === 'search') { setSidebarMode('thumbnails'); setQuery(''); rootRef.current?.focus(); } return; }
    if (editing) return;
    if (event.key === 'F9') { event.preventDefault(); setSidebar((value) => !value); }
    if (event.key === 'F11' || event.key === 'F5') { event.preventDefault(); enterFullscreen(event.key === 'F5'); }
    if (['+', '='].includes(event.key)) { event.preventDefault(); changeZoom(1); }
    if (event.key === '-') { event.preventDefault(); changeZoom(-1); }
    if (event.ctrlKey && key === '0') { event.preventDefault(); setZoom(1); }
    if (event.ctrlKey && event.key === 'ArrowLeft') { event.preventDefault(); setRotation((value) => (value + 270) % 360); }
    if (event.ctrlKey && event.key === 'ArrowRight') { event.preventDefault(); setRotation((value) => (value + 90) % 360); }
    if (event.ctrlKey && event.key === 'PageDown' || !event.ctrlKey && key === 'n' || presentation && ['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); goToPage(currentPage + 1); }
    if (event.ctrlKey && event.key === 'PageUp' || !event.ctrlKey && key === 'p' || presentation && ['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); goToPage(currentPage - 1); }
    if (!event.ctrlKey && ['w', 'f', 'a'].includes(key)) { event.preventDefault(); setZoom({ w: 'fit-width', f: 'fit-page', a: 'automatic' }[key]); }
  }

  function menuKeyboard(event) {
    event.stopPropagation();
    if (['Escape', 'Tab'].includes(event.key)) { event.preventDefault(); setMenu(null); rootRef.current?.focus(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...menuRef.current.querySelectorAll('button:not(:disabled)')];
    const index = buttons.indexOf(document.activeElement);
    buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  }

  const annotations = pages.flatMap((page) => page.annotations.map((annotation) => ({ ...annotation, page: page.number })));
  return <div ref={rootRef} className={`papers ${sidebar ? 'has-sidebar' : ''} ${night ? 'is-night' : ''} ${presentation ? 'is-presenting' : ''}`} tabIndex={0} onKeyDown={keyboard}>
    <header className="papers__toolbar">
      {sidebar && <div className="papers__sidebar-title"><button aria-label="Rechercher dans le document" onClick={() => setSidebarMode('search')}><Search size={17} /></button><strong>Visionneur de documents</strong><button aria-label="Menu principal du lecteur" onClick={() => setMenu(menu === 'main' ? null : 'main')}><Menu size={17} /></button></div>}
      <button aria-label="Afficher ou masquer le panneau du document" aria-pressed={sidebar} onClick={() => setSidebar((value) => !value)}><PanelLeft size={17} /></button>
      <strong className="papers__filename" title={filename}>{filename}</strong>
      <form className="papers__page-selector" onSubmit={(event) => { event.preventDefault(); goToPage(pageDraft ?? currentPage); rootRef.current?.focus(); }}><input ref={pageRef} aria-label="Numéro de page" inputMode="numeric" value={pageDraft ?? currentPage} onChange={(event) => setPageDraft(event.target.value)} onBlur={() => { if (pageDraft !== null) goToPage(pageDraft); }} /><span>sur {pdf?.numPages || '…'}</span></form>
      <button aria-label="Menu du document" onClick={() => setMenu(menu === 'document' ? null : 'document')}><MoreVertical size={18} /></button>
    </header>
    <div className="papers__journey" aria-label="Actions du CV">
      {onBack && <button onClick={onBack}>{backLabel}</button>}
      <button onClick={() => { setSidebar(true); setSidebarMode('search'); }}>Rechercher</button>
      <button onClick={saveCopy}><Download size={15} />Télécharger</button>
      {onContact && <button onClick={onContact}>Contact</button>}
    </div>
    <span className="papers__status" role="status">{notice || documentState.searchError || (error ? 'Échec du chargement du CV' : !pdf ? 'Chargement du CV…' : indexing ? 'CV affiché · préparation de la recherche…' : 'CV prêt à lire')}</span>
    <div className="papers__body">
      {sidebar && <aside className="papers__sidebar" aria-label="Panneau du document">
        <div className="papers__sidebar-content">
          {sidebarMode === 'search' ? <><div className="papers__search"><Search size={16} /><input ref={searchRef} aria-label="Rechercher dans le PDF" placeholder="Rechercher…" value={query} onChange={(event) => setQuery(event.target.value)} /><button aria-label="Fermer la recherche du PDF" onClick={() => { setSidebarMode('thumbnails'); setQuery(''); }}><X size={15} /></button></div><span className="papers__search-count" role="status">{indexing ? 'Préparation de la recherche…' : query ? `${hits.length} résultat${hits.length === 1 ? '' : 's'}` : 'Rechercher dans le document'}</span>{hits.map((hit, index) => <button className="papers__search-hit" key={`${hit.page}-${hit.index}`} onClick={() => goToPage(hit.page)}><strong>Page {hit.page} · Résultat {index + 1}</strong><span>{hit.snippet}</span></button>)}</>
          : sidebarMode === 'outline' ? outline.length ? <Outline items={outline} onNavigate={goToDestination} /> : <p className="papers__empty"><List size={32} />Ce document ne possède pas de sommaire.</p>
          : sidebarMode === 'annotations' ? annotations.length ? annotations.map((annotation) => <button className="papers__search-hit" key={annotation.id} onClick={() => goToPage(annotation.page)}><strong>Page {annotation.page}</strong><span>{annotation.contentsObj?.str || annotation.subtype}</span></button>) : <p className="papers__empty"><FileText size={32} />Aucune annotation dans ce document.</p>
          : pages.map((page) => <button className={`papers__thumbnail ${page.number === currentPage ? 'is-current' : ''}`} key={page.number} aria-label={`Afficher la page ${page.number}`} aria-pressed={page.number === currentPage} onClick={() => goToPage(page.number)}><PdfPage pdf={pdf} number={page.number} scale={135 / page.width} rotation={0} thumbnail /><span>{page.number}</span></button>)}
        </div>
        <nav className="papers__sidebar-tabs" aria-label="Contenu du panneau">{[['thumbnails', 'Vignettes', Grid2X2], ['outline', 'Sommaire', List], ['annotations', 'Annotations', FileText]].map(([mode, label, Icon]) => <button key={mode} aria-label={label} aria-pressed={sidebarMode === mode} onClick={() => setSidebarMode(mode)}><Icon size={18} /></button>)}</nav>
      </aside>}
      <div className="papers__main">
        <div ref={scrollRef} className={`papers__scroll ${dual && !presentation ? 'is-dual' : ''}`} aria-label="Pages du document" tabIndex={0} onScroll={() => {
          if (!restoreRef.current) { const area = scrollRef.current; ratioRef.current = area.scrollTop / Math.max(1, area.scrollHeight - area.clientHeight); stateCallback.current?.({ page: currentPage, scrollRatio: ratioRef.current, zoom, rotation, sidebar, continuous, dual, night }); }
          if (!continuous || presentation) return;
          const viewportBounds = scrollRef.current.getBoundingClientRect();
          const candidates = [...scrollRef.current.querySelectorAll('[data-pdf-page]')];
          const nearest = candidates.sort((a, b) => Math.abs(a.getBoundingClientRect().top - viewportBounds.top) - Math.abs(b.getBoundingClientRect().top - viewportBounds.top))[0];
          if (nearest) setCurrentPage(Number(nearest.dataset.pdfPage));
        }}>
          {error ? <div className="papers__loading" role="alert"><FileText size={44} /><strong>{error}</strong><button onClick={() => { setIndexing(true); setDocumentState({ pdf: null, pages: [], outline: [], metadata: null, error: '' }); setRetry((value) => value + 1); }}>Réessayer</button><a href={url} download={filename}>Télécharger le CV</a><a href={url} target="_blank" rel="noreferrer">Ouvrir le PDF original</a></div> : !pdf ? <div className="papers__loading" role="status"><span className="papers__spinner" />Ouverture du document…</div> : pages.filter((page) => continuous && !presentation || page.number === currentPage).map((page) => <PdfPage key={page.number} pdf={pdf} number={page.number} scale={scale} rotation={rotation} query={query} onNavigate={goToDestination} onReady={restorePosition} />)}
        </div>
        {pdf && !presentation && <div className="papers__zoom" aria-label="Zoom du document"><button aria-label="Ajuster automatiquement" title="Ajuster automatiquement" onClick={() => setZoom('automatic')}><Maximize size={17} /></button><button aria-label="Agrandir le document" title="Agrandir" disabled={scale >= 5} onClick={() => changeZoom(1)}><Plus size={19} /></button><button aria-label="Réduire le document" title="Réduire" disabled={scale <= .15} onClick={() => changeZoom(-1)}><Minus size={19} /></button><span>{Math.round(scale * 100)} %</span></div>}
        {fullscreen && <button className="papers__exit-fullscreen" onClick={() => document.exitFullscreen()}>Quitter le plein écran</button>}
      </div>
    </div>
    {menu && <div ref={menuRef} className={`papers__menu ${menu === 'main' ? 'is-main' : ''}`} role="menu" aria-label="Actions du lecteur" onKeyDown={menuKeyboard}>{menu === 'main' ? <><button role="menuitem" onClick={() => { setMenu(null); onOpenFiles?.(); }}>Ouvrir…</button><button role="menuitemcheckbox" aria-checked={night} onClick={() => { setNight((value) => !value); setMenu(null); }}><Moon size={16} />Mode nuit {night ? '✓' : ''}</button><div role="separator" /><button role="menuitem" onClick={() => { setMenu(null); setDialog('shortcuts'); }}>Raccourcis clavier</button></> : <><button role="menuitem" onClick={() => enterFullscreen(false)}><Maximize size={16} />Plein écran <kbd>F11</kbd></button><button role="menuitem" onClick={() => enterFullscreen(true)}>Présenter en diaporama <kbd>F5</kbd></button><div role="separator" /><button role="menuitem" onClick={() => { setMenu(null); onOpenCopy?.(); }}><Copy size={16} />Ouvrir une copie</button><button role="menuitem" onClick={saveCopy}><Download size={16} />Enregistrer sous… <kbd>Ctrl+S</kbd></button><div role="separator" /><button role="menuitemcheckbox" aria-checked={continuous} onClick={() => { setContinuous((value) => !value); setMenu(null); }}>Continu {continuous ? '✓' : ''}</button><button role="menuitemcheckbox" aria-checked={dual} onClick={() => { setDual((value) => !value); setMenu(null); }}><Columns2 size={16} />Deux pages {dual ? '✓' : ''}</button><button role="menuitem" onClick={() => { setRotation((value) => (value + 90) % 360); setMenu(null); }}><RotateCw size={16} />Tourner dans le sens horaire</button><div role="separator" /><button role="menuitem" onClick={() => { setMenu(null); setDialog('properties'); }}><Info size={16} />Propriétés du document</button></>}</div>}
    {dialog && <dialog ref={dialogRef} className="papers__dialog" aria-label={dialog === 'properties' ? 'Propriétés du document' : dialog === 'shortcuts' ? 'Raccourcis du lecteur' : 'Plein écran indisponible'} onCancel={() => setDialog(null)} onKeyDown={(event) => event.stopPropagation()}><header><h2>{dialog === 'properties' ? 'Propriétés du document' : dialog === 'shortcuts' ? 'Raccourcis clavier' : 'Plein écran indisponible'}</h2><button aria-label="Fermer le dialogue du lecteur" onClick={() => setDialog(null)}><X size={17} /></button></header>{dialog === 'properties' ? <dl><dt>Nom</dt><dd>{filename}</dd><dt>Pages</dt><dd>{pdf?.numPages || '—'}</dd><dt>Format</dt><dd>PDF {metadata?.PDFFormatVersion || ''}</dd><dt>Auteur</dt><dd>{metadata?.Author || 'Non renseigné'}</dd><dt>Dimensions</dt><dd>{Math.round(base.width / 72 * 25.4)} × {Math.round(base.height / 72 * 25.4)} mm</dd></dl> : dialog === 'shortcuts' ? <dl>{[['Rechercher', 'Ctrl+F'], ['Choisir une page', 'Ctrl+L'], ['Page suivante/précédente', 'Ctrl+Page ↓ / ↑'], ['Zoom', '+ / −'], ['Taille réelle', 'Ctrl+0'], ['Tourner', 'Ctrl+← / →'], ['Panneau latéral', 'F9'], ['Plein écran', 'F11'], ['Diaporama', 'F5']].map(([label, keys]) => <div key={label}><dt>{label}</dt><dd><kbd>{keys}</kbd></dd></div>)}</dl> : <p>Le navigateur ne permet pas le plein écran dans cette fenêtre.</p>}</dialog>}
  </div>;
}
