import test from 'node:test';
import assert from 'node:assert/strict';
import { clockReducer, INITIAL_CLOCK, timerRemaining, stopwatchElapsed, formatDuration } from './clockState.js';

test('timer uses a deadline and completes once even after a long background delay', () => {
  const started = clockReducer(INITIAL_CLOCK, { type: 'start-timer', now: 1000, duration: 5000 });
  assert.equal(timerRemaining(started.timer, 3500), 2500);
  const finished = clockReducer(started, { type: 'tick', now: 90000 });
  assert.equal(finished.timer.status, 'finished');
  assert.equal(finished.timer.remaining, 0);
  assert.equal(clockReducer(finished, { type: 'tick', now: 100000 }), finished);
  assert.equal(clockReducer(finished, { type: 'start-timer', now: 100000, duration: 1000 }).timer.run, 2);
});

test('pause, resume and reset preserve duration without counting paused time', () => {
  let state = clockReducer(INITIAL_CLOCK, { type: 'start-timer', now: 1000, duration: 10000 });
  state = clockReducer(state, { type: 'pause-timer', now: 4000 });
  assert.equal(timerRemaining(state.timer, 9000), 7000);
  state = clockReducer(state, { type: 'resume-timer', now: 20000 });
  assert.equal(state.timer.endsAt, 27000);
  state = clockReducer(state, { type: 'reset-timer', now: 22000 });
  assert.equal(state.timer.status, 'idle');
  assert.equal(timerRemaining(state.timer, 99999), 10000);
});

test('invalid duration and repeated starts cannot replace a running timer', () => {
  for (const duration of [0, -1, 1.5, 999, 86400001, NaN]) assert.equal(clockReducer(INITIAL_CLOCK, { type: 'start-timer', duration, now: 0 }), INITIAL_CLOCK);
  const running = clockReducer(INITIAL_CLOCK, { type: 'start-timer', duration: 1000, now: 0 });
  assert.equal(clockReducer(running, { type: 'start-timer', duration: 2000, now: 10 }), running);
  assert.equal(clockReducer(running, { type: 'pause-timer', now: 1001 }).timer.status, 'finished');
});

test('stopwatch supports pause, resume, laps and bounded history without losing elapsed time', () => {
  let state = clockReducer(INITIAL_CLOCK, { type: 'start-watch', now: 0 });
  state = clockReducer(state, { type: 'lap', now: 1500 });
  assert.deepEqual(state.stopwatch.laps, [1500]);
  state = clockReducer(state, { type: 'pause-watch', now: 2000 });
  assert.equal(stopwatchElapsed(state.stopwatch, 9000), 2000);
  state = clockReducer(state, { type: 'start-watch', now: 10000 });
  assert.equal(stopwatchElapsed(state.stopwatch, 11000), 3000);
  for (let i = 0; i < 60; i++) state = clockReducer(state, { type: 'lap', now: 12000 + i });
  assert.equal(state.stopwatch.laps.length, 50);
  state = clockReducer(state, { type: 'reset-watch', now: 14000 });
  assert.equal(stopwatchElapsed(state.stopwatch, 15000), 0);
  assert.deepEqual(state.stopwatch.laps, []);
});

test('duration formatting handles hours, fractions and zero', () => {
  assert.equal(formatDuration(3661230, true), '01:01:01.23');
  assert.equal(formatDuration(-1), '00:00:00');
});
