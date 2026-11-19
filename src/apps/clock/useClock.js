import { useEffect, useReducer, useRef } from 'react';
import { clockReducer, INITIAL_CLOCK } from './clockState';
import { nextClockDeadline } from './alarms';

// Owned by DesktopShell so closing or minimizing the app never cancels a timer.
export function useClock(onNotify) {
  const [state, dispatch] = useReducer(clockReducer, INITIAL_CLOCK);
  const announced = useRef(0);
  const announcedAlarms = useRef(new Map());
  const { status, run } = state.timer;
  const deadline = nextClockDeadline(state);
  useEffect(() => {
    if (deadline === null) return undefined;
    const tick = () => dispatch({ type: 'tick', now: Date.now() });
    const timeout = setTimeout(tick, Math.max(0, deadline - Date.now()));
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => { clearTimeout(timeout); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, [deadline]);
  useEffect(() => {
    const messages = [];
    if (status === 'finished' && announced.current !== run) {
      announced.current = run;
      messages.push('Minuteur terminé.');
    }
    for (const alarm of state.alarms) {
      if (alarm.status === 'ringing' && announcedAlarms.current.get(alarm.id) !== alarm.occurrence) {
        announcedAlarms.current.set(alarm.id, alarm.occurrence);
        messages.push(`Alarme : ${alarm.label}.`);
      }
    }
    for (const id of announcedAlarms.current.keys()) {
      if (!state.alarms.some((alarm) => alarm.id === id)) announcedAlarms.current.delete(id);
    }
    if (messages.length) onNotify(`${messages.join(' ')} Ouvrez Horloge pour continuer.`);
  }, [status, run, state.alarms, onNotify]);
  return [state, dispatch];
}
