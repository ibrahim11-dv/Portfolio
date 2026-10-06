import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Grid2X2, Pin, PinOff, Power, Play, Plus } from 'lucide-react';
import { APPS_LAYOUT_EVENT, appById, endAppDrag, hasAppDrag, readAppDrag, readDockFavorites, writeAppDrag, writeDockFavorites } from './apps';
import { readFileDrag } from './dragDrop';
import './DesktopDock.css';

export default function DesktopDock({ openApps, activeApp, onOpen, onLaunch = onOpen, onQuit, onShowApps, onTrashPaths, isFileProtected = () => true }) {
  const [favorites, setFavorites] = useState(readDockFavorites);
  const [launching, setLaunching] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [menu, setMenu] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [trashDrop, setTrashDrop] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const appsRef = useRef(null);
  const menuRef = useRef(null);
  const menuTrigger = useRef(null);
  const launchTimer = useRef(null);
  const tooltipId = useId();
  const dockApps = [...favorites, ...new Set(openApps.filter((id) => !favorites.includes(id) && appById(id)))];

  useEffect(() => {
    function syncLayout() { setFavorites(readDockFavorites()); }
    function startDrag(event) { setDragging(event.detail?.id || null); setTooltip(null); setMenu(null); }
    function finishDrag() { setDragging(null); setDropIndex(null); setTrashDrop(null); }
    window.addEventListener(APPS_LAYOUT_EVENT, syncLayout);
    window.addEventListener('portfolio:app-drag-started', startDrag);
    window.addEventListener('portfolio:app-drag-ended', finishDrag);
    window.addEventListener('dragend', finishDrag);
    window.addEventListener('drop', finishDrag);
    window.addEventListener('blur', finishDrag);
    return () => {
      clearTimeout(launchTimer.current);
      window.removeEventListener(APPS_LAYOUT_EVENT, syncLayout);
      window.removeEventListener('portfolio:app-drag-started', startDrag);
      window.removeEventListener('portfolio:app-drag-ended', finishDrag);
      window.removeEventListener('dragend', finishDrag);
      window.removeEventListener('drop', finishDrag);
      window.removeEventListener('blur', finishDrag);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const frame = requestAnimationFrame(() => menuRef.current?.querySelector('button')?.focus());
    function outside(event) { if (!menuRef.current?.contains(event.target)) setMenu(null); }
    window.addEventListener('pointerdown', outside);
    window.addEventListener('resize', outside);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointerdown', outside); window.removeEventListener('resize', outside); };
  }, [menu]);

  function showTooltip(event, id, label, keyboard = false) {
    if (menu || dragging || (keyboard && !event.currentTarget.matches(':focus-visible'))) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 620px)').matches;
    const tooltipHalfWidth = Math.min(label.length * 7 + 24, 254) / 2;
    const center = Math.max(tooltipHalfWidth + 10, Math.min(rect.left + rect.width / 2, window.innerWidth - tooltipHalfWidth - 10));
    setTooltip({ id, label, keyboard, mobile, x: mobile ? center : rect.right + 12, y: mobile ? rect.top - 10 : rect.top + rect.height / 2 });
  }

  function tooltipEvents(id, label) {
    return {
      onMouseEnter: (event) => showTooltip(event, id, label), onMouseLeave: () => setTooltip(null),
      onFocus: (event) => showTooltip(event, id, label, true), onBlur: () => setTooltip(null),
      'aria-describedby': tooltip?.id === id ? tooltipId : undefined,
    };
  }

  function launch(id, forceOpen = false) {
    setTooltip(null); setMenu(null);
    if (!openApps.includes(id)) {
      clearTimeout(launchTimer.current);
      setLaunching(id);
      launchTimer.current = setTimeout(() => setLaunching(null), 450);
    }
    (forceOpen ? onLaunch : onOpen)(id);
  }

  function contextMenu(event, id) {
    event.preventDefault(); event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const fromKeyboard = event.clientX === 0 && event.clientY === 0;
    menuTrigger.current = event.currentTarget;
    setTooltip(null);
    const height = ['files', 'terminal', 'editor'].includes(id) ? 214 : 174;
    setMenu({ id, x: Math.max(8, Math.min(fromKeyboard ? rect.right + 8 : event.clientX, window.innerWidth - 232)), y: Math.max(36, Math.min(fromKeyboard ? rect.top : event.clientY, window.innerHeight - height)) });
  }

  function moveFavorite(event, id) {
    if (!event.altKey || !favorites.includes(id) || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const index = favorites.indexOf(id);
    const next = Math.max(0, Math.min(favorites.length - 1, index + (['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1)));
    const reordered = favorites.filter((favorite) => favorite !== id);
    reordered.splice(next, 0, id); writeDockFavorites(reordered);
    setAnnouncement(`${appById(id).name}, position ${next + 1} dans les favoris.`);
  }

  function insertionIndex(event) {
    const horizontal = window.matchMedia('(max-width: 620px)').matches;
    const position = horizontal ? event.clientX : event.clientY;
    const buttons = [...appsRef.current.querySelectorAll('[data-favorite="true"]')];
    const index = buttons.findIndex((button) => { const rect = button.getBoundingClientRect(); return position < (horizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2); });
    return index < 0 ? favorites.length : index;
  }

  function acceptApp(event) {
    if (!hasAppDrag(event)) return;
    event.preventDefault(); event.stopPropagation();
    event.dataTransfer.dropEffect = favorites.includes(dragging) ? 'move' : 'copy';
    setDropIndex(insertionIndex(event));
  }

  function dropApp(event) {
    if (!hasAppDrag(event)) return;
    event.preventDefault(); event.stopPropagation();
    const app = readAppDrag(event);
    if (app) {
      const index = insertionIndex(event);
      const oldIndex = favorites.indexOf(app.id);
      const reordered = favorites.filter((id) => id !== app.id);
      reordered.splice(Math.max(0, index - (oldIndex >= 0 && oldIndex < index ? 1 : 0)), 0, app.id);
      writeDockFavorites(reordered);
      setAnnouncement(`${app.name} ${oldIndex < 0 ? 'ajouté aux' : 'déplacé dans les'} favoris.`);
    }
    setDropIndex(null); endAppDrag();
  }

  function acceptTrash(event) {
    const paths = readFileDrag(event);
    if (!paths.length) return;
    event.preventDefault(); event.stopPropagation();
    const allowed = paths.every((path) => !isFileProtected(path));
    event.dataTransfer.dropEffect = allowed ? 'move' : 'none';
    setTrashDrop(allowed ? 'allowed' : 'denied'); setTooltip(null);
  }

  function dropTrash(event) {
    const paths = readFileDrag(event);
    if (!paths.length) return;
    event.preventDefault(); event.stopPropagation();
    if (paths.every((path) => !isFileProtected(path))) { onTrashPaths?.(paths); setAnnouncement(`${paths.length} élément${paths.length > 1 ? 's' : ''} déplacé${paths.length > 1 ? 's' : ''} dans la corbeille.`); }
    else setAnnouncement('Les éléments du portfolio sont protégés. Seules vos créations peuvent être supprimées.');
    setTrashDrop(null);
  }

  function menuKeys(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setMenu(null); menuTrigger.current?.focus(); return; }
    const buttons = [...menuRef.current.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next !== undefined) { event.preventDefault(); buttons[next]?.focus(); }
  }

  return <>
    <aside className={`ubuntu-dock ${dragging ? 'is-app-dragging' : ''}`} aria-label="Applications favorites et ouvertes" onContextMenu={(event) => event.preventDefault()}
      onDragEnter={(event) => { if (!event.target.closest('.ubuntu-dock__bottom')) acceptApp(event); }}
      onDragOver={(event) => { if (!event.target.closest('.ubuntu-dock__bottom')) acceptApp(event); }}
      onDrop={(event) => { if (!event.target.closest('.ubuntu-dock__bottom')) dropApp(event); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropIndex(null); }}>
      <div className="ubuntu-dock__apps" ref={appsRef} onDragEnter={acceptApp} onDragOver={acceptApp} onDrop={dropApp}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropIndex(null); }}>
        {dockApps.map((id, index) => {
          const app = appById(id);
          const isOpen = openApps.includes(id);
          return <button key={id} className={`ubuntu-dock__item ${activeApp === id ? 'is-active' : ''} ${launching === id ? 'is-launching' : ''} ${dragging === id ? 'is-being-dragged' : ''}`}
            data-app-launcher={id} data-favorite={favorites.includes(id)} data-drop-before={dropIndex === index || undefined}
            data-drop-after={dropIndex === favorites.length && index === dockApps.length - 1 && favorites.length === dockApps.length || undefined}
            aria-label={`${app.name}${isOpen ? ' · ouvert' : ''}`} aria-pressed={activeApp === id}
            draggable {...tooltipEvents(id, app.name)} onClick={() => launch(id)} onContextMenu={(event) => contextMenu(event, id)}
            onKeyDown={(event) => moveFavorite(event, id)} onDragStart={(event) => writeAppDrag(event, id)} onDragEnd={endAppDrag}>
            <span className="ubuntu-dock__icon"><img src={app.icon} alt="" draggable="false" /></span>
            {isOpen && <span className="ubuntu-dock__running" aria-hidden="true" />}
          </button>;
        })}
        {!dockApps.length && <div className={`ubuntu-dock__empty ${dropIndex !== null ? 'is-drop-target' : ''}`} aria-label="Déposer une application pour l’ajouter aux favoris" />}
      </div>
      <div className="ubuntu-dock__bottom">
        <button className="ubuntu-dock__item" data-app-launcher="applications" aria-label="Afficher les applications"
          {...tooltipEvents('applications', 'Afficher les applications')} onClick={() => { setTooltip(null); setMenu(null); onShowApps(); }}>
          <span className="ubuntu-dock__icon ubuntu-dock__icon--grid"><Grid2X2 size={22} strokeWidth={1.7} /></span>
        </button>
        <span className="ubuntu-dock__separator" />
        <button className={`ubuntu-dock__item ubuntu-dock__trash ${activeApp === 'trash' ? 'is-active' : ''} ${launching === 'trash' ? 'is-launching' : ''} ${trashDrop ? `is-drop-${trashDrop}` : ''}`}
          data-app-launcher="trash" aria-label="Corbeille" aria-pressed={activeApp === 'trash'} {...tooltipEvents('trash', 'Corbeille')} onClick={() => launch('trash')}
          onDragEnter={acceptTrash} onDragOver={acceptTrash} onDrop={dropTrash} onDragLeave={() => setTrashDrop(null)} onContextMenu={(event) => contextMenu(event, 'trash')}>
          <span className="ubuntu-dock__icon"><img src="/ubuntu-apps/trash.png" alt="" draggable="false" /></span>
          {openApps.includes('trash') && <span className="ubuntu-dock__running" aria-hidden="true" />}
        </button>
      </div>
    </aside>
    {tooltip && createPortal(<span id={tooltipId} role="tooltip" className={`ubuntu-dock__tooltip ${tooltip.mobile ? 'is-mobile' : ''} ${tooltip.keyboard ? 'is-keyboard' : ''}`}
      style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.label}</span>, document.body)}
    {menu && createPortal(<div ref={menuRef} role="menu" aria-label={`Actions de ${appById(menu.id)?.name || 'la corbeille'}`} className="ubuntu-launcher-menu"
      style={{ left: menu.x, top: menu.y }} onKeyDown={menuKeys} onContextMenu={(event) => event.preventDefault()}>
      <button role="menuitem" onClick={() => launch(menu.id, true)}><Play size={16} />Ouvrir</button>
      {['files', 'terminal', 'editor'].includes(menu.id) && <button role="menuitem" onClick={() => { onLaunch(menu.id, { newWindow: true }); setMenu(null); }}><Plus size={16} />Nouvelle fenêtre</button>}
      {menu.id !== 'trash' && <><div role="separator" /><button role="menuitem" onClick={() => {
        const pinned = favorites.includes(menu.id);
        writeDockFavorites(pinned ? favorites.filter((id) => id !== menu.id) : [...favorites, menu.id]);
        setAnnouncement(`${appById(menu.id).name} ${pinned ? 'retiré des' : 'ajouté aux'} favoris.`); setMenu(null);
      }}>{favorites.includes(menu.id) ? <PinOff size={16} /> : <Pin size={16} />}{favorites.includes(menu.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button></>}
      {openApps.includes(menu.id) && onQuit && <><div role="separator" /><button role="menuitem" onClick={() => { onQuit(menu.id); setMenu(null); }}><Power size={16} />Quitter</button></>}
    </div>, document.body)}
    <span className="ubuntu-launcher-announcement" role="status">{announcement}</span>
  </>;
}
