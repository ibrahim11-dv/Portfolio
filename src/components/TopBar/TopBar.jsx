import { useState, useEffect, useRef } from "react";
import {
  Wifi,
  Bluetooth,
  Moon,
  Plane,
  Leaf,
  Sun,
  Power,
  Lock,
  Camera,
  ChevronRight,
} from "lucide-react";
import "./TopBar.css";
import DesktopDialog from './DesktopDialog';
import { PREFERENCES_KEY, readPreferences } from './preferences';
import { captureDesktop, captureScreen } from './captureScreen';
import { observeBattery } from './battery';
import BatteryIndicator from './BatteryIndicator';
import UbuntuSession from './UbuntuSession';

import ClockMenu from './ClockMenu';
import ScreenshotEditor from './ScreenshotEditor';
import { useAppearance } from '../../AppearanceContext';

function SymbolicIcon({ name }) {
  return <span aria-hidden="true" className="ubuntu-symbolic-icon" style={{ '--icon': `url("${import.meta.env.BASE_URL}ubuntu-icons/${name}-symbolic.svg")` }} />;
}

export default function TopBar({ appName, workspaceCount = 4, onWorkspaceChange, workspace, onOverview, onOpenAppearance, overviewOpen = false, notifications = [], onClearNotifications, onDismissNotification, quiet = false, onQuiet }) {
  const { effectiveTheme, setTheme } = useAppearance();
  const [now, setNow] = useState(new Date());
  const [openMenu, setOpenMenu] = useState(null); // "clock" | "system" | null
  const [localWorkspace, setLocalWorkspace] = useState(0);
  const activeWorkspace = workspace ?? localWorkspace;
  const [preferences, setPreferences] = useState(readPreferences);
  const { volume, brightness, ...toggles } = preferences;
  const [detail, setDetail] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [session, setSession] = useState(null);
  const [battery, setBattery] = useState({ percentage: 0, charging: false });
  const [notice, setNotice] = useState('');
  const [captureUrl, setCaptureUrl] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const previousVolume = useRef(volume || 60);

  useEffect(() => observeBattery(navigator, setBattery), []);

  function updatePreference(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }
  const setVolume = (value) => updatePreference('volume', value);
  const setBrightness = (value) => updatePreference('brightness', value);

  useEffect(() => {
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); }
    catch { /* Preferences still work for this session when storage is unavailable. */ }
    const root = document.documentElement;
    root.dataset.desktopSaver = String(preferences.saver);
    document.querySelectorAll('audio, video').forEach((media) => { media.volume = preferences.volume / 100; });
  }, [preferences]);

  useEffect(() => () => {
    delete document.documentElement.dataset.desktopSaver;
  }, []);

  useEffect(() => () => { if (captureUrl) URL.revokeObjectURL(captureUrl); }, [captureUrl]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  function mute() {
    if (volume) previousVolume.current = volume;
    setVolume(volume ? 0 : previousVolume.current);
  }

  function openSession(mode) {
    setOpenMenu(null);
    setDetail(null);
    setDialog(null);
    setSession(mode);
  }

  async function takeScreenshot(external = false) {
    setOpenMenu(null);
    setDetail(null);
    setDialog(null);
    setCapturing(true);
    try {
      const url = await (external ? captureScreen() : captureDesktop());
      setCaptureUrl(url);
      setDialog('capture-edit');
    } catch (error) {
      setNotice(error.name === 'NotAllowedError' ? 'Capture annulée ou non autorisée.' : error.message);
      if (!external) setDialog('capture');
    } finally { setCapturing(false); }
  }

  const containerRef = useRef(null);
  const clockRef = useRef(null);
  const systemRef = useRef(null);
  const trackRef = useRef(null);
  const activeRef = useRef(0);
  const lastWheelRef = useRef(0);
  useEffect(() => { activeRef.current = activeWorkspace; }, [activeWorkspace]);

  // clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function shellShortcut(event) {
      if (document.querySelector('dialog[open]')) return;
      const key = event.key.toLowerCase();
      if (event.metaKey && key === 'v') {
        event.preventDefault();
        setDetail(null);
        setOpenMenu((current) => current === 'clock' ? null : 'clock');
        clockRef.current?.focus();
      }
      if ((event.metaKey && key === 'l') || (event.ctrlKey && event.altKey && event.key === 'Delete')) {
        event.preventDefault();
        setOpenMenu(null);
        setDetail(null);
        setDialog(null);
        setSession(event.metaKey ? 'lock' : 'power');
      }
    }
    document.addEventListener('keydown', shellShortcut);
    return () => document.removeEventListener('keydown', shellShortcut);
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && openMenu) {
        event.preventDefault();
        if (detail) {
          containerRef.current?.querySelector('[aria-expanded="true"].ubuntu-qs-detail-btn, [aria-expanded="true"].ubuntu-qs-footer__btn')?.focus();
          setDetail(null);
        } else {
          (openMenu === "clock" ? clockRef : systemRef).current?.focus();
          setOpenMenu(null);
        }
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [openMenu, detail]);

  // close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  function goToWorkspace(index) {
    const clamped = Math.max(0, Math.min(workspaceCount - 1, index));
    if (clamped === activeRef.current) return;
    activeRef.current = clamped;
    setLocalWorkspace(clamped);
    onWorkspaceChange && onWorkspaceChange(clamped);
  }

  // mouse wheel over the dots = switch workspace (non-passive so preventDefault works)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function onWheel(e) {
      e.preventDefault();
      const t = Date.now();
      if (t - lastWheelRef.current < 150) return; // throttle trackpads
      lastWheelRef.current = t;
      goToWorkspace(activeRef.current + (e.deltaY > 0 ? 1 : -1));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceCount, onWorkspaceChange]);

  function toggle(key) {
    if (key === 'dark') { setTheme(effectiveTheme === 'dark' ? 'light' : 'dark'); return; }
    updatePreference(key, !preferences[key]);
  }

  // --- formatting ---
  const barDate = now.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const cards = [
    { key: "wifi", Icon: Wifi, title: "Wi-Fi", subtitle: "Indisponible", disabled: true },
    { key: "bluetooth", Icon: Bluetooth, title: "Bluetooth", subtitle: "Indisponible", disabled: true },
    { key: 'dark', Icon: Moon, title: 'Style sombre', subtitle: effectiveTheme === 'dark' ? 'Activé' : 'Désactivé' },
    { key: "night", Icon: Moon, title: "Éclairage nocturne", subtitle: toggles.night ? "Activé" : "Désactivé" },
    { key: "plane", Icon: Plane, title: "Mode avion", subtitle: "Indisponible", disabled: true },
    { key: "saver", Icon: Leaf, title: "Économie d'énergie", subtitle: toggles.saver ? "Activé" : "Désactivé", arrow: true },
  ];

  return (
    <>
    <div ref={containerRef} className="ubuntu-topbar" onBlur={(event) => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) { setOpenMenu(null); setDetail(null); }
    }} onKeyDown={(event) => {
      if (event.key === 'ArrowDown' && [clockRef.current, systemRef.current].includes(event.target)) {
        event.preventDefault();
        containerRef.current.querySelector('.ubuntu-topbar__dropdown button:not(:disabled)')?.focus();
      }
    }}>
      {/* --- Left: workspace dots + app name --- */}
      <div className="ubuntu-topbar__left">
        <button
          ref={trackRef}
          className="ubuntu-topbar__workspace-track"
          title="Activités · molette pour changer de bureau"
          aria-label="Activités"
          aria-expanded={overviewOpen}
          onClick={() => onOverview?.()}
        >
          {Array.from({ length: workspaceCount }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={
                "ubuntu-topbar__dot" +
                (i === activeWorkspace ? " ubuntu-topbar__dot--active" : "")
              }
            />
          ))}
        </button>
        {appName && <span className="ubuntu-topbar__app-name">{appName}</span>}
      </div>

      {/* --- Center: clock + calendar --- */}
      <div className="ubuntu-topbar__center">
        <button
          ref={clockRef}
          aria-label="Date et calendrier"
          aria-expanded={openMenu === "clock"}
          aria-controls={openMenu === "clock" ? "ubuntu-calendar" : undefined}
          className={
            "ubuntu-topbar__clock-btn" +
            (openMenu === "clock" ? " ubuntu-topbar__clock-btn--open" : "")
          }
          onClick={() => {
            setOpenMenu(openMenu === "clock" ? null : "clock");
          }}
        >
          <span>{barDate}</span><span>{timeStr}</span>{quiet && <Moon size={12} aria-label="Ne pas déranger" />}{notifications.length > 0 && <span className="ubuntu-topbar__notification-dot" aria-label={`${notifications.length} notifications`} />}
        </button>

        {openMenu === "clock" && <ClockMenu now={now} notifications={notifications} onClear={onClearNotifications} onDismiss={onDismissNotification} quiet={quiet} onQuiet={onQuiet} />}
      </div>

      {/* --- Right: system menu --- */}
      <div className="ubuntu-topbar__right">
        <button
          ref={systemRef}
          aria-label="Réglages rapides"
          aria-expanded={openMenu === "system"}
          aria-controls={openMenu === "system" ? "ubuntu-quick-settings" : undefined}
          className={
            "ubuntu-topbar__system-btn" +
            (openMenu === "system" ? " ubuntu-topbar__system-btn--open" : "")
          }
          onClick={() => { setDetail(null); setOpenMenu(openMenu === "system" ? null : "system"); }}
        >
          <span className="ubuntu-topbar__status-icons">
            <SymbolicIcon name="network-wireless-disabled" />
            <SymbolicIcon name={volume > 0 ? "audio-volume-high" : "audio-volume-muted"} />
            <BatteryIndicator {...battery} />
          </span>
        </button>

        {openMenu === "system" && (
          <div id="ubuntu-quick-settings" role="dialog" aria-label="Réglages rapides" className="ubuntu-topbar__dropdown ubuntu-topbar__dropdown--system">
            <div className="ubuntu-quick-settings__footer">
              <div className="ubuntu-qs-footer__battery">
                <BatteryIndicator {...battery} showPercentage />
              </div>
              <div className="ubuntu-qs-footer__right">
                <button className="ubuntu-qs-footer__btn ubuntu-qs-appearance" aria-label="Ouvrir les réglages d’apparence" onClick={() => { setOpenMenu(null); onOpenAppearance?.(); }}><Sun size={16} /></button>
                <button className="ubuntu-qs-footer__btn" aria-label={capturing ? 'Préparation de la capture' : "Capture d'écran"} disabled={capturing} onClick={() => takeScreenshot()}><Camera size={16} /></button>
                <button className="ubuntu-qs-footer__btn" aria-label="Verrouiller" onClick={() => openSession('lock')}><Lock size={16} /></button>
                <button className="ubuntu-qs-footer__btn" aria-label="Éteindre ou se déconnecter" aria-expanded={detail === 'power'} onClick={() => setDetail(detail === 'power' ? null : 'power')}><Power size={16} /></button>
              </div>
            </div>
            <div className="ubuntu-quick-settings__sliders">
              <div className="ubuntu-qs-slider">
                <button className="ubuntu-calendar__nav-btn" aria-label={volume ? 'Couper le son' : 'Rétablir le son'} aria-pressed={volume === 0} onClick={mute}><SymbolicIcon name={volume ? 'audio-volume-high' : 'audio-volume-muted'} /></button>
                <input
                  type="range"
                  aria-label="Volume"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="ubuntu-qs-slider__input"
                  style={{ "--val": volume + "%" }}
                />
                <output>{volume} %</output>
              </div>
              <div className="ubuntu-qs-slider">
                <Sun size={18} className="ubuntu-qs-slider__icon" />
                <input
                  type="range"
                  aria-label="Luminosité"
                  min="0"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="ubuntu-qs-slider__input"
                  style={{ "--val": brightness + "%" }}
                />
                <output>{brightness} %</output>
              </div>
            </div>

            <div className="ubuntu-quick-settings__grid">
              {cards.map(({ key, Icon, title, subtitle, arrow, disabled }) => (
                <div key={key} className="ubuntu-qs-tile">
                <button
                  className={"ubuntu-qs-card" + (!disabled && (key === 'dark' ? effectiveTheme === 'dark' : toggles[key]) ? " active" : "")}
                  onClick={disabled ? undefined : () => toggle(key)}
                  disabled={disabled}
                  aria-pressed={!disabled && (key === 'dark' ? effectiveTheme === 'dark' : !!toggles[key])}
                  title={disabled ? `${title} : indisponible dans le navigateur` : title}
                >
                  <span className="ubuntu-qs-card__icon">
                    <Icon size={18} />
                  </span>
                  <span className="ubuntu-qs-card__content">
                    <span className="ubuntu-qs-card__title">{title}</span>
                    <span className="ubuntu-qs-card__subtitle">{subtitle}</span>
                  </span>
                </button>
                {arrow && <button className="ubuntu-qs-detail-btn" aria-label={`Détails : ${title}`} aria-expanded={detail === key} onClick={() => setDetail(detail === key ? null : key)}><ChevronRight size={16} /></button>}
                </div>
              ))}
            </div>

            {detail === 'saver' && <section className="ubuntu-qs-detail" aria-label="Économie d’énergie">
              <h3>Mode d’alimentation</h3>
              <button className="ubuntu-power-option" aria-pressed={toggles.saver} onClick={() => updatePreference('saver', true)}>Économie d’énergie {toggles.saver && <span aria-hidden="true">✓</span>}</button>
              <button className="ubuntu-power-option" aria-pressed={!toggles.saver} onClick={() => updatePreference('saver', false)}>Équilibré {!toggles.saver && <span aria-hidden="true">✓</span>}</button>
            </section>}
            {detail === 'power' && <section className="ubuntu-qs-power-menu" aria-label="Éteindre ou se déconnecter">
              <button onClick={() => openSession('suspend')}>Mettre en veille</button>
              <button onClick={() => openSession('restart')}>Redémarrer…</button>
              <button onClick={() => openSession('power')}>Éteindre…</button>
            </section>}
          </div>
        )}
      </div>
    </div>
    <div className="desktop-display-overlay" aria-hidden="true" style={{ background: `rgba(0, 0, 0, ${(100 - brightness) * 0.0065})` }} />
    {toggles.night && <div className="desktop-display-overlay desktop-display-overlay--night" aria-hidden="true" />}
    <div className="desktop-notice" role="status">{notice}</div>
    {session && <UbuntuSession key={session} initialMode={session} now={now} battery={battery} onClose={(restart) => { if (restart) window.location.reload(); else setSession(null); }} />}
    {dialog === 'capture-edit' && captureUrl && <ScreenshotEditor source={captureUrl} onNotify={setNotice} onClose={() => { setDialog(null); setCaptureUrl(null); systemRef.current?.focus(); }} />}
    {dialog === 'capture' && <DesktopDialog key={dialog} variant={dialog} title="Capture d’écran"
      onClose={() => { setDialog(null); systemRef.current?.focus(); }}>
      {dialog === 'capture' && <>
        <p>La capture directe du bureau n’a pas pu être préparée. Réessayez, ou choisissez une surface avec l’autorisation du navigateur.</p>
        <p>L’image reste sur votre appareil. Le partage s’arrête dès que l’image est reçue.</p>
        <button className="desktop-action desktop-action--primary" onClick={() => takeScreenshot()}>Réessayer</button>
        <button className="desktop-action" onClick={() => takeScreenshot(true)}>Partager une surface</button>
      </>}
    </DesktopDialog>}
    </>
  );
}
