import { HOME, PORTFOLIO_FILES } from './portfolioData.js';
import { isRetiredCatalogPath, migratePortfolioCatalog, PROJECT_CATALOG_SNAPSHOT } from './portfolioCatalogMigration.js';

export const INITIAL_FILES = { ...PORTFOLIO_FILES };

export const ROOT = HOME;
export const DIRECTORY_MARKER = null;
const FILES_KEY = 'portfolio.virtual-files.v1';
const PROTECTED_KEY = 'portfolio.protected-files.v1';
const CATALOG_KEY = 'portfolio.project-catalog.v1';
const TRASH_KEY = 'portfolio.virtual-trash.v2';
export const TRASH_CHANGE_EVENT = 'portfolio:trash-change';

const originalPaths = new Set(['/', '/home', ROOT]);
Object.keys(INITIAL_FILES).forEach((path) => {
  const parts = path.split('/').filter(Boolean);
  parts.forEach((_, index) => originalPaths.add(`/${parts.slice(0, index + 1).join('/')}`));
});
let protectedPaths = new Set(originalPaths);
let memoryTrash = {};
let trashInitialized = false;

function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function protectOriginals(files) {
  const saved = readStored(PROTECTED_KEY, null);
  if (Array.isArray(saved)) {
    protectedPaths = new Set([...originalPaths, ...saved]);
    return files;
  }
  // Earlier versions allowed moving original documents. Keep those originals protected too.
  Object.entries(INITIAL_FILES).forEach(([original, content]) => {
    if (content === DIRECTORY_MARKER || Object.hasOwn(files, original)) return;
    Object.entries(files).forEach(([path, value]) => {
      if (value === content) protectedPaths.add(path);
    });
  });
  try { localStorage.setItem(PROTECTED_KEY, JSON.stringify([...protectedPaths])); } catch { /* read-only storage */ }
  return { ...INITIAL_FILES, ...files };
}

function allProtectedPaths() {
  const saved = readStored(PROTECTED_KEY, []);
  return new Set([...protectedPaths, ...originalPaths, ...(Array.isArray(saved) ? saved : [])].filter((path) => !isRetiredCatalogPath(path)));
}

export function canModifyPath(files, path) {
  const normalized = normalizePath(path);
  return ![...allProtectedPaths()].some((original) => original === normalized || original.startsWith(`${normalized}/`))
    && !Object.keys(files).some((file) => files[file] !== DIRECTORY_MARKER && normalized.startsWith(`${file}/`));
}

export function canDeletePath(files, path) {
  const normalized = normalizePath(path);
  return canModifyPath(files, normalized)
    && Object.keys(files).some((file) => file === normalized || file.startsWith(`${normalized}/`));
}

export function readFiles() {
  try {
    const raw = JSON.parse(localStorage.getItem(FILES_KEY));
    const stored = raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.fromEntries(Object.entries(raw).map(([path, content]) => [path.startsWith('/home/guest/') ? path.replace('/home/guest/', `${HOME}/`) : path, content])) : null;
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      if (localStorage.getItem('portfolio.personal-content.v2') === '1') {
        const next = protectOriginals(stored);
        return writeFiles(next);
      }
      const next = { ...INITIAL_FILES, ...stored };
      const examples = {
        [`${HOME}/README.md`]: '# Portfolio Ubuntu\n\nBienvenue dans votre espace de travail.\n',
        [`${HOME}/Documents/about.txt`]: 'Je suis développeur front-end.\n\nCe fichier est éditable depuis le bureau.\n',
        [`${HOME}/Documents/todo.txt`]: '- Finaliser le portfolio\n- Ajouter mes projets\n- Publier le site\n',
        [`${HOME}/Desktop/welcome.txt`]: 'Bienvenue sur le bureau Ubuntu du portfolio.\n',
      };
      Object.entries(examples).forEach(([path, content]) => { if (next[path] === content) delete next[path]; });
      const protectedFiles = protectOriginals(next);
      const persisted = writeFiles(protectedFiles);
      localStorage.setItem('portfolio.personal-content.v2', '1');
      return persisted;
    }
    const next = protectOriginals({ ...INITIAL_FILES });
    const persisted = writeFiles(next);
    localStorage.setItem('portfolio.personal-content.v2', '1');
    return persisted;
  } catch {
    return { ...INITIAL_FILES };
  }
}

export function writeFiles(files) {
  const previousCatalog = readStored(CATALOG_KEY, {});
  const previous = migratePortfolioCatalog(readStored(FILES_KEY, {}), previousCatalog);
  const next = migratePortfolioCatalog(files, previousCatalog);
  allProtectedPaths().forEach((path) => {
    if (originalPaths.has(path) && (!Object.hasOwn(INITIAL_FILES, path) || INITIAL_FILES[path] === DIRECTORY_MARKER)) {
      if (Object.hasOwn(previous, path) || Object.hasOwn(next, path)) next[path] = DIRECTORY_MARKER;
    } else if (Object.hasOwn(previous, path)) next[path] = previous[path];
    else if (Object.hasOwn(INITIAL_FILES, path)) next[path] = INITIAL_FILES[path];
    else if (Object.hasOwn(next, path) && next[path] !== DIRECTORY_MARKER) delete next[path];
  });
  try {
    localStorage.setItem(FILES_KEY, JSON.stringify(next));
    localStorage.setItem(CATALOG_KEY, JSON.stringify(PROJECT_CATALOG_SNAPSHOT));
  } catch { /* read-only storage */ }
  return next;
}

function saveTrash(trash) {
  memoryTrash = trash;
  trashInitialized = true;
  try { localStorage.setItem(TRASH_KEY, JSON.stringify(trash)); } catch { /* read-only storage */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TRASH_CHANGE_EVENT));
}

export function readTrash() {
  const saved = readStored(TRASH_KEY, null);
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) return Object.fromEntries(Object.entries(saved).filter(([, record]) => record
    && typeof record.path === 'string' && record.path.startsWith('/')
    && record.files && typeof record.files === 'object' && !Array.isArray(record.files)
    && Object.entries(record.files).every(([file, content]) => (file === record.path || file.startsWith(`${record.path}/`)) && (content === DIRECTORY_MARKER || typeof content === 'string'))));
  if (trashInitialized) return memoryTrash;
  const legacy = readStored('portfolio.virtual-trash.v1', {});
  const records = {};
  Object.entries(legacy).forEach(([path, content]) => {
    if (!path.startsWith('/') || (content !== DIRECTORY_MARKER && typeof content !== 'string')) return;
    if (!canModifyPath({ [path]: content }, path) || (content !== DIRECTORY_MARKER && Object.values(INITIAL_FILES).includes(content))) return;
    records[path] = { path, files: { [path]: content }, deletedAt: Date.now() };
  });
  memoryTrash = { ...memoryTrash, ...records };
  trashInitialized = true;
  try { localStorage.setItem(TRASH_KEY, JSON.stringify(memoryTrash)); localStorage.removeItem('portfolio.virtual-trash.v1'); } catch { /* read-only storage */ }
  return memoryTrash;
}

export function trashPaths(files, paths) {
  const trash = { ...readTrash() };
  let next = files;
  [...new Set(paths.map((path) => normalizePath(path)))].forEach((path) => {
    if (!canDeletePath(next, path)) return;
    const removed = Object.fromEntries(Object.entries(next).filter(([file]) => file === path || file.startsWith(`${path}/`)));
    if (isDirectory(next, path) && !Object.hasOwn(removed, path)) removed[path] = DIRECTORY_MARKER;
    const key = uniquePath(Object.fromEntries(Object.keys(trash).map((item) => [item, ''])), path.slice(0, path.lastIndexOf('/')) || '/', path.split('/').at(-1));
    trash[key] = { path, files: removed, deletedAt: Date.now() };
    next = removePath(next, path);
  });
  saveTrash(trash);
  return next;
}

export function restoreFromTrash(files, path) {
  const trash = { ...readTrash() };
  const record = trash[path];
  if (!record) return files;
  const parent = record.path.slice(0, record.path.lastIndexOf('/')) || '/';
  const safeParent = Object.keys(files).some((file) => files[file] !== DIRECTORY_MARKER && (parent === file || parent.startsWith(`${file}/`))) ? `${ROOT}/Desktop` : parent;
  const destination = uniquePath(files, safeParent, record.path.split('/').at(-1));
  if (!canModifyPath(files, destination)) return files;
  const next = { ...files };
  Object.entries(record.files).forEach(([file, content]) => {
    const target = `${destination}${file.slice(record.path.length)}`;
    if (canModifyPath(next, target)) next[target] = content;
  });
  delete trash[path];
  saveTrash(trash);
  return next;
}

export function emptyTrash() { saveTrash({}); }

export function normalizePath(path, cwd = ROOT) {
  const raw = path.startsWith('/') ? path : `${cwd}/${path}`;
  const parts = raw.split('/').filter(Boolean);
  const output = [];
  parts.forEach((part) => {
    if (part === '.') return;
    if (part === '..') output.pop();
    else output.push(part);
  });
  return output.length ? `/${output.join('/')}` : '/';
}

export function displayPath(path) {
  return path === ROOT ? '~' : path.startsWith(`${ROOT}/`) ? `~${path.slice(ROOT.length)}` : path;
}

export function parentDirectories(files) {
  const dirs = new Set(['/', ROOT, `${ROOT}/Desktop`, `${ROOT}/Documents`, `${ROOT}/Downloads`, `${ROOT}/Pictures`]);
  Object.keys(files).forEach((file) => {
    const parts = file.split('/').filter(Boolean);
    parts.forEach((_, index) => dirs.add(`/${parts.slice(0, index + 1).join('/')}`));
  });
  return [...dirs];
}

export function listDirectory(files, directory) {
  const prefix = directory === '/' ? '/' : `${directory}/`;
  const children = new Map();
  Object.keys(files).forEach((file) => {
    if (!file.startsWith(prefix) || file === directory) return;
    const rest = file.slice(prefix.length);
    const name = rest.split('/')[0];
    if (!name) return;
    children.set(name, files[file] === DIRECTORY_MARKER || rest.includes('/') ? 'dir' : 'file');
  });
  return [...children.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function isDirectory(files, path) {
  const normalized = normalizePath(path);
  return normalized === '/' || Object.keys(files).some((file) => file === normalized ? files[file] === DIRECTORY_MARKER : file.startsWith(`${normalized}/`));
}

export function uniquePath(files, directory, name) {
  const requestedParent = normalizePath(directory);
  const blocked = (parent) => Object.keys(files).some((file) => files[file] !== DIRECTORY_MARKER && (file === parent || parent.startsWith(`${file}/`)));
  let parent = blocked(requestedParent) ? `${ROOT}/Desktop` : requestedParent;
  while (parent !== '/' && blocked(parent)) parent = parent.slice(0, parent.lastIndexOf('/')) || '/';
  const sanitized = String(name).replace(/[\\/]/g, ' ').trim();
  const cleanName = !sanitized || sanitized === '.' || sanitized === '..' ? 'Sans nom' : sanitized;
  let candidate = normalizePath(cleanName, parent);
  let index = 2;
  while (Object.prototype.hasOwnProperty.call(files, candidate) || isDirectory(files, candidate) || !canModifyPath(files, candidate)) {
    const extensionIndex = cleanName.lastIndexOf('.');
    const stem = extensionIndex > 0 ? cleanName.slice(0, extensionIndex) : cleanName;
    const extension = extensionIndex > 0 ? cleanName.slice(extensionIndex) : '';
    candidate = normalizePath(`${stem} ${index}${extension}`, parent);
    index += 1;
  }
  return candidate;
}

export function removePath(files, path) {
  const normalized = normalizePath(path);
  if (!canDeletePath(files, normalized)) return files;
  return Object.fromEntries(Object.entries(files).filter(([file]) => file !== normalized && !file.startsWith(`${normalized}/`)));
}

export function renamePath(files, path, newName) {
  const normalized = normalizePath(path);
  if (!canDeletePath(files, normalized)) return files;
  const parent = normalized.slice(0, normalized.lastIndexOf('/')) || '/';
  const cleanName = String(newName).replace(/[\\/]/g, ' ').trim();
  const destination = normalizePath(cleanName, parent);
  if (!cleanName || cleanName === '.' || cleanName === '..' || destination === normalized || Object.prototype.hasOwnProperty.call(files, destination) || isDirectory(files, destination) || !canModifyPath(files, destination)) return files;
  const next = { ...files };
  Object.entries(files).forEach(([file, value]) => {
    if (file !== normalized && !file.startsWith(`${normalized}/`)) return;
    delete next[file];
    next[`${destination}${file.slice(normalized.length)}`] = value;
  });
  return next;
}

// One transaction for a multi-selection. Originals always stay in the portfolio.
export function transferPaths(files, paths, destination, { copy } = {}) {
  const targetDirectory = normalizePath(destination);
  if (!isDirectory(files, targetDirectory)) return { files, paths: [], changed: false, message: 'Le dossier de destination n’existe plus.' };
  const sources = [...new Set(paths.filter((path) => typeof path === 'string' && path.startsWith('/')).map((path) => normalizePath(path)))];
  const roots = sources.filter((path) => !sources.some((parent) => parent !== path && path.startsWith(`${parent}/`)));
  let next = files;
  const created = [];
  let copies = 0;
  let moves = 0;
  const skipped = [];
  roots.forEach((source) => {
    if (source === '/' || !Object.keys(files).some((path) => path === source || path.startsWith(`${source}/`))) { skipped.push('Un élément n’est plus disponible.'); return; }
    if (targetDirectory === source || targetDirectory.startsWith(`${source}/`)) { skipped.push('Un dossier ne peut pas être déplacé ou copié dans lui-même.'); return; }
    const shouldCopy = copy === true || !canDeletePath(files, source);
    const sourceParent = source.slice(0, source.lastIndexOf('/')) || '/';
    if (!shouldCopy && targetDirectory === sourceParent) { skipped.push('L’élément se trouve déjà dans ce dossier.'); return; }
    const destinationPath = uniquePath(next, targetDirectory, source.split('/').at(-1));
    if (next === files) next = { ...files };
    const sourceFiles = Object.entries(files).filter(([path]) => path === source || path.startsWith(`${source}/`));
    if (!shouldCopy) sourceFiles.forEach(([path]) => { delete next[path]; });
    if (isDirectory(files, source) && !Object.hasOwn(files, source)) next[destinationPath] = DIRECTORY_MARKER;
    sourceFiles.forEach(([path, content]) => { next[`${destinationPath}${path.slice(source.length)}`] = content; });
    created.push(destinationPath);
    if (shouldCopy) copies += 1;
    else moves += 1;
  });
  const summary = [moves ? `${moves} élément${moves > 1 ? 's' : ''} déplacé${moves > 1 ? 's' : ''}` : '', copies ? `${copies} élément${copies > 1 ? 's' : ''} copié${copies > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
  return { files: next, paths: created, changed: next !== files, message: summary ? `${summary}${skipped.length ? ' · Certains éléments n’ont pas été transférés.' : ''}` : skipped[0] || 'Aucun élément à transférer.' };
}
