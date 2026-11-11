import test from 'node:test';
import assert from 'node:assert/strict';
import { exportVisitorFiles, importVisitorFiles, inspectStorage } from './storageStats.js';
import { INITIAL_FILES, ROOT } from './virtualFs.js';

test('inspectStorage summarizes protected, visitor and trash entries accurately', () => {
  const files = {
    ...INITIAL_FILES,
    [`${ROOT}/Desktop/Note.txt`]: 'Bonjour IbrahimOS',
    [`${ROOT}/Documents/Calculs`]: null,
  };
  const trash = {
    [`${ROOT}/Desktop/Ancien.txt`]: {
      path: `${ROOT}/Desktop/Ancien.txt`,
      files: { [`${ROOT}/Desktop/Ancien.txt`]: 'Contenu supprimé' },
      deletedAt: 1000,
    },
  };
  const stats = inspectStorage(files, trash);
  assert.ok(stats.protectedCount > 0);
  assert.equal(stats.visitorCount, 1);
  assert.equal(stats.trashCount, 1);
  assert.ok(stats.trashBytes > 0);
  assert.equal(stats.totalBytes, stats.filesBytes + stats.trashBytes);
  assert.equal(stats.largestFiles[0].path, `${ROOT}/Documents/CV.pdf`);
});

test('exportVisitorFiles and importVisitorFiles preserve visitor items and refuse overwriting protected portfolio files', () => {
  const customNote = `${ROOT}/Desktop/Perso.txt`;
  const customFolder = `${ROOT}/Documents/MesNotes`;
  const files = {
    ...INITIAL_FILES,
    [customNote]: 'Mes notes personnelles',
    [customFolder]: null,
  };
  const backup = exportVisitorFiles(files);
  assert.deepEqual(Object.keys(backup.files).sort(), [customFolder, customNote].sort());
  assert.equal(Object.hasOwn(backup.files, `${ROOT}/Documents/CV.pdf`), false);

  const tampered = {
    ...backup,
    files: {
      ...backup.files,
      [`${ROOT}/Documents/CV.pdf`]: 'tentative de remplacement',
      '/etc/passwd': 'interdit',
    },
  };
  const restored = importVisitorFiles({ ...INITIAL_FILES }, JSON.stringify(tampered));
  assert.equal(restored.importedCount, 2);
  assert.equal(restored.files[customNote], 'Mes notes personnelles');
  assert.equal(restored.files[`${ROOT}/Documents/CV.pdf`], INITIAL_FILES[`${ROOT}/Documents/CV.pdf`]);
  assert.equal(Object.hasOwn(restored.files, '/etc/passwd'), false);
});
