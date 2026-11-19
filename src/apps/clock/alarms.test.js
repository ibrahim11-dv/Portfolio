import test from 'node:test';
import assert from 'node:assert/strict';
import { nextAlarmTime, nextClockDeadline, updateAlarms } from './alarms.js';
import { clockReducer, INITIAL_CLOCK } from './clockState.js';

test('alarms schedule the next local occurrence, including tomorrow and midnight', () => {
  const now = new Date(2026, 10, 19, 9, 30).getTime();
  assert.equal(nextAlarmTime('10:00', now), new Date(2026, 10, 19, 10).getTime());
  assert.equal(nextAlarmTime('09:30', now), new Date(2026, 10, 20, 9, 30).getTime());
  assert.equal(nextAlarmTime('00:00', now), new Date(2026, 10, 20).getTime());
  for (const time of ['', '24:00', '12:60', '9:00', null]) assert.equal(nextAlarmTime(time, now), null);
  assert.equal(nextAlarmTime('12:00', NaN), null);
});

test('creation validates input, bounds the list and never reuses an identifier', () => {
  let alarms = [];
  const add = { type: 'add-alarm', time: '10:00', now: 0, id: 'a', label: '  Pause  ' };
  assert.equal(updateAlarms(alarms, { ...add, time: '25:30' }), alarms);
  alarms = updateAlarms(alarms, add);
  assert.equal(alarms[0].label, 'Pause');
  assert.equal(updateAlarms(alarms, add), alarms);
  for (let n = 0; n < 20; n++) alarms = updateAlarms(alarms, { ...add, id: `alarm-${n}` });
  assert.equal(alarms.length, 10);
});

test('expired alarms and timer complete together after browser suspension, once only', () => {
  let state = clockReducer(INITIAL_CLOCK, { type: 'add-alarm', id: 'a', time: '10:00', now: 0 });
  state = clockReducer(state, { type: 'start-timer', now: 0, duration: 1000 });
  assert.equal(nextClockDeadline(state), 1000);
  state = clockReducer(state, { type: 'tick', now: state.alarms[0].dueAt + 900000 });
  assert.equal(state.timer.status, 'finished');
  assert.equal(state.alarms[0].status, 'ringing');
  assert.equal(state.alarms[0].occurrence, 1);
  assert.equal(nextClockDeadline(state), null);
  assert.equal(clockReducer(state, { type: 'tick', now: 999999999 }), state);
});

test('snooze re-arms an alarm for five minutes; dismissal and deletion stop scheduling', () => {
  let alarms = updateAlarms([], { type: 'add-alarm', id: 'a', time: '10:00', now: 0 });
  const due = alarms[0].dueAt;
  alarms = updateAlarms(alarms, { type: 'tick', now: due });
  alarms = updateAlarms(alarms, { type: 'snooze-alarm', id: 'a', now: due + 100 });
  assert.equal(alarms[0].dueAt, due + 300100);
  assert.equal(updateAlarms(alarms, { type: 'tick', now: due + 300099 }), alarms);
  alarms = updateAlarms(alarms, { type: 'tick', now: due + 300100 });
  assert.equal(alarms[0].occurrence, 2);
  alarms = updateAlarms(alarms, { type: 'dismiss-alarm', id: 'a' });
  assert.equal(alarms[0].status, 'dismissed');
  assert.equal(nextClockDeadline({ ...INITIAL_CLOCK, alarms }), null);
  assert.deepEqual(updateAlarms(alarms, { type: 'delete-alarm', id: 'a' }), []);
});

test('disabled alarms do not ring and can be scheduled again without changing the timer', () => {
  let state = clockReducer(INITIAL_CLOCK, { type: 'add-alarm', id: 'a', time: '10:00', now: 0 });
  const due = state.alarms[0].dueAt;
  state = clockReducer(state, { type: 'toggle-alarm', id: 'a', now: 1 });
  assert.equal(state.alarms[0].status, 'disabled');
  assert.equal(clockReducer(state, { type: 'tick', now: due + 1 }), state);
  state = clockReducer(state, { type: 'toggle-alarm', id: 'a', now: due + 1 });
  assert.equal(state.alarms[0].status, 'scheduled');
  assert.ok(state.alarms[0].dueAt > due);
  assert.equal(state.timer, INITIAL_CLOCK.timer);
  assert.equal(clockReducer(state, { type: 'tab', tab: 'alarms' }).tab, 'alarms');
});
