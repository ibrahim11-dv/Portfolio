export const DEFAULT_PREFERENCES = {
  volume: 60, brightness: 100, night: false, saver: false, dark: false,
};

export const PREFERENCES_KEY = 'portfolio.desktop.preferences.v1';

export function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY)) ?? {};
    return Object.fromEntries(Object.entries(DEFAULT_PREFERENCES).map(([key, fallback]) => {
      const value = saved[key];
      return [key, typeof fallback === 'boolean'
        ? (typeof value === 'boolean' ? value : fallback)
        : (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback)];
    }));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}
