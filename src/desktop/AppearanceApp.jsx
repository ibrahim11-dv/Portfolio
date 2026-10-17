import { useRef, useState } from 'react';
import { Check, ImagePlus, MonitorCog, Moon, RotateCcw, Sun, Upload } from 'lucide-react';
import { COLOR_WALLPAPERS, useAppearance } from '../AppearanceContext';
import './AppearanceApp.css';

const themes = [
  ['light', 'Clair', Sun, 'Des surfaces claires et lisibles'],
  ['dark', 'Sombre', Moon, 'Des surfaces foncées et calmes'],
  ['system', 'Système', MonitorCog, 'Suit la préférence de votre appareil'],
];

const wallpapers = [
  ['adaptive', 'Ubuntu adaptatif', 'S’adapte au thème'], ['ubuntu-light', 'Ubuntu clair', 'Toujours clair'], ['ubuntu-dark', 'Ubuntu sombre', 'Toujours sombre'],
  ...COLOR_WALLPAPERS.map(([id, name]) => [id, name, 'Couleur unie']),
];

export default function AppearanceApp({ onNotify }) {
  const { appearance, effectiveTheme, imageUrl, storageWarning, setTheme, setWallpaper, setFit, importWallpaper, resetAppearance } = useAppearance();
  const inputRef = useRef(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const announce = (message) => { setStatus(message); onNotify?.(message); };
  async function chooseFile(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setBusy(true);
    try { await importWallpaper(file); announce('Fond d’écran personnalisé appliqué.'); }
    catch (error) { announce(error.message || 'Impossible d’utiliser cette image.'); }
    finally { setBusy(false); }
  }
  async function reset() { await resetAppearance(); announce('Apparence par défaut rétablie.'); }
  return <main className="appearance-app" aria-labelledby="appearance-title">
    <header className="appearance-app__heading"><span><MonitorCog size={24} aria-hidden="true" /><small>PRÉFÉRENCES DU BUREAU</small></span><h1 id="appearance-title">Apparence</h1><p>Choisissez un thème et personnalisez le fond d’écran de votre espace de travail.</p></header>
    <section className="appearance-app__section" aria-labelledby="appearance-theme"><div className="appearance-app__section-heading"><div><small>THÈME</small><h2 id="appearance-theme">Couleurs du système</h2></div><output>Actif : {effectiveTheme === 'dark' ? 'Sombre' : 'Clair'}</output></div><div className="appearance-app__theme-grid">{themes.map(([id, label, Icon, description]) => <button key={id} className={`appearance-choice appearance-choice--theme ${appearance.theme === id ? 'is-selected' : ''}`} type="button" aria-pressed={appearance.theme === id} onClick={() => { setTheme(id); announce(`Thème ${label.toLowerCase()} sélectionné.`); }}><span className={`appearance-choice__preview appearance-choice__preview--${id}`}><Icon size={20} /></span><strong>{label}</strong><small>{description}</small>{appearance.theme === id && <Check className="appearance-choice__check" size={17} aria-label="Sélectionné" />}</button>)}</div></section>
    <section className="appearance-app__section" aria-labelledby="appearance-wallpaper"><div className="appearance-app__section-heading"><div><small>FOND D’ÉCRAN</small><h2 id="appearance-wallpaper">Arrière-plan</h2></div><button className="appearance-app__reset" type="button" onClick={reset}><RotateCcw size={15} />Rétablir l’apparence par défaut</button></div><div className="appearance-app__wallpaper-grid">{wallpapers.map(([id, label, description]) => <button key={id} type="button" className={`appearance-wallpaper ${appearance.wallpaper === id ? 'is-selected' : ''} appearance-wallpaper--${id}`} aria-pressed={appearance.wallpaper === id} onClick={() => { setWallpaper(id); announce(`${label} appliqué.`); }}><span aria-hidden="true" /><strong>{label}</strong><small>{description}</small>{appearance.wallpaper === id && <Check size={16} aria-label="Sélectionné" />}</button>)}</div>
      <div className="appearance-app__import"><div className="appearance-app__image-preview" style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined} aria-hidden="true">{!imageUrl && <ImagePlus size={24} />}</div><div><h3>Votre image</h3><p>JPEG, PNG ou WebP, 10 Mo maximum. Elle reste uniquement sur cet appareil.</p><div className="appearance-app__import-actions"><button className="appearance-app__import-button" type="button" onClick={() => inputRef.current?.click()} disabled={busy}><Upload size={16} />{busy ? 'Préparation…' : 'Importer une image'}</button>{imageUrl && <button type="button" className="appearance-app__fit" aria-pressed={appearance.fit === 'cover'} onClick={() => { const fit = appearance.fit === 'cover' ? 'contain' : 'cover'; setFit(fit); announce(fit === 'cover' ? 'Image réglée pour remplir le bureau.' : 'Image ajustée au bureau.'); }}>{appearance.fit === 'cover' ? 'Remplir' : 'Ajuster'}</button>}</div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} /></div></div>
    </section><p className="appearance-app__status" role="status">{status || storageWarning}</p>
  </main>;
}
