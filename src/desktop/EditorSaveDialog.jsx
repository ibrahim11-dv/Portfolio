import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Folder } from 'lucide-react';
import { canModifyPath, isDirectory, listDirectory, normalizePath, ROOT, uniquePath } from './virtualFs';

export default function EditorSaveDialog({ files, document, error, onSave, onCancel }) {
  const originalParent = document.path.slice(0, document.path.lastIndexOf('/')) || ROOT;
  const [directory, setDirectory] = useState(isDirectory(files, originalParent) ? originalParent : `${ROOT}/Documents`);
  const [name, setName] = useState(document.draft || canModifyPath(files, document.path) ? document.path.split('/').at(-1) : uniquePath(files, directory, document.path.split('/').at(-1)).split('/').at(-1));
  const ref = useRef(null), inputRef = useRef(null), id = useId();
  useEffect(() => {
    const previousFocus = window.document.activeElement;
    const dialog = ref.current;
    dialog.showModal(); inputRef.current?.select();
    return () => { dialog.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} className="editor-file-dialog" aria-labelledby={id} onCancel={(event) => { event.preventDefault(); onCancel(); }} onKeyDown={(event) => event.stopPropagation()}>
    <form onSubmit={(event) => { event.preventDefault(); onSave(normalizePath(name, directory)); }}>
      <header><button type="button" onClick={onCancel}>Annuler</button><h2 id={id}>Enregistrer sous</h2><button type="submit" className="is-suggested" disabled={!name.trim()}>Enregistrer</button></header>
      <div className="editor-file-dialog__location"><button type="button" aria-label="Dossier parent" disabled={directory === '/'} onClick={() => setDirectory(normalizePath('..', directory))}><ChevronLeft size={16} /></button><span title={directory}>{directory.replace(ROOT, '~')}</span></div>
      <div className="editor-file-dialog__body"><nav aria-label="Emplacements"><button type="button" onClick={() => setDirectory(ROOT)}>Dossier personnel</button><button type="button" onClick={() => setDirectory(`${ROOT}/Desktop`)}>Bureau</button><button type="button" onClick={() => setDirectory(`${ROOT}/Documents`)}>Documents</button></nav><div className="editor-file-dialog__entries">{listDirectory(files, directory).map(([entry, type]) => <button type="button" key={entry} onClick={() => type === 'dir' ? setDirectory(normalizePath(entry, directory)) : setName(entry)}>{type === 'dir' && <Folder size={18} />}<span>{entry}</span>{type === 'dir' && <small>Dossier</small>}</button>)}</div></div>
      <div className="editor-file-dialog__name"><label htmlFor={`${id}-name`}>Nom du fichier</label><input ref={inputRef} id={`${id}-name`} value={name} onChange={(event) => setName(event.target.value)} required autoComplete="off" spellCheck="false" />{error && <p role="alert">{error}</p>}</div>
    </form>
  </dialog>, window.document.body);
}
