import { readAppShortcut } from './apps.js';
import { CV_DOCUMENT, PROFILE } from './portfolioData.js';
import { isDirectory, listDirectory, parentDirectories } from './virtualFs.js';
import { readImage } from './imageFiles.js';

export function formatFileSize(bytes) {
  if (bytes < 1000) return `${bytes} octet${bytes === 1 ? '' : 's'}`;
  const units = ['ko', 'Mo', 'Go', 'To'];
  let value = bytes / 1000;
  let index = 0;
  while (value >= 1000 && index < units.length - 1) { value /= 1000; index += 1; }
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${units[index]}`;
}

export function fileMetadata(files, path) {
  if (isDirectory(files, path)) {
    const size = listDirectory(files, path).length;
    return { type: 'Dossier', size, sizeLabel: `${size} élément${size === 1 ? '' : 's'}`, icon: '/ubuntu-apps/folder.png' };
  }
  const content = files[path] || '';
  const image = readImage(content);
  if (image) return { type: `Image ${image.mime.split('/')[1].replace('svg+xml', 'SVG').toUpperCase()}`, size: image.size, sizeLabel: formatFileSize(image.size), icon: image.src };
  const shortcut = readAppShortcut(content);
  const extension = path.split('.').at(-1).toLowerCase();
  const types = { md: 'Document Markdown', json: 'Document JSON', js: 'Script JavaScript', jsx: 'Script JavaScript', html: 'Document HTML', css: 'Feuille de style CSS' };
  const size = content === CV_DOCUMENT ? PROFILE.cvSize : new TextEncoder().encode(content).length;
  return {
    type: content === CV_DOCUMENT ? 'Document PDF' : shortcut ? 'Lanceur d’application' : types[extension] || 'Document texte',
    size,
    sizeLabel: formatFileSize(size),
    icon: shortcut?.icon || '/ubuntu-apps/file.png',
  };
}

export function summarizeFiles(files, paths) {
  const unique = [...new Set(paths)];
  const roots = unique.filter((path) => !unique.some((other) => other !== path && path.startsWith(other === '/' ? '/' : `${other}/`)));
  const covered = Object.keys(files).filter((path) => roots.some((root) => path === root || path.startsWith(root === '/' ? '/' : `${root}/`)));
  const filePaths = covered.filter((path) => !isDirectory(files, path));
  const folderPaths = parentDirectories(files).filter((path) => isDirectory(files, path) && !roots.includes(path) && roots.some((root) => path.startsWith(root === '/' ? '/' : `${root}/`)));
  return {
    fileCount: filePaths.length,
    folderCount: folderPaths.length,
    totalSize: filePaths.reduce((size, path) => size + fileMetadata(files, path).size, 0),
  };
}
