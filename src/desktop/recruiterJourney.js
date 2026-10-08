export function findReusableWindow(windows, appId, filePath, newWindow = false) {
  if (newWindow) return null;
  const candidates = windows.filter((item) => item.appId === appId).sort((a, b) => b.zIndex - a.zIndex);
  return candidates.find((item) => !filePath || item.filePath === filePath) || candidates[0] || null;
}

export function normalizeReadingState(state = {}) {
  const finite = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  return {
    page: Math.floor(finite(state.page, 1, 1, 100000)),
    scrollRatio: finite(state.scrollRatio, 0, 0, 1),
    zoom: ['automatic', 'fit-width', 'fit-page'].includes(state.zoom) ? state.zoom : finite(state.zoom, 'fit-width', .15, 5),
    rotation: [0, 90, 180, 270].includes(state.rotation) ? state.rotation : 0,
    sidebar: typeof state.sidebar === 'boolean' ? state.sidebar : false,
    continuous: state.continuous !== false,
    dual: state.dual === true,
    night: state.night === true,
  };
}

export function rememberCollection(collections, filters, scroll) {
  return { ...collections, [filters.group]: { ...filters, scroll } };
}
