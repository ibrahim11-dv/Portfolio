import test from 'node:test';
import assert from 'node:assert/strict';
import { linePosition } from './linePosition.js';

test('line navigation preserves offsets for CRLF, Unicode and empty final lines', () => {
  assert.equal(linePosition('😀\r\nété\r\n', 2), 4);
  assert.equal(linePosition('😀\r\nété\r\n', 3), 9);
  assert.equal(linePosition('', 1), 0);
});
test('line navigation rejects invalid or out-of-document positions', () => {
  for (const value of ['', 0, -1, 1.5, 'abc', Infinity, 3]) assert.equal(linePosition('a\nb', value), null);
});
