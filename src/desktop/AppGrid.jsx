import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Pin, PinOff, Play, Plus } from 'lucide-react';
import { APPS_LAYOUT_EVENT, appById, endAppDrag, hasAppDrag, readAppDrag, readAppOrder, readDockFavorites, writeAppDrag, writeAppOrder, writeDockFavorites } from './apps';
import './AppGrid.css';

export default function AppGrid({ open = true, onOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [present, setPresent] = useState(open);
  const [previousOpen, setPreviousOpen] = useState(open);
  const [order, setOrder] = useState(readAppOrder);
  const [favorites, setFavorites] = useState(readDockFavorites);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [menu, setMenu] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const previousFocus = useRef(null);
  const menuRef = useRef(null);
  const menuTrigger = useRef(null);
  const instructionsId = useId();

  // Keep the overlay mounted during its closing animation and reset each new search.
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (open) {
      setQuery('');
      setPresent(true);
    }
  }

  useEffect(() => {
    if (open) {
      if (!panelRef.current?.contains(document.activeElement)) previousFocus.current = document.activeElement;
      const frame = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => {
      if (panelRef.current?.contains(document.activeElement) && previousFocus.current?.isConnected) previousFocus.current.focus();
      setPresent(false);
    }, 160);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    function syncLayout() { setOrder(readAppOrder()); setFavorites(readDockFavorites()); }
    function startDrag(event) { setDragging(event.detail?.id || null); setMenu(null); }
    function finishDrag() { setDragging(null); setDropTarget(null); }
    window.addEventListener(APPS_LAYOUT_EVENT, syncLayout);
    window.addEventListener('portfolio:app-drag-started', startDrag);
    window.addEventListener('portfolio:app-drag-ended', finishDrag);
    window.addEventListener('dragend', finishDrag);
    window.addEventListener('drop', finishDrag);
    window.addEventListener('blur', finishDrag);
    return () => {
      window.removeEventListener(APPS_LAYOUT_EVENT, syncLayout);
      window.removeEventListener('portfolio:app-drag-started', startDrag);
      window.removeEventListener('portfolio:app-drag-ended', finishDrag);
      window.removeEventListener('dragend', finishDrag);
      window.removeEventListener('drop', finishDrag);
      window.removeEventListener('blur', finishDrag);
    };
  }, []);

  useEffect(() => {
    function desktopShortcut() { onClose(); }
    window.addEventListener('portfolio:app-shortcut-created', desktopShortcut);
    return () => window.removeEventListener('portfolio:app-shortcut-created', desktopShortcut);
  }, [onClose]);

  useEffect(() => {
    if (!menu || !open) return;
    const frame = requestAnimationFrame(() => menuRef.current?.querySelector('button')?.focus());
    function outside(event) { if (!menuRef.current?.contains(event.target)) setMenu(null); }
    window.addEventListener('pointerdown', outside);
    window.addEventListener('resize', outside);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointerdown', outside); window.removeEventListener('resize', outside); };
  }, [menu, open]);

  const apps = order.map(appById).filter((app) => app.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  function restoreFocus() {
    if (panelRef.current?.contains(document.activeElement) && previousFocus.current?.isConnected) previousFocus.current.focus();
  }

  function closeOverview() { setMenu(null); restoreFocus(); onClose(); }
  function launchApplication(id, payload) { setMenu(null); restoreFocus(); onOpen(id, payload); }

  function handleKeys(event) {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeOverview();
    }
    if (event.key === 'Tab') {
      const controls = [...panelRef.current.querySelectorAll('[data-overview-control]')];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }

  function moveBetweenApps(event, index) {
    const buttons = [...panelRef.current.querySelectorAll('.ubuntu-overview__app')];
    const columns = buttons.filter((button) => button.offsetTop === buttons[0]?.offsetTop).length || 1;
    if (event.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      const id = apps[index]?.id;
      const position = order.indexOf(id);
      const change = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -columns : columns;
      const next = Math.max(0, Math.min(order.length - 1, position + change));
      const reordered = order.filter((appId) => appId !== id); reordered.splice(next, 0, id); writeAppOrder(reordered);
      setAnnouncement(`${appById(id).name}, position ${next + 1}.`); return;
    }
    let next;
    if (event.key === 'ArrowRight') next = Math.min(index + 1, buttons.length - 1);
    if (event.key === 'ArrowLeft') next = Math.max(index - 1, 0);
    if (event.key === 'ArrowDown') next = Math.min(index + columns, buttons.length - 1);
    if (event.key === 'ArrowUp') next = index - columns;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      if (next < 0) searchRef.current?.focus();
      else buttons[next]?.focus();
    }
  }

  function contextMenu(event, id) {
    event.preventDefault(); event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const keyboard = event.clientX === 0 && event.clientY === 0;
    menuTrigger.current = event.currentTarget;
    setMenu({ id, x: Math.max(8, Math.min(keyboard ? rect.left : event.clientX, window.innerWidth - 232)), y: Math.max(36, Math.min(keyboard ? rect.bottom : event.clientY, window.innerHeight - 158)) });
  }

  function acceptApp(event, id) {
    if (!hasAppDrag(event)) return;
    event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    setDropTarget({ id, after: event.clientX >= rect.left + rect.width / 2 });
  }

  function reorderApp(event, targetId) {
    if (!hasAppDrag(event)) return;
    event.preventDefault(); event.stopPropagation();
    const app = readAppDrag(event);
    if (app && app.id !== targetId) {
      const rect = event.currentTarget.getBoundingClientRect();
      const after = event.clientX >= rect.left + rect.width / 2;
      const reordered = order.filter((id) => id !== app.id);
      reordered.splice(reordered.indexOf(targetId) + (after ? 1 : 0), 0, app.id);
      writeAppOrder(reordered);
      setAnnouncement(`${app.name}, position ${reordered.indexOf(app.id) + 1}.`);
    }
    endAppDrag(); setDropTarget(null);
  }

  function menuKeys(event) {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); setMenu(null); menuTrigger.current?.focus(); return; }
    const buttons = [...menuRef.current.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (event.key === 'Tab') { event.preventDefault(); next = (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length; }
    if (next !== undefined) { event.preventDefault(); buttons[next]?.focus(); }
  }

  if (!present) return null;
  return <div className={`ubuntu-overview ${open ? 'is-opening' : 'is-closing'} ${dragging ? 'is-app-dragging' : ''}`} role="dialog" aria-modal={open} aria-hidden={!open}
    aria-label="Applications" aria-describedby={instructionsId} onKeyDown={handleKeys}
    onClick={(event) => { if (open && event.target === event.currentTarget) closeOverview(); }} onContextMenu={(event) => event.preventDefault()}>
    <div className="ubuntu-overview__panel" ref={panelRef}>
      <p id={instructionsId} className="ubuntu-overview__accessible">Rechercher une application, puis appuyer sur Entrée pour l’ouvrir. Utiliser les flèches pour parcourir les applications et Échap pour fermer.</p>
      <div className="ubuntu-overview__search">
        <Search size={18} aria-hidden="true" />
        <input ref={searchRef} data-overview-control tabIndex={open ? 0 : -1} value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher" aria-label="Rechercher une application" autoComplete="off" spellCheck="false"
          onKeyDown={(event) => {
            if (!apps.length) return;
            if (event.key === 'ArrowDown') { event.preventDefault(); panelRef.current.querySelector('.ubuntu-overview__app')?.focus(); }
            if (event.key === 'Enter') { event.preventDefault(); launchApplication(apps[0].id); }
          }} />
        {query && <button type="button" className="ubuntu-overview__clear" data-overview-control tabIndex={open ? 0 : -1}
          aria-label="Effacer la recherche" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><X size={17} aria-hidden="true" /></button>}
      </div>
      {query && <p className="ubuntu-overview__accessible" role="status">{apps.length} application{apps.length !== 1 ? 's' : ''} trouvée{apps.length !== 1 ? 's' : ''}</p>}
      <div className="ubuntu-overview__grid">{apps.map((app, index) => <button key={app.id} className={`ubuntu-overview__app ${dragging === app.id ? 'is-being-dragged' : ''}`} data-overview-control data-app-id={app.id}
        data-drop-before={dropTarget?.id === app.id && !dropTarget.after || undefined} data-drop-after={dropTarget?.id === app.id && dropTarget.after || undefined}
        draggable={open} tabIndex={open ? 0 : -1} onKeyDown={(event) => moveBetweenApps(event, index)} onClick={() => launchApplication(app.id)} onContextMenu={(event) => contextMenu(event, app.id)}
        onDragStart={(event) => writeAppDrag(event, app.id)} onDragEnd={endAppDrag} onDragEnter={(event) => acceptApp(event, app.id)} onDragOver={(event) => acceptApp(event, app.id)} onDrop={(event) => reorderApp(event, app.id)} onDragLeave={() => setDropTarget(null)}>
        <img src={app.icon} alt="" draggable="false" /><span>{app.name}</span>
      </button>)}</div>
      {!apps.length && <p className="ubuntu-overview__empty">Aucune application trouvée pour « {query} »</p>}
    </div>
    <span className="ubuntu-overview__accessible" role="status">{announcement}</span>
    {menu && open && createPortal(<div ref={menuRef} role="menu" aria-label={`Actions de ${appById(menu.id).name}`} className="ubuntu-launcher-menu"
      style={{ left: menu.x, top: menu.y }} onKeyDown={menuKeys} onContextMenu={(event) => event.preventDefault()}>
      <button role="menuitem" onClick={() => launchApplication(menu.id)}><Play size={16} />Ouvrir</button>
      {['files', 'terminal', 'editor'].includes(menu.id) && <button role="menuitem" onClick={() => launchApplication(menu.id, { newWindow: true })}><Plus size={16} />Nouvelle fenêtre</button>}
      <div role="separator" /><button role="menuitem" onClick={() => {
        const pinned = favorites.includes(menu.id);
        writeDockFavorites(pinned ? favorites.filter((id) => id !== menu.id) : [...favorites, menu.id]);
        setAnnouncement(`${appById(menu.id).name} ${pinned ? 'retiré des' : 'ajouté aux'} favoris.`); setMenu(null); menuTrigger.current?.focus();
      }}>{favorites.includes(menu.id) ? <PinOff size={16} /> : <Pin size={16} />}{favorites.includes(menu.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button>
    </div>, document.body)}
  </div>;
}
