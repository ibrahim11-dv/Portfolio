export const DESKTOP_APPS = [
  { id: 'files', name: 'Fichiers', icon: '/ubuntu-apps/files.png', shortcut: 'Super+E' },
  { id: 'terminal', name: 'Terminal', icon: '/ubuntu-apps/terminal.png', shortcut: 'Ctrl+Alt+T' },
  { id: 'editor', name: 'Éditeur de texte', icon: '/ubuntu-apps/editor.png' },
  { id: 'help', name: 'Aide', icon: '/ubuntu-apps/help.png' },
  { id: 'store', name: 'App Center', icon: '/ubuntu-apps/store.png' },
];

export const DOCK_APPS = ['files', 'terminal', 'editor'];

export function appById(id) { return DESKTOP_APPS.find((app) => app.id === id); }
