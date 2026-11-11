import { useEffect, useReducer, useRef } from 'react';
import { clockReducer, INITIAL_CLOCK } from './clockState';

// Owned by DesktopShell so closing or minimizing the app never cancels a timer.
export function useClock(onNotify) {
  const [state, dispatch] = useReducer(clockReducer, INITIAL_CLOCK);
  const announced = useRef(0);
  const { status, endsAt, run } = state.timer;
  useEffect(() => {
    if (status !== 'running') return undefined;
    const tick = () => dispatch({ type: 'tick', now: Date.now() });
    const timeout = setTimeout(tick, Math.max(0, endsAt - Date.now()));
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => { clearTimeout(timeout); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, [status, endsAt]);
  useEffect(() => {
    if (status === 'finished' && announced.current !== run) {
      announced.current = run;
      onNotify('Minuteur terminé. Ouvrez Horloge pour en démarrer un nouveau.');
    }
  }, [status, run, onNotify]);
  return [state, dispatch];
}
