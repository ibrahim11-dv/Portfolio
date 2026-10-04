import { useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Clipboard, Copy, Download, FilePlus2, Folder, FolderPlus, Grid2X2, Home, Image, Info, List, Menu, Monitor, Music, Pencil, Search, Scissors, Trash2, Video, X } from 'lucide-react';
import { DIRECTORY_MARKER, isDirectory, listDirectory, normalizePath, removePath, renamePath, ROOT, uniquePath, writeFiles } from './virtualFs';

const TRASH_KEY = 'portfolio.virtual-trash.v1';

function fileName(path) { return path.split('/').filter(Boolean).pop() || path; }
const folderLabels = { Desktop: 'Bureau', Documents: 'Documents', Downloads: 'Téléchargements', Music: 'Musique', Pictures: 'Images', Videos: 'Vidéos' };

export default function FileManager({ files, setFiles, onOpenFile }) {
  const rootRef = useRef(null);
  const [cwd, setCwd] = useState(ROOT);
  const [locations, setLocations] = useState([ROOT]);
  const [locationIndex, setLocationIndex] = useState(0);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedPath, setSelectedPath] = useState(null);
  const [editingPath, setEditingPath] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState({ path: null, mode: 'copy' });
  const [infoPath, setInfoPath] = useState(null);
  const [notice, setNotice] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const entries = listDirectory(files, cwd);
  const visibleEntries = useMemo(() => entries
    .filter(([name]) => name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .sort(([aName, aType], [bName, bType]) => sortBy === 'type'
      ? aType.localeCompare(bType) || aName.localeCompare(bName)
      : aType.localeCompare(bType) || aName.localeCompare(bName)), [entries, query, sortBy]);

  function persist(next) {
    setFiles(next);
    writeFiles(next);
  }

  function go(path) {
    const target = normalizePath(path, cwd);
    if (target !== cwd) {
      const nextLocations = [...locations.slice(0, locationIndex + 1), target];
      setLocations(nextLocations);
      setLocationIndex(nextLocations.length - 1);
      setCwd(target);
    }
    setSelectedPath(null);
    setNotice('');
    setQuery('');
    setContextMenu(null);
  }

  function goBack() {
    if (locationIndex === 0) return;
    const nextIndex = locationIndex - 1;
    setLocationIndex(nextIndex);
    setCwd(locations[nextIndex]);
    setSelectedPath(null);
  }

  function goForward() {
    if (locationIndex >= locations.length - 1) return;
    const nextIndex = locationIndex + 1;
    setLocationIndex(nextIndex);
    setCwd(locations[nextIndex]);
    setSelectedPath(null);
  }

  function openEntry(path, type) {
    if (type === 'dir') go(path);
    else onOpenFile(path);
  }

  function createEntry(kind) {
    const name = kind === 'folder' ? 'Nouveau dossier' : 'Nouveau document.txt';
    const path = uniquePath(files, cwd, name);
    const next = { ...files, [path]: kind === 'folder' ? DIRECTORY_MARKER : '' };
    persist(next);
    setSelectedPath(path);
    setNotice(kind === 'folder' ? 'Dossier créé' : 'Document créé');
    setContextMenu(null);
    if (kind !== 'folder') onOpenFile(path);
  }

  function startRename(path) {
    setSelectedPath(path);
    setEditingPath(path);
    setRenameValue(fileName(path));
    setContextMenu(null);
  }

  function commitRename() {
    if (!editingPath) return;
    const next = renamePath(files, editingPath, renameValue);
    if (next !== files) {
      const parent = editingPath.slice(0, editingPath.lastIndexOf('/')) || '/';
      setSelectedPath(normalizePath(renameValue, parent));
      persist(next);
      setNotice('Nom modifié');
    }
    setEditingPath(null);
  }

  function moveToTrash(path) {
    if (!path) return;
    const removed = Object.fromEntries(Object.entries(files).filter(([file]) => file === path || file.startsWith(`${path}/`)));
    try {
      const currentTrash = JSON.parse(localStorage.getItem(TRASH_KEY) || '{}');
      localStorage.setItem(TRASH_KEY, JSON.stringify({ ...currentTrash, ...removed }));
    } catch { /* read-only storage */ }
    persist(removePath(files, path));
    setSelectedPath(null);
    setContextMenu(null);
    setNotice('Élément déplacé vers la corbeille');
  }

  function copySelection(mode) {
    if (!selectedPath) return;
    setClipboard({ path: selectedPath, mode });
    setContextMenu(null);
    setNotice(mode === 'copy' ? 'Élément copié' : 'Élément coupé');
  }

  function paste() {
    if (!clipboard.path) return;
    const source = clipboard.path;
    if (cwd === source || cwd.startsWith(`${source}/`)) { setNotice('Un dossier ne peut pas être collé dans lui-même.'); setContextMenu(null); return; }
    if (!Object.keys(files).some((path) => path === source || path.startsWith(`${source}/`))) { setClipboard({ path: null, mode: 'copy' }); return; }
    const destination = uniquePath(files, cwd, fileName(source));
    let next = { ...files };
    if (clipboard.mode === 'cut') next = removePath(next, source);
    Object.entries(files).forEach(([file, value]) => {
      if (file !== source && !file.startsWith(`${source}/`)) return;
      next[`${destination}${file.slice(source.length)}`] = value;
    });
    persist(next);
    setSelectedPath(destination);
    setClipboard({ path: null, mode: 'copy' });
    setContextMenu(null);
    setNotice('Élément collé');
  }

  function openContextMenu(event, path = null, kind = 'context') {
    event.preventDefault();
    event.stopPropagation();
    const bounds = rootRef.current?.getBoundingClientRect();
    const height = path ? 330 : kind === 'context' ? 120 : 180;
    const buttonBounds = event.currentTarget.getBoundingClientRect();
    const x = kind === 'context' ? event.clientX : buttonBounds.left;
    const y = kind === 'context' ? event.clientY : buttonBounds.bottom + 5;
    setContextMenu({ x: Math.max(8, Math.min(x - (bounds?.left || 0), (bounds?.width || 400) - 228)), y: Math.max(52, Math.min(y - (bounds?.top || 0), (bounds?.height || 500) - height - 8)), path, kind });
    if (path) setSelectedPath(path);
  }

  function handleKeyDown(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
    if (event.key === 'Escape') { setContextMenu(null); setInfoPath(null); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') { event.preventDefault(); copySelection('copy'); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x') { event.preventDefault(); copySelection('cut'); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') { event.preventDefault(); paste(); }
    if (event.key === 'Delete' && selectedPath) { event.preventDefault(); moveToTrash(selectedPath); }
    if (event.key === 'F2' && selectedPath) { event.preventDefault(); startRename(selectedPath); }
    if (event.key === 'Enter' && selectedPath) {
      event.preventDefault();
      const type = isDirectory(files, selectedPath) ? 'dir' : 'file';
      openEntry(selectedPath, type);
    }
  }

  const breadcrumbRoot = cwd === ROOT || cwd.startsWith(`${ROOT}/`) ? ROOT : '/';
  const breadcrumbParts = cwd.slice(breadcrumbRoot === '/' ? 1 : ROOT.length).split('/').filter(Boolean);
  const breadcrumbLinks = breadcrumbParts.reduce((links, part) => {
    const path = normalizePath(part, links.at(-1)?.path || breadcrumbRoot);
    return [...links, { part, path }];
  }, []);
  const menuPath = contextMenu?.path || null;
  const menuType = menuPath && isDirectory(files, menuPath) ? 'dir' : 'file';
  const selectedSize = infoPath && !isDirectory(files, infoPath) ? new TextEncoder().encode(files[infoPath] ?? '').length : 0;

  return <div ref={rootRef} className={`ubuntu-files ${sidebarVisible ? '' : 'is-sidebar-hidden'}`} tabIndex={0} onKeyDown={handleKeyDown} onClick={() => setContextMenu(null)} onContextMenu={(event) => openContextMenu(event)}>
    <div className="ubuntu-files__toolbar">
      <div className="ubuntu-files__sidebar-title"><strong>Fichiers</strong><button aria-label="Afficher ou masquer le panneau latéral" onClick={() => setSidebarVisible((value) => !value)}><List size={18} /></button></div>
      <button aria-label="Précédent" disabled={locationIndex === 0} onClick={goBack}><ChevronLeft size={17} /></button>
      <button aria-label="Suivant" disabled={locationIndex >= locations.length - 1} onClick={goForward}><ChevronRight size={17} /></button>
      <div className="ubuntu-files__breadcrumbs">
        <button onClick={() => go(breadcrumbRoot)}>{breadcrumbRoot === ROOT ? <Home size={15} /> : <Monitor size={15} />}{breadcrumbRoot === ROOT ? 'Dossier personnel' : 'Ordinateur'}</button>
        {breadcrumbLinks.map(({ part, path }) => <span key={path}>› <button onClick={() => go(path)}>{folderLabels[part] || part}</button></span>)}
      </div>
      <span className="ubuntu-files__toolbar-spacer" />
      <button aria-label="Rechercher" className={search ? 'is-selected' : ''} onClick={() => setSearch((value) => !value)}><Search size={17} /></button>
      <div className="ubuntu-files__view-switch"><button aria-label={view === 'grid' ? 'Afficher en liste' : 'Afficher en grille'} onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>{view === 'grid' ? <Grid2X2 size={17} /> : <List size={18} />}</button><button aria-label="Options d’affichage" onClick={(event) => openContextMenu(event, null, 'view')}><ChevronDown size={14} /></button></div>
      <button aria-label="Menu de Fichiers" onClick={(event) => openContextMenu(event, null, 'app')}><Menu size={18} /></button>
    </div>
    {search && <div className="ubuntu-files__search-row"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Rechercher dans ${cwd === ROOT ? 'Dossier personnel' : fileName(cwd)}`} aria-label="Rechercher dans le dossier actuel" /><button aria-label="Fermer la recherche" onClick={() => { setSearch(false); setQuery(''); }}><X size={16} /></button></div>}
    <div className="ubuntu-files__body">
      <nav className="ubuntu-files__sidebar" aria-label="Emplacements" onClick={(event) => event.stopPropagation()}>
        <button className={cwd === ROOT ? 'is-selected' : ''} onClick={() => go(ROOT)}><Home size={17} /> Dossier personnel</button>
        {[['Desktop', 'Bureau', Monitor], ['Documents', 'Documents', Folder], ['Downloads', 'Téléchargements', Download], ['Music', 'Musique', Music], ['Pictures', 'Images', Image], ['Videos', 'Vidéos', Video]].map(([directory, label, Icon]) => <button key={directory} className={cwd === `${ROOT}/${directory}` ? 'is-selected' : ''} onClick={() => go(`${ROOT}/${directory}`)}><Icon size={17} />{label}</button>)}
        <div className="ubuntu-files__sidebar-separator" />
        <button className={cwd === '/' ? 'is-selected' : ''} onClick={() => go('/')}><Monitor size={17} /> Ordinateur</button>
      </nav>
      <div className="ubuntu-files__main">
      {view === 'list' && <div className="ubuntu-files__columns"><span>Nom</span><span>Taille</span><span>Type</span></div>}
      <div role="listbox" aria-label="Fichiers du dossier" className={`ubuntu-files__grid ${view === 'list' ? 'is-list' : ''} ${visibleEntries.length === 0 ? 'is-empty' : ''}`} onClick={() => setSelectedPath(null)} onContextMenu={(event) => openContextMenu(event)}>
        {visibleEntries.map(([name, type]) => {
          const path = normalizePath(name, cwd);
          const selected = selectedPath === path;
          const isEditing = editingPath === path;
          return <div role="option" tabIndex={0} key={name} className={`ubuntu-file ${selected ? 'is-selected' : ''}`} aria-selected={selected} onClick={(event) => { event.stopPropagation(); setSelectedPath(path); setContextMenu(null); }} onContextMenu={(event) => openContextMenu(event, path)} onDoubleClick={() => { if (!isEditing) openEntry(path, type); }}>
            <span className="ubuntu-file__icon"><img src={type === 'dir' ? '/ubuntu-apps/folder.png' : '/ubuntu-apps/file.png'} alt="" draggable="false" /></span>
            {isEditing ? <input className="ubuntu-file__rename" value={renameValue} autoFocus onChange={(event) => setRenameValue(event.target.value)} onBlur={commitRename} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { event.stopPropagation(); if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') setEditingPath(null); }} /> : <span>{cwd === ROOT && type === 'dir' ? folderLabels[name] || name : name}</span>}
            <span className="ubuntu-file__size">{type === 'dir' ? `${listDirectory(files, path).length} éléments` : `${new TextEncoder().encode(files[path] || '').length} octets`}</span><small>{type === 'dir' ? 'Dossier' : 'Document texte'}</small>
          </div>;
        })}
        {visibleEntries.length === 0 && <div className="ubuntu-files__empty"><Folder size={64} strokeWidth={1.2} /><strong>{query ? 'Aucun résultat' : 'Le dossier est vide'}</strong><span>{query ? 'Essayez un autre terme de recherche.' : ''}</span></div>}
      </div>
      </div>
    </div>
    <footer className="ubuntu-files__status"><span>{visibleEntries.length} élément{visibleEntries.length === 1 ? '' : 's'}</span><span>{notice || (selectedPath ? fileName(selectedPath) : 'Prêt')}</span></footer>
    {contextMenu && <div className="ubuntu-files__context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
      {contextMenu.kind === 'view' ? <><strong className="ubuntu-files__popover-title">Affichage</strong><button onClick={() => { setView('grid'); setContextMenu(null); }}><Grid2X2 size={16} /> Grille {view === 'grid' ? '✓' : ''}</button><button onClick={() => { setView('list'); setContextMenu(null); }}><List size={16} /> Liste {view === 'list' ? '✓' : ''}</button><span className="ubuntu-files__context-separator" /><label className="ubuntu-files__sort-label">Trier par<select aria-label="Trier" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="name">Nom</option><option value="type">Type</option></select></label></> : <>
      {menuPath && <button onClick={() => { openEntry(menuPath, menuType); setContextMenu(null); }}><Home size={15} /> Ouvrir</button>}
      <button onClick={() => createEntry('folder')}><FolderPlus size={15} /> Nouveau dossier</button>
      <button onClick={() => createEntry('file')}><FilePlus2 size={15} /> Nouveau document</button>
      {menuPath && <><span className="ubuntu-files__context-separator" /><button onClick={() => startRename(menuPath)}><Pencil size={15} /> Renommer</button><button onClick={() => copySelection('copy')}><Copy size={15} /> Copier</button><button onClick={() => copySelection('cut')}><Scissors size={15} /> Couper</button><button disabled={!clipboard.path} onClick={paste}><Clipboard size={15} /> Coller</button><button onClick={() => moveToTrash(menuPath)}><Trash2 size={15} /> Mettre à la corbeille</button><button onClick={() => { setInfoPath(menuPath); setContextMenu(null); }}><Info size={15} /> Propriétés</button></>}
      {!menuPath && clipboard.path && <button onClick={paste}><Clipboard size={15} /> Coller</button>}
      </>}
    </div>}
    {infoPath && <div className="ubuntu-files__properties" role="dialog" aria-label="Propriétés" onClick={(event) => event.stopPropagation()}><div className="ubuntu-files__properties-heading"><Info size={17} /> Propriétés</div><strong>{fileName(infoPath)}</strong><span>{isDirectory(files, infoPath) ? 'Dossier' : 'Document texte'}</span>{!isDirectory(files, infoPath) && <span>{selectedSize} octets</span>}<button onClick={() => setInfoPath(null)}>Fermer</button></div>}
  </div>;
}
