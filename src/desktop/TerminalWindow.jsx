import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, Grid2X2, Maximize, Menu, Pin, Plus, Search, Terminal, X } from 'lucide-react';
import { displayPath, ROOT } from './virtualFs';
import './TerminalWindow.css';

const titleOf = (tab) => tab.label ? `${tab.label} — ${tab.title}` : tab.title;
const DEFAULT_FONT_SIZE = 14;

export default function TerminalWindow({ Session, ...props }) {
  const initial = props.initialTerminal;
  const firstCwd = initial?.session?.cwd || props.initialDirectory || ROOT;
  const nextId = useRef(2);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const overviewSearchRef = useRef(null);
  const searchRef = useRef(null);
  const sessionRefs = useRef(new Map());
  const closedTabs = useRef([]);
  const dialogRef = useRef(null);
  const renameRef = useRef(null);
  const cellRef = useRef(null);
  const [tabs, setTabs] = useState([{ id: 1, title: `ibrahim@ubuntu: ${displayPath(firstCwd)}`, directory: firstCwd, label: initial?.label || '', pinned: initial?.pinned || false, initialSession: initial?.session }]);
  const [activeId, setActiveId] = useState(1);
  const navigationKey = `${props.navigationRequest || 0}:${props.initialDirectory || ROOT}`;
  const [previousNavigation, setPreviousNavigation] = useState(navigationKey);
  const [closedCount, setClosedCount] = useState(0);
  const [menu, setMenu] = useState(null);
  const [menuTabId, setMenuTabId] = useState(null);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [overview, setOverview] = useState(false);
  const [overviewQuery, setOverviewQuery] = useState('');
  const [previews, setPreviews] = useState({});
  const [searchVisible, setSearchVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [searchCount, setSearchCount] = useState(0);
  const [searchIndex, setSearchIndex] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState('');
  const [terminalSize, setTerminalSize] = useState(null);
  const [contextPoint, setContextPoint] = useState(null);
  const activeTab = tabs.find((tab) => tab.id === activeId) || tabs[0];
  const menuTab = tabs.find((tab) => tab.id === menuTabId) || activeTab;
  const currentSession = () => sessionRefs.current.get(activeId);
  const focusSession = () => requestAnimationFrame(() => currentSession()?.focus());
  const restoreFocus = () => overview ? requestAnimationFrame(() => overviewSearchRef.current?.focus()) : focusSession();
  if (previousNavigation !== navigationKey) {
    setPreviousNavigation(navigationKey);
    setTabs((current) => current.map((tab) => tab.id === activeId ? { ...tab, directory: props.initialDirectory || ROOT, navigationRequest: navigationKey } : tab));
  }

  useEffect(() => {
    if (!menu) return undefined;
    menuRef.current?.querySelector('button:not(:disabled)')?.focus();
    const dismiss = (event) => {
      if (!menuRef.current?.contains(event.target) && !event.target.closest('[data-terminal-menu]')) setMenu(null);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [menu, menuTabId]);
  useEffect(() => { if (overview) overviewSearchRef.current?.focus(); }, [overview]);
  useEffect(() => { if (searchVisible) searchRef.current?.focus(); }, [searchVisible]);
  useEffect(() => {
    if (!dialog) return;
    const element = dialogRef.current;
    element.showModal();
    if (dialog.kind === 'rename') { renameRef.current?.focus(); renameRef.current?.select(); }
    else element.querySelector('button')?.focus();
    return () => element.close();
  }, [dialog]);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2800);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const root = rootRef.current;
    let previousSize;
    let timer;
    const measure = () => {
      const output = root.querySelector('.ubuntu-terminal__session:not([hidden]) .ubuntu-terminal__output');
      if (!output) return;
      const style = getComputedStyle(output);
      const cell = cellRef.current.getBoundingClientRect();
      const columns = Math.max(1, Math.floor((output.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)) / Math.max(1, cell.width)));
      const rows = Math.max(1, Math.floor((output.clientHeight - Number.parseFloat(style.paddingTop) - Number.parseFloat(style.paddingBottom)) / Math.max(1, cell.height)));
      const size = `${columns} × ${rows}`;
      if (previousSize && size !== previousSize && !root.querySelector('.ptyxis-overview')) {
        setTerminalSize(size);
        clearTimeout(timer);
        timer = setTimeout(() => setTerminalSize(null), 1000);
      }
      previousSize = size;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [fontSize, activeId, searchVisible]);

  function activate(id) {
    setActiveId(id); setMenu(null); setOverview(false); setSearchIndex(0);
    requestAnimationFrame(() => sessionRefs.current.get(id)?.focus());
  }
  function addTab() {
    const directory = currentSession()?.getSnapshot().cwd || firstCwd;
    const id = nextId.current++;
    setTabs((current) => [...current, { id, directory, title: `ibrahim@ubuntu: ${displayPath(directory)}`, label: '', pinned: false }]);
    activate(id);
  }
  function closeTab(id) {
    const tab = tabs.find((item) => item.id === id);
    if (!tab) return;
    closedTabs.current = [{ ...tab, initialSession: sessionRefs.current.get(id)?.getSnapshot() }, ...closedTabs.current].slice(0, 10);
    setClosedCount(closedTabs.current.length);
    if (tabs.length === 1) { props.onClose?.(); return; }
    const index = tabs.indexOf(tab);
    const remaining = tabs.filter((item) => item.id !== id);
    setTabs(remaining); setMenu(null);
    if (activeId === id) setActiveId(remaining[Math.min(index, remaining.length - 1)].id);
    restoreFocus();
  }
  function restoreTab() {
    const tab = closedTabs.current.shift();
    if (!tab) return;
    setClosedCount(closedTabs.current.length);
    const id = nextId.current++;
    setTabs((current) => [...current.filter((item) => item.pinned), ...(tab.pinned ? [{ ...tab, id }] : []), ...current.filter((item) => !item.pinned), ...(!tab.pinned ? [{ ...tab, id }] : [])]);
    activate(id);
  }
  function closeOtherTabs(id) {
    const removed = tabs.filter((tab) => tab.id !== id && !tab.pinned);
    closedTabs.current = [...removed.map((tab) => ({ ...tab, initialSession: sessionRefs.current.get(tab.id)?.getSnapshot() })), ...closedTabs.current].slice(0, 10);
    setClosedCount(closedTabs.current.length);
    setTabs((current) => current.filter((tab) => tab.id === id || tab.pinned));
    setActiveId(id); setMenu(null);
    restoreFocus();
  }
  function toggleOverview() {
    setMenu(null);
    if (overview) { setOverview(false); focusSession(); return; }
    setPreviews(Object.fromEntries(tabs.map((tab) => [tab.id, sessionRefs.current.get(tab.id)?.getSnapshot()])));
    setOverviewQuery(''); setOverview(true);
  }
  function moveTab(id, direction) {
    setTabs((current) => {
      const index = current.findIndex((tab) => tab.id === id);
      const neighbor = index + direction;
      if (!current[neighbor] || current[index].pinned !== current[neighbor].pinned) return current;
      const next = [...current];
      [next[index], next[neighbor]] = [next[neighbor], next[index]];
      return next;
    });
    setMenu(null);
    restoreFocus();
  }
  function pinTab(id) {
    setTabs((current) => current.map((tab) => tab.id === id ? { ...tab, pinned: !tab.pinned } : tab).sort((a, b) => Number(b.pinned) - Number(a.pinned)));
    setMenu(null);
    restoreFocus();
  }
  function newWindow(tab) {
    const session = sessionRefs.current.get(tab?.id || activeId)?.getSnapshot();
    props.onNewWindow?.(tab ? { session, label: tab.label, pinned: tab.pinned } : { session: { cwd: session?.cwd || firstCwd } });
    if (tab) closeTab(tab.id);
    setMenu(null);
  }
  function showSearch() { setMenu(null); setOverview(false); setSearchVisible(true); requestAnimationFrame(() => searchRef.current?.focus()); }
  function navigateSearch(direction) { setSearchIndex((index) => searchCount ? (index + direction + searchCount) % searchCount : 0); }
  async function toggleFullscreen() {
    setMenu(null);
    try {
      if (document.fullscreenElement === rootRef.current) await document.exitFullscreen();
      else await rootRef.current.requestFullscreen();
    } catch { setNotice('Le navigateur n’a pas autorisé le plein écran.'); }
  }
  async function copyText() {
    const selected = window.getSelection();
    const input = rootRef.current.querySelector('.ubuntu-terminal__session:not([hidden]) input');
    const text = rootRef.current.contains(selected?.anchorNode) ? selected.toString() : input?.value.slice(input.selectionStart, input.selectionEnd);
    if (!text) { setMenu(null); return; }
    try { await navigator.clipboard.writeText(text); setNotice('Texte copié dans le presse-papiers.'); }
    catch { setNotice('La copie n’est pas disponible dans ce navigateur.'); }
    setMenu(null);
  }
  async function pasteText() {
    setMenu(null);
    try { currentSession()?.paste(await navigator.clipboard.readText()); }
    catch { setNotice('Utilisez Ctrl+V dans la ligne de commande pour coller.'); focusSession(); }
  }
  function openTabMenu(id, event) {
    event?.preventDefault(); event?.stopPropagation();
    setMenuTabId(id); setMenu('tab');
  }
  function selectOutput() {
    const output = rootRef.current.querySelector('.ubuntu-terminal__session:not([hidden]) .ubuntu-terminal__output');
    if (!output) return;
    const range = document.createRange();
    range.selectNodeContents(output);
    const selection = window.getSelection();
    selection?.removeAllRanges(); selection?.addRange(range);
    setMenu(null);
  }
  function renameTab(tab) { setMenu(null); setRenameValue(tab.label || ''); setDialog({ kind: 'rename', id: tab.id }); }
  function closeDialog() { setDialog(null); if (overview) requestAnimationFrame(() => overviewSearchRef.current?.focus()); else focusSession(); }

  function keyboard(event) {
    if (event.metaKey || event.defaultPrevented || dialog) return;
    const key = event.key.toLowerCase();
    let handled = true;
    if (event.ctrlKey && event.shiftKey && event.altKey && key === 't') restoreTab();
    else if (event.ctrlKey && event.shiftKey && !event.altKey && key === 't') addTab();
    else if (event.ctrlKey && event.shiftKey && !event.altKey && key === 'n') newWindow();
    else if (event.ctrlKey && event.shiftKey && key === 'o') toggleOverview();
    else if (event.ctrlKey && event.shiftKey && key === 'w') closeTab(activeId);
    else if (event.ctrlKey && event.shiftKey && key === 'q') props.onClose?.();
    else if (event.ctrlKey && event.shiftKey && key === 'f') showSearch();
    else if (event.ctrlKey && event.shiftKey && key === 'c') copyText();
    else if (event.ctrlKey && event.shiftKey && key === 'v') pasteText();
    else if (event.ctrlKey && event.shiftKey && key === 'a') selectOutput();
    else if (event.ctrlKey && ['PageUp', 'PageDown'].includes(event.key)) {
      const direction = event.key === 'PageDown' ? 1 : -1;
      if (event.shiftKey) moveTab(activeId, direction);
      else activate(tabs[(tabs.findIndex((tab) => tab.id === activeId) + direction + tabs.length) % tabs.length].id);
    } else if (event.altKey && !event.ctrlKey && /^\d$/.test(key)) { const tab = tabs[key === '0' ? 9 : Number(key) - 1]; if (tab) activate(tab.id); }
    else if (event.altKey && key === ',') openTabMenu(activeId);
    else if (event.ctrlKey && ['+', '=', '-', '0'].includes(key)) setFontSize((size) => key === '0' ? DEFAULT_FONT_SIZE : Math.max(8, Math.min(32, size + (key === '-' ? -1 : 1))));
    else if (event.ctrlKey && key === '?') { setMenu(null); setDialog({ kind: 'shortcuts' }); }
    else if (event.key === 'F11') toggleFullscreen();
    else if (event.key === 'F10') { if (event.shiftKey) { setContextPoint(null); setMenu('context'); } else setMenu(menu === 'main' ? null : 'main'); }
    else if (event.key === 'Escape') {
      if (menu) { setMenu(null); if (overview) overviewSearchRef.current?.focus(); else focusSession(); }
      else if (overview) { setOverview(false); focusSession(); }
      else if (searchVisible) { setSearchVisible(false); setSearch(''); focusSession(); }
      else handled = false;
    } else handled = false;
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  }

  const filtered = tabs.filter((tab) => titleOf(tab).toLocaleLowerCase().includes(overviewQuery.toLocaleLowerCase()));
  return <div ref={rootRef} className={`ubuntu-terminal ptyxis ${fullscreen ? 'is-fullscreen' : ''}`} style={{ '--terminal-font-size': `${fontSize}px` }} onKeyDown={keyboard} onContextMenu={(event) => {
    if (!event.target.closest('.ubuntu-terminal__pane')) return;
    event.preventDefault();
    const bounds = rootRef.current.getBoundingClientRect();
    setContextPoint({ left: Math.max(6, Math.min(event.clientX - bounds.left, bounds.width - 300)), top: Math.max(52, Math.min(event.clientY - bounds.top, bounds.height - 285)) });
    setMenu('context');
  }}>
    <span ref={cellRef} className="ptyxis__cell-measure" aria-hidden="true">M</span>
    <div className="ubuntu-terminal__chrome ptyxis__header">
      <div className="ptyxis__new-terminal"><button aria-label="Nouvel onglet" title="Nouvel onglet (Ctrl+Maj+T)" onClick={addTab}><Plus size={18} /></button><button data-terminal-menu aria-label="Profils du terminal" aria-expanded={menu === 'profiles'} onClick={() => setMenu(menu === 'profiles' ? null : 'profiles')}><ChevronDown size={14} /></button></div>
      <div className="ptyxis__title" title={titleOf(activeTab)} onContextMenu={(event) => openTabMenu(activeId, event)}><strong>{titleOf(activeTab)}</strong><small>Ubuntu</small></div>
      <button aria-label="Afficher les onglets ouverts" title="Afficher les onglets ouverts (Ctrl+Maj+O)" aria-pressed={overview} onClick={toggleOverview}><Grid2X2 size={17} /><span className="ptyxis__tab-count">{tabs.length}</span></button>
      <button data-terminal-menu aria-label="Menu du terminal" aria-expanded={menu === 'main'} onClick={() => setMenu(menu === 'main' ? null : 'main')}><Menu size={18} /></button>
      {fullscreen && <button aria-label="Quitter le plein écran" onClick={toggleFullscreen}><Maximize size={17} /></button>}
    </div>
    {tabs.map((tab) => <div key={tab.id} className="ubuntu-terminal__session" data-terminal-tab={tab.id} hidden={tab.id !== activeId} inert={overview ? true : undefined} aria-hidden={overview ? true : undefined}><Session {...props} ref={(session) => { if (session) sessionRefs.current.set(tab.id, session); else sessionRefs.current.delete(tab.id); }} initialSession={tab.initialSession} initialDirectory={tab.directory} navigationRequest={tab.navigationRequest || 0} active={tab.id === activeId && !overview} search={searchVisible ? search : ''} searchIndex={searchCount ? Math.min(searchIndex, searchCount - 1) : 0} onSearchCount={setSearchCount} onExit={() => closeTab(tab.id)} onDirectoryChange={(cwd) => setTabs((current) => current.map((item) => item.id === tab.id && item.directory !== cwd ? { ...item, directory: cwd, title: `ibrahim@ubuntu: ${displayPath(cwd)}` } : item))} /></div>)}
    {searchVisible && !overview && <div className="ptyxis-find"><Search size={16} /><input ref={searchRef} type="search" aria-label="Rechercher dans le terminal" placeholder="Rechercher…" value={search} onChange={(event) => { setSearch(event.target.value); setSearchIndex(0); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); navigateSearch(event.shiftKey ? -1 : 1); } }} /><span role="status">{searchCount ? `${Math.min(searchIndex + 1, searchCount)} sur ${searchCount}` : search ? 'Aucun résultat' : ''}</span><button aria-label="Résultat précédent" disabled={!searchCount} onClick={() => navigateSearch(-1)}><ArrowUp size={16} /></button><button aria-label="Résultat suivant" disabled={!searchCount} onClick={() => navigateSearch(1)}><ArrowDown size={16} /></button><button aria-label="Fermer la recherche" onClick={() => { setSearchVisible(false); setSearch(''); focusSession(); }}><X size={16} /></button></div>}
    {overview && <div className="ptyxis-overview" role="region" aria-label="Aperçu des onglets"><div className="ptyxis-overview__search"><Search size={17} /><input ref={overviewSearchRef} type="search" aria-label="Rechercher un onglet" placeholder="Rechercher des onglets…" value={overviewQuery} onChange={(event) => setOverviewQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && filtered[0]) { event.preventDefault(); activate(filtered[0].id); } }} /></div><div className="ptyxis-overview__grid">{filtered.map((tab) => <article key={tab.id} className={`ptyxis-thumbnail ${tab.id === activeId ? 'is-selected' : ''}`} onContextMenu={(event) => openTabMenu(tab.id, event)}>
      <button className="ptyxis-thumbnail__activate" aria-label={`Ouvrir l’onglet ${titleOf(tab)}`} aria-pressed={tab.id === activeId} onClick={() => activate(tab.id)}><div className="ptyxis-thumbnail__screen" aria-hidden="true">{[...(previews[tab.id]?.lines || []), `${promptPreview(previews[tab.id]?.cwd || tab.directory)} ${previews[tab.id]?.command || ''}`].slice(-14).map((line, index) => <div key={index}>{line || '\u00a0'}</div>)}</div><div className="ptyxis-thumbnail__caption"><Terminal size={15} /><span>{titleOf(tab)}</span>{tab.pinned && <Pin size={13} />}</div></button>
      {!tab.pinned && <button className="ptyxis-thumbnail__close" aria-label={`Fermer l’onglet ${titleOf(tab)}`} onClick={() => closeTab(tab.id)}><X size={13} /></button>}
    </article>)}</div>{!filtered.length && <div className="ptyxis-overview__empty"><Search size={52} /><h3>Aucun onglet trouvé</h3></div>}<button className="ptyxis-overview__new" onClick={addTab}><Plus size={17} />Nouvel onglet</button></div>}
    {menu && <div ref={menuRef} className={`ubuntu-app-popover ubuntu-terminal__menu ptyxis__menu ${menu === 'profiles' ? 'is-profiles' : ''}`} style={menu === 'context' && contextPoint ? { ...contextPoint, right: 'auto', maxHeight: 'calc(100% - 58px)' } : undefined} role="menu" aria-label={menu === 'tab' ? 'Actions de l’onglet' : 'Actions du terminal'} onKeyDown={(event) => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) || event.target.matches('input')) return;
      event.preventDefault(); event.stopPropagation();
      const buttons = [...menuRef.current.querySelectorAll('button:not(:disabled)')];
      const index = buttons.indexOf(document.activeElement);
      buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    }}>
      {menu === 'context' ? <><button role="menuitem" onClick={copyText}>Copier<kbd>Ctrl+Maj+C</kbd></button><button role="menuitem" onClick={pasteText}>Coller<kbd>Ctrl+Maj+V</kbd></button><button role="menuitem" onClick={selectOutput}>Tout sélectionner<kbd>Ctrl+Maj+A</kbd></button><hr /><button role="menuitem" onClick={showSearch}>Rechercher…<kbd>Ctrl+Maj+F</kbd></button><button role="menuitem" onClick={() => renameTab(activeTab)}>Définir le titre…</button><button role="menuitem" onClick={() => { currentSession()?.reset(); setMenu(null); focusSession(); }}>Réinitialiser et effacer</button></> : menu === 'profiles' ? <><strong>Profils</strong><button role="menuitem" onClick={addTab}><Terminal size={16} />Ubuntu<Check size={15} /></button></> : menu === 'tab' ? <>
        <button role="menuitem" disabled={tabs.indexOf(menuTab) === 0 || tabs[tabs.indexOf(menuTab) - 1]?.pinned !== menuTab.pinned} onClick={() => moveTab(menuTab.id, -1)}>Déplacer vers la gauche</button><button role="menuitem" disabled={tabs.indexOf(menuTab) === tabs.length - 1 || tabs[tabs.indexOf(menuTab) + 1]?.pinned !== menuTab.pinned} onClick={() => moveTab(menuTab.id, 1)}>Déplacer vers la droite</button><button role="menuitem" onClick={() => newWindow(menuTab)}>Déplacer vers une nouvelle fenêtre</button><hr /><button role="menuitem" onClick={() => pinTab(menuTab.id)}>{menuTab.pinned ? 'Désépingler' : 'Épingler'} l’onglet</button><button role="menuitem" onClick={() => renameTab(menuTab)}>Définir le titre…</button><hr /><button role="menuitem" disabled={tabs.length === 1} onClick={() => closeOtherTabs(menuTab.id)}>Fermer les autres onglets</button><button role="menuitem" onClick={() => closeTab(menuTab.id)}>Fermer l’onglet<kbd>Ctrl+Maj+W</kbd></button>
      </> : <>
        <div className="ubuntu-terminal__zoom"><button aria-label="Réduire le texte" onClick={() => setFontSize((size) => Math.max(8, size - 1))}>−</button><button aria-label="Rétablir la taille du texte" onClick={() => setFontSize(DEFAULT_FONT_SIZE)}>{Math.round(fontSize / DEFAULT_FONT_SIZE * 100)} %</button><button aria-label="Agrandir le texte" onClick={() => setFontSize((size) => Math.min(32, size + 1))}>+</button></div>
        <button role="menuitem" onClick={addTab}>Nouvel onglet<kbd>Ctrl+Maj+T</kbd></button><button role="menuitem" onClick={() => newWindow()}>Nouvelle fenêtre<kbd>Ctrl+Maj+N</kbd></button><button role="menuitem" onClick={toggleOverview}>Afficher les onglets ouverts<kbd>Ctrl+Maj+O</kbd></button><hr /><button role="menuitem" onClick={showSearch}>Rechercher…<kbd>Ctrl+Maj+F</kbd></button><button role="menuitem" onClick={copyText}>Copier<kbd>Ctrl+Maj+C</kbd></button><button role="menuitem" onClick={pasteText}>Coller<kbd>Ctrl+Maj+V</kbd></button><button role="menuitem" onClick={toggleFullscreen}>{fullscreen ? 'Quitter le plein écran' : 'Plein écran'}<kbd>F11</kbd></button><hr /><button role="menuitem" onClick={() => { currentSession()?.reset(); setMenu(null); focusSession(); }}>Réinitialiser et effacer</button><button role="menuitem" disabled={!closedCount} onClick={restoreTab}>Rouvrir l’onglet fermé</button><button role="menuitem" onClick={() => { setMenu(null); setDialog({ kind: 'shortcuts' }); }}>Raccourcis clavier</button><button role="menuitem" onClick={() => { setMenu(null); setDialog({ kind: 'about' }); }}>À propos de Terminal</button>
      </>}
    </div>}
    {dialog && <dialog ref={dialogRef} className="ptyxis-dialog" aria-label={dialog.kind === 'rename' ? 'Définir le titre' : dialog.kind === 'shortcuts' ? 'Raccourcis clavier' : 'À propos de Terminal'} onCancel={(event) => { event.preventDefault(); closeDialog(); }}>
      <header><h2>{dialog.kind === 'rename' ? 'Définir le titre' : dialog.kind === 'shortcuts' ? 'Raccourcis clavier' : 'Terminal'}</h2><button aria-label="Fermer" onClick={closeDialog}><X size={16} /></button></header>
      {dialog.kind === 'rename' ? <form onSubmit={(event) => { event.preventDefault(); setTabs((current) => current.map((tab) => tab.id === dialog.id ? { ...tab, label: renameValue.trim() } : tab)); closeDialog(); }}><p>Ajoutez un nom pour retrouver cette session. Laissez le champ vide pour utiliser le titre automatique.</p><label htmlFor="ptyxis-tab-title">Titre</label><input ref={renameRef} id="ptyxis-tab-title" maxLength={100} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /><footer><button type="button" onClick={closeDialog}>Annuler</button><button type="submit">Enregistrer</button></footer></form> : dialog.kind === 'shortcuts' ? <dl>{[['Nouvel onglet', 'Ctrl+Maj+T'], ['Nouvelle fenêtre', 'Ctrl+Maj+N'], ['Aperçu des onglets', 'Ctrl+Maj+O'], ['Onglet précédent / suivant', 'Ctrl+Page ↑ / ↓'], ['Déplacer l’onglet', 'Ctrl+Maj+Page ↑ / ↓'], ['Onglet 1 à 10', 'Alt+1 à 0'], ['Fermer l’onglet', 'Ctrl+Maj+W'], ['Rouvrir l’onglet', 'Ctrl+Alt+Maj+T'], ['Rechercher', 'Ctrl+Maj+F'], ['Copier / coller', 'Ctrl+Maj+C / V'], ['Zoom', 'Ctrl++ / − / 0'], ['Plein écran', 'F11']].map(([label, shortcut]) => <div key={label}><dt>{label}</dt><dd><kbd>{shortcut}</kbd></dd></div>)}</dl> : <div className="ptyxis-about"><Terminal size={56} /><h3>Terminal</h3><p>Bureau d’Ibrahim Chehlafi</p><p>Interface inspirée de Ptyxis. Les commandes manipulent les fichiers de ce bureau.</p></div>}
    </dialog>}
    {notice && <div className="ptyxis__notice" role="status">{notice}</div>}
    {terminalSize && !overview && <div className="ptyxis__size" aria-hidden="true">{terminalSize}</div>}
  </div>;
}

function promptPreview(cwd) { return `ibrahim@ubuntu:${displayPath(cwd)}$`; }
