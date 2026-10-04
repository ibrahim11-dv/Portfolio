export const INITIAL_FILES = {
  '/home/guest/README.md': '# Portfolio Ubuntu\n\nBienvenue dans votre espace de travail.\n',
  '/home/guest/Documents/about.txt': 'Je suis développeur front-end.\n\nCe fichier est éditable depuis le bureau.\n',
  '/home/guest/Documents/todo.txt': '- Finaliser le portfolio\n- Ajouter mes projets\n- Publier le site\n',
  '/home/guest/Desktop/welcome.txt': 'Bienvenue sur le bureau Ubuntu du portfolio.\n',
};

export const ROOT = '/home/guest';
export const DIRECTORY_MARKER = null;

export function readFiles() {
  try {
    const stored = JSON.parse(localStorage.getItem('portfolio.virtual-files.v1'));
    return stored && typeof stored === 'object' ? stored : { ...INITIAL_FILES };
  } catch {
    return { ...INITIAL_FILES };
  }
}

export function writeFiles(files) {
  try { localStorage.setItem('portfolio.virtual-files.v1', JSON.stringify(files)); } catch { /* read-only storage */ }
}

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
  const parent = normalizePath(directory);
  const cleanName = String(name).replace(/[\\/]/g, ' ').trim() || 'Sans nom';
  let candidate = normalizePath(cleanName, parent);
  let index = 2;
  while (Object.prototype.hasOwnProperty.call(files, candidate) || Object.keys(files).some((file) => file.startsWith(`${candidate}/`))) {
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
  return Object.fromEntries(Object.entries(files).filter(([file]) => file !== normalized && !file.startsWith(`${normalized}/`)));
}

export function renamePath(files, path, newName) {
  const normalized = normalizePath(path);
  const parent = normalized.slice(0, normalized.lastIndexOf('/')) || '/';
  const cleanName = String(newName).replace(/[\\/]/g, ' ').trim();
  const destination = normalizePath(cleanName, parent);
  if (!cleanName || destination === normalized || Object.prototype.hasOwnProperty.call(files, destination) || Object.keys(files).some((file) => file.startsWith(`${destination}/`))) return files;
  const next = { ...files };
  Object.entries(files).forEach(([file, value]) => {
    if (file !== normalized && !file.startsWith(`${normalized}/`)) return;
    delete next[file];
    next[`${destination}${file.slice(normalized.length)}`] = value;
  });
  return next;
}
