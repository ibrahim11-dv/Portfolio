import { readAppShortcut } from '../../config/apps.js';
import { CV_DOCUMENT } from '../../data/portfolioData.js';
import { fileMetadata, formatFileSize } from './fileMetadata.js';
import { readImage } from './imageFiles.js';
import { canDeletePath, canModifyPath, DIRECTORY_MARKER, isDirectory, normalizePath, parentDirectories, readTrash, ROOT } from './virtualFs.js';

export const BACKUP_FORMAT = 'ibrahimos-filesystem-backup';

function classifyFile(path, content) {
  if (content === CV_DOCUMENT) return 'pdf';
  if (readImage(content)) return 'image';
  if (readAppShortcut(content)) return 'shortcut';
  if (path.toLowerCase().endsWith('.md')) return 'markdown';
  return 'text';
}

export function inspectStorage(files, trash = readTrash()) {
  const categoryMeta = {
    pdf: { id: 'pdf', label: 'Documents PDF', count: 0, bytes: 0 },
    markdown: { id: 'markdown', label: 'Documents Markdown', count: 0, bytes: 0 },
    text: { id: 'text', label: 'Fichiers texte & notes', count: 0, bytes: 0 },
    image: { id: 'image', label: 'Images', count: 0, bytes: 0 },
    shortcut: { id: 'shortcut', label: 'Raccourcis d’applications', count: 0, bytes: 0 },
    trash: { id: 'trash', label: 'Corbeille', count: 0, bytes: 0 },
  };

  const fileEntries = [];
  let filesBytes = 0;
  let visitorBytes = 0;
  let protectedCount = 0;
  let visitorCount = 0;

  Object.entries(files).forEach(([path, content]) => {
    if (content === DIRECTORY_MARKER || isDirectory(files, path)) return;
    const meta = fileMetadata(files, path);
    const removable = canDeletePath(files, path);
    const kind = classifyFile(path, content);
    categoryMeta[kind].count += 1;
    categoryMeta[kind].bytes += meta.size;
    filesBytes += meta.size;
    if (removable) {
      visitorCount += 1;
      visitorBytes += meta.size;
    } else {
      protectedCount += 1;
    }
    fileEntries.push({
      path,
      name: path.split('/').at(-1),
      type: meta.type,
      icon: meta.icon,
      size: meta.size,
      sizeLabel: meta.sizeLabel,
      protected: !removable,
    });
  });

  const trashRecords = Object.values(trash || {});
  let trashBytes = 0;
  trashRecords.forEach((record) => {
    Object.entries(record?.files || {}).forEach(([filePath, content]) => {
      if (content === DIRECTORY_MARKER) return;
      const meta = fileMetadata({ [filePath]: content }, filePath);
      trashBytes += meta.size;
    });
  });
  categoryMeta.trash.count = trashRecords.length;
  categoryMeta.trash.bytes = trashBytes;

  const folders = parentDirectories(files).filter((dir) => dir.startsWith(`${ROOT}/`) && isDirectory(files, dir));
  const totalBytes = filesBytes + trashBytes;

  return {
    totalFiles: fileEntries.length,
    totalFolders: folders.length,
    protectedCount,
    visitorCount,
    trashCount: trashRecords.length,
    filesBytes,
    visitorBytes,
    trashBytes,
    totalBytes,
    totalSizeLabel: formatFileSize(totalBytes),
    filesSizeLabel: formatFileSize(filesBytes),
    visitorSizeLabel: formatFileSize(visitorBytes),
    trashSizeLabel: formatFileSize(trashBytes),
    categories: Object.values(categoryMeta).map((cat) => ({
      ...cat,
      sizeLabel: formatFileSize(cat.bytes),
      share: totalBytes > 0 ? Math.round((cat.bytes / totalBytes) * 100) : 0,
    })),
    largestFiles: fileEntries.sort((a, b) => b.size - a.size || a.path.localeCompare(b.path, 'fr')).slice(0, 8),
  };
}

export function exportVisitorFiles(files) {
  const exported = {};
  Object.entries(files).forEach(([path, content]) => {
    if (!path.startsWith(`${ROOT}/`)) return;
    if (!canDeletePath(files, path)) return;
    exported[path] = content;
  });
  return {
    type: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    files: exported,
  };
}

export function importVisitorFiles(files, rawPayload) {
  const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
  if (!payload || payload.type !== BACKUP_FORMAT || payload.version !== 1 || typeof payload.files !== 'object' || Array.isArray(payload.files)) {
    throw new Error('Ce fichier n’est pas une sauvegarde IbrahimOS valide.');
  }
  const next = { ...files };
  let importedCount = 0;
  Object.entries(payload.files).forEach(([rawPath, content]) => {
    if (typeof rawPath !== 'string' || (content !== DIRECTORY_MARKER && typeof content !== 'string')) return;
    const normalized = normalizePath(rawPath, ROOT);
    if (!normalized.startsWith(`${ROOT}/`)) return;
    if (!canModifyPath(next, normalized)) return;
    next[normalized] = content;
    importedCount += 1;
  });
  return { files: next, importedCount };
}
