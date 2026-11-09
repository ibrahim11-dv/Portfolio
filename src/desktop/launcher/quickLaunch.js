import { DESKTOP_APPS, appById } from '../../config/apps.js';

const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

export function quickLaunchResults(query, windows) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = (text) => terms.every((term) => normalize(text).includes(term));
  const opened = [...windows].sort((a, b) => b.zIndex - a.zIndex).map((item) => {
    const app = appById(item.appId);
    return { id: `window:${item.id}`, windowId: item.id, name: item.filePath?.split('/').at(-1) || app?.name || 'Corbeille', icon: app?.icon || '/ubuntu-apps/trash.png', detail: `${app?.name || 'Corbeille'} · Bureau ${item.workspace + 1} · ${item.minimized ? 'Réduite' : 'Ouverte'}` };
  });
  const apps = DESKTOP_APPS.map((app) => ({ ...app, id: `app:${app.id}`, appId: app.id, detail: 'Ouvrir l’application' }));
  return [...opened, ...apps].filter((item) => matches(`${item.name} ${item.detail} ${item.appId || ''}`));
}
