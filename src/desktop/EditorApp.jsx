import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, FilePlus2, FolderOpen, Info, Menu, Minus, Plus, X } from 'lucide-react';
import { canModifyPath, ROOT, uniquePath, writeFiles } from './virtualFs';
import { CV_DOCUMENT } from './portfolioData';
import { readImage } from './imageFiles';
import { createDocument, documentDirty, documentExternal, documentStatistics, editDocument, historyDocument, indentDocument, replaceDocumentMatches, saveDocument, searchDocument } from './editorDocument';
import EditorDialog from './EditorDialog';
import EditorSaveDialog from './EditorSaveDialog';
import EditorSearch from './EditorSearch';
import './TextEditor.css';

export default function EditorApp({ files, filePath, setFiles, windowId = 'editor', navigationRequest = 0, openRequests, initialDocument, onNewWindow, onOpenDirectory, onClose }) {
  const nextId = useRef(2);
  const lastOpenRequest = useRef(0);
  const [tabs, setTabs] = useState(() => [initialDocument ? { ...initialDocument, id: 1 } : createDocument(files, openRequests?.[0]?.path || filePath || `${ROOT}/Documents/À propos.md`, 1)]);
  const [activeId, setActiveId] = useState(1);
  const closedTabs = useRef([]);
  const [menu, setMenu] = useState(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const searchTimer = useRef(null);
  const [searchFocus, setSearchFocus] = useState(0);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [searchOptions, setSearchOptions] = useState({ regex: false, caseSensitive: false, wholeWord: false });
  const [matchIndex, setMatchIndex] = useState(0);
  const [wrap, setWrap] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [properties, setProperties] = useState(false);
  const [indentWidth, setIndentWidth] = useState(4);
  const [autoIndent, setAutoIndent] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const [saveDialog, setSaveDialog] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef(null), textareaRef = useRef(null), highlightsRef = useRef(null), menuRef = useRef(null);
  const bypassClose = useRef(false);
  const active = tabs.find((tab) => tab.id === activeId) || tabs[0];
  const readOnly = !canModifyPath(files, active.path);
  const external = documentExternal(active, files);
  const found = useMemo(() => searchDocument(active.text, query, searchOptions), [active.text, query, searchOptions]);
  const matches = found.matches, currentIndex = Math.min(matchIndex, Math.max(0, matches.length - 1));
  const statistics = documentStatistics(active.text);
  const beforeCursor = active.text.slice(0, active.selectionStart);
  const cursor = { line: beforeCursor.split('\n').length, column: [...beforeCursor.split('\n').at(-1)].length + 1 };

  function updateTab(id, update) { setTabs((current) => current.map((tab) => tab.id === id ? typeof update === 'function' ? update(tab) : update : tab)); }
  function focusDocument(document = active) {
    requestAnimationFrame(() => {
      const view = textareaRef.current;
      if (!view?.isConnected || window.document.querySelector('dialog[open]')) return;
      view.focus({ preventScroll: true }); view.setSelectionRange(document.selectionStart, document.selectionEnd); view.scrollTop = document.scrollTop;
      if (highlightsRef.current) { highlightsRef.current.scrollTop = view.scrollTop; highlightsRef.current.scrollLeft = view.scrollLeft; }
    });
  }
  function openDocument(path) {
    const existing = tabs.find((tab) => tab.path === path && !tab.draft);
    if (existing) { setActiveId(existing.id); focusDocument(existing); }
    else { const document = createDocument(files, path, nextId.current++); setTabs((current) => [...current, document]); setActiveId(document.id); focusDocument(document); }
    setMenu(null); setSearchVisible(false); setMatchIndex(0);
  }
  useEffect(() => {
    const requests = openRequests ? openRequests.filter((request) => request.id > lastOpenRequest.current) : navigationRequest > lastOpenRequest.current && filePath ? [{ id: navigationRequest, path: filePath }] : [];
    if (!requests.length) return;
    let next = tabs, selected;
    for (const request of requests) {
      lastOpenRequest.current = request.id;
      if (typeof files[request.path] !== 'string' || files[request.path] === CV_DOCUMENT || readImage(files[request.path])) continue;
      selected = next.find((tab) => tab.path === request.path && !tab.draft);
      if (!selected) { selected = createDocument(files, request.path, nextId.current++); next = [...next, selected]; }
    }
    if (!selected) return;
    // Consume a batch together so simultaneous file openings cannot overwrite a request.
    setTabs(next); setActiveId(selected.id); setSearchVisible(false); setMatchIndex(0); focusDocument(selected);
    // Editing tabs or files must not replay a previous opening request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, navigationRequest, openRequests]);
  useEffect(() => {
    const reveal = () => rootRef.current?.querySelector('[role="tab"][aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const frame = requestAnimationFrame(reveal);
    const observer = new ResizeObserver(reveal);
    if (rootRef.current) observer.observe(rootRef.current);
    if (rootRef.current?.closest('.ubuntu-window')?.classList.contains('is-active-window')) focusDocument();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
    // Restore this tab's view when switching, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);
  useEffect(() => {
    function beforeClose(event) {
      if (event.detail?.id !== windowId || bypassClose.current || !tabs.some(documentDirty)) return;
      event.preventDefault(); setMenu(null); setPendingAction({ ids: tabs.map((tab) => tab.id), action: event.detail.close });
    }
    function beforeUnload(event) { if (tabs.some(documentDirty)) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('portfolio:window-before-close', beforeClose); window.addEventListener('beforeunload', beforeUnload);
    return () => { window.removeEventListener('portfolio:window-before-close', beforeClose); window.removeEventListener('beforeunload', beforeUnload); };
  }, [tabs, windowId]);
  useEffect(() => {
    if (!menu) return undefined;
    function dismiss(event) { if (!rootRef.current?.contains(event.target) || !event.target.closest('.ubuntu-editor__toolbar, .ubuntu-app-popover')) setMenu(null); }
    window.document.addEventListener('pointerdown', dismiss);
    const handle = requestAnimationFrame(() => menuRef.current?.querySelector('input, button')?.focus());
    return () => { window.document.removeEventListener('pointerdown', dismiss); cancelAnimationFrame(handle); };
  }, [menu]);
  useEffect(() => {
    const changed = () => setFullscreen(window.document.fullscreenElement === rootRef.current);
    window.document.addEventListener('fullscreenchange', changed);
    return () => window.document.removeEventListener('fullscreenchange', changed);
  }, []);
  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  function newDocument() {
    const reserved = { ...files, ...Object.fromEntries(tabs.map((tab) => [tab.path, tab.text])) };
    const document = createDocument(files, uniquePath(reserved, `${ROOT}/Documents`, 'Sans titre.txt'), nextId.current++, true);
    setTabs((current) => [...current, document]); setActiveId(document.id); setMenu(null); setSearchVisible(false); focusDocument(document);
  }
  function closeTabs(ids) {
    const action = (documents) => {
      const next = documents.filter((tab) => !ids.includes(tab.id));
      const closed = documents.filter((tab) => ids.includes(tab.id) && !(tab.draft && documentDirty(tab))).map((tab) => documentDirty(tab) ? { ...tab, text: tab.baseText, undo: [], redo: [], selectionStart: 0, selectionEnd: 0 } : tab);
      closedTabs.current = [...closedTabs.current, ...closed].slice(-20);
      if (!next.length) { bypassClose.current = true; onClose?.(); return; }
      setTabs(next);
      if (ids.includes(activeId)) setActiveId(next[Math.min(tabs.findIndex((tab) => tab.id === activeId), next.length - 1)].id);
    };
    setMenu(null);
    if (tabs.some((tab) => ids.includes(tab.id) && documentDirty(tab))) setPendingAction({ ids, action }); else action(tabs);
  }
  function continueSaving(documents, currentFiles, pending) {
    const document = documents.find((tab) => pending.ids.includes(tab.id) && documentDirty(tab));
    if (!document) { setPendingAction(null); pending.action(documents); return; }
    if (document.draft || !canModifyPath(currentFiles, document.path)) { setSaveDialog({ id: document.id }); setSaveError(''); return; }
    performSave(document.id, document.path, {}, documents, currentFiles, pending);
  }
  function performSave(id, destination, options = {}, documents = tabs, currentFiles = files, pending = pendingAction?.saving ? pendingAction : null) {
    const document = documents.find((tab) => tab.id === id);
    if (!document) return;
    const result = saveDocument(document, currentFiles, destination, options);
    if (result.error) { setSaveError(result.error); updateTab(id, (tab) => ({ ...tab, notice: result.error })); if (!saveDialog) setSaveDialog({ id }); return; }
    if (result.conflict) { setConfirmation({ type: 'overwrite', id, destination: result.conflict.path, content: result.conflict.currentContent, kind: result.conflict.kind }); return; }
    const nextFiles = writeFiles(result.files), nextDocuments = documents.map((tab) => tab.id === id ? result.document : tab);
    setFiles(nextFiles); setTabs(nextDocuments); setSaveDialog(null); setConfirmation(null); setSaveError('');
    if (pending) continueSaving(nextDocuments, nextFiles, pending); else focusDocument(result.document);
  }
  function saveActive(as = false) {
    setMenu(null);
    if (as || active.draft || readOnly) { setSaveDialog({ id: active.id }); setSaveError(''); } else performSave(active.id, active.path);
  }
  function cancelSave() { setSaveDialog(null); setSaveError(''); if (pendingAction) setPendingAction({ ...pendingAction, saving: false }); else focusDocument(); }
  function reloadDocument(id) {
    const document = tabs.find((tab) => tab.id === id);
    if (typeof files[document.path] !== 'string') return;
    const next = createDocument(files, document.path, id); updateTab(id, next); setConfirmation(null); focusDocument(next);
  }
  function requestReload() { if (documentDirty(active)) setConfirmation({ type: 'reload', id: active.id }); else reloadDocument(active.id); }
  function beginSearch(replace = false) {
    window.clearTimeout(searchTimer.current); setSearchClosing(false);
    const view = textareaRef.current, selected = active.text.slice(view?.selectionStart ?? 0, view?.selectionEnd ?? 0);
    if (selected) setQuery(selected);
    setMenu(null); setReplaceMode(replace); setSearchVisible(true); setMatchIndex(0); setSearchFocus((value) => value + 1);
  }
  function closeSearch() {
    window.clearTimeout(searchTimer.current); setSearchClosing(true); focusDocument();
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250;
    searchTimer.current = window.setTimeout(() => { setSearchVisible(false); setSearchClosing(false); }, duration);
  }
  function selectMatch(index, focus = false) {
    if (!matches.length) return;
    const next = (index + matches.length) % matches.length, match = matches[next];
    setMatchIndex(next); updateTab(active.id, (tab) => ({ ...tab, selectionStart: match.start, selectionEnd: match.end }));
    textareaRef.current?.setSelectionRange(match.start, match.end); if (focus) textareaRef.current?.focus();
  }
  function replaceMatches(all = false) {
    if (readOnly || !matches.length) return;
    const selected = all ? matches : [matches[currentIndex]], next = replaceDocumentMatches(active, selected, replacement, searchOptions.regex);
    updateTab(active.id, { ...next, notice: `${selected.length} remplacement${selected.length > 1 ? 's' : ''}` });
    setMatchIndex(0);
  }
  function restoreHistory(redo = false) { if (readOnly) return; const next = historyDocument(active, redo); updateTab(active.id, next); focusDocument(next); }
  function moveTab(direction) {
    const index = tabs.findIndex((tab) => tab.id === activeId), target = index + direction;
    if (target < 0 || target >= tabs.length) return;
    const next = [...tabs]; [next[index], next[target]] = [next[target], next[index]]; setTabs(next);
  }
  function detachTab() {
    if (!onNewWindow) return;
    onNewWindow(active);
    if (tabs.length === 1) { bypassClose.current = true; onClose?.(); }
    else { const remaining = tabs.filter((tab) => tab.id !== activeId); setTabs(remaining); setActiveId(remaining[0].id); }
    setMenu(null);
  }
  function reopenTab() {
    const document = closedTabs.current.pop();
    if (!document) return;
    const existing = tabs.find((tab) => !tab.draft && !document.draft && tab.path === document.path);
    if (existing) { setActiveId(existing.id); focusDocument(existing); return; }
    const restored = { ...document, id: nextId.current++ };
    setTabs((current) => [...current, restored]); setActiveId(restored.id); focusDocument(restored);
  }
  async function toggleFullscreen() {
    try { if (window.document.fullscreenElement === rootRef.current) await window.document.exitFullscreen(); else await rootRef.current.requestFullscreen(); focusDocument(); }
    catch { updateTab(active.id, (tab) => ({ ...tab, notice: 'Le plein écran n’est pas disponible.' })); }
  }
  function toggleProperties() {
    setProperties(!properties);
    if (properties) focusDocument();
    else requestAnimationFrame(() => rootRef.current?.querySelector('.editor-properties header button')?.focus());
  }
  function changeText(text, start, end) { if (!readOnly) updateTab(active.id, (tab) => editDocument(tab, text, start, end)); }
  function keyDown(event) {
    if (event.target.closest('dialog') || event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { setMenu(null); if (properties) { setProperties(false); focusDocument(); return; } if (searchVisible) closeSearch(); return; }
    if (event.key === 'F9' && !event.altKey && !event.ctrlKey) { event.preventDefault(); toggleProperties(); return; }
    if (event.key === 'F11') { event.preventDefault(); toggleFullscreen(); return; }
    if (event.altKey && event.key.toLowerCase() === 'w') { event.preventDefault(); setWrap(!wrap); return; }
    if (!event.ctrlKey || event.altKey && !['PageUp', 'PageDown'].includes(event.key)) return;
    const key = event.key.toLowerCase();
    if (['z', 'y'].includes(key) && event.target !== textareaRef.current) return;
    if (['s', 'f', 'h', 't', 'n', 'o', 'k', 'w', 'z', 'y', 'g', 'pageup', 'pagedown', '+', '=', '-', '0'].includes(key)) event.preventDefault();
    if (key === 's') saveActive(event.shiftKey);
    if (key === 'f' || key === 'h') beginSearch(key === 'h');
    if (key === 't') event.shiftKey ? reopenTab() : newDocument();
    if (key === 'n') event.shiftKey ? detachTab() : onNewWindow?.();
    if (key === 'o' || key === 'k') setMenu('open');
    if (key === 'w') closeTabs([activeId]);
    if ((key === 'z' || key === 'y') && event.target === textareaRef.current) restoreHistory(key === 'y' || event.shiftKey);
    if (key === 'g') selectMatch(currentIndex + (event.shiftKey ? -1 : 1), true);
    if (key === 'pageup' || key === 'pagedown') {
      const direction = key === 'pageup' ? -1 : 1;
      if (event.shiftKey) moveTab(direction);
      else { const index = tabs.findIndex((tab) => tab.id === activeId); setActiveId(tabs[(index + direction + tabs.length) % tabs.length].id); }
    }
    if (['+', '=', '-', '0'].includes(key)) setFontSize((value) => key === '0' ? 14 : Math.min(32, Math.max(8, value + (key === '-' ? -1 : 1))));
  }

  return <div className={`ubuntu-editor ${fullscreen ? 'is-fullscreen' : ''}`} ref={rootRef} style={{ '--editor-font-size': `${fontSize}px` }} onKeyDown={keyDown}>
    <div className="ubuntu-editor__toolbar"><div className="editor-toolbar__start"><button className="ubuntu-editor__open" aria-label="Ouvrir un document" aria-expanded={menu === 'open'} onClick={() => setMenu(menu === 'open' ? null : 'open')}><FolderOpen size={17} /><span>Ouvrir</span><ChevronDown size={13} /></button><button aria-label="Nouvel onglet" title="Nouvel onglet (Ctrl+T)" onClick={newDocument}><FilePlus2 size={18} /></button></div><div className="ubuntu-editor__document-title" title={active.path}><strong>{documentDirty(active) && <span className="ubuntu-editor__unsaved" />}<span>{active.draft ? 'Sans titre' : active.path.split('/').at(-1)}</span></strong><small>{active.draft ? 'Brouillon' : active.path.slice(0, active.path.lastIndexOf('/')).replace(ROOT, 'Dossier personnel')}</small></div><button aria-label="Propriétés du document" aria-pressed={properties} title="Propriétés du document (F9)" onClick={toggleProperties}><Info size={18} /></button><button aria-label="Menu de l’éditeur" aria-expanded={menu === 'main'} onClick={() => setMenu(menu === 'main' ? null : 'main')}><Menu size={18} /></button>{fullscreen && <button aria-label="Quitter le plein écran" onClick={toggleFullscreen}><X size={18} /></button>}</div>
    {tabs.length > 1 && <div className="editor-tabs" role="tablist" aria-label="Documents ouverts">{tabs.map((tab) => <div className={tab.id === activeId ? 'is-selected' : ''} key={tab.id} onContextMenu={(event) => { event.preventDefault(); setActiveId(tab.id); setMenu('tab'); }}><button role="tab" aria-selected={tab.id === activeId} onClick={() => { setActiveId(tab.id); setMatchIndex(0); }} title={tab.path}>{documentDirty(tab) && <span>•</span>}{tab.draft ? 'Sans titre' : tab.path.split('/').at(-1)}</button><button aria-label={`Fermer ${tab.draft ? 'le brouillon' : tab.path.split('/').at(-1)}`} onClick={() => closeTabs([tab.id])}><X size={13} /></button></div>)}</div>}
    {menu && <div ref={menuRef} className={`ubuntu-app-popover ubuntu-editor__menu ${menu === 'open' ? 'ubuntu-editor__picker' : ''}`} role="menu" aria-label={menu === 'open' ? 'Ouvrir un document' : menu === 'tab' ? 'Actions de l’onglet' : 'Actions de l’éditeur'} onKeyDown={(event) => { if (event.key === 'Escape') { setMenu(null); focusDocument(); } }}>
      {menu === 'open' ? <><strong>Ouvrir un document</strong><input aria-label="Filtrer les documents" placeholder="Rechercher un document…" value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} />{Object.entries(files).filter(([path, content]) => typeof content === 'string' && content !== CV_DOCUMENT && !readImage(content) && !path.endsWith('.desktop') && path.toLocaleLowerCase().includes(pickerQuery.toLocaleLowerCase())).map(([path]) => <button key={path} role="menuitem" onClick={() => openDocument(path)}><span>{path.split('/').at(-1)}</span><small>{path.replace(ROOT, '~')}</small></button>)}</> : menu === 'tab' ? <><button role="menuitem" onClick={() => { moveTab(-1); setMenu(null); }}>Déplacer à gauche</button><button role="menuitem" onClick={() => { moveTab(1); setMenu(null); }}>Déplacer à droite</button><button role="menuitem" onClick={detachTab}>Déplacer vers une nouvelle fenêtre</button><button role="menuitem" onClick={() => closeTabs(tabs.filter((tab) => tab.id !== activeId).map((tab) => tab.id))}>Fermer les autres onglets</button><button role="menuitem" onClick={() => closeTabs([activeId])}>Fermer l’onglet <kbd>Ctrl+W</kbd></button></> : <><div className="editor-zoom"><button aria-label="Réduire le texte" onClick={() => setFontSize(Math.max(8, fontSize - 1))}><Minus size={16} /></button><button onClick={() => setFontSize(14)} aria-label="Rétablir la taille du texte">{Math.round(fontSize / 14 * 100)} %</button><button aria-label="Agrandir le texte" onClick={() => setFontSize(Math.min(32, fontSize + 1))}><Plus size={16} /></button></div><button role="menuitem" onClick={() => { setMenu(null); onNewWindow?.(); }}>Nouvelle fenêtre <kbd>Ctrl+N</kbd></button><button role="menuitem" onClick={() => saveActive()} disabled={readOnly && !active.draft}>Enregistrer <kbd>Ctrl+S</kbd></button><button role="menuitem" onClick={() => saveActive(true)}>Enregistrer sous… <kbd>Ctrl+Maj+S</kbd></button><button role="menuitem" disabled={active.draft || !documentDirty(active) && !external} onClick={() => { setMenu(null); setConfirmation({ type: 'reload', id: activeId }); }}>Abandonner les modifications…</button><hr /><button role="menuitem" onClick={() => beginSearch()}>Rechercher/remplacer… <kbd>Ctrl+F</kbd></button><button role="menuitemcheckbox" aria-checked={wrap} onClick={() => { setWrap(!wrap); setMenu(null); }}>Retour à la ligne</button><button role="menuitem" onClick={() => { setMenu(null); toggleFullscreen(); }}>{fullscreen ? 'Quitter le plein écran' : 'Plein écran'} <kbd>F11</kbd></button></>}
    </div>}
    {external && <div className="editor-external" role="status"><span>{Object.hasOwn(files, active.path) ? 'Ce document a été modifié ailleurs.' : 'Ce document a été supprimé ou déplacé.'}</span>{typeof files[active.path] === 'string' && <button onClick={requestReload}>Recharger</button>}<button onClick={() => saveActive(true)}>Enregistrer sous…</button></div>}
    <div className="editor-body"><div className="editor-document"><div className="ubuntu-editor__page"><pre ref={highlightsRef} className={`editor-highlights ${wrap ? 'is-wrapped' : ''}`} aria-hidden="true">{searchVisible ? highlightedText(active.text, matches, currentIndex) : active.text}{'\n'}</pre><textarea ref={textareaRef} value={active.text} readOnly={readOnly} wrap={wrap ? 'soft' : 'off'} onChange={(event) => changeText(event.target.value, event.target.selectionStart, event.target.selectionEnd)} onSelect={(event) => updateTab(active.id, (tab) => ({ ...tab, selectionStart: event.target.selectionStart, selectionEnd: event.target.selectionEnd }))} onScroll={(event) => { if (highlightsRef.current) { highlightsRef.current.scrollTop = event.target.scrollTop; highlightsRef.current.scrollLeft = event.target.scrollLeft; } updateTab(active.id, (tab) => ({ ...tab, scrollTop: event.target.scrollTop })); }} onKeyDown={(event) => {
      if (readOnly || event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return;
      const view = event.currentTarget, start = view.selectionStart, end = view.selectionEnd;
      if (event.key === 'Tab') { event.preventDefault(); const next = indentDocument(active, start, end, indentWidth, event.shiftKey); updateTab(active.id, next); focusDocument(next); }
      if (event.key === 'Enter' && autoIndent) { const prefix = active.text.slice(0, start).split('\n').at(-1).match(/^\s*/)?.[0] || ''; if (prefix) { event.preventDefault(); const insert = '\n' + prefix, text = active.text.slice(0, start) + insert + active.text.slice(end); const next = editDocument(active, text, start + insert.length); updateTab(active.id, next); focusDocument(next); } }
    }} aria-label="Contenu du fichier" spellCheck="false" /></div>
    {searchVisible && <EditorSearch closing={searchClosing} focusRequest={searchFocus} query={query} onQuery={(value) => { setQuery(value); setMatchIndex(0); }} replacement={replacement} onReplacement={setReplacement} replaceMode={replaceMode} onReplaceMode={setReplaceMode} options={searchOptions} onOptions={(value) => { setSearchOptions(value); setMatchIndex(0); }} matchCount={matches.length} matchIndex={currentIndex} error={found.error} readOnly={readOnly} onNavigate={(direction) => selectMatch(currentIndex + direction)} onAccept={() => selectMatch(currentIndex, true)} onReplace={() => replaceMatches()} onReplaceAll={() => replaceMatches(true)} onClose={closeSearch} />}
    </div>{properties && <><button className="editor-properties-backdrop" aria-label="Fermer les propriétés du document" onClick={() => { setProperties(false); focusDocument(); }} /><aside className="editor-properties" aria-label="Propriétés du document"><header><h2>Propriétés</h2><button aria-label="Fermer les propriétés" onClick={() => { setProperties(false); focusDocument(); }}><X size={17} /></button></header><div className="editor-properties__group"><div><span>Nom du fichier</span><strong>{active.draft ? 'Sans titre' : active.path.split('/').at(-1)}</strong></div><button onClick={() => onOpenDirectory?.(active.path.slice(0, active.path.lastIndexOf('/')))}><span>Emplacement</span><strong>{active.draft ? 'Brouillon non enregistré' : active.path.slice(0, active.path.lastIndexOf('/')).replace(ROOT, '~')}</strong></button><div><span>Type de document</span><strong>{active.path.endsWith('.md') ? 'Markdown' : 'Texte brut'}</strong></div><div><span>Encodage</span><strong>UTF-8</strong></div><div><span>Fin de ligne</span><strong>{active.text.includes('\r\n') ? 'Windows (CR LF)' : 'Unix (LF)'}</strong></div></div><div className="editor-properties__group"><label>Indentation automatique<input type="checkbox" checked={autoIndent} onChange={(event) => setAutoIndent(event.target.checked)} /></label><label>Espaces par tabulation<select value={indentWidth} onChange={(event) => setIndentWidth(Number(event.target.value))}>{[2, 4, 8].map((width) => <option key={width}>{width}</option>)}</select></label></div><h3>Statistiques</h3><div className="editor-properties__group">{[['Lignes', statistics.lines], ['Mots', statistics.words], ['Caractères sans espaces', statistics.nonWhitespace], ['Tous les caractères', statistics.characters]].map(([label, value]) => <div className="editor-properties__stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></aside></>}</div>
    <footer className="ubuntu-editor__status"><span role="status">{active.notice || (readOnly ? 'Lecture seule · portfolio' : active.draft ? 'Brouillon' : '')}</span><span>Ln {cursor.line}, Col {cursor.column}</span><span>UTF-8</span></footer>
    {pendingAction && !saveDialog && !confirmation && <EditorDialog title="Enregistrer les modifications ?" onCancel={() => { setPendingAction(null); focusDocument(); }} actions={[{ label: 'Annuler', onClick: () => { setPendingAction(null); focusDocument(); } }, { label: pendingAction.ids.length > 1 ? 'Tout abandonner' : 'Abandonner', style: 'destructive', onClick: () => { const pending = pendingAction; setPendingAction(null); pending.action(tabs); } }, { label: 'Enregistrer', style: 'suggested', defaultAction: true, onClick: () => { const pending = { ...pendingAction, saving: true }; setPendingAction(pending); continueSaving(tabs, files, pending); } }]}><p>Les modifications non enregistrées seront perdues.</p><ul className="editor-dirty-list">{tabs.filter((tab) => pendingAction.ids.includes(tab.id) && documentDirty(tab)).map((tab) => <li key={tab.id}>{tab.draft ? 'Sans titre' : tab.path.split('/').at(-1)}</li>)}</ul></EditorDialog>}
    {saveDialog && <EditorSaveDialog key={saveDialog.id} files={files} document={tabs.find((tab) => tab.id === saveDialog.id)} error={saveError} onSave={(destination) => performSave(saveDialog.id, destination)} onCancel={cancelSave} />}
    {confirmation && <EditorDialog title={confirmation.type === 'reload' ? 'Abandonner les modifications ?' : confirmation.kind === 'external' ? 'Le document a changé' : 'Remplacer le fichier ?'} onCancel={() => setConfirmation(null)} actions={[{ label: 'Annuler', defaultAction: true, onClick: () => setConfirmation(null) }, { label: confirmation.type === 'reload' ? 'Abandonner' : 'Remplacer', style: 'destructive', onClick: () => confirmation.type === 'reload' ? reloadDocument(confirmation.id) : performSave(confirmation.id, confirmation.destination, { confirmed: true, expectedContent: confirmation.content }) }]}><p>{confirmation.type === 'reload' ? 'Recharger le document supprimera vos modifications non enregistrées.' : `« ${confirmation.destination.split('/').at(-1)} » ${confirmation.kind === 'external' ? 'a été modifié ou supprimé depuis son ouverture. Votre version remplacera son contenu actuel.' : 'existe déjà. Votre document remplacera son contenu.'}`}</p></EditorDialog>}
  </div>;
}

function highlightedText(text, matches, currentIndex) {
  const parts = []; let cursor = 0;
  matches.forEach((match, index) => { parts.push(text.slice(cursor, match.start)); parts.push(<mark key={`${match.start}-${index}`} className={index === currentIndex ? 'is-current' : undefined}>{match.value || '\u200b'}</mark>); cursor = match.end; });
  parts.push(text.slice(cursor)); return parts;
}
