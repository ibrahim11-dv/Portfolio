import test from 'node:test';
import assert from 'node:assert/strict';
import legacyFiles from './legacyProjectFiles.js';
import { migratePortfolioCatalog } from './portfolioCatalogMigration.js';
import { INITIAL_FILES, ROOT, canDeletePath, readFiles, writeFiles } from './virtualFs.js';

const retiredFolder = `${ROOT}/Projets/ParcVision Mobile`;
const retiredReadme = `${retiredFolder}/README.md`;

test('catalog refresh removes only its exact retired document, preserving visitor copies and children', () => {
  const visitor = `${retiredFolder}/Notes personnelles.txt`;
  const copy = `${ROOT}/Documents/Copie du projet.md`;
  const files = { ...legacyFiles, [retiredFolder]: null, [visitor]: 'à conserver', [copy]: legacyFiles[retiredReadme] };
  const result = migratePortfolioCatalog(files);
  assert.equal(Object.hasOwn(result, retiredReadme), false);
  assert.equal(result[visitor], 'à conserver');
  assert.equal(result[copy], legacyFiles[retiredReadme]);
  assert.equal(result[retiredFolder], null);
  assert.equal(files[retiredReadme], legacyFiles[retiredReadme]);
  assert.deepEqual(migratePortfolioCatalog(result), result);
});

test('empty retired directories disappear while modified documents survive', () => {
  const clean = migratePortfolioCatalog({ [retiredFolder]: null, [retiredReadme]: legacyFiles[retiredReadme] });
  assert.deepEqual(clean, {});
  const edited = { [retiredReadme]: 'Une note différente du document généré' };
  assert.deepEqual(migratePortfolioCatalog(edited), edited);
});

test('existing generated reports are upgraded without replacing visitor edits', () => {
  const path = `${ROOT}/Projets/ParcVision/README.md`;
  assert.equal(migratePortfolioCatalog(legacyFiles)[path], INITIAL_FILES[path]);
  assert.equal(migratePortfolioCatalog({ [path]: 'Mon texte' })[path], 'Mon texte');
});

test('later report editions update known generated text without trusting unrelated manifest paths', () => {
  const path = `${ROOT}/Projets/LearnXcompile/README.md`;
  const visitor = `${ROOT}/Documents/Notes.txt`;
  const previous = { [path]: 'Ancienne présentation générée', [visitor]: 'Notes privées' };
  const result = migratePortfolioCatalog(previous, previous);
  assert.equal(result[path], INITIAL_FILES[path]);
  assert.equal(result[visitor], 'Notes privées');
  assert.equal(migratePortfolioCatalog({ [path]: 'Texte modifié' }, previous)[path], 'Texte modifié');
});

test('persisted old protection does not resurrect the retired project, and new reports stay protected', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  } });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  });
  const visitor = `${retiredFolder}/Notes personnelles.txt`;
  storage.set('portfolio.virtual-files.v1', JSON.stringify({ ...legacyFiles, [retiredFolder]: null, [visitor]: 'à conserver' }));
  storage.set('portfolio.protected-files.v1', JSON.stringify([...Object.keys(legacyFiles), retiredFolder]));
  storage.set('portfolio.personal-content.v2', '1');
  const files = readFiles();
  assert.equal(Object.hasOwn(files, retiredReadme), false);
  assert.equal(canDeletePath(files, visitor), true);
  assert.equal(canDeletePath(files, retiredFolder), true);
  for (const name of ['ParcVision', 'PFE-ESTO', 'Gestion des stagiaires', 'YouTube Video Downloader', 'LearnXcompile']) {
    const path = `${ROOT}/Projets/${name}/README.md`;
    assert.equal(files[path], INITIAL_FILES[path]);
    assert.equal(canDeletePath(files, path), false);
  }
  assert.equal(Object.hasOwn(writeFiles(files), retiredReadme), false);
  assert.equal(readFiles()[visitor], 'à conserver');
});
