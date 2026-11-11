export const INITIAL_CLOCK = {
  tab: 'timer',
  timer: { status: 'idle', duration: 300000, remaining: 300000, endsAt: null, run: 0 },
  stopwatch: { elapsed: 0, startedAt: null, laps: [] },
};

export function timerRemaining(timer, now) { return timer.status === 'running' ? Math.max(0, timer.endsAt - now) : timer.remaining; }
export function stopwatchElapsed(watch, now) { return watch.elapsed + (watch.startedAt === null ? 0 : Math.max(0, now - watch.startedAt)); }
export function formatDuration(ms, fractions = false) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  const parts = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((n) => String(n).padStart(2, '0'));
  return parts.join(':') + (fractions ? `.${String(Math.floor(Math.max(0, ms) % 1000 / 10)).padStart(2, '0')}` : '');
}

export function clockReducer(state, action) {
  const { timer, stopwatch } = state;
  const now = action.now;
  switch (action.type) {
    case 'tab': return ['timer', 'stopwatch'].includes(action.tab) ? { ...state, tab: action.tab } : state;
    case 'start-timer': {
      if (!Number.isInteger(action.duration) || action.duration < 1000 || action.duration > 86400000 || timer.status === 'running') return state;
      return { ...state, timer: { status: 'running', duration: action.duration, remaining: action.duration, endsAt: now + action.duration, run: timer.run + 1 } };
    }
    case 'pause-timer': {
      if (timer.status !== 'running') return state;
      const remaining = timerRemaining(timer, now);
      return { ...state, timer: { ...timer, remaining, endsAt: null, status: remaining ? 'paused' : 'finished' } };
    }
    case 'resume-timer': return timer.status === 'paused' ? { ...state, timer: { ...timer, endsAt: now + timer.remaining, status: 'running' } } : state;
    case 'reset-timer': return { ...state, timer: { ...timer, remaining: timer.duration, endsAt: null, status: 'idle' } };
    case 'tick': return timer.status === 'running' && now >= timer.endsAt ? { ...state, timer: { ...timer, remaining: 0, endsAt: null, status: 'finished' } } : state;
    case 'start-watch': return stopwatch.startedAt === null ? { ...state, stopwatch: { ...stopwatch, startedAt: now } } : state;
    case 'pause-watch': return { ...state, stopwatch: { ...stopwatch, elapsed: stopwatchElapsed(stopwatch, now), startedAt: null } };
    case 'reset-watch': return { ...state, stopwatch: { elapsed: 0, startedAt: null, laps: [] } };
    case 'lap': return stopwatch.startedAt === null || stopwatch.laps.length >= 50 ? state : { ...state, stopwatch: { ...stopwatch, laps: [...stopwatch.laps, stopwatchElapsed(stopwatch, now)] } };
    default: return state;
  }
}
