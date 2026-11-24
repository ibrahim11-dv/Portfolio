import { updateAlarms } from './alarms.js';

export const INITIAL_CLOCK = {
  tab: 'timer',
  alarms: [],
  timer: { status: 'idle', duration: 300000, remaining: 300000, endsAt: null, run: 0 },
  stopwatch: { elapsed: 0, startedAt: null, laps: [] },
};

export const WORLD_CITIES = [
  { id: 'perpignan', name: 'Perpignan / Paris', country: 'France', timeZone: 'Europe/Paris' },
  { id: 'oujda', name: 'Oujda / Casablanca', country: 'Maroc', timeZone: 'Africa/Casablanca' },
  { id: 'utc', name: 'UTC', country: 'Temps universel', timeZone: 'UTC' },
  { id: 'london', name: 'Londres', country: 'Royaume-Uni', timeZone: 'Europe/London' },
  { id: 'montreal', name: 'Montréal', country: 'Canada', timeZone: 'America/Toronto' },
  { id: 'new_york', name: 'New York', country: 'États-Unis', timeZone: 'America/New_York' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japon', timeZone: 'Asia/Tokyo' },
];

export function formatWorldCity(city, now = Date.now()) {
  const date = new Date(now);
  const time = new Intl.DateTimeFormat('fr-FR', {
    timeZone: city.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
  const dayLabel = new Intl.DateTimeFormat('fr-FR', {
    timeZone: city.timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
  const hour24 = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: city.timeZone,
    hour: '2-digit',
    hour12: false,
  }).format(date));
  const period = hour24 >= 6 && hour24 < 19 ? 'Jour' : 'Nuit';
  return { ...city, time, dayLabel, period };
}

export function timerRemaining(timer, now) { return timer.status === 'running' ? Math.max(0, timer.endsAt - now) : timer.remaining; }
export function stopwatchElapsed(watch, now) { return watch.elapsed + (watch.startedAt === null ? 0 : Math.max(0, now - watch.startedAt)); }
export function formatDuration(ms, fractions = false) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  const parts = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((n) => String(n).padStart(2, '0'));
  return parts.join(':') + (fractions ? `.${String(Math.floor(Math.max(0, ms) % 1000 / 10)).padStart(2, '0')}` : '');
}

export function clockReducer(state, action) {
  const alarms = updateAlarms(state.alarms, action);
  if (alarms !== state.alarms) state = { ...state, alarms };
  const { timer, stopwatch } = state;
  const now = action.now;
  switch (action.type) {
    case 'tab': return ['timer', 'stopwatch', 'world', 'alarms'].includes(action.tab) ? { ...state, tab: action.tab } : state;
    case 'start-timer': {
      if (!Number.isInteger(action.duration) || action.duration < 1000 || action.duration > 86400000 || timer.status === 'running') return state;
      return { ...state, timer: { status: 'running', duration: action.duration, remaining: action.duration, endsAt: now + action.duration, run: timer.run + 1 } };
    }
    case 'pause-timer': {
      if (timer.status !== 'running') return state;
      const remaining = timerRemaining(timer, now);
      return { ...state, timer: { ...timer, remaining, endsAt: null, status: remaining ? 'paused' : 'finished' } };
    }
    case 'extend-timer': {
      if (!['running', 'paused'].includes(timer.status) || !Number.isFinite(now)) return state;
      const remaining = timerRemaining(timer, now);
      if (remaining <= 0 || remaining + 60000 > 86400000) return state;
      return { ...state, timer: { ...timer, remaining: remaining + 60000, endsAt: timer.status === 'running' ? timer.endsAt + 60000 : null } };
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
