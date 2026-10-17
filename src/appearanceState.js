export const APPEARANCE_KEY = 'ibrahimos.appearance.v1';
export const COLOR_WALLPAPERS = [
  ['graphite', 'Graphite', '#24262a'], ['black', 'Noir', '#0d0e10'], ['mist', 'Gris clair', '#cbd0d4'],
  ['paper', 'Blanc cassé froid', '#e9edef'], ['aubergine', 'Aubergine', '#4e1e45'], ['petrol', 'Bleu pétrole', '#123a43'],
];
export const DEFAULT_APPEARANCE = { version: 1, theme: 'system', wallpaper: 'adaptive', fit: 'cover' };

export function validWallpaper(value) {
  return value === 'adaptive' || value === 'ubuntu-light' || value === 'ubuntu-dark' || value === 'custom' || COLOR_WALLPAPERS.some(([id]) => id === value) ? value : 'adaptive';
}

export function resolveTheme(theme, systemDark) { return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme === 'dark' ? 'dark' : 'light'; }

export function readAppearance(storage) {
  try {
    const raw = JSON.parse(storage?.getItem(APPEARANCE_KEY));
    if (raw?.version === 1 && ['light', 'dark', 'system'].includes(raw.theme)) return { ...DEFAULT_APPEARANCE, theme: raw.theme, wallpaper: validWallpaper(raw.wallpaper), fit: raw.fit === 'contain' ? 'contain' : 'cover' };
    const legacy = JSON.parse(storage?.getItem('portfolio.desktop.preferences.v1'));
    if (typeof legacy?.dark === 'boolean') return { ...DEFAULT_APPEARANCE, theme: legacy.dark ? 'dark' : 'light' };
  } catch { /* Storage may be unavailable. */ }
  return { ...DEFAULT_APPEARANCE };
}
