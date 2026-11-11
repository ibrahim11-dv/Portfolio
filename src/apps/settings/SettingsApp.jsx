import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Bell, Cpu, HardDrive, Info, LayoutGrid, Monitor, Moon, Palette, RotateCcw, Sliders, Sun, Terminal, Volume2, VolumeX } from 'lucide-react';
import { APPS_LAYOUT_EVENT, DESKTOP_APPS, DOCK_APPS, readDockFavorites, writeDockFavorites } from '../../config/apps';
import { useAppearance } from '../../shared/appearance/AppearanceContext';
import { PREFERENCES_CHANGE_EVENT, readPreferences, writePreferences } from '../../shared/desktopPreferences';
import { inspectStorage } from '../../shared/filesystem/storageStats';
import { formatFileSize } from '../../shared/filesystem/fileMetadata';
import { readTrash } from '../../shared/filesystem/virtualFs';
import { PROFILE } from '../../data/portfolioData';
import './SettingsApp.css';

const SECTIONS = [
  { id: 'display', label: 'Affichage & Énergie', icon: Monitor },
  { id: 'sound', label: 'Son & Notifications', icon: Volume2 },
  { id: 'dock', label: 'Bureau & Dock', icon: LayoutGrid },
  { id: 'about', label: 'À propos', icon: Info },
];

export default function SettingsApp({ files = {}, windows = [], quiet = false, onQuiet, onOpenApp, onNotify }) {
  const [section, setSection] = useState('display');
  const [preferences, setPreferences] = useState(readPreferences);
  const [favorites, setFavorites] = useState(readDockFavorites);
  const { appearance, effectiveTheme, setTheme } = useAppearance();

  useEffect(() => {
    const syncPrefs = (event) => setPreferences(event?.detail || readPreferences());
    const syncDock = () => setFavorites(readDockFavorites());
    window.addEventListener(PREFERENCES_CHANGE_EVENT, syncPrefs);
    window.addEventListener(APPS_LAYOUT_EVENT, syncDock);
    return () => {
      window.removeEventListener(PREFERENCES_CHANGE_EVENT, syncPrefs);
      window.removeEventListener(APPS_LAYOUT_EVENT, syncDock);
    };
  }, []);

  function updatePref(key, value) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    writePreferences(next);
  }

  function toggleDockApp(appId) {
    const next = favorites.includes(appId)
      ? favorites.filter((id) => id !== appId)
      : [...favorites, appId];
    setFavorites(writeDockFavorites(next));
  }

  function moveDockApp(appId, direction) {
    const index = favorites.indexOf(appId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= favorites.length) return;
    const next = [...favorites];
    [next[index], next[target]] = [next[target], next[index]];
    setFavorites(writeDockFavorites(next));
  }

  const storage = useMemo(() => inspectStorage(files, readTrash()), [files]);

  return (
    <section className="settings-app" aria-label="Paramètres">
      <nav className="settings-app__sidebar" aria-label="Rubriques des paramètres">
        <header className="settings-app__brand">
          <Sliders size={18} />
          <strong>Paramètres</strong>
        </header>
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? 'is-active' : ''}
              aria-pressed={section === item.id}
              onClick={() => setSection(item.id)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="settings-app__content">
        {section === 'display' && (
          <div className="settings-panel">
            <header>
              <h1>Affichage & Énergie</h1>
              <p>Ajustez la luminosité, la température des couleurs, le thème et les animations du bureau.</p>
            </header>

            <div className="settings-card">
              <div className="settings-row">
                <div>
                  <strong>Luminosité de l’écran</strong>
                  <small>Atténue l’affichage du bureau virtuel ({preferences.brightness} %)</small>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  aria-label="Luminosité de l’écran"
                  value={preferences.brightness}
                  onChange={(event) => updatePref('brightness', Number(event.target.value))}
                />
              </div>

              <div className="settings-row">
                <div>
                  <strong>Éclairage nocturne</strong>
                  <small>Réduit la lumière bleue avec un filtre ambré chaleureux</small>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Éclairage nocturne"
                  checked={preferences.night}
                  onChange={(event) => updatePref('night', event.target.checked)}
                />
              </div>

              <div className="settings-row">
                <div>
                  <strong>Mode Économie d’énergie</strong>
                  <small>Désactive les transitions et animations du bureau pour économiser les ressources</small>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Mode Économie d’énergie"
                  checked={preferences.saver}
                  onChange={(event) => updatePref('saver', event.target.checked)}
                />
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-row">
                <div>
                  <strong>Style de couleurs</strong>
                  <small>Thème actuellement actif : {effectiveTheme === 'dark' ? 'Sombre' : 'Clair'}</small>
                </div>
                <div className="settings-segmented" role="group" aria-label="Thème du système">
                  {[['light', 'Clair', Sun], ['dark', 'Sombre', Moon], ['system', 'Système', Monitor]].map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={appearance.theme === id}
                      onClick={() => setTheme(id)}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-row">
                <div>
                  <strong>Arrière-plan et couleurs</strong>
                  <small>Choisir un fond d’écran Ubuntu ou importer une image personnelle</small>
                </div>
                <button type="button" className="settings-btn" onClick={() => onOpenApp?.('appearance')}>
                  <Palette size={15} /> Ouvrir Apparence
                </button>
              </div>
            </div>
          </div>
        )}

        {section === 'sound' && (
          <div className="settings-panel">
            <header>
              <h1>Son & Notifications</h1>
              <p>Contrôlez le volume des médias du bureau et le comportement des bannières de notification.</p>
            </header>

            <div className="settings-card">
              <div className="settings-row">
                <div>
                  <strong>Volume système</strong>
                  <small>{preferences.volume === 0 ? 'Son coupé (muet)' : `Niveau actuel : ${preferences.volume} %`}</small>
                </div>
                <div className="settings-inline-controls">
                  <button
                    type="button"
                    className="settings-btn"
                    aria-label={preferences.volume === 0 ? 'Rétablir le son' : 'Couper le son'}
                    onClick={() => updatePref('volume', preferences.volume === 0 ? 60 : 0)}
                  >
                    {preferences.volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Volume système"
                    value={preferences.volume}
                    onChange={(event) => updatePref('volume', Number(event.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-row">
                <div>
                  <strong>Ne pas déranger</strong>
                  <small>Masque les bannières flottantes tout en conservant l’historique dans le calendrier</small>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Ne pas déranger"
                  checked={quiet}
                  onChange={(event) => onQuiet?.(event.target.checked)}
                />
              </div>
              <div className="settings-row">
                <div>
                  <strong>Aperçu de notification</strong>
                  <small>Envoie une notification de test dans le centre de notifications</small>
                </div>
                <button
                  type="button"
                  className="settings-btn"
                  onClick={() => onNotify?.('Notification de test envoyée depuis les Paramètres.')}
                >
                  <Bell size={15} /> Tester une notification
                </button>
              </div>
            </div>
          </div>
        )}

        {section === 'dock' && (
          <div className="settings-panel">
            <header>
              <h1>Bureau & Dock</h1>
              <p>Organisez les applications épinglées au dock latéral et restaurez la configuration par défaut.</p>
            </header>

            <div className="settings-card">
              <div className="settings-row">
                <div>
                  <strong>Applications épinglées ({favorites.length})</strong>
                  <small>Réordonnez vos raccourcis favoris dans le dock Ubuntu</small>
                </div>
                <button
                  type="button"
                  className="settings-btn"
                  onClick={() => {
                    setFavorites(writeDockFavorites(DOCK_APPS));
                    onNotify?.('Favoris du dock réinitialisés.');
                  }}
                >
                  <RotateCcw size={14} /> Par défaut
                </button>
              </div>

              <ul className="settings-dock-list" aria-label="Applications épinglées au dock">
                {favorites.map((appId, index) => {
                  const app = DESKTOP_APPS.find((item) => item.id === appId);
                  if (!app) return null;
                  return (
                    <li key={app.id} className="settings-dock-item">
                      <img src={app.icon} alt="" />
                      <strong>{app.name}</strong>
                      <div className="settings-dock-item__actions">
                        <button type="button" disabled={index === 0} aria-label={`Monter ${app.name}`} onClick={() => moveDockApp(app.id, -1)}><ArrowUp size={14} /></button>
                        <button type="button" disabled={index === favorites.length - 1} aria-label={`Descendre ${app.name}`} onClick={() => moveDockApp(app.id, 1)}><ArrowDown size={14} /></button>
                        <button type="button" className="settings-btn" onClick={() => toggleDockApp(app.id)}>Retirer</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="settings-card">
              <div className="settings-row">
                <div>
                  <strong>Ajouter au dock</strong>
                  <small>Cliquez sur une application pour l’épingler au dock</small>
                </div>
              </div>
              <div className="settings-app-pills">
                {DESKTOP_APPS.filter((app) => !favorites.includes(app.id)).map((app) => (
                  <button key={app.id} type="button" className="settings-btn" onClick={() => toggleDockApp(app.id)}>
                    <img src={app.icon} alt="" /> + {app.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'about' && (
          <div className="settings-panel">
            <header>
              <h1>À propos d’IbrahimOS</h1>
              <p>Informations sur l’environnement de bureau interactif et le profil ingénieur.</p>
            </header>

            <div className="settings-about-hero">
              <div className="settings-about-hero__badge">Ubuntu 26.04 LTS</div>
              <h2>IbrahimOS · Édition Portfolio</h2>
              <p>{PROFILE.name} — {PROFILE.role}</p>
            </div>

            <div className="settings-card">
              <div className="settings-row"><span>Nom d’hôte</span><strong>ibrahim-desktop</strong></div>
              <div className="settings-row"><span>Environnement de bureau</span><strong>GNOME 50 (React 19 · Vite)</strong></div>
              <div className="settings-row"><span>Système de fenêtrage</span><strong>Wayland virtuel (Ancrage 4 coins & Bureaux dynamiques)</strong></div>
              <div className="settings-row"><span>Applications installées</span><strong>{DESKTOP_APPS.length} applications natives</strong></div>
              <div className="settings-row"><span>Fenêtres actives</span><strong>{windows.length} fenêtre{windows.length > 1 ? 's' : ''}</strong></div>
              <div className="settings-row"><span>Stockage virtuel</span><strong>{formatFileSize(storage.totalBytes)} ({storage.fileCount} fichiers, {storage.folderCount} dossiers)</strong></div>
            </div>

            <div className="settings-about-actions">
              <button type="button" className="settings-btn is-primary" onClick={() => onOpenApp?.('presentation')}>
                <Cpu size={15} /> Ouvrir Présentation
              </button>
              <button type="button" className="settings-btn" onClick={() => onOpenApp?.('windows', { initialTab: 'storage' })}>
                <HardDrive size={15} /> Inspecter le stockage
              </button>
              <button type="button" className="settings-btn" onClick={() => onOpenApp?.('terminal')}>
                <Terminal size={15} /> Ouvrir le Terminal
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
