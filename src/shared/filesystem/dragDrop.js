import { canDeletePath, normalizePath } from './virtualFs.js';

export const MIME_FILES = 'application/x-ubuntu-files';
export const MIME_APP = 'application/x-ubuntu-app';
export const FILE_CLIPBOARD_EVENT = 'portfolio:file-clipboard';
export const FILE_DRAG_END_EVENT = 'portfolio:file-drag-end';
const CLIPBOARD_KEY = 'portfolio.file-clipboard.v1';
let activeDrag = [];
let memoryClipboard = { paths: [], mode: 'copy' };

function pathsFrom(value) {
  return Array.isArray(value) ? [...new Set(value.filter((path) => typeof path === 'string' && path.startsWith('/')).map((path) => normalizePath(path)))] : [];
}

export function writeFileDrag(event, paths, files) {
  const transfer = event.dataTransfer || event;
  activeDrag = pathsFrom(paths).filter((path) => Object.keys(files).some((file) => file === path || file.startsWith(`${path}/`)));
  transfer.setData(MIME_FILES, JSON.stringify({ paths: activeDrag }));
  // The transfer helper chooses copy for protected originals, even in mixed selections.
  transfer.effectAllowed = 'copyMove';
  return activeDrag;
}

export function readFileDrag(event) {
  const transfer = event?.dataTransfer || event;
  if (!transfer || !Array.from(transfer.types || []).includes(MIME_FILES)) return [];
  try {
    const raw = transfer.getData(MIME_FILES);
    if (raw) return pathsFrom(JSON.parse(raw)?.paths);
  } catch { return []; }
  return [...activeDrag];
}

export function endFileDrag() {
  activeDrag = [];
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(FILE_DRAG_END_EVENT));
}

export function fileDragCopies(event, files, paths) {
  if (event.ctrlKey || event.metaKey) return true;
  if (event.shiftKey) return false;
  return paths.length > 0 && paths.every((path) => !canDeletePath(files, path)) ? true : undefined;
}

export function readFileClipboard() {
  try {
    const value = JSON.parse(localStorage.getItem(CLIPBOARD_KEY));
    if (value) return { paths: pathsFrom(value.paths), mode: value.mode === 'cut' ? 'cut' : 'copy' };
  } catch { /* Storage can be unavailable in private browsing. */ }
  return memoryClipboard;
}

export function writeFileClipboard(paths, mode = 'copy') {
  memoryClipboard = { paths: pathsFrom(paths), mode: mode === 'cut' ? 'cut' : 'copy' };
  try { localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(memoryClipboard)); } catch { /* Keep an in-memory clipboard. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(FILE_CLIPBOARD_EVENT));
  return memoryClipboard;
}
