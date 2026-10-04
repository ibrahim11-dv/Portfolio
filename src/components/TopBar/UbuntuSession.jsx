import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronUp, LockKeyhole, Power, RotateCw, UserRound } from 'lucide-react';
import BatteryIndicator from './BatteryIndicator';
import './UbuntuSession.css';

export default function UbuntuSession({ initialMode, now, battery, onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [seconds, setSeconds] = useState(60);
  const dialogRef = useRef(null);
  const touchStart = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      document.querySelector('.ubuntu-topbar__system-btn')?.focus();
    };
  }, []);

  useEffect(() => {
    dialogRef.current.querySelector('[data-session-focus]')?.focus();
  }, [mode]);

  useEffect(() => {
    if (mode !== 'power' && mode !== 'restart') return;
    const deadline = Date.now() + 60000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (!remaining) setMode(mode === 'restart' ? 'boot' : 'off');
    }, 250);
    return () => clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'boot') return;
    // Remount the desktop after the restart splash; local preferences survive.
    const timer = setTimeout(() => closeRef.current(true), 1300);
    return () => clearTimeout(timer);
  }, [mode]);

  function cancel(event) {
    event.preventDefault();
    if (mode === 'unlock') setMode('lock');
    else if (mode === 'power' || mode === 'restart') onClose();
  }

  function handleKey(event) {
    if (mode === 'suspend' && ['Enter', ' ', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      setMode('lock');
      return;
    }
    if (mode === 'lock' && !event.ctrlKey && !event.metaKey && !event.altKey &&
      (event.key.length === 1 || ['Enter', 'ArrowUp'].includes(event.key))) {
      event.preventDefault();
      setMode('unlock');
    }
  }

  const confirming = mode === 'power' || mode === 'restart';
  const locking = mode === 'lock' || mode === 'unlock';
  const displayedSeconds = seconds > 10 ? Math.ceil(seconds / 10) * 10 : seconds;
  const title = { lock: 'Écran verrouillé', unlock: 'Déverrouiller', power: 'Éteindre', restart: 'Redémarrer', off: 'Éteint', boot: 'Démarrage', suspend: 'En veille' }[mode];

  return (
    <dialog ref={dialogRef} className="ubuntu-session" data-mode={mode} aria-label={title}
      onCancel={cancel} onKeyDown={handleKey}>
      {locking && <>
        <div className="ubuntu-session__wallpaper" aria-hidden="true" />
        <div className="ubuntu-session__status"><LockKeyhole size={15} /><BatteryIndicator {...battery} showPercentage /></div>
        {mode === 'lock' ? <button className="ubuntu-lock" data-session-focus aria-label="Afficher la connexion"
          onClick={() => setMode('unlock')} onWheel={(event) => { if (event.deltaY < -5) setMode('unlock'); }}
          onTouchStart={(event) => { touchStart.current = event.touches[0].clientY; }}
          onTouchEnd={(event) => { if (touchStart.current !== null && touchStart.current - event.changedTouches[0].clientY > 40) setMode('unlock'); touchStart.current = null; }}>
          <span className="ubuntu-lock__clock">
            <time className="ubuntu-lock__time">{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
            <span className="ubuntu-lock__date">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </span>
          <span className="ubuntu-lock__hint"><ChevronUp size={20} />Cliquez ou appuyez sur une touche</span>
        </button> : <div className="ubuntu-unlock">
          <div className="ubuntu-unlock__avatar"><UserRound size={72} strokeWidth={1.4} /></div>
          <h1>Invité</h1>
          <button className="ubuntu-unlock__submit" data-session-focus onClick={() => onClose()}>Déverrouiller <ArrowRight size={18} /></button>
          <button className="ubuntu-unlock__back" aria-label="Revenir à l’horloge" onClick={() => setMode('lock')}><ArrowLeft size={20} /></button>
        </div>}
      </>}
      {confirming && <div className="ubuntu-power">
        <div className="ubuntu-power__icon">{mode === 'restart' ? <RotateCw size={48} strokeWidth={1.6} /> : <Power size={48} strokeWidth={1.6} />}</div>
        <h1>{title}</h1>
        <p>Le système {mode === 'restart' ? 'redémarrera' : 's’éteindra'} automatiquement dans {displayedSeconds} seconde{displayedSeconds !== 1 ? 's' : ''}.</p>
        <div className="ubuntu-power__actions">
          <button data-session-focus onClick={() => onClose()}>Annuler</button>
          <button className="ubuntu-power__confirm" onClick={() => setMode(mode === 'restart' ? 'boot' : 'off')}>{title}</button>
        </div>
      </div>}
      {mode === 'off' && <button className="ubuntu-off__start" data-session-focus aria-label="Allumer" title="Allumer" onClick={() => setMode('boot')}><Power size={28} strokeWidth={1.5} /></button>}
      {mode === 'suspend' && <button className="ubuntu-suspend" data-session-focus aria-label="Sortir de veille" onClick={() => setMode('lock')} />}
      {mode === 'boot' && <div className="ubuntu-boot" role="status"><span className="ubuntu-boot__spinner" /><span>ubuntu</span></div>}
    </dialog>
  );
}
