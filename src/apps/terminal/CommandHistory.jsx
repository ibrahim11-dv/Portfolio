import { useEffect, useRef, useState } from 'react';

export default function CommandHistory({ history, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const input = useRef(null);
  useEffect(() => { input.current?.focus(); }, []);
  const results = history.filter((command) => command.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <section className="terminal-history" aria-label="Historique des commandes" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
  }}>
    <header><strong>Historique des commandes</strong><button onClick={onClose} aria-label="Fermer l’historique">Fermer</button></header>
    <input ref={input} type="search" aria-label="Rechercher une commande" placeholder="Rechercher une commande…" value={query} onChange={(event) => setQuery(event.target.value)} />
    <p>Choisissez une commande pour la modifier avant de l’exécuter.</p>
    <small role="status">{results.length} résultat{results.length === 1 ? '' : 's'}</small>
    <div className="terminal-history__results">{results.map((command) => <button key={command} onClick={() => onSelect(command)}>{command}</button>)}</div>
    {!results.length && <p>{history.length ? 'Aucune commande ne correspond à cette recherche.' : 'Les commandes de cet onglet apparaîtront ici.'}</p>}
  </section>;
}
