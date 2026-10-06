import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTORY_MARKER, ROOT } from './virtualFs.js';
import { locationCompletions } from './locationCompletion.js';

const files = {
  [ROOT]: DIRECTORY_MARKER,
  [`${ROOT}/Documents`]: DIRECTORY_MARKER,
  [`${ROOT}/Downloads`]: DIRECTORY_MARKER,
  [`${ROOT}/Documents/Compétences.md`]: 'é',
  [`${ROOT}/Documents/CV.pdf`]: '',
  [`${ROOT}/Documents/.secret`]: '',
  [`${ROOT}/Documents/Dossier imbriqué/Note.txt`]: 'note',
};

test('completes absolute, home and relative directory paths', () => {
  assert.equal(locationCompletions(files, `${ROOT}/Doc`).prefix, `${ROOT}/Documents/`);
  assert.equal(locationCompletions(files, '~/Doc').prefix, '~/Documents/');
  assert.equal(locationCompletions(files, '../Doc', `${ROOT}/Downloads`).prefix, '../Documents/');
  assert.equal(locationCompletions(files, '~').prefix, '~/');
});

test('retains the common prefix for ambiguous paths', () => {
  const result = locationCompletions(files, '~/Do');
  assert.equal(result.prefix, '~/Do');
  assert.equal(result.matches.length, 2);
  assert.ok(result.matches.every((match) => match.value.endsWith('/')));
});

test('supports unicode, spaces and implicit directories without adding a slash to files', () => {
  assert.equal(locationCompletions(files, 'Comp', `${ROOT}/Documents`).prefix, 'Compétences.md');
  assert.equal(locationCompletions(files, 'Doss', `${ROOT}/Documents`).prefix, 'Dossier imbriqué/');
  assert.equal(locationCompletions(files, 'Dossier imbriqué/No', `${ROOT}/Documents`).prefix, 'Dossier imbriqué/Note.txt');
});

test('respects Linux casing and only suggests hidden entries for a dot prefix', () => {
  assert.equal(locationCompletions(files, 'doc').matches.length, 0);
  assert.ok(!locationCompletions(files, '~/Documents/').matches.some((match) => match.name === '.secret'));
  assert.equal(locationCompletions(files, '~/Documents/.s').prefix, '~/Documents/.secret');
});

test('handles absent parents, empty input and unsupported URI schemes', () => {
  for (const input of ['', '/absent/f', 'trash:///', 'https://example.com']) assert.deepEqual(locationCompletions(files, input).matches, []);
  assert.equal(locationCompletions(files, 'Doc', 'trash').prefix, 'Documents/');
});
