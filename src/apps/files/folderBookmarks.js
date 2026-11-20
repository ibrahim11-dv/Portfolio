import { isDirectory, normalizePath } from '../../shared/filesystem/virtualFs.js';

export const BOOKMARKS_KEY = 'portfolio.folder-bookmarks.v1';
export const BOOKMARKS_EVENT = 'portfolio:folder-bookmarks';
export const MAX_BOOKMARKS = 20;

export function sanitizeBookmarks(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((path) => typeof path === 'string' && path.startsWith('/') && path.length <= 1024 && !Array.from(path).some((char) => char.charCodeAt(0) < 32)).map((path) => normalizePath(path)))].slice(0, MAX_BOOKMARKS);
}

export function addBookmark(paths, path, files) {
  const current = sanitizeBookmarks(paths);
  const [normalized] = sanitizeBookmarks([path]);
  if (!normalized || !isDirectory(files, normalized)) return { paths: current, error: 'Ce dossier est indisponible.' };
  if (current.includes(normalized)) return { paths: current };
  if (current.length >= MAX_BOOKMARKS) return { paths: current, error: `Vous avez déjà ${MAX_BOOKMARKS} favoris. Retirez-en un avant d’en ajouter un autre.` };
  return { paths: [...current, normalized] };
}

// Keep a working session copy when browser storage is blocked or full.
export function createBookmarkStore(getStorage, notify = () => {}) {
  let memory = [];
  let sessionOnly = false;
  return {
    read() {
      if (!sessionOnly) {
        try { memory = sanitizeBookmarks(JSON.parse(getStorage().getItem(BOOKMARKS_KEY))); }
        catch { /* Retain the most recent usable list. */ }
      }
      return [...memory];
    },
    write(paths) {
      memory = sanitizeBookmarks(paths);
      try { getStorage().setItem(BOOKMARKS_KEY, JSON.stringify(memory)); sessionOnly = false; }
      catch { sessionOnly = true; }
      notify();
      return { paths: [...memory], persisted: !sessionOnly };
    },
  };
}

export const folderBookmarks = createBookmarkStore(() => localStorage, () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BOOKMARKS_EVENT));
});
