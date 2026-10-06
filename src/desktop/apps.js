export const DESKTOP_APPS = [
  { id: 'portfolio', name: 'Portfolio', icon: '/ubuntu-apps/portfolio.svg' },
  { id: 'cv', name: 'Curriculum vitæ', icon: '/ubuntu-apps/file.png' },
  { id: 'files', name: 'Fichiers', icon: '/ubuntu-apps/files.png', shortcut: 'Super+E' },
  { id: 'terminal', name: 'Terminal', icon: '/ubuntu-apps/terminal.png', shortcut: 'Ctrl+Alt+T' },
  { id: 'editor', name: 'Éditeur de texte', icon: '/ubuntu-apps/editor.png' },
  { id: 'images', name: 'Visionneur d’images', icon: '/ubuntu-apps/loupe.svg' },
  { id: 'help', name: 'Aide', icon: '/ubuntu-apps/help.png' },
  { id: 'store', name: 'App Center', icon: '/ubuntu-apps/store.png' },
];

export const DOCK_APPS = ['portfolio', 'files', 'terminal', 'editor'];

export function appById(id) { return DESKTOP_APPS.find((app) => app.id === id); }

export const APP_DRAG_TYPE = 'application/x-ubuntu-app';
export const APPS_LAYOUT_EVENT = 'portfolio:apps-layout';
const FAVORITES_KEY = 'portfolio.dock-favorites.v1';
const APP_ORDER_KEY = 'portfolio.app-order.v1';
let memoryFavorites = [...DOCK_APPS];
let memoryOrder = DESKTOP_APPS.map((app) => app.id);

function validIds(value) {
  return Array.isArray(value) ? [...new Set(value.filter((id) => appById(id)))] : null;
}

function readLayout(key, fallback) {
  try { return validIds(JSON.parse(localStorage.getItem(key))) || [...fallback]; }
  catch { return [...fallback]; }
}

function writeLayout(key, ids) {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* Keep the layout for this session when storage is unavailable. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(APPS_LAYOUT_EVENT));
  return ids;
}

export function readDockFavorites() { return readLayout(FAVORITES_KEY, memoryFavorites); }
export function writeDockFavorites(ids) {
  memoryFavorites = validIds(ids) || [...DOCK_APPS];
  return writeLayout(FAVORITES_KEY, memoryFavorites);
}
export function readAppOrder() {
  const stored = readLayout(APP_ORDER_KEY, memoryOrder);
  return [...stored, ...DESKTOP_APPS.map((app) => app.id).filter((id) => !stored.includes(id))];
}
export function writeAppOrder(ids) {
  const ordered = validIds(ids) || [];
  memoryOrder = [...ordered, ...DESKTOP_APPS.map((app) => app.id).filter((id) => !ordered.includes(id))];
  return writeLayout(APP_ORDER_KEY, memoryOrder);
}

export function hasAppDrag(event) {
  const transfer = event?.dataTransfer || event;
  return Array.from(transfer?.types || []).includes(APP_DRAG_TYPE);
}
export function readAppDrag(event) {
  const transfer = event?.dataTransfer || event;
  if (!hasAppDrag(transfer)) return null;
  try { return appById(JSON.parse(transfer.getData(APP_DRAG_TYPE))?.id) || null; }
  catch { return null; }
}
export function writeAppDrag(event, id) {
  const transfer = event?.dataTransfer || event;
  if (!appById(id) || !transfer) return false;
  transfer.setData(APP_DRAG_TYPE, JSON.stringify({ id }));
  transfer.effectAllowed = 'copyMove';
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('portfolio:app-drag-started', { detail: { id } }));
  return true;
}
export function endAppDrag() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('portfolio:app-drag-ended'));
}

export function readAppShortcut(content) {
  if (typeof content !== 'string') return null;
  try {
    const shortcut = JSON.parse(content);
    return shortcut?.type === 'ubuntu-app-shortcut' && shortcut.version === 1 ? appById(shortcut.appId) || null : null;
  } catch { return null; }
}
