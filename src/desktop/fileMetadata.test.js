import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTORY_MARKER, ROOT } from './virtualFs.js';
import { CV_DOCUMENT, PROFILE } from './portfolioData.js';
import { fileMetadata, summarizeFiles } from './fileMetadata.js';

const folder = `${ROOT}/Documents/Essai`;
const files = {
  [folder]: DIRECTORY_MARKER,
  [`${folder}/Texte.txt`]: 'é',
  [`${folder}/Implicite/Note.txt`]: 'abcd',
  [`${ROOT}/Documents/CV.pdf`]: CV_DOCUMENT,
};

test('measures UTF-8 content and uses the actual supplied PDF size', () => {
  assert.equal(fileMetadata(files, `${folder}/Texte.txt`).size, 2);
  assert.equal(fileMetadata(files, `${ROOT}/Documents/CV.pdf`).size, PROFILE.cvSize);
});

test('counts nested implicit folders and excludes the selected root', () => {
  assert.deepEqual(summarizeFiles(files, [folder]), { fileCount: 2, folderCount: 1, totalSize: 6 });
});

test('does not double-count duplicate and overlapping selections', () => {
  assert.deepEqual(summarizeFiles(files, [folder, folder, `${folder}/Texte.txt`]), { fileCount: 2, folderCount: 1, totalSize: 6 });
  assert.deepEqual(summarizeFiles(files, [folder, `${folder}/Implicite`]), { fileCount: 2, folderCount: 1, totalSize: 6 });
});

test('aggregates multiple files and handles an empty selection', () => {
  assert.deepEqual(summarizeFiles(files, [`${folder}/Texte.txt`, `${ROOT}/Documents/CV.pdf`]), { fileCount: 2, folderCount: 0, totalSize: PROFILE.cvSize + 2 });
  assert.deepEqual(summarizeFiles(files, []), { fileCount: 0, folderCount: 0, totalSize: 0 });
});
