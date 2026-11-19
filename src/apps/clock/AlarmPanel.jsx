import { useRef, useState } from 'react';
import { MAX_ALARMS } from './alarms';

const dateLabel = (timestamp) => new Date(timestamp).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AlarmPanel({ alarms, onAction }) {
  const [time, setTime] = useState('09:00');
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const heading = useRef(null);
  const full = alarms.length >= MAX_ALARMS;
  function add(event) {
    event.preventDefault();
    if (full) return;
    onAction({ type: 'add-alarm', id: crypto.randomUUID(), time, label, now: Date.now() });
    setMessage(`Alarme « ${label.trim() || 'Alarme'} » programmée à ${time}.`);
    setLabel('');
  }
  return <>
    <h1 ref={heading} tabIndex={-1}>Alarmes</h1>
    <p className="clock-app__note">Un rappel visuel à l’heure locale choisie, aujourd’hui ou demain. Gardez cette page ouverte.</p>
    <form onSubmit={add} className="clock-app__alarm-form">
      <label>Heure<input type="time" required value={time} onChange={(event) => setTime(event.target.value)} /></label>
      <label>Nom de l’alarme<input value={label} maxLength={60} placeholder="Faire une pause…" onChange={(event) => setLabel(event.target.value)} /></label>
      <button className="is-primary" disabled={full}>Ajouter une alarme</button>
    </form>
    <p role="status">{full ? 'Limite de 10 alarmes atteinte. Supprimez une alarme pour en ajouter une autre.' : message}</p>
    {!alarms.length && <p>Aucune alarme. Choisissez une heure pour créer votre premier rappel.</p>}
    <ul className="clock-app__alarm-list" aria-label="Alarmes programmées">
      {alarms.map((alarm) => <li key={alarm.id} className={alarm.status === 'ringing' ? 'is-ringing' : ''}>
        <div className="clock-app__alarm-heading"><strong>{alarm.label}</strong><span>{alarm.time}</span></div>
        <p>{alarm.status === 'scheduled' ? `Prévue ${dateLabel(alarm.dueAt)}` : alarm.status === 'ringing' ? `Alarme déclenchée · ${dateLabel(alarm.dueAt)}` : alarm.status === 'disabled' ? 'Désactivée' : 'Terminée'}</p>
        <div className="clock-app__actions">
          {alarm.status === 'ringing' ? <>
            <button onClick={() => { onAction({ type: 'dismiss-alarm', id: alarm.id, now: Date.now() }); heading.current?.focus(); }} aria-label={`Arrêter ${alarm.label}`}>Arrêter</button>
            <button onClick={() => { onAction({ type: 'snooze-alarm', id: alarm.id, now: Date.now() }); heading.current?.focus(); }} aria-label={`Reporter ${alarm.label} de 5 minutes`}>Reporter de 5 min</button>
          </> : <button role="switch" aria-checked={alarm.status === 'scheduled'} aria-label={`Activer l’alarme ${alarm.label}`} onClick={() => onAction({ type: 'toggle-alarm', id: alarm.id, now: Date.now() })}>{alarm.status === 'scheduled' ? 'Activée' : 'Activer'}</button>}
          <button aria-label={`Supprimer l’alarme ${alarm.label}`} onClick={() => { onAction({ type: 'delete-alarm', id: alarm.id, now: Date.now() }); setMessage(`Alarme « ${alarm.label} » supprimée.`); heading.current?.focus(); }}>Supprimer</button>
        </div>
      </li>)}
    </ul>
    <p className="clock-app__note">La fenêtre Horloge peut rester fermée. Recharger la page efface les alarmes. Si le navigateur est suspendu, les rappels s’affichent à son réveil. « Ne pas déranger » les conserve dans les notifications du calendrier.</p>
  </>;
}
