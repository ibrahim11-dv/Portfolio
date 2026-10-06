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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import "./TopBar.css";
import DesktopDialog from './DesktopDialog';
import { PREFERENCES_KEY, readPreferences } from './preferences';
import { captureScreen } from './captureScreen';
import { observeBattery } from './battery';
import BatteryIndicator from './BatteryIndicator';
import UbuntuSession from './UbuntuSession';

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function SymbolicIcon({ name }) {
  return <span aria-hidden="true" className="ubuntu-symbolic-icon" style={{ '--icon': `url("${import.meta.env.BASE_URL}ubuntu-icons/${name}-symbolic.svg")` }} />;
}

export default function TopBar({ appName, workspaceCount = 4, onWorkspaceChange, workspace, onOverview, overviewOpen = false }) {
  const [now, setNow] = useState(new Date());
  const [openMenu, setOpenMenu] = useState(null); // "clock" | "system" | null
  const [localWorkspace, setLocalWorkspace] = useState(0);
  const activeWorkspace = workspace ?? localWorkspace;
  const [viewDate, setViewDate] = useState(new Date()); // month shown in calendar
  const [preferences, setPreferences] = useState(readPreferences);
  const { volume, brightness, ...toggles } = preferences;
  const [detail, setDetail] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [session, setSession] = useState(null);
  const [battery, setBattery] = useState({ percentage: 0, charging: false });
  const [selectedDate, setSelectedDate] = useState(new Date());
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
    root.dataset.desktopDark = String(preferences.dark);
    root.dataset.desktopSaver = String(preferences.saver);
    document.querySelectorAll('audio, video').forEach((media) => { media.volume = preferences.volume / 100; });
  }, [preferences]);

  useEffect(() => () => {
    delete document.documentElement.dataset.desktopDark;
    delete document.documentElement.dataset.desktopSaver;
  }, []);

  useEffect(() => () => { if (captureUrl) URL.revokeObjectURL(captureUrl); }, [captureUrl]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  function openDialog(name) {
    setOpenMenu(null);
    setDetail(null);
    setDialog(name);
  }

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

  async function takeScreenshot() {
    setDialog(null);
    setCapturing(true);
    try {
      const url = await captureScreen();
      setCaptureUrl(url);
      setDialog('capture-result');
    } catch (error) {
      setNotice(error.name === 'NotAllowedError' ? 'Capture annulée ou non autorisée.' : error.message);
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
        setViewDate(new Date());
        setSelectedDate(new Date());
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
        (openMenu === "clock" ? clockRef : systemRef).current?.focus();
        setOpenMenu(null);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [openMenu]);

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
    updatePreference(key, !preferences[key]);
  }

  // --- formatting ---
  const barDate = now.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const longDate = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // --- calendar grid (weeks start on Monday) ---
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isThisMonth = now.getFullYear() === year && now.getMonth() === month;
  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  function shiftMonth(delta) {
    setViewDate(new Date(year, month + delta, 1));
  }

  const cards = [
    { key: "wifi", Icon: Wifi, title: "Wi-Fi", subtitle: "Indisponible", disabled: true },
    { key: "bluetooth", Icon: Bluetooth, title: "Bluetooth", subtitle: "Indisponible", disabled: true },
    { key: "night", Icon: Moon, title: "Éclairage nocturne", subtitle: toggles.night ? "Activé" : "Désactivé" },
    { key: "plane", Icon: Plane, title: "Mode avion", subtitle: "Indisponible", disabled: true },
    { key: "saver", Icon: Leaf, title: "Économie d'énergie", subtitle: toggles.saver ? "Activé" : "Désactivé", arrow: true },
  ];

  return (
    <>
    <div ref={containerRef} className="ubuntu-topbar">
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
            setViewDate(new Date());
            setSelectedDate(new Date());
            setOpenMenu(openMenu === "clock" ? null : "clock");
          }}
        >
          <span>{barDate}</span><span>{timeStr}</span>
        </button>

        {openMenu === "clock" && (
          <div id="ubuntu-calendar" className="ubuntu-topbar__dropdown ubuntu-topbar__dropdown--clock">
            <div className="ubuntu-calendar__header">
              <div className="ubuntu-calendar__date">{longDate}</div>
              <div className="ubuntu-calendar__time">{timeStr}</div>
            </div>

            <div className="ubuntu-calendar__month-nav">
              <button className="ubuntu-calendar__nav-btn" onClick={() => shiftMonth(-1)} aria-label="Mois précédent">
                <ChevronDown size={16} className="ubuntu-calendar__nav-icon left" />
              </button>
              <span>{monthLabel}</span>
              <button className="ubuntu-calendar__nav-btn" onClick={() => shiftMonth(1)} aria-label="Mois suivant">
                <ChevronDown size={16} className="ubuntu-calendar__nav-icon right" />
              </button>
            </div>

            <div className="ubuntu-calendar__grid">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="ubuntu-calendar__day-label">{d}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={"e" + i} className="ubuntu-calendar__day ubuntu-calendar__day--empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = isThisMonth && day === now.getDate();
                return (
                  <button
                    key={day}
                    aria-label={new Date(year, month, day).toLocaleDateString('fr-FR', { dateStyle: 'full' })}
                    aria-pressed={selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day}
                    aria-current={isToday ? 'date' : undefined}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={
                      "ubuntu-calendar__day" +
                      (isToday ? " ubuntu-calendar__day--today" : "")
                    }
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="ubuntu-calendar__selection" aria-live="polite">
              {selectedDate.toLocaleDateString('fr-FR', { dateStyle: 'full' })}
            </div>
            <button className="desktop-action" onClick={() => { const today = new Date(); setViewDate(today); setSelectedDate(today); }}>Aujourd’hui</button>
          </div>
        )}
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
          <div id="ubuntu-quick-settings" className="ubuntu-topbar__dropdown ubuntu-topbar__dropdown--system">
            <div className="ubuntu-quick-settings__grid">
              {cards.map(({ key, Icon, title, subtitle, arrow, disabled }) => (
                <div key={key} className="ubuntu-qs-tile">
                <button
                  className={"ubuntu-qs-card" + (!disabled && toggles[key] ? " active" : "")}
                  onClick={disabled ? undefined : () => toggle(key)}
                  disabled={disabled}
                  aria-pressed={!disabled && !!toggles[key]}
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

            <div className="ubuntu-quick-settings__footer">
              <div className="ubuntu-qs-footer__battery">
                <BatteryIndicator {...battery} showPercentage />
              </div>
              <div className="ubuntu-qs-footer__right">
                <button className="ubuntu-qs-footer__btn" aria-label="Capture d'écran" disabled={capturing} onClick={() => openDialog('capture')}><Camera size={16} /></button>
                <button className="ubuntu-qs-footer__btn" aria-label="Verrouiller" onClick={() => openSession('lock')}><Lock size={16} /></button>
                <button className="ubuntu-qs-footer__btn" aria-label="Éteindre" aria-expanded={detail === 'power'} onClick={() => setDetail(detail === 'power' ? null : 'power')}><Power size={16} /></button>
              </div>
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
    {dialog && <DesktopDialog key={dialog} variant={dialog} title={{ capture: 'Capture d’écran', 'capture-result': 'Votre capture' }[dialog]}
      onClose={() => { setDialog(null); systemRef.current?.focus(); }}>
      {dialog === 'capture' && <>
        <p>Choisissez l’onglet ou la fenêtre à capturer dans la boîte de dialogue du navigateur. L’image reste sur votre appareil.</p>
        <button className="desktop-action desktop-action--primary" onClick={takeScreenshot}>Choisir et capturer</button>
      </>}
      {dialog === 'capture-result' && <><img className="desktop-capture" src={captureUrl} alt="Capture de la surface choisie" /><a className="desktop-action desktop-action--primary" href={captureUrl} download="capture-portfolio.png">Télécharger l’image PNG</a></>}
    </DesktopDialog>}
    </>
  );
}
