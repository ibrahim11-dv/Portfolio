import { useLayoutEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { quickLaunchResults } from './quickLaunch';
import './QuickLauncher.css';

const SCOPES = [['all', 'Tout'], ['apps', 'Applications'], ['windows', 'Fenêtres'], ['files', 'Fichiers'], ['recent', 'Récents'], ['actions', 'Actions']];

export default function QuickLauncher({ windows, files, recent, commands, onOpen, onOpenPath, onCommand, onClearRecent, onFocus, onClose }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const origin = useRef(document.activeElement);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const results = quickLaunchResults(query, windows, { files, recent, scope, commands });
  useLayoutEffect(() => { dialog.current.showModal(); input.current.focus(); }, []);
  function dismiss() {
    onClose();
    requestAnimationFrame(() => { if (origin.current?.isConnected) origin.current.focus({ preventScroll: true }); });
  }
  function launch(item) {
    onClose();
    if (item.windowId) onFocus(item.windowId);
    else if (item.path) onOpenPath(item.path);
    else if (item.command) onCommand(item.command);
    else onOpen(item.appId);
  }
  function keys(event) {
    event.stopPropagation();
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const choices = [...dialog.current.querySelectorAll('[data-launch-result]')];
    const position = choices.indexOf(document.activeElement);
    if (event.key === 'ArrowUp' && position <= 0) input.current.focus();
    else choices[Math.min(choices.length - 1, position + (event.key === 'ArrowDown' ? 1 : -1))]?.focus();
  }
  return <dialog ref={dialog} className="quick-launcher" aria-labelledby="quick-launch-title" onCancel={(event) => { event.preventDefault(); dismiss(); }} onKeyDown={keys} onKeyUp={(event) => event.stopPropagation()}>
    <header><h2 id="quick-launch-title">Lancement rapide</h2><button onClick={dismiss} aria-label="Fermer le lancement rapide"><X size={20} /></button></header>
    <label className="quick-launcher__search"><Search size={20} aria-hidden="true" /><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) { event.preventDefault(); launch(results[0]); } }} placeholder="Application, fichier, dossier…" aria-label="Rechercher dans IbrahimOS" /></label>
    <div className="quick-launcher__filters" role="group" aria-label="Rechercher dans">{SCOPES.map(([id, label]) => <button key={id} aria-pressed={scope === id} onClick={() => setScope(id)}>{label}</button>)}</div>
    <p>{scope === 'recent' ? 'Documents ouverts pendant cette session uniquement.' : 'Recherche par nom et chemin dans IbrahimOS, sans accéder aux fichiers de votre ordinateur.'}</p>
    {scope === 'recent' && recent.length > 0 && <button className="quick-launcher__clear" onClick={() => { onClearRecent(); input.current.focus(); }}>Effacer les documents récents</button>}
    <p>Entrée pour ouvrir · ↑ ↓ pour choisir · Échap pour fermer</p>
    <span role="status">{results.length} résultat{results.length !== 1 ? 's' : ''}</span>
    <div className="quick-launcher__results">{results.map((item) => <button key={item.id} data-launch-result onClick={() => launch(item)}><img src={item.icon} alt="" /><span><strong>{item.name}</strong><small>{item.detail}</small></span></button>)}{!results.length && <p>{query.trim() ? `Aucun résultat pour « ${query} » dans ${SCOPES.find(([id]) => id === scope)[1].toLocaleLowerCase()}.` : scope === 'recent' ? 'Aucun document récent. Ouvrez un fichier ou le CV pour le retrouver ici.' : 'Aucun élément à afficher.'}</p>}</div>
  </dialog>;
}
