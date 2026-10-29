/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import backgroundLight from './assets/background.webp';
import backgroundDark from './assets/backgroundDark.webp';
import { APPEARANCE_KEY, COLOR_WALLPAPERS, DEFAULT_APPEARANCE, readAppearance, validWallpaper, resolveWallpaper, resolveTheme } from './appearanceState';

const AppearanceContext = createContext(null);
const IMAGE_KEY = 'wallpaper';
const DB_NAME = 'ibrahimos-appearance';
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 24 * 1024 * 1024;
const MAX_SIDE = 2560;


function openStore(mode = 'readonly') {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('IndexedDB indisponible')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onerror = () => reject(request.error || new Error('IndexedDB indisponible'));
    request.onsuccess = () => resolve(request.result.transaction('images', mode).objectStore('images'));
  });
}

async function readImage() {
  try {
    const store = await openStore();
    return await new Promise((resolve, reject) => { const request = store.get(IMAGE_KEY); request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error); });
  } catch { return null; }
}

async function storeImage(blob) {
  const store = await openStore('readwrite');
  await new Promise((resolve, reject) => { const request = store.put(blob, IMAGE_KEY); request.onsuccess = resolve; request.onerror = () => reject(request.error); });
}

async function deleteImage() {
  try { const store = await openStore('readwrite'); await new Promise((resolve, reject) => { const request = store.delete(IMAGE_KEY); request.onsuccess = resolve; request.onerror = () => reject(request.error); }); } catch { /* Nothing to clear. */ }
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file);
  return new Promise((resolve, reject) => { const image = new Image(); const url = URL.createObjectURL(file); image.onload = () => { URL.revokeObjectURL(url); resolve(image); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); }; image.src = url; });
}

export async function normalizeWallpaper(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)) throw new Error('Choisissez une image JPEG, PNG ou WebP.');
  if (file.size > MAX_BYTES) throw new Error('L’image dépasse la limite de 10 Mo.');
  const image = await decode(file);
  const width = image.width, height = image.height;
  if (!width || !height || width * height > MAX_PIXELS) { image.close?.(); throw new Error('L’image dépasse la limite de 24 mégapixels.'); }
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas'); canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); image.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, file.type === 'image/png' ? 'image/png' : 'image/jpeg', .9));
  if (!blob) throw new Error('La préparation de l’image a échoué.');
  return blob;
}

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(() => {
    try { return readAppearance(window.localStorage); } catch { return { ...DEFAULT_APPEARANCE }; }
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches || false);
  const [imageUrl, setImageUrl] = useState(null);
  const [storageWarning, setStorageWarning] = useState('');
  const effectiveTheme = resolveTheme(appearance.theme, systemDark);

  useEffect(() => { const media = window.matchMedia?.('(prefers-color-scheme: dark)'); if (!media) return undefined; const update = () => setSystemDark(media.matches); media.addEventListener?.('change', update); return () => media.removeEventListener?.('change', update); }, []);
  useEffect(() => { let active = true; readImage().then((blob) => { if (blob && active) setImageUrl(URL.createObjectURL(blob)); }); return () => { active = false; }; }, []);
  useEffect(() => {
    try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance)); } catch { /* The setting still works for this session. */ }
    const root = document.documentElement;
    root.dataset.desktopTheme = effectiveTheme;
    root.dataset.desktopDark = String(effectiveTheme === 'dark');
    root.dataset.wallpaperKind = appearance.wallpaper;
    const wallpaper = resolveWallpaper(appearance, effectiveTheme, { light: backgroundLight, dark: backgroundDark, custom: imageUrl });
    root.dataset.wallpaperSolid = String(wallpaper.solid);
    root.style.setProperty('--desktop-wallpaper', wallpaper.image);
    root.style.setProperty('--desktop-wallpaper-color', wallpaper.color);
    root.style.setProperty('--desktop-wallpaper-size', wallpaper.size);
    root.style.setProperty('--adaptive-wallpaper', wallpaper.adaptiveImage);
  }, [appearance, effectiveTheme, imageUrl]);
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  async function importWallpaper(file) {
    const blob = await normalizeWallpaper(file);
    const url = URL.createObjectURL(blob);
    setImageUrl(url); setAppearance((current) => ({ ...current, wallpaper: 'custom' }));
    try { await storeImage(blob); setStorageWarning(''); } catch { setStorageWarning('L’image est active mais ne pourra pas être conservée après fermeture.'); }
  }
  async function resetAppearance() { await deleteImage(); if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(null); setAppearance({ ...DEFAULT_APPEARANCE }); setStorageWarning(''); }
  const value = { appearance, effectiveTheme, imageUrl, storageWarning, setTheme: (theme) => setAppearance((current) => ({ ...current, theme })), setWallpaper: (wallpaper) => setAppearance((current) => ({ ...current, wallpaper: validWallpaper(wallpaper) })), setFit: (fit) => setAppearance((current) => ({ ...current, fit: fit === 'contain' ? 'contain' : 'cover' })), importWallpaper, resetAppearance };
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() { const value = useContext(AppearanceContext); if (!value) throw new Error('AppearanceProvider manquant'); return value; }
export { APPEARANCE_KEY, COLOR_WALLPAPERS, DEFAULT_APPEARANCE };
