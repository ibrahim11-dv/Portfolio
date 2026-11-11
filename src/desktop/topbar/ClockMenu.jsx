import { useRef, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';

const sameDay = (a, b) => a.toDateString() === b.toDateString();
const fullDate = (date) => date.toLocaleDateString('fr-FR', { dateStyle: 'full' });
const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const AGENDA_KEY = 'portfolio.calendar-events.v1';

function readAgenda() {
  try { return JSON.parse(localStorage.getItem(AGENDA_KEY)) || {}; }
  catch { return {}; }
}

function writeAgenda(agenda) {
  try { localStorage.setItem(AGENDA_KEY, JSON.stringify(agenda)); }
  catch { /* Session only if storage unavailable */ }
  return agenda;
}

export default function ClockMenu({ now, notifications, onClear, onDismiss, quiet, onQuiet, onOpenClock }) {
  const [selected, setSelected] = useState(now);
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [agenda, setAgenda] = useState(readAgenda);
  const [draftNote, setDraftNote] = useState('');
  const grid = useRef(null);
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const selectedKey = dayKey(selected);
  const dayNotes = agenda[selectedKey] || [];
  function choose(date, focus = false) {
    setSelected(date);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    if (focus) requestAnimationFrame(() => grid.current?.querySelector('[tabindex="0"]')?.focus());
  }
  function shift(delta) {
    const target = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    target.setDate(Math.min(selected.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
    choose(target, true);
  }
  function navigate(event, date) {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -(date.getDay() + 6) % 7, End: 6 - (date.getDay() + 6) % 7 }[event.key];
    if (offset !== undefined) { event.preventDefault(); choose(new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset), true); }
    if (event.key === 'PageUp' || event.key === 'PageDown') { event.preventDefault(); shift(event.key === 'PageUp' ? -1 : 1); }
  }
  function addNote(event) {
    event.preventDefault();
    const text = draftNote.trim();
    if (!text) return;
    const next = writeAgenda({
      ...agenda,
      [selectedKey]: [...dayNotes, { id: Date.now(), text }].slice(-10),
    });
    setAgenda(next);
    setDraftNote('');
  }
  function removeNote(id) {
    const updated = dayNotes.filter((item) => item.id !== id);
    const next = { ...agenda };
    if (updated.length) next[selectedKey] = updated;
    else delete next[selectedKey];
    setAgenda(writeAgenda(next));
  }
  return <div id="ubuntu-calendar" role="dialog" aria-label="Calendrier et notifications" className="ubuntu-topbar__dropdown ubuntu-topbar__dropdown--clock">
    <section className="ubuntu-notifications" aria-label="Notifications">
      <div className="ubuntu-notifications__list">
        {notifications.length ? notifications.map(item => <article key={item.id} className="ubuntu-notification"><header><strong>IbrahimOS</strong><button aria-label={`Supprimer la notification : ${item.text}`} onClick={() => onDismiss(item.id)}><X size={16} /></button></header><p>{item.text}</p><time dateTime={new Date(item.id).toISOString()}>{new Date(item.id).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time></article>) : <div className="ubuntu-notifications__empty"><Bell size={40} strokeWidth={1.4} /><p>Aucune notification</p></div>}
      </div>
      <footer><label>Ne pas déranger<input type="checkbox" role="switch" checked={quiet} onChange={event => onQuiet(event.target.checked)} /></label><button className="desktop-action" disabled={!notifications.length} onClick={onClear}>Effacer</button></footer>
    </section>
    <section className="ubuntu-calendar" aria-label="Calendrier">
      <button className="ubuntu-calendar__today" onClick={() => choose(now)} title="Revenir à aujourd’hui"><span>{now.toLocaleDateString('fr-FR', { weekday: 'long' })}</span><strong>{now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></button>
      <div className="ubuntu-calendar__month-nav"><button className="ubuntu-calendar__nav-btn" aria-label="Mois précédent" onClick={() => shift(-1)}><ChevronLeft size={16} /></button><span aria-live="polite">{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span><button className="ubuntu-calendar__nav-btn" aria-label="Mois suivant" onClick={() => shift(1)}><ChevronRight size={16} /></button></div>
      <div className="ubuntu-calendar__grid" ref={grid}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) => <span key={index} className="ubuntu-calendar__day-label">{label}</span>)}
        {days.map(date => {
          const hasEvents = Boolean(agenda[dayKey(date)]?.length);
          return <button key={date.toISOString()} tabIndex={sameDay(date, selected) ? 0 : -1} aria-label={fullDate(date)} aria-pressed={sameDay(date, selected)} aria-current={sameDay(date, now) ? 'date' : undefined} onKeyDown={event => navigate(event, date)} onClick={() => choose(date)} className={`ubuntu-calendar__day${sameDay(date, now) ? ' ubuntu-calendar__day--today' : ''}${date.getMonth() !== month.getMonth() ? ' is-other-month' : ''}${hasEvents ? ' has-events' : ''}`}>{date.getDate()}</button>;
        })}
      </div>
      <div className="ubuntu-calendar__agenda">
        <strong>{sameDay(selected, now) ? 'Aujourd’hui' : fullDate(selected)}</strong>
        {dayNotes.length ? <ul className="ubuntu-calendar__events">{dayNotes.map((item) => <li key={item.id}><span>{item.text}</span><button type="button" aria-label={`Supprimer la note ${item.text}`} onClick={() => removeNote(item.id)}><Trash2 size={13} /></button></li>)}</ul> : <p>Aucun événement</p>}
        <form className="ubuntu-calendar__event-form" onSubmit={addNote}>
          <input type="text" value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="Ajouter une note pour ce jour…" aria-label="Ajouter une note à l’agenda" maxLength={80} />
          <button type="submit" aria-label="Enregistrer la note" disabled={!draftNote.trim()}><Plus size={14} /></button>
        </form>
      </div>
      <button className="desktop-action" onClick={onOpenClock}>Ouvrir Horloge</button>
    </section>
  </div>;
}
