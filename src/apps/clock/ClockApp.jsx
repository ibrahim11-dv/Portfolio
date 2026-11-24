import { useEffect, useState } from 'react';
import { formatDuration, formatWorldCity, stopwatchElapsed, timerRemaining, WORLD_CITIES } from './clockState';
import './ClockApp.css';
import AlarmPanel from './AlarmPanel';
import { lapStatistics } from './lapStatistics';

export default function ClockApp({ state, onAction }) {
  const [now, setNow] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(() => String(Math.floor(state.timer.duration / 60000)));
  const [seconds, setSeconds] = useState(() => String(state.timer.duration / 1000 % 60));
  const [error, setError] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const { tab, timer, stopwatch } = state;
  const laps = lapStatistics(stopwatch.laps);
  const timerActive = ['running', 'paused'].includes(timer.status);
  useEffect(() => {
    if (timer.status !== 'running' && stopwatch.startedAt === null && tab !== 'world') return undefined;
    const interval = setInterval(() => setNow(Date.now()), tab === 'world' && timer.status !== 'running' && stopwatch.startedAt === null ? 1000 : 100);
    return () => clearInterval(interval);
  }, [timer.status, stopwatch.startedAt, tab]);
  function act(type, extra = {}) { const now = Date.now(); setNow(now); onAction({ type, now, ...extra }); }
  function start(event) {
    event.preventDefault();
    const valid = /^\d+$/.test(minutes) && /^\d+$/.test(seconds) && Number(seconds) < 60;
    const duration = (Number(minutes) * 60 + Number(seconds)) * 1000;
    if (!valid || duration < 1000 || duration > 86400000) { setError('Choisissez une durée entre 1 seconde et 24 heures (secondes de 0 à 59).'); return; }
    setError(''); act('start-timer', { duration });
  }
  const statuses = { idle: 'Prêt', running: 'En cours', paused: 'En pause', finished: 'Minuteur terminé' };
  const visibleCities = WORLD_CITIES.filter((city) => `${city.name} ${city.country}`.toLocaleLowerCase().includes(cityFilter.trim().toLocaleLowerCase()));
  return <section className="clock-app" aria-label="Horloge">
    <nav aria-label="Outils de l’horloge">
      <button aria-pressed={tab === 'timer'} onClick={() => act('tab', { tab: 'timer' })}>Minuteur</button>
      <button aria-pressed={tab === 'stopwatch'} onClick={() => act('tab', { tab: 'stopwatch' })}>Chronomètre</button>
      <button aria-pressed={tab === 'world'} onClick={() => act('tab', { tab: 'world' })}>Monde</button>
      <button aria-pressed={tab === 'alarms'} onClick={() => act('tab', { tab: 'alarms' })}>Alarmes{state.alarms.some((alarm) => alarm.status === 'ringing') ? ' · Rappel' : ''}</button>
    </nav>
    {tab === 'timer' ? <>
      <h1>Minuteur</h1><div className="clock-app__display" role="timer" aria-label="Temps restant">{formatDuration(Math.ceil(timerRemaining(timer, now) / 1000) * 1000)}</div><p role="status">{statuses[timer.status]}</p>
      <form onSubmit={start}><fieldset disabled={timerActive}><legend>Durée du minuteur</legend><div className="clock-app__fields"><label>Minutes<input type="number" min="0" max="1440" step="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label><label>Secondes<input type="number" min="0" max="59" step="1" value={seconds} onChange={(event) => setSeconds(event.target.value)} /></label></div><div className="clock-app__presets">{[1, 5, 25].map((value) => <button type="button" key={value} onClick={() => { setMinutes(String(value)); setSeconds('0'); setError(''); }}>{value} min</button>)}</div></fieldset>
      {error && <p role="alert">{error}</p>}
      <div className="clock-app__actions">{!timerActive && <button className="is-primary" type="submit">Démarrer</button>}{timer.status === 'running' && <button type="button" onClick={() => act('pause-timer')}>Pause</button>}{timer.status === 'paused' && <button type="button" className="is-primary" onClick={() => act('resume-timer')}>Reprendre</button>}{timerActive && <button type="button" aria-label="Ajouter une minute au temps restant" disabled={timerRemaining(timer, now) <= 0 || timerRemaining(timer, now) + 60000 > 86400000} onClick={() => act('extend-timer')}>+1 min</button>}<button type="button" onClick={() => { setError(''); act('reset-timer'); }}>Réinitialiser</button></div></form>
      <p className="clock-app__note">+1 min prolonge le temps restant sans reprendre un minuteur en pause. Réinitialiser revient à la durée choisie. Reste actif lorsque cette fenêtre est fermée. Gardez la page ouverte ; si le navigateur est suspendu, la notification arrivera à son réveil.</p>
    </> : tab === 'stopwatch' ? <>
      <h1>Chronomètre</h1><div className="clock-app__display" role="timer" aria-label="Temps écoulé">{formatDuration(stopwatchElapsed(stopwatch, now), true)}</div><p role="status">{stopwatch.startedAt !== null ? 'En cours' : stopwatch.elapsed ? 'En pause' : 'Prêt'}</p>
      <div className="clock-app__actions"><button className="is-primary" onClick={() => act(stopwatch.startedAt === null ? 'start-watch' : 'pause-watch')}>{stopwatch.startedAt === null ? stopwatch.elapsed ? 'Reprendre' : 'Démarrer' : 'Pause'}</button><button disabled={stopwatch.startedAt === null || stopwatch.laps.length >= 50} onClick={() => act('lap')}>Tour</button><button onClick={() => act('reset-watch')}>Réinitialiser</button></div>
      {stopwatch.laps.length > 0 && <div className="clock-app__lap-summary" aria-label="Résumé des tours"><p>{stopwatch.laps.length} tour{stopwatch.laps.length > 1 ? 's' : ''} enregistré{stopwatch.laps.length > 1 ? 's' : ''}</p><p>Moyenne par tour : <strong>{formatDuration(laps.average, true)}</strong></p></div>}
      <ol className="clock-app__laps" aria-label="Temps intermédiaires">{stopwatch.laps.map((elapsed, index) => <li key={index}><span>Tour {index + 1}{stopwatch.laps.length > 1 && laps.fastest !== laps.slowest && <small>{laps.durations[index] === laps.fastest ? 'Le plus rapide' : laps.durations[index] === laps.slowest ? 'Le plus lent' : ''}</small>}</span><strong aria-label={`Durée du tour : ${formatDuration(laps.durations[index], true)}`}>{formatDuration(laps.durations[index], true)}</strong><small>Total : {formatDuration(elapsed, true)}</small></li>)}</ol>
      <p className="clock-app__note">Jusqu’à 50 tours. Le chronomètre continue lorsque cette fenêtre est fermée, jusqu’au rechargement de la page.</p>
    </> : tab === 'alarms' ? <AlarmPanel alarms={state.alarms} onAction={onAction} /> : <>
      <h1>Horloges mondiales</h1>
      <label className="clock-app__world-search">Filtrer une ville
        <input type="search" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} placeholder="Perpignan, Oujda, Montréal, Tokyo…" />
      </label>
      <ul className="clock-app__world-list" aria-label="Fuseaux horaires">
        {visibleCities.map((city) => {
          const info = formatWorldCity(city, now);
          return <li key={city.id} className="clock-app__world-card">
            <div>
              <strong>{info.name}</strong>
              <small>{info.country} · {info.dayLabel}</small>
            </div>
            <div className="clock-app__world-time">
              <span>{info.time}</span>
              <small className={`clock-app__badge ${info.period === 'Jour' ? 'is-day' : 'is-night'}`}>{info.period}</small>
            </div>
          </li>;
        })}
      </ul>
    </>}
  </section>;
}
