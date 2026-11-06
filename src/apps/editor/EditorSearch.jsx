import { ArrowDown, ArrowUp, Replace, Search, Settings2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function EditorSearch({ closing, focusRequest, query, onQuery, replacement, onReplacement, replaceMode, onReplaceMode, options, onOptions, matchCount, matchIndex, error, readOnly, onNavigate, onAccept, onReplace, onReplaceAll, onClose }) {
  const inputRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, [focusRequest]);
  useEffect(() => {
    if (!showOptions) return undefined;
    const dismiss = (event) => { if (!event.target.closest('.editor-search__options, button[aria-label="Options de recherche"]')) setShowOptions(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [showOptions]);
  return <div className={`editor-search-shell ${closing ? 'is-closing' : ''}`} inert={closing || undefined}><div className="editor-search__reveal"><div className="editor-search" onKeyDown={(event) => {
    if (event.key === 'Escape') { event.stopPropagation(); showOptions ? setShowOptions(false) : onClose(); }
    if (event.target === inputRef.current && ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) { event.preventDefault(); if (event.key === 'Enter') onAccept(); else onNavigate(event.key === 'ArrowUp' ? -1 : 1); }
  }}>
    <div className={`editor-search__entry ${error ? 'is-error' : ''}`}><Search size={16} /><input ref={inputRef} value={query} aria-label="Rechercher dans le document" placeholder="Rechercher" onChange={(event) => onQuery(event.target.value)} /><span role="status">{error ? '!' : query ? matchCount ? `${matchIndex + 1}/${matchCount}` : '0/0' : ''}</span></div>
    <div className="editor-search__arrows"><button aria-label="Résultat précédent" onMouseDown={(event) => event.preventDefault()} onClick={() => onNavigate(-1)} disabled={!matchCount}><ArrowUp size={17} /></button><button aria-label="Résultat suivant" onMouseDown={(event) => event.preventDefault()} onClick={() => onNavigate(1)} disabled={!matchCount}><ArrowDown size={17} /></button></div>
    <button aria-label="Rechercher et remplacer" aria-pressed={replaceMode} onClick={() => onReplaceMode(!replaceMode)}><Replace size={17} /></button>
    <button aria-label="Options de recherche" aria-expanded={showOptions} onClick={() => setShowOptions(!showOptions)}><Settings2 size={17} /></button>
    <button aria-label="Fermer la recherche" onClick={onClose}><X size={16} /></button>
    {replaceMode && <><div className="editor-search__replacement"><Replace size={16} /><input value={replacement} onChange={(event) => onReplacement(event.target.value)} aria-label="Remplacer par" placeholder="Remplacer" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onReplace(); } }} /></div><button className="editor-search__replace" disabled={readOnly || !matchCount} onClick={onReplace}>Remplacer</button><button className="editor-search__replace-all" disabled={readOnly || !matchCount} onClick={onReplaceAll}>Tout remplacer</button></>}
    {error && <p className="editor-search__error" role="alert">{error}</p>}
    {showOptions && <div className="editor-search__options" role="group" aria-label="Options de recherche">{[['regex', 'Expressions régulières'], ['caseSensitive', 'Respecter la casse'], ['wholeWord', 'Mots entiers seulement']].map(([name, label]) => <label key={name}><input type="checkbox" checked={options[name]} onChange={(event) => onOptions({ ...options, [name]: event.target.checked })} />{label}</label>)}</div>}
  </div></div></div>;
}
