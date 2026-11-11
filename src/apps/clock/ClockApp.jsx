import { useEffect, useState } from 'react';
import { formatDuration, stopwatchElapsed, timerRemaining } from './clockState';
import './ClockApp.css';

export default function ClockApp({ state, onAction }) {
  const [now, setNow] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(() => String(Math.floor(state.timer.duration / 60000)));
  const [seconds, setSeconds] = useState(() => String(state.timer.duration / 1000 % 60));
  const [error, setError] = useState('');
  const { tab, timer, stopwatch } = state;
  const timerActive = ['running', 'paused'].includes(timer.status);
  useEffect(() => {
    if (timer.status !== 'running' && stopwatch.startedAt === null) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [timer.status, stopwatch.startedAt]);
  function act(type, extra = {}) { const now = Date.now(); setNow(now); onAction({ type, now, ...extra }); }
  function start(event) {
    event.preventDefault();
    const valid = /^\d+$/.test(minutes) && /^\d+$/.test(seconds) && Number(seconds) < 60;
    const duration = (Number(minutes) * 60 + Number(seconds)) * 1000;
    if (!valid || duration < 1000 || duration > 86400000) { setError('Choisissez une durée entre 1 seconde et 24 heures (secondes de 0 à 59).'); return; }
    setError(''); act('start-timer', { duration });
  }
  const statuses = { idle: 'Prêt', running: 'En cours', paused: 'En pause', finished: 'Minuteur terminé' };
  return <section className="clock-app" aria-label="Horloge">
    <nav aria-label="Outils de l’horloge"><button aria-pressed={tab === 'timer'} onClick={() => act('tab', { tab: 'timer' })}>Minuteur</button><button aria-pressed={tab === 'stopwatch'} onClick={() => act('tab', { tab: 'stopwatch' })}>Chronomètre</button></nav>
    {tab === 'timer' ? <>
      <h1>Minuteur</h1><div className="clock-app__display" role="timer" aria-label="Temps restant">{formatDuration(Math.ceil(timerRemaining(timer, now) / 1000) * 1000)}</div><p role="status">{statuses[timer.status]}</p>
      <form onSubmit={start}><fieldset disabled={timerActive}><legend>Durée du minuteur</legend><div className="clock-app__fields"><label>Minutes<input type="number" min="0" max="1440" step="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label><label>Secondes<input type="number" min="0" max="59" step="1" value={seconds} onChange={(event) => setSeconds(event.target.value)} /></label></div><div className="clock-app__presets">{[1, 5, 25].map((value) => <button type="button" key={value} onClick={() => { setMinutes(String(value)); setSeconds('0'); setError(''); }}>{value} min</button>)}</div></fieldset>
      {error && <p role="alert">{error}</p>}
      <div className="clock-app__actions">{!timerActive && <button className="is-primary" type="submit">Démarrer</button>}{timer.status === 'running' && <button type="button" onClick={() => act('pause-timer')}>Pause</button>}{timer.status === 'paused' && <button type="button" className="is-primary" onClick={() => act('resume-timer')}>Reprendre</button>}<button type="button" onClick={() => { setError(''); act('reset-timer'); }}>Réinitialiser</button></div></form>
      <p className="clock-app__note">Reste actif lorsque cette fenêtre est fermée. Gardez la page ouverte ; si le navigateur est suspendu, la notification arrivera à son réveil.</p>
    </> : <>
      <h1>Chronomètre</h1><div className="clock-app__display" role="timer" aria-label="Temps écoulé">{formatDuration(stopwatchElapsed(stopwatch, now), true)}</div><p role="status">{stopwatch.startedAt !== null ? 'En cours' : stopwatch.elapsed ? 'En pause' : 'Prêt'}</p>
      <div className="clock-app__actions"><button className="is-primary" onClick={() => act(stopwatch.startedAt === null ? 'start-watch' : 'pause-watch')}>{stopwatch.startedAt === null ? stopwatch.elapsed ? 'Reprendre' : 'Démarrer' : 'Pause'}</button><button disabled={stopwatch.startedAt === null || stopwatch.laps.length >= 50} onClick={() => act('lap')}>Tour</button><button onClick={() => act('reset-watch')}>Réinitialiser</button></div>
      <ol className="clock-app__laps" aria-label="Temps intermédiaires">{stopwatch.laps.map((elapsed, index) => <li key={index}><span>Tour {index + 1}</span><strong>{formatDuration(elapsed, true)}</strong><small>+ {formatDuration(elapsed - (stopwatch.laps[index - 1] || 0), true)}</small></li>)}</ol>
      <p className="clock-app__note">Jusqu’à 50 tours. Le chronomètre continue lorsque cette fenêtre est fermée, jusqu’au rechargement de la page.</p>
    </>}
  </section>;
}
