import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Clipboard, Copy, Download, FilePlus2, Folder, FolderPlus, Grid2X2, Home, Image, Info, List, Menu, Monitor, Music, Pencil, Search, Scissors, Trash2, Undo2, Video, X } from 'lucide-react';
import { canDeletePath, DIRECTORY_MARKER, emptyTrash, isDirectory, listDirectory, normalizePath, readTrash, renamePath, restoreFromTrash, ROOT, transferPaths, trashPaths, TRASH_CHANGE_EVENT, writeFiles } from './virtualFs';
import { endFileDrag, FILE_CLIPBOARD_EVENT, FILE_DRAG_END_EVENT, fileDragCopies, readFileClipboard, readFileDrag, writeFileClipboard, writeFileDrag } from './dragDrop';
import ConfirmationDialog from './ConfirmationDialog';
import FileNameDialog from './FileNameDialog';
import FileProperties from './FileProperties';
import LocationEntry from './LocationEntry';
import { fileMetadata } from './fileMetadata';

function fileName(path) { return path.split('/').filter(Boolean).pop() || path; }
const folderLabels = { Desktop: 'Bureau', Documents: 'Documents', Downloads: 'Téléchargements', Music: 'Musique', Pictures: 'Images', Videos: 'Vidéos' };

export default function FileManager({ files, setFiles, onOpenFile, initialLocation, initialDirectory = ROOT, navigationRequest = 0 }) {
  const rootRef = useRef(null);
  const gridRef = useRef(null);
  const locationRef = useRef(null);
  const menuRef = useRef(null);
  const selectionAnchor = useRef(null);
  const rubberRef = useRef(null);
  const suppressBlankClick = useRef(false);
  const typeAhead = useRef({ value: '', at: 0 });
  const undoRef = useRef([]);
  const requestedLocation = initialLocation === 'trash' ? 'trash' : normalizePath(initialDirectory);
  const requestedKey = `${navigationRequest}:${requestedLocation}`;
  const [previousLocation, setPreviousLocation] = useState(requestedKey);
  const [cwd, setCwd] = useState(requestedLocation);
  const [locations, setLocations] = useState([requestedLocation]);
  const [locationIndex, setLocationIndex] = useState(0);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [descending, setDescending] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [locationEditing, setLocationEditing] = useState(false);
  const [locationValue, setLocationValue] = useState('');
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [focusedPath, setFocusedPath] = useState(null);
  const [nameOperation, setNameOperation] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(readFileClipboard);
  const [infoPaths, setInfoPaths] = useState(null);
  const [notice, setNotice] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [compactSidebar, setCompactSidebar] = useState(false);
  const [sidebarOverlay, setSidebarOverlay] = useState(false);
  const [dropTarget, setDropTarget] = useState(null);
  const [dragPaths, setDragPaths] = useState([]);
  const [rubberBand, setRubberBand] = useState(null);
  const [undoCount, setUndoCount] = useState(0);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [, refreshTrash] = useReducer((value) => value + 1, 0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setCompactSidebar(entry.contentRect.width < 640));
    if (rootRef.current) observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!locationEditing) return;
    locationRef.current?.focus();
    locationRef.current?.select();
  }, [locationEditing]);
  useEffect(() => {
    if (!contextMenu) return;
    const frame = requestAnimationFrame(() => menuRef.current?.querySelector('button:not(:disabled)')?.focus());
    const dismiss = (event) => { if (!menuRef.current?.contains(event.target)) setContextMenu(null); };
    document.addEventListener('pointerdown', dismiss);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', dismiss); };
  }, [contextMenu]);
  useEffect(() => {
    const updateClipboard = () => setClipboard(readFileClipboard());
    const finishDrag = () => { setDragPaths([]); setDropTarget(null); };
    window.addEventListener(TRASH_CHANGE_EVENT, refreshTrash);
    window.addEventListener(FILE_CLIPBOARD_EVENT, updateClipboard);
    window.addEventListener(FILE_DRAG_END_EVENT, finishDrag);
    window.addEventListener('storage', refreshTrash);
    window.addEventListener('storage', updateClipboard);
    return () => {
      window.removeEventListener(TRASH_CHANGE_EVENT, refreshTrash);
      window.removeEventListener(FILE_CLIPBOARD_EVENT, updateClipboard);
      window.removeEventListener(FILE_DRAG_END_EVENT, finishDrag);
      window.removeEventListener('storage', refreshTrash);
      window.removeEventListener('storage', updateClipboard);
    };
  }, []);
  if (previousLocation !== requestedKey) {
    setPreviousLocation(requestedKey);
    setCwd(requestedLocation);
    setLocations([requestedLocation]);
    setLocationIndex(0);
    setSelectedPaths([]);
    setFocusedPath(null);
    setContextMenu(null);
    setNameOperation(null);
  }
  if (previousLocation === requestedKey && cwd !== 'trash' && !isDirectory(files, cwd)) {
    let parent = normalizePath('..', cwd);
    while (parent !== '/' && !isDirectory(files, parent)) parent = normalizePath('..', parent);
    setCwd(parent);
    setLocations([parent]);
    setLocationIndex(0);
    setSelectedPaths([]);
    setFocusedPath(null);
    setNameOperation(null);
    setContextMenu(null);
    setNotice('Le dossier a été déplacé ou supprimé.');
  }
  const inTrash = cwd === 'trash';
  const trash = readTrash();
  const entries = inTrash ? Object.entries(trash).map(([key, record]) => [key, isDirectory(record.files, record.path) ? 'dir' : 'file']) : listDirectory(files, cwd);
  const visibleEntries = useMemo(() => {
    const nameOf = (name) => inTrash ? fileName(trash[name]?.path || name) : name;
    const metadataOf = (name) => {
      const path = inTrash ? trash[name].path : normalizePath(name, cwd);
      const source = inTrash ? trash[name].files : files;
      return fileMetadata(source, path);
    };
    return entries.filter(([name]) => (showHidden || !nameOf(name).startsWith('.')) && nameOf(name).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
      .sort(([aName, aType], [bName, bType]) => {
        const foldersFirst = Number(bType === 'dir') - Number(aType === 'dir');
        if (foldersFirst) return foldersFirst;
        const names = nameOf(aName).localeCompare(nameOf(bName), undefined, { numeric: true, sensitivity: 'base' });
        const value = sortBy === 'size' ? metadataOf(aName).size - metadataOf(bName).size || names
          : sortBy === 'type' ? metadataOf(aName).type.localeCompare(metadataOf(bName).type) || names : names;
        return descending ? -value : value;
      });
  }, [entries, inTrash, trash, query, sortBy, descending, showHidden, cwd, files]);
  const visiblePaths = visibleEntries.map(([name]) => inTrash ? name : normalizePath(name, cwd));
  const selection = selectedPaths.filter((path) => visiblePaths.includes(path));
  const selectedPath = selection.includes(focusedPath) ? focusedPath : selection.at(-1);
  const allDeletable = selection.length > 0 && selection.every((path) => canDeletePath(files, path));

  function select(paths, focus = paths.at(-1)) {
    setSelectedPaths(paths);
    setFocusedPath(focus || null);
  }

  function focusEntry(path) {
    requestAnimationFrame(() => {
      if (document.querySelector('dialog[open]') || !rootRef.current?.closest('.ubuntu-window')?.classList.contains('is-active-window')) return;
      const item = path && gridRef.current?.querySelector(`[data-file-path="${CSS.escape(path)}"]`);
      (item || rootRef.current)?.focus({ preventScroll: true });
      item?.scrollIntoView({ block: 'nearest' });
    });
  }

  function remember(before, next, label, trashKeys = []) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(next)])].filter((key) => Object.hasOwn(before, key) !== Object.hasOwn(next, key) || before[key] !== next[key]);
    if (!keys.length && !trashKeys.length) return;
    undoRef.current = [...undoRef.current.slice(-19), { before, after: next, keys, label, trashKeys }];
    setUndoCount(undoRef.current.length);
  }

  function persist(next, label, trashKeys) {
    if (next === files) return;
    if (label) remember(files, next, label, trashKeys);
    setFiles(writeFiles(next));
  }

  function undoOperation() {
    const action = undoRef.current.at(-1);
    if (!action) return;
    let restoredFiles;
    if (action.trashKeys.length) {
      if (action.trashKeys.some((key) => !Object.hasOwn(readTrash(), key))) {
        undoRef.current.pop();
        setUndoCount(undoRef.current.length);
        setNotice('Cette action n’est plus disponible : un élément a déjà été restauré ou supprimé.');
        return;
      }
      let next = files;
      action.trashKeys.forEach((key) => { next = restoreFromTrash(next, key); });
      restoredFiles = writeFiles(next);
      setFiles(restoredFiles);
    } else {
      if (action.keys.some((key) => Object.hasOwn(files, key) !== Object.hasOwn(action.after, key) || files[key] !== action.after[key])) {
        setNotice('Impossible d’annuler : un des éléments a changé dans une autre application.');
        return;
      }
      const next = { ...files };
      action.keys.forEach((key) => { if (Object.hasOwn(action.before, key)) next[key] = action.before[key]; else delete next[key]; });
      restoredFiles = writeFiles(next);
      setFiles(restoredFiles);
    }
    undoRef.current.pop();
    setUndoCount(undoRef.current.length);
    const restored = action.keys.filter((path) => Object.hasOwn(action.before, path) && Object.hasOwn(restoredFiles, path));
    const roots = restored.filter((path) => !restored.some((other) => other !== path && path.startsWith(`${other}/`)));
    const visible = roots.filter((path) => normalizePath('..', path) === cwd);
    select(visible);
    setContextMenu(null);
    setNotice(`${action.label} : action annulée`);
    requestAnimationFrame(() => (visible[0] && gridRef.current?.querySelector(`[data-file-path="${CSS.escape(visible[0])}"]`) || rootRef.current)?.focus({ preventScroll: true }));
  }

  function go(path) {
    setSidebarOverlay(false);
    const target = path === 'trash' ? 'trash' : normalizePath(path, cwd === 'trash' ? ROOT : cwd);
    if (target !== cwd) {
      const nextLocations = [...locations.slice(0, locationIndex + 1), target];
      setLocations(nextLocations);
      setLocationIndex(nextLocations.length - 1);
      setCwd(target);
    }
    select([]);
    selectionAnchor.current = null;
    setNotice('');
    setQuery('');
    setContextMenu(null);
    setNameOperation(null);
    setLocationEditing(false);
    requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
  }

  function goHistory(direction) {
    const nextIndex = locationIndex + direction;
    if (nextIndex < 0 || nextIndex >= locations.length) return;
    setSidebarOverlay(false);
    setLocationIndex(nextIndex);
    setCwd(locations[nextIndex]);
    select([]);
    setQuery('');
    setContextMenu(null);
    setLocationEditing(false);
    setNameOperation(null);
    requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
  }

  function editLocation() {
    setLocationValue(inTrash ? 'trash:///' : cwd);
    setLocationEditing(true);
    setContextMenu(null);
    requestAnimationFrame(() => { locationRef.current?.focus(); locationRef.current?.select(); });
  }

  function submitLocation(event) {
    event.preventDefault();
    const raw = locationValue.trim();
    const expanded = raw === '~' ? ROOT : raw.startsWith('~/') ? `${ROOT}/${raw.slice(2)}` : raw;
    const target = normalizePath(expanded, inTrash ? ROOT : cwd);
    if (raw === 'trash:///' || raw === 'trash://') go('trash');
    else if (raw && isDirectory(files, target)) go(target);
    else if (raw && Object.hasOwn(files, target)) { onOpenFile(target); setLocationEditing(false); }
    else { setNotice('Cet emplacement n’existe pas.'); locationRef.current?.focus(); return; }
    rootRef.current?.focus({ preventScroll: true });
  }

  function changeSort(value) {
    if (value === sortBy) setDescending((current) => !current);
    else { setSortBy(value); setDescending(false); }
  }

  function openEntry(path, type) {
    if (inTrash) return;
    if (type === 'dir') go(path);
    else onOpenFile(path);
  }

  function createEntry(kind) {
    if (inTrash) return;
    setContextMenu(null);
    setNameOperation({ kind, directory: cwd });
  }

  function startRename(path) {
    if (!canDeletePath(files, path)) { setNotice('Ce document du portfolio est protégé. Vous pouvez en créer une copie.'); setContextMenu(null); return; }
    select([path]);
    setNameOperation({ kind: isDirectory(files, path) ? 'folder' : 'file', path, directory: normalizePath('..', path), anchor: gridRef.current?.querySelector(`[data-file-path="${CSS.escape(path)}"]`) });
    setContextMenu(null);
  }

  function saveName(name) {
    if (!nameOperation || !isDirectory(files, nameOperation.directory)) return 'Ce dossier n’existe plus.';
    const { path, kind, directory } = nameOperation;
    if (path && !canDeletePath(files, path)) return 'Cet élément est protégé ou n’existe plus.';
    const destination = normalizePath(name, directory);
    const next = path ? renamePath(files, path, name) : { ...files, [destination]: kind === 'folder' ? DIRECTORY_MARKER : '' };
    if (path && next === files && destination !== path) return 'Impossible de renommer cet élément.';
    if (next !== files) persist(next, path ? 'Renommage' : 'Création');
    setQuery('');
    if (name.startsWith('.')) setShowHidden(true);
    select([destination]);
    setNameOperation(null);
    setNotice(path ? 'Nom modifié' : kind === 'folder' ? 'Dossier créé' : 'Document créé');
    focusEntry(destination);
  }

  function closeNameOperation(restoreFocus = true) {
    const path = nameOperation?.path;
    setNameOperation(null);
    if (restoreFocus !== false) requestAnimationFrame(() => (path && gridRef.current?.querySelector(`[data-file-path="${CSS.escape(path)}"]`) || rootRef.current)?.focus({ preventScroll: true }));
  }

  function openProperties(paths = selection.length ? selection : [cwd]) {
    if (inTrash) return;
    setInfoPaths([...paths]);
    setContextMenu(null);
  }

  function closeProperties() {
    setInfoPaths(null);
    requestAnimationFrame(() => (selectedPath && gridRef.current?.querySelector(`[data-file-path="${CSS.escape(selectedPath)}"]`) || rootRef.current)?.focus({ preventScroll: true }));
  }

  function revealInParent(directory, paths) {
    go(directory);
    const children = paths.filter((path) => normalizePath('..', path) === directory);
    if (children.some((path) => fileName(path).startsWith('.'))) setShowHidden(true);
    select(children);
    requestAnimationFrame(() => {
      const item = children[0] && gridRef.current?.querySelector(`[data-file-path="${CSS.escape(children[0])}"]`);
      (item || rootRef.current)?.focus({ preventScroll: true });
      item?.scrollIntoView({ block: 'nearest' });
    });
  }

  function moveToTrash(paths = selection) {
    const allowed = paths.filter((path) => canDeletePath(files, path));
    if (!allowed.length) { setNotice('Seuls les fichiers et dossiers que vous créez peuvent être supprimés.'); setContextMenu(null); return; }
    const previousKeys = Object.keys(readTrash());
    const next = trashPaths(files, allowed);
    const newKeys = Object.keys(readTrash()).filter((key) => !previousKeys.includes(key));
    persist(next, 'Mise à la corbeille', newKeys);
    const remaining = visiblePaths.filter((path) => Object.hasOwn(next, path) || isDirectory(next, path));
    const nextFocus = remaining.includes(selectedPath) ? selectedPath : remaining[Math.min(Math.max(0, visiblePaths.indexOf(selectedPath)), remaining.length - 1)];
    select(nextFocus ? [nextFocus] : []);
    selectionAnchor.current = nextFocus || null;
    setContextMenu(null);
    setNotice(`${allowed.length} élément${allowed.length > 1 ? 's' : ''} dans la corbeille${allowed.length !== paths.length ? ' · Les éléments protégés ont été conservés.' : ''}`);
    focusEntry(nextFocus);
  }

  function copySelection(mode) {
    if (!selection.length || inTrash) return;
    if (mode === 'cut' && !allDeletable) { setNotice('Un document du portfolio est protégé. Utilisez Copier.'); setContextMenu(null); return; }
    setClipboard(writeFileClipboard(selection, mode));
    setContextMenu(null);
    setNotice(`${selection.length} élément${selection.length > 1 ? 's' : ''} ${mode === 'copy' ? 'copié' : 'coupé'}${selection.length > 1 ? 's' : ''}`);
    focusEntry(selectedPath);
  }

  function paste() {
    if (!clipboard.paths.length || inTrash) return;
    const result = transferPaths(files, clipboard.paths, cwd, { copy: clipboard.mode === 'copy' });
    if (result.changed) {
      persist(result.files, clipboard.mode === 'copy' ? 'Copie' : 'Déplacement');
      select(result.paths);
      if (clipboard.mode === 'cut') setClipboard(writeFileClipboard([], 'copy'));
    }
    setContextMenu(null);
    setNotice(result.message);
    focusEntry(result.paths[0] || selectedPath);
  }

  function restoreSelection(paths = selection) {
    let next = files;
    paths.forEach((path) => { next = restoreFromTrash(next, path); });
    persist(next);
    select([]);
    setContextMenu(null);
    setNotice('Éléments restaurés. Un nom disponible est utilisé si nécessaire.');
    focusEntry();
  }

  function clearTrash() {
    setContextMenu(null);
    setConfirmEmpty(true);
  }

  function selectEntry(event, path) {
    event.stopPropagation();
    if (event.shiftKey && selectionAnchor.current && visiblePaths.includes(selectionAnchor.current)) {
      const start = visiblePaths.indexOf(selectionAnchor.current);
      const end = visiblePaths.indexOf(path);
      const range = visiblePaths.slice(Math.min(start, end), Math.max(start, end) + 1);
      select(event.ctrlKey || event.metaKey ? [...new Set([...selection, ...range])] : range, path);
    } else if (event.ctrlKey || event.metaKey) {
      select(selection.includes(path) ? selection.filter((item) => item !== path) : [...selection, path], path);
      selectionAnchor.current = path;
    } else {
      select([path]);
      selectionAnchor.current = path;
    }
    setContextMenu(null);
  }

  function openContextMenu(event, path = null, kind = 'context') {
    event.preventDefault();
    event.stopPropagation();
    const bounds = rootRef.current?.getBoundingClientRect();
    const height = path ? 400 : kind === 'view' ? 290 : kind === 'app' ? 330 : kind === 'context' ? 175 : 90;
    const buttonBounds = event.currentTarget.getBoundingClientRect();
    const x = kind === 'context' ? event.clientX : buttonBounds.left;
    const y = kind === 'context' ? event.clientY : buttonBounds.bottom + 5;
    setContextMenu({ x: Math.max(8, Math.min(x - (bounds?.left || 0), (bounds?.width || 400) - 228)), y: Math.max(52, Math.min(y - (bounds?.top || 0), (bounds?.height || 500) - height - 8)), path, kind });
    if (path && !selection.includes(path)) select([path]);
    if (!path && kind === 'context') select([]);
    rootRef.current?.focus({ preventScroll: true });
  }

  function handleKeyDown(event) {
    if (event.ctrlKey && event.altKey) return;
    const control = event.ctrlKey;
    const key = event.key.toLowerCase();
    if (event.ctrlKey && key === 'l') { event.preventDefault(); editLocation(); return; }
    if (event.ctrlKey && key === 'h') { event.preventDefault(); setShowHidden((value) => !value); return; }
    if (event.key === 'F9' && !event.altKey && !event.metaKey && !event.ctrlKey) { event.preventDefault(); if (compactSidebar) setSidebarOverlay((value) => !value); else setSidebarVisible((value) => !value); return; }
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
    if (event.metaKey) return;
    if (event.key === 'Escape') { setContextMenu(null); setSidebarOverlay(false); select([]); rootRef.current?.focus({ preventScroll: true }); }
    if (event.altKey && event.key === 'Enter' && !inTrash) { event.preventDefault(); openProperties(); return; }
    if (control && key === 'a') { event.preventDefault(); select(visiblePaths); }
    if (control && key === 'c') { event.preventDefault(); copySelection('copy'); }
    if (control && key === 'x') { event.preventDefault(); copySelection('cut'); }
    if (control && key === 'v') { event.preventDefault(); paste(); }
    if (control && key === 'z') { event.preventDefault(); undoOperation(); }
    if (control && key === 'f') { event.preventDefault(); setSearch(true); }
    if (event.altKey && event.key === 'ArrowLeft') { event.preventDefault(); goHistory(-1); return; }
    if (event.altKey && event.key === 'ArrowRight') { event.preventDefault(); goHistory(1); return; }
    if (event.altKey && event.key === 'ArrowUp' && !inTrash) { event.preventDefault(); go(normalizePath('..', cwd)); return; }
    if (event.key === 'Delete' && !event.altKey && !control && selection.length && !inTrash) { event.preventDefault(); moveToTrash(); }
    if (event.key === 'F2' && !event.altKey && !control && selection.length === 1 && !inTrash) { event.preventDefault(); startRename(selectedPath); }
    if (control && event.shiftKey && key === 'n') { event.preventDefault(); createEntry('folder'); }
    if (event.key === 'Enter' && selectedPath) {
      event.preventDefault();
      if (inTrash) return;
      selection.forEach((path) => openEntry(path, isDirectory(files, path) ? 'dir' : 'file'));
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) && visiblePaths.length) {
      event.preventDefault();
      const grid = gridRef.current;
      const cells = [...(grid?.querySelectorAll('[data-entry-index]') || [])];
      const firstTop = cells[0]?.offsetTop;
      const columns = view === 'list' ? 1 : Math.max(1, cells.filter((cell) => cell.offsetTop === firstTop).length);
      const currentIndex = visiblePaths.indexOf(focusedPath || selectedPath);
      const delta = event.key === 'ArrowUp' ? -columns : event.key === 'ArrowDown' ? columns : event.key === 'ArrowLeft' ? -1 : 1;
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? visiblePaths.length - 1 : currentIndex < 0 ? 0 : Math.max(0, Math.min(visiblePaths.length - 1, currentIndex + delta));
      const path = visiblePaths[index];
      if (event.shiftKey) {
        const anchor = visiblePaths.indexOf(selectionAnchor.current || selectedPath || path);
        select(visiblePaths.slice(Math.min(anchor < 0 ? index : anchor, index), Math.max(anchor < 0 ? index : anchor, index) + 1), path);
      } else if (control) setFocusedPath(path);
      else { select([path]); selectionAnchor.current = path; }
      const item = grid?.querySelector(`[data-entry-index="${index}"]`);
      item?.focus({ preventScroll: true });
      item?.scrollIntoView({ block: 'nearest' });
    }
    if (event.key === ' ' && focusedPath) {
      event.preventDefault();
      select(control ? selection.includes(focusedPath) ? selection.filter((path) => path !== focusedPath) : [...selection, focusedPath] : [focusedPath], focusedPath);
    }
    if (!control && !event.altKey && event.key.length === 1 && event.key !== ' ') {
      const now = event.timeStamp;
      const value = now - typeAhead.current.at < 900 ? `${typeAhead.current.value}${event.key}` : event.key;
      typeAhead.current = { value, at: now };
      const match = visibleEntries.findIndex(([name]) => (inTrash ? fileName(trash[name]?.path || name) : cwd === ROOT ? folderLabels[name] || name : name).toLocaleLowerCase().startsWith(value.toLocaleLowerCase()));
      if (match >= 0) {
        select([visiblePaths[match]]);
        selectionAnchor.current = visiblePaths[match];
        gridRef.current?.querySelector(`[data-entry-index="${match}"]`)?.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function beginRubberBand(event) {
    if (event.button !== 0 || event.pointerType === 'touch' || event.target.closest('.ubuntu-file') || event.target.closest('button')) return;
    const grid = gridRef.current;
    const rect = grid.getBoundingClientRect();
    rubberRef.current = { x: event.clientX - rect.left + grid.scrollLeft, y: event.clientY - rect.top + grid.scrollTop, base: event.ctrlKey || event.metaKey || event.shiftKey ? selection : [], pointer: event.pointerId };
    grid.setPointerCapture(event.pointerId);
    setContextMenu(null);
    rootRef.current?.focus({ preventScroll: true });
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) select([]);
    suppressBlankClick.current = false;
  }

  function updateRubberBand(event) {
    const anchor = rubberRef.current;
    const grid = gridRef.current;
    if (!anchor || !grid) return;
    const rect = grid.getBoundingClientRect();
    const x = event.clientX - rect.left + grid.scrollLeft;
    const y = event.clientY - rect.top + grid.scrollTop;
    if (Math.abs(x - anchor.x) < 4 && Math.abs(y - anchor.y) < 4) return;
    const box = { left: Math.min(anchor.x, x), top: Math.min(anchor.y, y), width: Math.abs(x - anchor.x), height: Math.abs(y - anchor.y) };
    const selected = [...grid.querySelectorAll('[data-file-path]')].filter((item) => {
      const bounds = item.getBoundingClientRect();
      const left = bounds.left - rect.left + grid.scrollLeft;
      const top = bounds.top - rect.top + grid.scrollTop;
      return left < box.left + box.width && left + bounds.width > box.left && top < box.top + box.height && top + bounds.height > box.top;
    }).map((item) => item.dataset.filePath);
    select([...new Set([...anchor.base, ...selected])]);
    setRubberBand(box);
    suppressBlankClick.current = true;
    if (event.clientY > rect.bottom - 24) grid.scrollTop += 12;
    else if (event.clientY < rect.top + 24) grid.scrollTop -= 12;
  }

  function finishRubberBand(event) {
    if (rubberRef.current && gridRef.current?.hasPointerCapture(event.pointerId)) gridRef.current.releasePointerCapture(event.pointerId);
    rubberRef.current = null;
    setRubberBand(null);
  }

  function startDrag(event, path) {
    if (inTrash || nameOperation) { event.preventDefault(); return; }
    const paths = selection.includes(path) ? selection : [path];
    if (!selection.includes(path)) select([path]);
    writeFileDrag(event, paths, files);
    setDragPaths(paths);
    setContextMenu(null);
    const badge = document.createElement('div');
    badge.className = 'ubuntu-file-drag-preview';
    const icon = document.createElement('img');
    icon.src = isDirectory(files, path) ? '/ubuntu-apps/folder.png' : '/ubuntu-apps/file.png';
    const label = document.createElement('span');
    label.textContent = paths.length > 1 ? `${paths.length} éléments` : fileName(path);
    badge.append(icon, label);
    document.body.append(badge);
    event.dataTransfer.setDragImage(badge, 28, 28);
    setTimeout(() => badge.remove(), 0);
  }

  function dropHandlers(destination) {
    function acceptDrag(event) {
      const paths = readFileDrag(event);
      if (!paths.length) return;
      event.preventDefault();
      event.stopPropagation();
      const valid = destination === 'trash' ? paths.some((path) => canDeletePath(files, path)) : !paths.every((path) => path === destination || destination.startsWith(`${path}/`) || (destination === (path.slice(0, path.lastIndexOf('/')) || '/') && canDeletePath(files, path) && !event.ctrlKey && !event.metaKey));
      const copies = fileDragCopies(event, files, paths);
      event.dataTransfer.dropEffect = valid ? destination === 'trash' ? 'move' : copies === true ? 'copy' : 'move' : 'none';
      setDropTarget(valid ? destination : null);
    }
    return {
      onDragEnter: acceptDrag,
      onDragOver: acceptDrag,
      onDragLeave(event) { if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget((current) => current === destination ? null : current); },
    };
  }

  function handleFileDrop(event, destination) {
    const paths = readFileDrag(event);
    if (!paths.length) return;
    event.preventDefault();
    event.stopPropagation();
    if (destination === 'trash') moveToTrash(paths);
    else {
      const result = transferPaths(files, paths, destination, { copy: fileDragCopies(event, files, paths) });
      if (result.changed) {
        persist(result.files, 'Transfert');
        select(destination === cwd ? result.paths : []);
      }
      setNotice(result.message);
    }
    setDropTarget(null);
    setDragPaths([]);
    endFileDrag();
  }

  const breadcrumbRoot = cwd === ROOT || cwd.startsWith(`${ROOT}/`) ? ROOT : '/';
  const breadcrumbParts = inTrash ? [] : cwd.slice(breadcrumbRoot === '/' ? 1 : ROOT.length).split('/').filter(Boolean);
  const breadcrumbLinks = breadcrumbParts.reduce((links, part) => [...links, { part, path: normalizePath(part, links.at(-1)?.path || breadcrumbRoot) }], []);
  const menuPath = contextMenu?.path || null;
  const pathClass = (path) => `${cwd === path ? 'is-selected' : ''} ${dropTarget === path ? 'is-drop-target' : ''}`;

  return <div ref={rootRef} className={`ubuntu-files ${sidebarVisible ? '' : 'is-sidebar-hidden'} ${compactSidebar ? 'is-compact' : ''} ${compactSidebar && sidebarOverlay ? 'is-sidebar-overlay-open' : ''}`} tabIndex={0} onKeyDown={handleKeyDown} onClick={() => setContextMenu(null)} onContextMenu={(event) => openContextMenu(event)}>
    {confirmEmpty && <ConfirmationDialog title="Vider la corbeille ?" message="Tous les éléments de la corbeille seront définitivement supprimés. Cette action ne peut pas être annulée." confirmLabel="Vider la corbeille" onCancel={() => setConfirmEmpty(false)} onConfirm={() => { emptyTrash(); select([]); setConfirmEmpty(false); setNotice('La corbeille est vide'); }} />}
    <div className="ubuntu-files__toolbar">
      <div className="ubuntu-files__sidebar-title"><strong>{inTrash ? 'Corbeille' : 'Fichiers'}</strong><button aria-label="Afficher ou masquer le panneau latéral" aria-expanded={compactSidebar ? sidebarOverlay : sidebarVisible} onClick={() => { if (compactSidebar) setSidebarOverlay((value) => !value); else setSidebarVisible((value) => !value); }}><List size={18} /></button></div>
      <button aria-label="Précédent" disabled={locationIndex === 0} onClick={() => goHistory(-1)}><ChevronLeft size={17} /></button>
      <button aria-label="Suivant" disabled={locationIndex >= locations.length - 1} onClick={() => goHistory(1)}><ChevronRight size={17} /></button>
      {locationEditing ? <LocationEntry inputRef={locationRef} value={locationValue} onChange={setLocationValue} files={files} cwd={cwd} onSubmit={submitLocation} onCancel={() => { setLocationEditing(false); rootRef.current?.focus({ preventScroll: true }); }} /> : <div className="ubuntu-files__breadcrumbs" onDoubleClick={(event) => { if (!event.target.closest('button')) { event.stopPropagation(); editLocation(); } }}>
        <button className={dropTarget === (inTrash ? 'trash' : breadcrumbRoot) ? 'is-drop-target' : ''} {...dropHandlers(inTrash ? 'trash' : breadcrumbRoot)} onDrop={(event) => handleFileDrop(event, inTrash ? 'trash' : breadcrumbRoot)} onClick={() => go(inTrash ? 'trash' : breadcrumbRoot)}>{inTrash ? <Trash2 size={15} /> : breadcrumbRoot === ROOT ? <Home size={15} /> : <Monitor size={15} />}{inTrash ? 'Corbeille' : breadcrumbRoot === ROOT ? 'Dossier personnel' : 'Ordinateur'}</button>
        {breadcrumbLinks.map(({ part, path }) => <span key={path}>› <button className={dropTarget === path ? 'is-drop-target' : ''} {...dropHandlers(path)} onDrop={(event) => handleFileDrop(event, path)} onClick={() => go(path)}>{folderLabels[part] || part}</button></span>)}
      </div>}
      <span className="ubuntu-files__toolbar-spacer" />
      {inTrash && <button aria-label="Vider la corbeille" disabled={!entries.length} onClick={clearTrash}><Trash2 size={17} /></button>}
      {!inTrash && <button aria-label="Créer un fichier ou un dossier" title="Créer un fichier ou un dossier" onClick={(event) => openContextMenu(event, null, 'create')}><FilePlus2 size={17} /></button>}
      <button aria-label="Rechercher" className={search ? 'is-selected' : ''} onClick={() => setSearch((value) => !value)}><Search size={17} /></button>
      <div className="ubuntu-files__view-switch"><button aria-label={view === 'grid' ? 'Afficher en liste' : 'Afficher en grille'} onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>{view === 'grid' ? <Grid2X2 size={17} /> : <List size={18} />}</button><button aria-label="Options d’affichage" onClick={(event) => openContextMenu(event, null, 'view')}><ChevronDown size={14} /></button></div>
      <button aria-label="Menu de Fichiers" onClick={(event) => openContextMenu(event, null, 'app')}><Menu size={18} /></button>
    </div>
    {search && <div className="ubuntu-files__search-row"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Rechercher dans ${inTrash ? 'Corbeille' : cwd === ROOT ? 'Dossier personnel' : fileName(cwd)}`} aria-label="Rechercher dans le dossier actuel" /><button aria-label="Fermer la recherche" onClick={() => { setSearch(false); setQuery(''); }}><X size={16} /></button></div>}
    <div className="ubuntu-files__body">
      {compactSidebar && sidebarOverlay && <button className="ubuntu-files__sidebar-backdrop" aria-label="Fermer le panneau latéral" onClick={() => setSidebarOverlay(false)} />}
      <nav className="ubuntu-files__sidebar" aria-label="Emplacements" aria-hidden={compactSidebar && !sidebarOverlay || !compactSidebar && !sidebarVisible} inert={compactSidebar && !sidebarOverlay || !compactSidebar && !sidebarVisible ? true : undefined} onClick={(event) => event.stopPropagation()}>
        <button className={pathClass(ROOT)} {...dropHandlers(ROOT)} onDrop={(event) => handleFileDrop(event, ROOT)} onClick={() => go(ROOT)}><Home size={17} /> Dossier personnel</button>
        {[['Projets', 'Mes projets', Folder], ['Desktop', 'Bureau', Monitor], ['Documents', 'Documents', Folder], ['Downloads', 'Téléchargements', Download], ['Music', 'Musique', Music], ['Pictures', 'Images', Image], ['Videos', 'Vidéos', Video]].map(([directory, label, Icon]) => <button key={directory} className={pathClass(`${ROOT}/${directory}`)} {...dropHandlers(`${ROOT}/${directory}`)} onDrop={(event) => handleFileDrop(event, `${ROOT}/${directory}`)} onClick={() => go(`${ROOT}/${directory}`)}><Icon size={17} />{label}</button>)}
        <div className="ubuntu-files__sidebar-separator" />
        <button className={pathClass('trash')} {...dropHandlers('trash')} onDrop={(event) => handleFileDrop(event, 'trash')} onClick={() => go('trash')}><Trash2 size={17} /> Corbeille</button>
        <button className={pathClass('/')} {...dropHandlers('/')} onDrop={(event) => handleFileDrop(event, '/')} onClick={() => go('/')}><Monitor size={17} /> Ordinateur</button>
      </nav>
      <div className="ubuntu-files__main">
        {inTrash && entries.length > 0 && <div className="ubuntu-files__trash-actions"><span>Les éléments peuvent être restaurés à leur emplacement d’origine.</span><button onClick={() => restoreSelection(selection.length ? selection : Object.keys(trash))}>{selection.length ? 'Restaurer la sélection' : 'Tout restaurer'}</button></div>}
        {view === 'list' && <div className="ubuntu-files__columns">{[['name', 'Nom'], ['size', 'Taille'], ['type', 'Type']].map(([value, label]) => <button key={value} aria-label={`Trier par ${label.toLowerCase()}`} onClick={() => changeSort(value)}>{label}{sortBy === value && <span aria-hidden="true">{descending ? '⌄' : '⌃'}</span>}</button>)}</div>}
        <div ref={gridRef} role="listbox" aria-multiselectable="true" aria-label="Fichiers du dossier" className={`ubuntu-files__grid ${view === 'list' ? 'is-list' : ''} ${visibleEntries.length === 0 ? 'is-empty' : ''} ${dropTarget === cwd ? 'is-drop-target' : ''}`} {...dropHandlers(cwd)} onDrop={(event) => handleFileDrop(event, cwd)} onPointerDown={beginRubberBand} onPointerMove={updateRubberBand} onPointerUp={finishRubberBand} onPointerCancel={finishRubberBand} onClick={(event) => { if (event.target.closest('.ubuntu-file')) return; if (suppressBlankClick.current) { suppressBlankClick.current = false; return; } if (!event.ctrlKey && !event.metaKey && !event.shiftKey) select([]); }} onContextMenu={(event) => openContextMenu(event)}>
          {visibleEntries.map(([name, type], index) => {
            const path = inTrash ? name : normalizePath(name, cwd);
            const label = inTrash ? fileName(trash[path].path) : cwd === ROOT && type === 'dir' ? folderLabels[name] || name : name;
            const entryFiles = inTrash ? trash[path].files : files;
            const entryPath = inTrash ? trash[path].path : path;
            const metadata = fileMetadata(entryFiles, entryPath);
            const selected = selection.includes(path);

            const cut = clipboard.mode === 'cut' && clipboard.paths.includes(path);
            return <div role="option" tabIndex={focusedPath === path || !focusedPath && index === 0 ? 0 : -1} key={path} data-file-path={path} data-entry-index={index} className={`ubuntu-file ${selected ? 'is-selected' : ''} ${focusedPath === path ? 'is-focused' : ''} ${cut ? 'is-cut' : ''} ${dragPaths.includes(path) ? 'is-dragging' : ''} ${dropTarget === path ? 'is-drop-target' : ''}`} aria-selected={selected} draggable={!inTrash} onDragStart={(event) => startDrag(event, path)} onDragEnd={() => { endFileDrag(); setDragPaths([]); setDropTarget(null); }} {...(!inTrash && type === 'dir' ? dropHandlers(path) : {})} onDrop={type === 'dir' && !inTrash ? (event) => handleFileDrop(event, path) : undefined} onClick={(event) => selectEntry(event, path)} onContextMenu={(event) => openContextMenu(event, path)} onDoubleClick={(event) => { event.stopPropagation(); openEntry(path, type); }}>
              <span className="ubuntu-file__icon"><img src={metadata.icon} alt="" draggable="false" /></span>
              <span>{label}</span>
              <span className="ubuntu-file__size">{metadata.sizeLabel}</span><small>{metadata.type}</small>
            </div>;
          })}
          {visibleEntries.length === 0 && <div className="ubuntu-files__empty">{inTrash ? <Trash2 size={64} strokeWidth={1.2} /> : <Folder size={64} strokeWidth={1.2} />}<strong>{query ? 'Aucun résultat' : inTrash ? 'La corbeille est vide' : 'Le dossier est vide'}</strong><span>{query ? 'Essayez un autre terme de recherche.' : ''}</span></div>}
          {rubberBand && <div aria-hidden="true" className="ubuntu-files__selection-box" style={rubberBand} />}
        </div>
      </div>
    </div>
    <footer className="ubuntu-files__status"><span>{selection.length ? `${selection.length} sélectionné${selection.length > 1 ? 's' : ''}` : `${visibleEntries.length} élément${visibleEntries.length === 1 ? '' : 's'}`}</span><span role="status" title={notice}>{notice || (selectedPath ? `${fileName(selectedPath)}${!inTrash && !canDeletePath(files, selectedPath) ? ' · protégé' : ''}` : 'Prêt')}</span></footer>
    {contextMenu && <div ref={menuRef} className="ubuntu-files__context-menu" role="menu" aria-label="Actions sur les fichiers" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
      event.stopPropagation();
      if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); setContextMenu(null); rootRef.current?.focus(); }
      if (!event.target.matches('select') && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const controls = [...menuRef.current.querySelectorAll('button:not(:disabled), select')];
        const index = controls.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
        controls[next]?.focus();
      }
    }}>
      {contextMenu.kind === 'create' ? <><button role="menuitem" onClick={() => createEntry('folder')}><FolderPlus size={15} /> Nouveau dossier</button><button role="menuitem" onClick={() => createEntry('file')}><FilePlus2 size={15} /> Nouveau document</button></> : contextMenu.kind === 'view' ? <><strong className="ubuntu-files__popover-title">Affichage</strong><button onClick={() => { setView('grid'); setContextMenu(null); }}><Grid2X2 size={16} /> Grille {view === 'grid' ? '✓' : ''}</button><button onClick={() => { setView('list'); setContextMenu(null); }}><List size={16} /> Liste {view === 'list' ? '✓' : ''}</button><span className="ubuntu-files__context-separator" /><label className="ubuntu-files__sort-label">Trier par<select aria-label="Trier" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setDescending(false); }}><option value="name">Nom</option><option value="size">Taille</option><option value="type">Type</option></select></label><button role="menuitemcheckbox" aria-checked={descending} onClick={() => setDescending((value) => !value)}>Ordre inversé {descending ? '✓' : ''}</button><button role="menuitemcheckbox" aria-checked={showHidden} onClick={() => setShowHidden((value) => !value)}>Afficher les fichiers cachés {showHidden ? '✓' : ''}</button></> : inTrash ? <>
        {menuPath && <button onClick={() => restoreSelection()}><Folder size={15} /> Restaurer {selection.length > 1 ? 'la sélection' : ''}</button>}
        <button disabled={!entries.length} onClick={() => restoreSelection(Object.keys(trash))}><Folder size={15} /> Tout restaurer</button>
        <button disabled={!entries.length} onClick={clearTrash}><Trash2 size={15} /> Vider la corbeille</button>
      </> : <>
        {menuPath && <button onClick={() => { selection.forEach((path) => openEntry(path, isDirectory(files, path) ? 'dir' : 'file')); setContextMenu(null); }}><Home size={15} /> Ouvrir{selection.length > 1 ? ` ${selection.length} éléments` : ''}</button>}
        {!menuPath && <><button onClick={() => createEntry('folder')}><FolderPlus size={15} /> Nouveau dossier</button><button onClick={() => createEntry('file')}><FilePlus2 size={15} /> Nouveau document</button></>}
        {menuPath && <><span className="ubuntu-files__context-separator" /><button disabled={selection.length !== 1 || !allDeletable} onClick={() => startRename(menuPath)}><Pencil size={15} /> Renommer</button><button onClick={() => copySelection('copy')}><Copy size={15} /> Copier</button><button disabled={!allDeletable} onClick={() => copySelection('cut')}><Scissors size={15} /> Couper</button><button disabled={!clipboard.paths.length} onClick={paste}><Clipboard size={15} /> Coller</button><button disabled={!allDeletable} onClick={() => moveToTrash()}><Trash2 size={15} /> Mettre à la corbeille</button><button onClick={() => openProperties()}><Info size={15} /> Propriétés <kbd>Alt+Entrée</kbd></button></>}
        {!menuPath && <><button disabled={!clipboard.paths.length} onClick={paste}><Clipboard size={15} /> Coller</button><button onClick={() => openProperties([cwd])}><Info size={15} /> Propriétés</button></>}
        <span className="ubuntu-files__context-separator" /><button disabled={!undoCount} onClick={undoOperation}><Undo2 size={15} /> Annuler</button>
        {contextMenu.kind === 'app' && <button onClick={() => { setView((current) => current === 'grid' ? 'list' : 'grid'); setContextMenu(null); }}>{view === 'grid' ? <List size={16} /> : <Grid2X2 size={16} />}{view === 'grid' ? 'Afficher en liste' : 'Afficher en grille'}</button>}
        {contextMenu.kind === 'app' && <><span className="ubuntu-files__context-separator" /><button onClick={editLocation}>Saisir l’emplacement… <kbd>Ctrl+L</kbd></button><button role="menuitemcheckbox" aria-checked={showHidden} onClick={() => setShowHidden((value) => !value)}>Afficher les fichiers cachés {showHidden ? '✓' : ''}</button></>}
      </>}
    </div>}
    {nameOperation && <FileNameDialog key={`${nameOperation.directory}:${nameOperation.path || nameOperation.kind}`} presentation={nameOperation.path ? 'popover' : 'files'} operation={nameOperation} directory={nameOperation.directory} directoryLabel={nameOperation.directory === ROOT ? 'Dossier personnel' : folderLabels[fileName(nameOperation.directory)] || fileName(nameOperation.directory)} files={files} onSave={saveName} onClose={closeNameOperation} />}
    {infoPaths && <FileProperties files={files} paths={infoPaths} onClose={closeProperties} onOpenDirectory={revealInParent} />}
  </div>;
}





