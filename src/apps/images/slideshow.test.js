import test from 'node:test';
import assert from 'node:assert/strict';
import { nextSlide, slideshowDelay } from './slideshow.js';

test('slideshow walks the current directory order and stops after the last image', () => {
  const paths = ['/a.png', '/b.png', '/c.png'];
  assert.equal(nextSlide(paths, '/a.png'), '/b.png');
  assert.equal(nextSlide(paths, '/b.png'), '/c.png');
  assert.equal(nextSlide(paths, '/c.png'), null);
  assert.equal(nextSlide(paths, '/c.png', true), '/a.png');
});

test('missing, deleted or single images cannot produce an automatic loop', () => {
  assert.equal(nextSlide([], '/a.png', true), null);
  assert.equal(nextSlide(['/a.png'], '/a.png', true), null);
  assert.equal(nextSlide(['/b.png', '/c.png'], '/a.png', true), null);
  assert.equal(nextSlide(['/a.png', '/c.png'], '/a.png'), '/c.png');
});

test('only supported slideshow durations can create a timer', () => {
  for (const seconds of [3, 5, 10]) assert.equal(slideshowDelay(seconds), seconds * 1000);
  for (const invalid of [0, -1, NaN, Infinity, '3', null, 0.1]) assert.equal(slideshowDelay(invalid), 5000);
});
