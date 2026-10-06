import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Grid2X2, Search, X } from 'lucide-react';
import { appById, DESKTOP_APPS, endAppDrag, hasAppDrag, readAppDrag, writeAppDrag } from './apps';
import { cloneWindowVisual, restoreVisualScroll } from './windowVisual';
import './WindowOverview.css';

const WINDOW_DRAG = 'application/x-ubuntu-window';

function readWindowDrag(event) {
  try { return JSON.parse(event.dataTransfer.getData(WINDOW_DRAG))?.id || null; } catch { return null; }
}

function WindowPreview({ windowId, revision }) {
  const previewRef = useRef(null);
  useLayoutEffect(() => {
    const holder = previewRef.current;
    const source = document.querySelector(`.ubuntu-window[data-window-id="${windowId}"]`);
    if (!holder || !source) return;
    const scrollPositions = [];
    const clone = cloneWindowVisual(source, scrollPositions);
    clone.classList.remove('is-minimized', 'is-closing', 'is-unminimizing', 'is-opening-window', 'is-off-workspace');
    clone.removeAttribute('data-window-id');
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    clone.querySelectorAll('iframe').forEach((frame) => frame.remove());
    const width = Number.parseFloat(source.style.getPropertyValue('--window-width')) || 760;
    const height = Number.parseFloat(source.style.getPropertyValue('--window-height')) || 560;
    const fit = () => {
      const scale = Math.min(holder.clientWidth / width, holder.clientHeight / height);
      clone.style.setProperty('left', `${(holder.clientWidth - width * scale) / 2}px`, 'important');
      clone.style.setProperty('top', `${(holder.clientHeight - height * scale) / 2}px`, 'important');
      clone.style.setProperty('width', `${width}px`, 'important');
      clone.style.setProperty('height', `${height}px`, 'important');
      clone.style.setProperty('transform', `scale(${scale})`, 'important');
    };
    clone.style.transformOrigin = 'top left';
    clone.style.animation = 'none';
    clone.style.transition = 'none';
    clone.style.visibility = 'visible';
    clone.style.opacity = '1';
    holder.replaceChildren(clone);
    fit();
    restoreVisualScroll(scrollPositions);
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    return () => { observer.disconnect(); holder.replaceChildren(); };
  }, [windowId, revision]);
  return <div className="ubuntu-window-overview__preview" ref={previewRef} aria-hidden="true" />;
}

function WorkspacePreview({ windows, revision }) {
  const previewRef = useRef(null);
  useLayoutEffect(() => {
    const holder = previewRef.current;
    const stage = document.createElement('div');
    const scrollPositions = [];
    stage.className = 'ubuntu-window-overview__workspace-stage';
    windows.filter((item) => !item.minimized).forEach((item) => {
      const source = document.querySelector(`.ubuntu-window[data-window-id="${item.id}"]`);
      if (!source) return;
      const clone = cloneWindowVisual(source, scrollPositions);
      clone.classList.remove('is-minimized', 'is-closing', 'is-unminimizing', 'is-opening-window', 'is-off-workspace');
      clone.removeAttribute('data-window-id');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      clone.querySelectorAll('iframe').forEach((frame) => frame.remove());
      const geometry = { left: source.style.getPropertyValue('--window-left'), top: `${Number.parseFloat(source.style.getPropertyValue('--window-top')) + 32}px`, width: source.style.getPropertyValue('--window-width'), height: source.style.getPropertyValue('--window-height'), transform: 'none', animation: 'none', transition: 'none', visibility: 'visible', opacity: '1' };
      Object.entries(geometry).forEach(([name, value]) => clone.style.setProperty(name, value, 'important'));
      stage.append(clone);
    });
    holder.replaceChildren(stage);
    restoreVisualScroll(scrollPositions);
    const fit = () => {
      const scale = Math.min(holder.clientWidth / window.innerWidth, holder.clientHeight / window.innerHeight);
      stage.style.width = `${window.innerWidth}px`;
      stage.style.height = `${window.innerHeight}px`;
      stage.style.transform = `scale(${scale})`;
      stage.style.left = `${(holder.clientWidth - window.innerWidth * scale) / 2}px`;
      stage.style.top = `${(holder.clientHeight - window.innerHeight * scale) / 2}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    return () => { observer.disconnect(); holder.replaceChildren(); };
  }, [windows, revision]);
  return <span className="ubuntu-window-overview__workspace-preview" ref={previewRef} aria-hidden="true" />;
}

export default function WindowOverview({ open, windows, activeWorkspace, workspaceCount, onWorkspace, onMoveWindow, onOpen, onFocus, onCloseWindow, onClose, onShowApps, revision }) {
  const [present, setPresent] = useState(open);
  const [previousOpen, setPreviousOpen] = useState(open);
  const [query, setQuery] = useState('');
  const [dropWorkspace, setDropWorkspace] = useState(null);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const previousFocus = useRef(null);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (open) { setPresent(true); setQuery(''); }
  }
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      inputRef.current?.focus();
      return undefined;
    }
    const timer = setTimeout(() => {
      if (rootRef.current?.contains(document.activeElement) && previousFocus.current?.isConnected) previousFocus.current.focus();
      setPresent(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [open]);
  const visible = windows.filter((item) => item.workspace === activeWorkspace && (appById(item.appId)?.name || 'Corbeille').toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const results = query ? DESKTOP_APPS.filter((app) => app.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())) : [];
  function acceptWorkspaceDrag(event, index) {
    if (!hasAppDrag(event) && ![...event.dataTransfer.types].includes(WINDOW_DRAG)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = hasAppDrag(event) ? 'copy' : 'move';
    setDropWorkspace(index);
  }
  if (!present) return null;
  return <div ref={rootRef} className={`ubuntu-window-overview ${open ? 'is-opening' : 'is-closing'}`} role="dialog" aria-modal={open} aria-hidden={!open} aria-label="Activités" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    if (event.key === 'Tab') {
      const elements = [...rootRef.current.querySelectorAll('button:not(:disabled), input')];
      if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1)?.focus(); }
      if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0]?.focus(); }
    }
  }}>
    <div className="ubuntu-window-overview__search"><Search size={18} /><input ref={inputRef} placeholder="Saisir pour rechercher" aria-label="Rechercher dans Activités" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { if (visible[0]) onFocus(visible[0].id); else if (results[0]) onOpen(results[0].id); } }} />{query && <button aria-label="Effacer la recherche" onClick={() => setQuery('')}><X size={16} /></button>}</div>
    <nav className="ubuntu-window-overview__workspaces" aria-label="Bureaux virtuels">
      {Array.from({ length: workspaceCount }, (_, index) => <button key={index} className={`ubuntu-window-overview__workspace ${index === activeWorkspace ? 'is-current' : ''} ${dropWorkspace === index ? 'is-drop-target' : ''}`} aria-label={`Bureau ${index + 1}`} aria-pressed={index === activeWorkspace} onClick={() => onWorkspace(index)}
        onDragEnter={(event) => acceptWorkspaceDrag(event, index)} onDragOver={(event) => acceptWorkspaceDrag(event, index)}
        onDragLeave={() => setDropWorkspace(null)} onDrop={(event) => { event.preventDefault(); setDropWorkspace(null); const id = readWindowDrag(event); if (id) onMoveWindow(id, index); else { const app = readAppDrag(event); if (app) { onOpen(app.id, { workspace: index, newWindow: true }); endAppDrag(); } } }}>
        <WorkspacePreview windows={windows.filter((item) => item.workspace === index)} revision={revision} /><span>{index + 1}</span>
      </button>)}
    </nav>
    <div className="ubuntu-window-overview__windows">
      {visible.map((item) => { const app = appById(item.appId); return <article key={item.id} className="ubuntu-window-overview__window" draggable onDragStart={(event) => { event.dataTransfer.setData(WINDOW_DRAG, JSON.stringify({ id: item.id })); event.dataTransfer.effectAllowed = 'move'; }}>
        <button className="ubuntu-window-overview__open" aria-label={`Activer ${app?.name || 'Corbeille'}`} onClick={() => onFocus(item.id)}><WindowPreview windowId={item.id} revision={revision} /><span><img src={app?.icon || '/ubuntu-apps/trash.png'} alt="" />{app?.name || 'Corbeille'}{item.minimized && <small>Réduite</small>}</span></button>
        <button className="ubuntu-window-overview__close" aria-label={`Fermer ${app?.name || 'Corbeille'} depuis Activités`} onClick={() => onCloseWindow(item.id)}><X size={16} /></button>
      </article>; })}
      {!visible.length && !query && <div className="ubuntu-window-overview__empty">Aucune fenêtre sur ce bureau</div>}
    </div>
    {query && <div className="ubuntu-window-overview__results">{results.map((app) => <button key={app.id} draggable onDragStart={(event) => writeAppDrag(event, app.id)} onDragEnd={endAppDrag} onClick={() => onOpen(app.id)}><img src={app.icon} alt="" draggable={false} />{app.name}</button>)}{!results.length && !visible.length && <p>Aucun résultat</p>}</div>}
    <button className="ubuntu-window-overview__show-apps" onClick={onShowApps}><Grid2X2 size={19} />Afficher les applications</button>
  </div>;
}
