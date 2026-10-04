import { useRef, useState } from 'react';
import { FilePlus2, FolderOpen, Menu, Save, Search, X } from 'lucide-react';
import { normalizePath, ROOT, uniquePath, writeFiles } from './virtualFs';

export default function TextEditor({ files, filePath, setFiles }) {
  const [path, setPath] = useState(filePath || '/home/guest/Documents/about.txt');
  const [text, setText] = useState(files[path] ?? '');
  const [saved, setSaved] = useState(true);
  const [menu, setMenu] = useState(null);
  const [query, setQuery] = useState('');
  const [wrap, setWrap] = useState(true);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const textareaRef = useRef(null);
  function open(pathToOpen) { if (!saved) save(); setPath(pathToOpen); setText(files[pathToOpen] ?? ''); setSaved(true); setMenu(null); }
  function newDocument() { if (!saved) save(); setPath(uniquePath(files, `${ROOT}/Documents`, 'Sans titre.txt')); setText(''); setSaved(false); setMenu(null); }
  function save() { const next = { ...files, [path]: text }; setFiles(next); writeFiles(next); setSaved(true); }
  function find() { const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase(), (textareaRef.current?.selectionEnd || 0)); const position = index < 0 ? text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) : index; if (position >= 0 && query) { textareaRef.current.focus(); textareaRef.current.setSelectionRange(position, position + query.length); } }
  return <div className="ubuntu-editor" onKeyDown={(event) => { if (event.ctrlKey && event.key.toLowerCase() === 's') { event.preventDefault(); save(); } if (event.ctrlKey && event.key.toLowerCase() === 'f') { event.preventDefault(); setMenu('search'); } if (event.key === 'Escape') setMenu(null); }}>
    <div className="ubuntu-editor__toolbar"><button className="ubuntu-editor__open" onClick={() => setMenu(menu === 'open' ? null : 'open')}><FolderOpen size={16} /> Ouvrir</button><button aria-label="Nouveau document" onClick={newDocument}><FilePlus2 size={18} /></button><div className="ubuntu-editor__document-title"><strong>{!saved && <span className="ubuntu-editor__unsaved" />}{path.split('/').pop()}</strong><span>{path.slice(0, path.lastIndexOf('/')).replace(ROOT, 'Dossier personnel')}</span></div><button className="ubuntu-editor__save" onClick={save} disabled={saved}><Save size={16} /> Enregistrer</button><button aria-label="Menu de l’éditeur" onClick={() => setMenu(menu === 'main' ? null : 'main')}><Menu size={18} /></button></div>
    {menu === 'search' && <div className="ubuntu-editor__search"><Search size={17} /><input autoFocus aria-label="Rechercher dans le document" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') find(); }} placeholder="Rechercher…" /><button onClick={find}>Suivant</button><button aria-label="Fermer la recherche" onClick={() => setMenu(null)}><X size={16} /></button></div>}
    {menu === 'main' && <div className="ubuntu-app-popover ubuntu-editor__menu"><button onClick={newDocument}>Nouveau document</button><button onClick={() => setMenu('search')}>Rechercher <kbd>Ctrl+F</kbd></button><button onClick={() => { setWrap((value) => !value); setMenu(null); }}>Retour à la ligne {wrap ? '✓' : ''}</button><button onClick={() => setMenu('rename')}>Enregistrer sous…</button></div>}
    {menu === 'open' && <div className="ubuntu-app-popover ubuntu-editor__picker"><strong>Ouvrir un document</strong>{Object.entries(files).filter(([, content]) => content !== null).map(([file]) => <button key={file} onClick={() => open(file)}><span>{file.split('/').pop()}</span><small>{file.replace(ROOT, '~')}</small></button>)}</div>}
    {menu === 'rename' && <form className="ubuntu-app-popover ubuntu-editor__menu" onSubmit={(event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get('path'); const destination = normalizePath(String(value)); const next = { ...files, [destination]: text }; setPath(destination); setFiles(next); writeFiles(next); setSaved(true); setMenu(null); }}><label>Enregistrer sous<input name="path" defaultValue={path} aria-label="Chemin du document" required /></label><button type="submit">Enregistrer</button></form>}
    <div className="ubuntu-editor__page"><textarea ref={textareaRef} value={text} wrap={wrap ? 'soft' : 'off'} onChange={(event) => { setText(event.target.value); setSaved(false); }} onSelect={(event) => { const before = text.slice(0, event.target.selectionStart); setCursor({ line: before.split('\n').length, column: before.split('\n').at(-1).length + 1 }); }} aria-label="Contenu du fichier" spellCheck="false" /></div>
    <footer className="ubuntu-editor__status"><span>Texte brut</span><span>Ln {cursor.line}, Col {cursor.column}</span><span>UTF-8</span></footer>
  </div>;
}
