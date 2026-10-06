import { canModifyPath, isDirectory, normalizePath, ROOT } from './virtualFs.js';

export const documentDirty = (document) => document.text !== document.baseText;
export const documentExternal = (document, files) => !document.draft && files[document.path] !== document.baseText;

export function createDocument(files, path, id, draft = false) {
  return { id, path, text: draft ? '' : files[path] ?? '', baseText: draft ? '' : files[path] ?? '', draft, selectionStart: 0, selectionEnd: 0, scrollTop: 0, undo: [], redo: [], notice: '' };
}

export function editDocument(document, text, selectionStart = 0, selectionEnd = selectionStart) {
  if (text === document.text) return { ...document, selectionStart, selectionEnd };
  const snapshot = { text: document.text, selectionStart: document.selectionStart, selectionEnd: document.selectionEnd };
  return { ...document, text, selectionStart, selectionEnd, undo: [...document.undo, snapshot].slice(-100), redo: [], notice: '' };
}

export function historyDocument(document, redo = false) {
  const source = redo ? document.redo : document.undo;
  if (!source.length) return document;
  const snapshot = { text: document.text, selectionStart: document.selectionStart, selectionEnd: document.selectionEnd };
  return { ...document, ...source.at(-1), [redo ? 'redo' : 'undo']: source.slice(0, -1), [redo ? 'undo' : 'redo']: [...document[redo ? 'undo' : 'redo'], snapshot], notice: '' };
}

export function indentDocument(document, start, end, width = 4, unindent = false) {
  const text = document.text, firstLine = text.lastIndexOf('\n', start - 1) + 1;
  if (start === end && !unindent) {
    const column = [...text.slice(firstLine, start)].reduce((value, char) => value + (char === '\t' ? width - value % width : 1), 0);
    const insert = ' '.repeat(width - column % width);
    return editDocument(document, text.slice(0, start) + insert + text.slice(end), start + insert.length);
  }
  const operations = [];
  const limit = end > start && text[end - 1] === '\n' ? end - 1 : end;
  let offset = firstLine;
  while (offset <= limit) {
    const leading = text.slice(offset).match(/^(?:\t| *)/)[0];
    operations.push({ start: offset, remove: unindent ? Math.min(leading.length, leading.startsWith('\t') ? 1 : width) : 0, insert: unindent ? '' : ' '.repeat(width) });
    const newline = text.indexOf('\n', offset);
    if (newline < 0) break;
    offset = newline + 1;
  }
  let next = text;
  for (const operation of [...operations].reverse()) next = next.slice(0, operation.start) + operation.insert + next.slice(operation.start + operation.remove);
  const position = (point) => point + operations.reduce((delta, operation) => point < operation.start ? delta : delta + operation.insert.length - Math.min(operation.remove, point - operation.start), 0);
  return editDocument(document, next, position(start), position(end));
}

export function saveDocument(document, files, requested = document.path, { confirmed = false, expectedContent } = {}) {
  const path = normalizePath(requested.startsWith('~/') ? ROOT + requested.slice(1) : requested);
  const parent = path.slice(0, path.lastIndexOf('/')) || '/';
  const name = requested.split('/').at(-1);
  if (!name || ['.', '..'].includes(name) || [...name].some((char) => char.charCodeAt(0) < 32 || char === '\\') || new TextEncoder().encode(name).length > 255) return { error: 'Le nom de fichier est invalide.' };
  if (!canModifyPath(files, path) || isDirectory(files, path)) return { error: 'Cet emplacement est protégé. Choisissez un nom pour votre copie.' };
  if (!isDirectory(files, parent)) return { error: 'Le dossier de destination n’existe plus.' };
  const ownPath = path === document.path && !document.draft;
  const conflict = ownPath ? files[path] !== document.baseText : Object.hasOwn(files, path);
  if (conflict && (!confirmed || files[path] !== expectedContent)) return { conflict: { path, currentContent: files[path], kind: ownPath ? 'external' : 'replace' } };
  const next = { ...files, [path]: document.text };
  return { files: next, document: { ...document, path, baseText: document.text, draft: false, notice: 'Enregistré' } };
}

const wordCharacter = (value) => value !== undefined && /[\p{L}\p{M}\p{N}_]/u.test(value);
function previousCharacter(text, offset) {
  const last = text.charCodeAt(offset - 1);
  return text.slice(offset - (last >= 0xdc00 && last <= 0xdfff ? 2 : 1), offset);
}

export function searchDocument(text, query, { caseSensitive = false, wholeWord = false, regex = false } = {}) {
  if (!query) return { matches: [], error: '' };
  let expression;
  try { expression = new RegExp(regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), `${caseSensitive ? '' : 'i'}gu${regex ? 'm' : ''}`); }
  catch { return { matches: [], error: 'Expression régulière invalide' }; }
  const matches = [];
  let match;
  while ((match = expression.exec(text)) !== null) {
    const start = match.index, end = start + match[0].length;
    const nextPoint = text.codePointAt(end);
    if (!wholeWord || !wordCharacter(previousCharacter(text, start)) && !wordCharacter(nextPoint === undefined ? undefined : String.fromCodePoint(nextPoint))) matches.push({ start, end, value: match[0], groups: match.slice(1), namedGroups: match.groups });
    if (!match[0].length) {
      const point = text.codePointAt(expression.lastIndex);
      expression.lastIndex += point > 0xffff ? 2 : 1;
    }
  }
  return { matches, error: '' };
}

export function replacementText(match, replacement, regex = false) {
  if (!regex) return replacement;
  // GtkSourceView replacement syntax uses backslash-number capture references.
  return replacement.replace(/\\(\\|[0-9])/g, (_, value) => value === '\\' ? '\\' : value === '0' ? match.value : match.groups[Number(value) - 1] ?? '');
}

export function replaceDocumentMatches(document, matches, replacement, regex = false) {
  let text = document.text;
  for (const match of [...matches].reverse()) text = text.slice(0, match.start) + replacementText(match, replacement, regex) + text.slice(match.end);
  const start = matches[0]?.start ?? document.selectionStart;
  return editDocument(document, text, start, start);
}

export function documentStatistics(text) {
  return { lines: text.split('\n').length, words: (text.match(/\S+/gu) || []).length, characters: [...text].length, nonWhitespace: [...text.replace(/\s/gu, '')].length, bytes: new TextEncoder().encode(text).length };
}
