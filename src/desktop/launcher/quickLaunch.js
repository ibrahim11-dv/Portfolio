import { DESKTOP_APPS, appById } from '../../config/apps.js';
import { calculate } from '../../apps/calculator/calculator.js';
import { ROOT, parentDirectories, isDirectory, displayPath } from '../../shared/filesystem/virtualFs.js';
import { availableRecentDocuments } from '../../shared/filesystem/recentDocuments.js';

const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

function evaluateMathQuery(rawQuery) {
  const trimmed = String(rawQuery || '').trim();
  if (!trimmed) return null;
  const source = trimmed.replace(/^=\s*/, '');
  if (!/\d/.test(source) || (!trimmed.startsWith('=') && !/[+\-*/%×÷−]/.test(source))) return null;
  try {
    const result = calculate(source);
    if (result === source.replace(/\s+/g, '').replaceAll(',', '.')) return null;
    return {
      id: `calc:${source}`,
      appId: 'calculator',
      calculation: { expression: source, result },
      name: `${source} = ${result}`,
      icon: '/ubuntu-apps/calculator.svg',
      detail: 'Calculatrice · Entrée pour copier et ouvrir',
    };
  } catch {
    return null;
  }
}

export function quickLaunchResults(query, windows, { files = {}, recent = [], scope = 'all', commands = [] } = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = (text) => terms.every((term) => normalize(text).includes(term));
  const opened = [...windows].sort((a, b) => b.zIndex - a.zIndex).map((item) => {
    const app = appById(item.appId);
    const workspaceLabel = item.onAllWorkspaces ? 'Tous les bureaux' : `Bureau ${item.workspace + 1}`;
    return { id: `window:${item.id}`, windowId: item.id, name: item.filePath?.split('/').at(-1) || app?.name || 'Corbeille', icon: app?.icon || '/ubuntu-apps/trash.png', detail: `${app?.name || 'Corbeille'} · ${workspaceLabel} · ${item.minimized ? 'Réduite' : 'Ouverte'}` };
  });
  const apps = DESKTOP_APPS.map((app) => ({ ...app, id: `app:${app.id}`, appId: app.id, detail: 'Application · Ouvrir' }));
  const fileResult = (path) => {
    const directory = isDirectory(files, path);
    return { id: `file:${path}`, path, directory, name: path.split('/').at(-1), icon: directory ? '/ubuntu-apps/folder.png' : '/ubuntu-apps/file.png', detail: `${directory ? 'Dossier' : 'Fichier'} · ${displayPath(path)}` };
  };
  const paths = [...new Set([...Object.keys(files), ...parentDirectories(files)])].filter((path) => path.startsWith(`${ROOT}/`));
  const documents = paths.sort((a, b) => a.localeCompare(b, 'fr')).map(fileResult);
  const recentFiles = availableRecentDocuments(recent, files).map(fileResult);
  const system = commands.map((command) => ({ ...command, id: `command:${command.command}`, icon: '/ubuntu-apps/windows.svg', detail: 'Action du bureau' }));
  const collections = { apps, windows: opened, files: documents, recent: recentFiles, actions: system, all: [...opened, ...apps, ...system, ...(terms.length ? documents : [])] };
  const matched = (collections[scope] || collections.all).filter((item) => matches(`${item.name} ${item.detail} ${item.appId || ''}`));
  const mathItem = (scope === 'all' || scope === 'actions') ? evaluateMathQuery(query) : null;
  return mathItem ? [mathItem, ...matched] : matched;
}
