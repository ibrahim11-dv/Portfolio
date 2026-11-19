export const MAX_ALARMS = 10;

// Schedule against local calendar time, including changes of day and UTC offset.
export function nextAlarmTime(time, now) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !Number.isFinite(now)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() <= now) date.setDate(date.getDate() + 1);
  return date.getTime();
}

export function updateAlarms(alarms, action) {
  if (action.type === 'add-alarm') {
    const dueAt = nextAlarmTime(action.time, action.now);
    if (alarms.length >= MAX_ALARMS || dueAt === null || !action.id || alarms.some((alarm) => alarm.id === action.id)) return alarms;
    return [...alarms, { id: action.id, time: action.time, label: String(action.label || '').trim().slice(0, 60) || 'Alarme', dueAt, status: 'scheduled', occurrence: 0 }];
  }
  if (action.type === 'delete-alarm') return alarms.filter((alarm) => alarm.id !== action.id);
  let changed = false;
  const next = alarms.map((alarm) => {
    let updated = alarm;
    if (action.type === 'tick' && alarm.status === 'scheduled' && action.now >= alarm.dueAt) {
      updated = { ...alarm, status: 'ringing', occurrence: alarm.occurrence + 1 };
    } else if (alarm.id === action.id) {
      if (action.type === 'toggle-alarm') {
        const dueAt = nextAlarmTime(alarm.time, action.now);
        if (dueAt !== null) updated = { ...alarm, status: alarm.status === 'scheduled' ? 'disabled' : 'scheduled', dueAt };
      } else if (action.type === 'dismiss-alarm' && alarm.status === 'ringing') {
        updated = { ...alarm, status: 'dismissed' };
      } else if (action.type === 'snooze-alarm' && alarm.status === 'ringing' && Number.isFinite(action.now)) {
        updated = { ...alarm, status: 'scheduled', dueAt: action.now + 300000 };
      }
    }
    changed ||= updated !== alarm;
    return updated;
  });
  return changed ? next : alarms;
}

export function nextClockDeadline(state) {
  const deadlines = state.alarms.filter((alarm) => alarm.status === 'scheduled').map((alarm) => alarm.dueAt);
  if (state.timer.status === 'running') deadlines.push(state.timer.endsAt);
  return deadlines.length ? Math.min(...deadlines) : null;
}
