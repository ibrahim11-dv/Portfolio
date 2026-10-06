import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_FILES, ROOT } from './virtualFs.js';
import { createDocument, documentDirty, documentExternal, documentStatistics, editDocument, historyDocument, indentDocument, replaceDocumentMatches, saveDocument, searchDocument } from './editorDocument.js';

const path = `${ROOT}/Desktop/Editor verification.txt`;
const files = { ...INITIAL_FILES, [path]: 'Original visitor text\n' };
const document = () => createDocument(files, path, 1);

test('dirty state follows actual content, including an empty saved file', () => {
  const original = document(), edited = editDocument(original, 'changed');
  assert.equal(documentDirty(original), false);
  assert.equal(documentDirty(edited), true);
  assert.equal(documentDirty(editDocument(edited, original.text)), false);
  assert.equal(documentDirty(editDocument(original, '')), true);
});

test('undo and redo preserve text, selection and the saved baseline', () => {
  let doc = document();
  doc = { ...doc, selectionStart: 2, selectionEnd: 5 };
  const edited = editDocument(doc, 'first', 5), editedAgain = editDocument(edited, 'second', 6);
  const undone = historyDocument(editedAgain);
  assert.equal(undone.text, 'first'); assert.equal(undone.selectionStart, 5);
  assert.equal(historyDocument(undone, true).text, 'second');
  assert.equal(historyDocument(historyDocument(editedAgain)).text, doc.text);
  assert.equal(historyDocument(historyDocument(editedAgain)).selectionEnd, 5);
  assert.equal(documentDirty(historyDocument(historyDocument(editedAgain))), false);
  assert.equal(editDocument(undone, 'branch').redo.length, 0);
});

test('saving updates the baseline and allows undo after saving', () => {
  const edited = editDocument(document(), 'saved update');
  const result = saveDocument(edited, files);
  assert.equal(result.files[path], 'saved update');
  assert.equal(documentDirty(result.document), false);
  assert.equal(documentDirty(historyDocument(result.document)), true);
});

test('external changes cannot be silently overwritten', () => {
  const doc = editDocument(document(), 'my update'), external = { ...files, [path]: 'another window' };
  assert.equal(documentExternal(doc, external), true);
  const first = saveDocument(doc, external);
  assert.equal(first.conflict.kind, 'external');
  assert.equal(first.conflict.currentContent, 'another window');
  const result = saveDocument(doc, external, path, { confirmed: true, expectedContent: 'another window' });
  assert.equal(result.files[path], 'my update');
  assert.ok(saveDocument(doc, { ...external, [path]: 'changed again' }, path, { confirmed: true, expectedContent: 'another window' }).conflict);
});

test('a removed file requires explicit confirmation before being recreated', () => {
  const removed = { ...files }; delete removed[path];
  const doc = document();
  assert.equal(documentExternal(doc, removed), true);
  assert.equal(saveDocument(doc, removed).conflict.kind, 'external');
  assert.equal(saveDocument(doc, removed, path, { confirmed: true, expectedContent: undefined }).files[path], doc.text);
});

test('drafts and Save As require confirmation for existing visitor destinations', () => {
  const draft = editDocument(createDocument(files, `${ROOT}/Documents/New.txt`, 2, true), 'new text');
  assert.equal(saveDocument(draft, files, path).conflict.kind, 'replace');
  const result = saveDocument(draft, files, path, { confirmed: true, expectedContent: files[path] });
  assert.equal(result.document.draft, false); assert.equal(result.document.path, path);
  assert.equal(result.files[path], 'new text');
});

test('original content remains protected even after replacement confirmation', () => {
  const draft = editDocument(createDocument(files, path, 2, true), 'new text');
  const target = `${ROOT}/Documents/Compétences.md`;
  assert.ok(saveDocument(draft, files, target, { confirmed: true, expectedContent: files[target] }).error);
  assert.ok(saveDocument(draft, files, `${ROOT}/Documents`).error);
  assert.ok(saveDocument(draft, files, `${ROOT}/Desktop/missing/file.txt`).error);
});

test('Save As validates names, home paths and UTF-8 byte limits', () => {
  const doc = document();
  assert.equal(saveDocument(doc, files, '~/Desktop/Copy.txt').document.path, `${ROOT}/Desktop/Copy.txt`);
  assert.ok(saveDocument(doc, files, `${ROOT}/Desktop/${'é'.repeat(128)}`).error);
  assert.ok(saveDocument(doc, files, `${ROOT}/Desktop/bad\u0000name`).error);
});

test('literal search, case-sensitive search and Unicode whole words are distinct', () => {
  assert.equal(searchDocument('Ubuntu ubuntu UBUNTU', 'ubuntu').matches.length, 3);
  assert.equal(searchDocument('Ubuntu ubuntu UBUNTU', 'ubuntu', { caseSensitive: true }).matches.length, 1);
  assert.equal(searchDocument('a.b aXb', 'a.b').matches.length, 1);
  assert.equal(searchDocument('été étés préété 𝒜été été𝒜 été', 'été', { wholeWord: true }).matches.length, 2);
  assert.equal(searchDocument('e\u0301 e', 'e', { wholeWord: true }).matches.length, 1);
});

test('regular expressions handle groups, line anchors, invalid and zero-width matches', () => {
  assert.equal(searchDocument('one\ntwo', '^', { regex: true }).matches.length, 2);
  assert.equal(searchDocument('🙂', '(?=)', { regex: true }).matches.length, 2);
  assert.equal(searchDocument('abc', '[', { regex: true }).matches.length, 0);
  assert.ok(searchDocument('abc', '[', { regex: true }).error);
  assert.equal(searchDocument('text', '').matches.length, 0);
});

test('replace all is one undoable operation and treats literal replacement characters literally', () => {
  const doc = { ...document(), text: 'one one', baseText: 'one one' };
  const matches = searchDocument(doc.text, 'one').matches;
  const result = replaceDocumentMatches(doc, matches, '$&');
  assert.equal(result.text, '$& $&');
  assert.equal(historyDocument(result).text, 'one one');
});

test('regex replacements use Gtk capture references without re-replacing inserted text', () => {
  const doc = { ...document(), text: 'item12 item34', baseText: 'item12 item34' };
  const matches = searchDocument(doc.text, 'item([0-9]+)', { regex: true }).matches;
  assert.equal(replaceDocumentMatches(doc, matches, 'number\\1', true).text, 'number12 number34');
});

test('statistics count Unicode characters and actual encoded bytes', () => {
  assert.deepEqual(documentStatistics('été 🙂\n'), { lines: 2, words: 2, characters: 6, nonWhitespace: 4, bytes: 11 });
});

test('Tab uses the next tab stop and Shift+Tab removes the current line indentation', () => {
  const doc = { ...document(), text: ' x\nnext', selectionStart: 2, selectionEnd: 2 };
  const indented = indentDocument(doc, 2, 2, 4);
  assert.equal(indented.text, ' x  \nnext'); assert.equal(indented.selectionStart, 4);
  const outdented = indentDocument({ ...doc, text: '    x\nnext' }, 5, 5, 4, true);
  assert.equal(outdented.text, 'x\nnext'); assert.equal(outdented.selectionStart, 1);
});

test('selected lines indent as one undoable edit and exclude an unselected following line', () => {
  const doc = { ...document(), text: 'one\ntwo\nthree', selectionStart: 0, selectionEnd: 8 };
  const indented = indentDocument(doc, 0, 8, 2);
  assert.equal(indented.text, '  one\n  two\nthree');
  assert.equal(indented.selectionStart, 2); assert.equal(indented.selectionEnd, 12);
  assert.equal(historyDocument(indented).text, doc.text);
  const outdented = indentDocument(indented, 0, 12, 2, true);
  assert.equal(outdented.text, doc.text);
});
