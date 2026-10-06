import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ClipboardPaste, Copy, FilePlus2, FolderOpen, FolderPlus, LockKeyhole, Pencil, Scissors, Terminal, Trash2, X } from 'lucide-react';
import { canDeletePath, DIRECTORY_MARKER, isDirectory, listDirectory, normalizePath, readTrash, renamePath, restoreFromTrash, ROOT, trashPaths, transferPaths, uniquePath, writeFiles } from './virtualFs';
import { endAppDrag, hasAppDrag, readAppDrag, readAppShortcut } from './apps';
import { endFileDrag, FILE_CLIPBOARD_EVENT, FILE_DRAG_END_EVENT, fileDragCopies, readFileClipboard, readFileDrag, writeFileClipboard, writeFileDrag } from './dragDrop';
import FileNameDialog from './FileNameDialog';
import { readImage } from './imageFiles';
import './DesktopItems.css';

const DESKTOP = `${ROOT}/Desktop`;
const POSITIONS_KEY = 'portfolio.desktop-positions.v1';
const DESKTOP_DRAG = 'application/x-ubuntu-desktop';
const CELL_WIDTH = 116;
const CELL_HEIGHT = 116;
const SHORTCUTS = [
  { id: '@projects', name: 'Mes projets', icon: '/ubuntu-apps/folder.png', app: 'portfolio', options: { section: 'projects' }, protected: true },
  { id: '@cv', name: 'Mon CV', icon: '/ubuntu-apps/file.png', app: 'cv', protected: true },
  { id: '@profile', name: 'À propos', icon: '/ubuntu-apps/editor.png', app: 'portfolio', options: { section: 'profile' }, protected: true },
];

function readPositions() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSITIONS_KEY));
    return Object.fromEntries(Object.entries(saved || {}).filter(([, position]) => position && Number.isInteger(position.col) && Number.isInteger(position.row) && position.col >= 0 && position.row >= 0));
  } catch { return {}; }
}

function desktopLayout(viewport, count) {
  const mobile = viewport.width <= 620;
  const left = mobile ? 12 : 88;
  const top = mobile ? 12 : 20;
  const cols = Math.max(1, Math.floor((viewport.width - left - 12) / CELL_WIDTH));
  const rows = Math.max(1, Math.floor((viewport.height - 32 - top - (mobile ? 104 : 20)) / CELL_HEIGHT));
  return { left, top, cols, rows: Math.max(rows, Math.ceil(count / cols)), mobile };
}

const cellKey = (cell) => `${cell.col}:${cell.row}`;
function nearestCell(preferred, occupied, layout) {
  const cells = [];
  for (let col = 0; col < layout.cols; col += 1) for (let row = 0; row < layout.rows; row += 1) {
    if (!occupied.has(`${col}:${row}`)) cells.push({ col, row });
  }
  cells.sort((a, b) => (Math.abs(a.col - preferred.col) + Math.abs(a.row - preferred.row)) - (Math.abs(b.col - preferred.col) + Math.abs(b.row - preferred.row))
    || (layout.mobile ? a.row - b.row || a.col - b.col : a.col - b.col || a.row - b.row));
  return cells[0] || { col: preferred.col, row: layout.rows };
}

function arrangeItems(items, saved, layout) {
  const occupied = new Set();
  const result = {};
  // Existing positions take precedence; newly created documents fill a free cell.
  [...items.filter((item) => saved[item.id]), ...items.filter((item) => !saved[item.id])].forEach((item) => {
    const index = items.indexOf(item);
    const preferred = saved[item.id] || (layout.mobile ? { col: index % layout.cols, row: Math.floor(index / layout.cols) } : { col: Math.floor(index / layout.rows), row: index % layout.rows });
    const cell = nearestCell({ col: Math.min(preferred.col, layout.cols - 1), row: Math.min(preferred.row, layout.rows - 1) }, occupied, layout);
    occupied.add(cellKey(cell));
    result[item.id] = cell;
  });
  return result;
}

export default function DesktopItems({ files, setFiles, onOpen, onOpenFile, onFocusDesktop }) {
  const [selected, setSelected] = useState([]);
  const [positions, setPositions] = useState(readPositions);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [menu, setMenu] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [operation, setOperation] = useState(null);
  const [notice, setNotice] = useState('');
  const [rubberband, setRubberband] = useState(null);
  const [dragging, setDragging] = useState([]);
  const [dropTarget, setDropTarget] = useState(null);
  const [clipboard, setClipboard] = useState(readFileClipboard);
  const [undoCount, setUndoCount] = useState(0);
  const undoTrashRef = useRef([]);
  const menuRef = useRef(null);
  const surfaceRef = useRef(null);
  const anchorRef = useRef(null);
  const dragRef = useRef(null);
  const bandRef = useRef(null);
  const entries = listDirectory(files, DESKTOP).filter(([name]) => showHidden || !name.startsWith('.'));
  const items = [...SHORTCUTS, ...entries.map(([name, type]) => {
    const path = `${DESKTOP}/${name}`;
    const app = readAppShortcut(files[path]);
    return { id: path, path, name: app ? name.replace(/\.desktop$/, '') : name, type, app: app?.id, icon: app?.icon || readImage(files[path])?.src || `/ubuntu-apps/${type === 'dir' ? 'folder' : 'file'}.png`, protected: !canDeletePath(files, path) };
  })];
  const layout = desktopLayout(viewport, items.length);
  const cells = arrangeItems(items, positions, layout);
  const selection = selected.filter((id) => items.some((item) => item.id === id));
  const selectedItems = items.filter((item) => selection.includes(item.id));
  const selectedPaths = selectedItems.filter((item) => item.path).map((item) => item.path);
  const editableSelection = selectedItems.length > 0 && selectedItems.every((item) => !item.protected);
  const focusDesktop = useCallback((ids = []) => {
    requestAnimationFrame(() => {
      const item = ids[0] && surfaceRef.current?.querySelector(`[data-desktop-id="${CSS.escape(ids[0])}"]`);
      (item || surfaceRef.current)?.focus({ preventScroll: true });
      item?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }, []);

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    const updateClipboard = () => setClipboard(readFileClipboard());
    const clearDragFeedback = () => { dragRef.current = null; setDragging([]); setDropTarget(null); };
    window.addEventListener('resize', resize);
    window.addEventListener(FILE_CLIPBOARD_EVENT, updateClipboard);
    window.addEventListener(FILE_DRAG_END_EVENT, clearDragFeedback);
    return () => { window.removeEventListener('resize', resize); window.removeEventListener(FILE_CLIPBOARD_EVENT, updateClipboard); window.removeEventListener(FILE_DRAG_END_EVENT, clearDragFeedback); };
  }, []);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector('button:not(:disabled)')?.focus();
    function dismiss(event) { if (!menuRef.current?.contains(event.target)) setMenu(null); }
    function keyboard(event) {
      if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); setMenu(null); focusDesktop(selected); return; }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const buttons = [...menuRef.current.querySelectorAll('button:not(:disabled)')];
      const current = buttons.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
    const resize = () => setMenu(null);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', keyboard);
    window.addEventListener('resize', resize);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', keyboard); window.removeEventListener('resize', resize); };
  }, [menu, selected, focusDesktop]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    function cancelBand(event) {
      if (!bandRef.current || event.type === 'keydown' && event.key !== 'Escape') return;
      event.preventDefault();
      if (event.type === 'keydown') event.stopPropagation();
      const gesture = bandRef.current;
      bandRef.current = null;
      if (surfaceRef.current?.hasPointerCapture(gesture.pointerId)) surfaceRef.current.releasePointerCapture(gesture.pointerId);
      setSelected(gesture.previousSelection);
      setRubberband(null);
    }
    window.addEventListener('keydown', cancelBand, true);
    window.addEventListener('blur', cancelBand);
    return () => { window.removeEventListener('keydown', cancelBand, true); window.removeEventListener('blur', cancelBand); };
  }, []);

  function savePositions(next) {
    setPositions(next);
    try { localStorage.setItem(POSITIONS_KEY, JSON.stringify(next)); } catch { /* Movement still works when storage is unavailable. */ }
  }
  function showMenu(event, ids = []) {
    event.preventDefault(); onFocusDesktop(); setSelected(ids);
    setMenu({ x: Math.max(8, Math.min(event.clientX, window.innerWidth - 248)), y: Math.max(36, Math.min(event.clientY, window.innerHeight - (ids.length ? 360 : 318))), originX: event.clientX, originY: event.clientY });
  }
  function openItem(id) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    setMenu(null);
    if (item.app) onOpen(item.app, item.options);
    else if (item.type === 'dir') onOpen('files', { directory: item.path });
    else onOpenFile(item.path);
  }
  function selectItem(event, id) {
    onFocusDesktop(); setMenu(null);
    if (event.shiftKey && anchorRef.current) {
      const start = items.findIndex((item) => item.id === anchorRef.current);
      const end = items.findIndex((item) => item.id === id);
      const range = items.slice(Math.min(start, end), Math.max(start, end) + 1).map((item) => item.id);
      setSelected(event.ctrlKey || event.metaKey ? [...new Set([...selection, ...range])] : range);
    } else if (event.ctrlKey || event.metaKey) {
      setSelected(selection.includes(id) ? selection.filter((entry) => entry !== id) : [...selection, id]); anchorRef.current = id;
    } else { setSelected([id]); anchorRef.current = id; }
  }
  function begin(kind, path) {
    const rect = surfaceRef.current?.getBoundingClientRect();
    const cell = !path && menu && rect ? {
      col: Math.max(0, Math.min(layout.cols - 1, Math.floor((menu.originX - rect.left + surfaceRef.current.scrollLeft - layout.left) / CELL_WIDTH))),
      row: Math.max(0, Math.min(layout.rows - 1, Math.floor((menu.originY - rect.top + surfaceRef.current.scrollTop - layout.top) / CELL_HEIGHT))),
    } : null;
    setMenu(null);
    setOperation({ kind: path ? isDirectory(files, path) ? 'folder' : 'file' : kind, path, cell });
  }
  function closeOperation(ids = selection) { setOperation(null); focusDesktop(Array.isArray(ids) ? ids : selection); }
  function saveName(name) {
    if (operation.path && !canDeletePath(files, operation.path)) return 'Cet élément est protégé ou n’existe plus.';
    const path = operation.path || normalizePath(name, DESKTOP);
    const destination = normalizePath(name, DESKTOP);
    if (name.startsWith('.')) setShowHidden(true);
    setFiles(writeFiles(operation.path ? renamePath(files, path, name) : { ...files, [path]: operation.kind === 'folder' ? DIRECTORY_MARKER : '' }));
    if (operation.path && cells[path]) savePositions({ ...positions, [destination]: cells[path] });
    else if (operation.cell) savePositions({ ...positions, [destination]: nearestCell(operation.cell, new Set(Object.values(cells).map(cellKey)), layout) });
    setSelected([destination]); setNotice(operation.path ? 'Élément renommé.' : operation.kind === 'folder' ? 'Dossier créé sur le bureau.' : 'Document créé sur le bureau.'); closeOperation([destination]);
  }
  function deleteSelected() {
    setMenu(null);
    if (!editableSelection) { setNotice('Les éléments du portfolio sont protégés. Seules vos créations peuvent être supprimées.'); focusDesktop(selection); return; }
    const beforeTrash = readTrash();
    const next = trashPaths(files, selectedPaths);
    const receipts = Object.entries(readTrash()).filter(([key]) => !Object.hasOwn(beforeTrash, key)).map(([key, record]) => ({ key, signature: JSON.stringify(record) }));
    if (receipts.length) {
      undoTrashRef.current = [...undoTrashRef.current.slice(-19), receipts];
      setUndoCount(undoTrashRef.current.length);
    }
    setFiles(writeFiles(next)); setSelected([]); focusDesktop();
    setNotice(selection.length === 1 ? 'Élément déplacé dans la corbeille.' : 'Éléments déplacés dans la corbeille.');
  }
  function undoDeletion() {
    const receipts = undoTrashRef.current.at(-1);
    if (!receipts) return;
    setMenu(null); onFocusDesktop();
    const trash = readTrash();
    undoTrashRef.current.pop(); setUndoCount(undoTrashRef.current.length);
    if (receipts.some(({ key, signature }) => JSON.stringify(trash[key]) !== signature)) {
      setNotice('Cette suppression ne peut plus être annulée : un élément a déjà été restauré ou supprimé.'); focusDesktop(); return;
    }
    let next = files;
    receipts.forEach(({ key }) => { next = restoreFromTrash(next, key); });
    const added = Object.keys(next).filter((path) => !Object.hasOwn(files, path));
    const roots = added.filter((path) => !added.some((parent) => parent !== path && path.startsWith(`${parent}/`)));
    const visible = roots.filter((path) => normalizePath('..', path) === DESKTOP);
    setFiles(writeFiles(next)); setSelected(visible); focusDesktop(visible);
    setNotice('Suppression annulée. Les éléments ont été restaurés.');
  }
  function copySelection(mode) {
    setMenu(null);
    if (selectedPaths.length !== selection.length || (mode === 'cut' && !editableSelection)) return;
    writeFileClipboard(selectedPaths, mode);
    focusDesktop(selection);
  }
  function paste() {
    setMenu(null);
    const current = readFileClipboard();
    const result = transferPaths(files, current.paths, DESKTOP, { copy: current.mode !== 'cut' });
    if (result.changed) { setFiles(writeFiles(result.files)); setSelected(result.paths); if (current.mode === 'cut') writeFileClipboard([]); }
    setNotice(result.message);
    focusDesktop(result.changed ? result.paths : selection);
  }
  function startBand(event) {
    if (event.button !== 0 || event.target !== event.currentTarget || bandRef.current) return;
    onFocusDesktop(); setMenu(null); surfaceRef.current.focus();
    const rect = surfaceRef.current.getBoundingClientRect();
    const base = event.ctrlKey || event.metaKey || event.shiftKey ? selection : [];
    bandRef.current = { pointerId: event.pointerId, previousSelection: selection, start: { x: event.clientX - rect.left + surfaceRef.current.scrollLeft, y: event.clientY - rect.top + surfaceRef.current.scrollTop }, base, moved: false, openMenu: !menu && !event.ctrlKey && !event.metaKey && !event.shiftKey };
    setSelected(base); event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveBand(event) {
    if (!bandRef.current || bandRef.current.pointerId !== event.pointerId) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    const start = bandRef.current.start;
    const current = { x: event.clientX - rect.left + surfaceRef.current.scrollLeft, y: event.clientY - rect.top + surfaceRef.current.scrollTop };
    const band = { x: Math.min(start.x, current.x), y: Math.min(start.y, current.y), width: Math.abs(current.x - start.x), height: Math.abs(current.y - start.y) };
    if (band.width + band.height < 4) return;
    bandRef.current.moved = true;
    setRubberband(band);
    const matched = items.filter((item) => {
      const cell = cells[item.id]; const x = layout.left + cell.col * CELL_WIDTH; const y = layout.top + cell.row * CELL_HEIGHT;
      return x < band.x + band.width && x + 104 > band.x && y < band.y + band.height && y + 108 > band.y;
    }).map((item) => item.id);
    setSelected([...new Set([...bandRef.current.base, ...matched])]);
  }
  function endBand(event) {
    if (!bandRef.current || bandRef.current.pointerId !== event.pointerId) return;
    const gesture = bandRef.current;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    bandRef.current = null; setRubberband(null);
    if (event.type !== 'pointerup') setSelected(gesture.previousSelection);
    if (event.type === 'pointerup' && !gesture.moved && gesture.openMenu) showMenu(event);
  }
  function startDrag(event, item) {
    const ids = selection.includes(item.id) ? selection : [item.id];
    setSelected(ids); setMenu(null);
    const paths = items.filter((entry) => ids.includes(entry.id) && entry.path).map((entry) => entry.path);
    if (paths.length) writeFileDrag(event, paths, files);
    event.dataTransfer.setData(DESKTOP_DRAG, JSON.stringify({ ids, anchor: item.id })); event.dataTransfer.effectAllowed = 'copyMove';
    dragRef.current = { ids, anchor: item.id }; setDragging(ids);
    const ghost = document.createElement('div'); ghost.className = 'desktop-drag-ghost';
    const img = document.createElement('img'); img.src = item.icon; ghost.append(img);
    if (ids.length > 1) { const badge = document.createElement('span'); badge.textContent = String(ids.length); ghost.append(badge); }
    document.body.append(ghost); event.dataTransfer.setDragImage(ghost, 32, 32); setTimeout(() => ghost.remove(), 0);
  }
  function stopDrag() { endFileDrag(); dragRef.current = null; setDragging([]); setDropTarget(null); }
  function pointCell(event) {
    const rect = surfaceRef.current.getBoundingClientRect();
    return { col: Math.max(0, Math.min(layout.cols - 1, Math.floor((event.clientX - rect.left + surfaceRef.current.scrollLeft - layout.left) / CELL_WIDTH))), row: Math.max(0, Math.min(layout.rows - 1, Math.floor((event.clientY - rect.top + surfaceRef.current.scrollTop - layout.top) / CELL_HEIGHT))) };
  }
  function reposition(ids, anchor, cell) {
    const next = { ...positions }; const occupied = new Set(items.filter((item) => !ids.includes(item.id)).map((item) => cellKey(cells[item.id])));
    const origin = cells[anchor] || { col: 0, row: 0 };
    ids.forEach((id, index) => {
      const source = cells[id] || { col: origin.col, row: origin.row + index };
      const preferred = { col: Math.max(0, Math.min(layout.cols - 1, cell.col + source.col - origin.col)), row: Math.max(0, Math.min(layout.rows - 1, cell.row + source.row - origin.row)) };
      const target = nearestCell(preferred, occupied, { ...layout, rows: Math.max(layout.rows, Math.ceil((items.length + ids.length) / layout.cols)) });
      occupied.add(cellKey(target)); next[id] = target;
    });
    savePositions(next); setSelected(ids);
  }
  function dragOver(event, directory) {
    const app = hasAppDrag(event.dataTransfer); const paths = readFileDrag(event); const internal = Array.from(event.dataTransfer.types || []).includes(DESKTOP_DRAG);
    if (!app && !paths.length && !internal) return;
    if (directory && (paths.includes(directory) || paths.some((path) => directory.startsWith(`${path}/`)))) return;
    event.preventDefault(); if (directory) event.stopPropagation();
    event.dataTransfer.dropEffect = app ? 'copy' : internal && !directory ? 'move' : fileDragCopies(event, files, paths) ? 'copy' : 'move';
    setDropTarget(directory || { cell: pointCell(event) });
  }
  function receiveDrop(event, directory = DESKTOP) {
    event.preventDefault(); event.stopPropagation();
    const app = readAppDrag(event.dataTransfer); const cell = pointCell(event);
    if (app) {
      const path = uniquePath(files, directory, `${app.name}.desktop`);
      setFiles(writeFiles({ ...files, [path]: JSON.stringify({ type: 'ubuntu-app-shortcut', version: 1, appId: app.id }) }));
      if (directory === DESKTOP) reposition([path], path, cell);
      setNotice(`Raccourci « ${app.name} » créé.`);
      window.dispatchEvent(new Event('portfolio:app-shortcut-created'));
      endAppDrag();
    } else {
      let internal = dragRef.current;
      try { const raw = event.dataTransfer.getData(DESKTOP_DRAG); if (raw) internal = JSON.parse(raw); } catch { /* Ignore invalid external payloads. */ }
      const paths = readFileDrag(event);
      if (directory === DESKTOP && internal?.ids?.length && (!(event.ctrlKey || event.metaKey) || !paths.length)) reposition(internal.ids.filter((id) => items.some((item) => item.id === id)), internal.anchor, cell);
      else if (directory === DESKTOP && paths.length && !event.ctrlKey && !event.metaKey && paths.every((path) => path.slice(0, path.lastIndexOf('/')) === DESKTOP)) reposition(paths, paths[0], cell);
      else if (paths.length) {
        const result = transferPaths(files, paths, directory, { copy: fileDragCopies(event, files, paths) });
        if (result.changed) { setFiles(writeFiles(result.files)); if (directory === DESKTOP) reposition(result.paths, result.paths[0], cell); else setSelected([]); }
        setNotice(result.message);
      }
    }
    stopDrag();
  }
  function keyboard(event) {
    if (event.defaultPrevented) return;
    if (event.target.closest('input, textarea') || operation || menu) return;
    if (event.metaKey || event.ctrlKey && event.altKey) return;
    const modifier = event.ctrlKey; const key = event.key.toLowerCase();
    if (modifier && event.shiftKey && key === 'n') { event.preventDefault(); begin('folder'); }
    else if (modifier && key === 'h') { event.preventDefault(); setShowHidden((value) => !value); }
    else if (modifier && key === 'a') { event.preventDefault(); setSelected(items.map((item) => item.id)); }
    else if (modifier && ['c', 'x'].includes(key)) { event.preventDefault(); copySelection(key === 'x' ? 'cut' : 'copy'); }
    else if (modifier && key === 'v') { event.preventDefault(); paste(); }
    else if (modifier && !event.shiftKey && key === 'z') { event.preventDefault(); undoDeletion(); }
    else if (event.key === 'Delete' && selection.length) { event.preventDefault(); deleteSelected(); }
    else if (event.key === 'F2' && selection.length === 1 && editableSelection) { event.preventDefault(); begin('rename', selection[0]); }
    else if (event.key === 'Enter' && (event.target.closest('[data-desktop-id]') || selection.length === 1)) { event.preventDefault(); openItem(event.target.closest('[data-desktop-id]')?.dataset.desktopId || selection[0]); }
    else if (event.key === 'Escape') setSelected([]);
    else if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); showMenu({ preventDefault() {}, clientX: rect.left + 220, clientY: rect.top + 30 }, selection); }
    else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const currentId = document.activeElement?.dataset.desktopId || selection.at(-1); const current = cells[currentId] || { col: -1, row: 0 };
      const candidates = items.filter((item) => item.id !== currentId && (event.key === 'ArrowRight' ? cells[item.id].col > current.col : event.key === 'ArrowLeft' ? cells[item.id].col < current.col : event.key === 'ArrowDown' ? cells[item.id].row > current.row : event.key === 'ArrowUp' ? cells[item.id].row < current.row : true));
      candidates.sort((a, b) => (Math.abs(cells[a.id].col - current.col) + Math.abs(cells[a.id].row - current.row)) - (Math.abs(cells[b.id].col - current.col) + Math.abs(cells[b.id].row - current.row)));
      const next = event.key === 'Home' ? items[0] : event.key === 'End' ? items.at(-1) : candidates[0];
      if (next) { setSelected(event.shiftKey ? [...new Set([...selection, next.id])] : [next.id]); focusDesktop([next.id]); }
    }
  }

  return <>
    <div className="desktop-items" ref={surfaceRef} tabIndex={0} role="group" aria-label="Bureau. Cliquez sur un élément pour le sélectionner, sur une zone vide pour créer un fichier ou un dossier." onKeyDown={keyboard}
      onPointerDown={startBand} onPointerMove={moveBand} onPointerUp={endBand} onPointerCancel={endBand} onLostPointerCapture={endBand}
      onContextMenu={(event) => { if (event.target === event.currentTarget) showMenu(event); }}
      onDragEnter={(event) => dragOver(event)} onDragOver={(event) => dragOver(event)} onDrop={(event) => receiveDrop(event)} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null); }}>
      {items.map((item) => <button key={item.id} type="button" data-desktop-id={item.id} draggable className={`desktop-items__item ${selection.includes(item.id) ? 'is-selected' : ''} ${dragging.includes(item.id) ? 'is-dragging' : ''} ${dropTarget === item.path && item.type === 'dir' ? 'is-drop-target' : ''} ${clipboard.mode === 'cut' && clipboard.paths.includes(item.path) ? 'is-cut' : ''}`}
        style={{ left: layout.left + cells[item.id].col * CELL_WIDTH, top: layout.top + cells[item.id].row * CELL_HEIGHT }}
        title={`${item.name}${item.protected ? ' · élément du portfolio' : ''} (double-clic pour ouvrir)`} aria-pressed={selection.includes(item.id)}
        onClick={(event) => { event.stopPropagation(); selectItem(event, item.id); }} onDoubleClick={() => openItem(item.id)}
        onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) onFocusDesktop(); }}
        onContextMenu={(event) => { event.stopPropagation(); showMenu(event, selection.includes(item.id) ? selection : [item.id]); }}
        onDragStart={(event) => startDrag(event, item)} onDragEnd={stopDrag}
        onDragEnter={item.type === 'dir' ? (event) => dragOver(event, item.path) : undefined} onDragOver={item.type === 'dir' ? (event) => dragOver(event, item.path) : undefined} onDrop={item.type === 'dir' ? (event) => receiveDrop(event, item.path) : undefined}>
        <span className="desktop-items__icon"><img src={item.icon} alt="" draggable="false" />{item.app && item.path && <span className="desktop-items__shortcut-badge">↗</span>}</span><span>{item.name}</span>
      </button>)}
      {rubberband && <div className="desktop-items__selection" style={{ left: rubberband.x, top: rubberband.y, width: rubberband.width, height: rubberband.height }} />}
      {dropTarget && typeof dropTarget === 'object' && <div className="desktop-items__drop-cell" style={{ left: layout.left + dropTarget.cell.col * CELL_WIDTH, top: layout.top + dropTarget.cell.row * CELL_HEIGHT }} />}
    </div>
    {menu && createPortal(<div ref={menuRef} className="desktop-context-menu" role="menu" aria-label="Actions du bureau" style={{ left: menu.x, top: menu.y, maxHeight: Math.max(80, window.innerHeight - menu.y - 8) }}>
      {selection.length > 0 ? <>
        <button role="menuitem" disabled={selection.length !== 1} onClick={() => openItem(selection[0])}><FolderOpen size={16} />Ouvrir</button>
        <button role="menuitem" disabled={selection.length !== 1 || !editableSelection} onClick={() => begin('rename', selection[0])}><Pencil size={16} />Renommer…<kbd>F2</kbd></button>
        <button role="menuitem" disabled={!editableSelection} onClick={() => copySelection('cut')}><Scissors size={16} />Couper<kbd>Ctrl+X</kbd></button>
        <button role="menuitem" disabled={selectedPaths.length !== selection.length} onClick={() => copySelection('copy')}><Copy size={16} />Copier<kbd>Ctrl+C</kbd></button>
        <button role="menuitem" disabled={!editableSelection} onClick={deleteSelected}><Trash2 size={16} />Déplacer dans la corbeille</button>
        {!editableSelection && <span className="desktop-context-menu__hint"><LockKeyhole size={13} />Élément du portfolio protégé</span>}
      </> : <>
        <button role="menuitem" onClick={() => begin('folder')}><FolderPlus size={16} />Nouveau dossier…<kbd>Ctrl+Maj+N</kbd></button>
        <button role="menuitem" onClick={() => begin('file')}><FilePlus2 size={16} />Nouveau document…</button>
        <button role="menuitem" disabled={!clipboard.paths.length} onClick={paste}><ClipboardPaste size={16} />Coller<kbd>Ctrl+V</kbd></button>
        <button role="menuitem" disabled={!undoCount} onClick={undoDeletion}>Annuler la suppression<kbd>Ctrl+Z</kbd></button>
        <button role="menuitemcheckbox" aria-checked={showHidden} onClick={() => { setShowHidden((value) => !value); setMenu(null); focusDesktop(); }}><Check size={16} style={{ visibility: showHidden ? 'visible' : 'hidden' }} />Afficher les fichiers cachés<kbd>Ctrl+H</kbd></button>
        <div role="separator" />
        <button role="menuitem" onClick={() => { setMenu(null); onOpen('files', { directory: DESKTOP }); }}><FolderOpen size={16} />Afficher le Bureau dans Fichiers</button>
        <button role="menuitem" onClick={() => { setMenu(null); onOpen('terminal', { directory: DESKTOP }); }}><Terminal size={16} />Ouvrir dans le terminal</button>
      </>}
    </div>, document.body)}
    {operation && <FileNameDialog directory={DESKTOP} directoryLabel="Bureau" key={`${operation.kind}-${operation.path || ''}`} operation={operation} files={files} onSave={saveName} onClose={closeOperation} />}
    {notice && <div className="desktop-items__notice" role="status"><span>{notice}</span>{notice.includes('corbeille') && undoCount > 0 && <button onClick={undoDeletion}>Annuler</button>}{notice.includes('corbeille') && <button onClick={() => { setNotice(''); onOpen('trash'); }}>Corbeille</button>}<button aria-label="Masquer la notification" onClick={() => { setNotice(''); focusDesktop(selection); }}><X size={15} /></button></div>}
  </>;
}

