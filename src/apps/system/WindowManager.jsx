import { useState } from 'react';
import { appById } from '../../config/apps';
import './WindowManager.css';

export default function WindowManager({ windows, workspaceCount, onFocus, onMinimize, onClose, onMove }) {
  const [query, setQuery] = useState('');
  const matching = windows.filter((item) => `${appById(item.appId)?.name || 'Corbeille'} ${item.filePath || ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
  return <section className="window-manager" aria-labelledby="window-manager-title">
    <header><h1 id="window-manager-title">Fenêtres ouvertes</h1><p>Retrouvez vos applications et organisez-les entre les bureaux.</p><small>Cette liste concerne uniquement IbrahimOS, pas les programmes de votre ordinateur.</small></header>
    <label>Rechercher une fenêtre<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom d’application ou de fichier" /></label>
    <p role="status">{matching.length} fenêtre{matching.length !== 1 ? 's' : ''} · {workspaceCount} bureaux</p>
    <div className="window-manager__list">{matching.map((item) => {
      const app = appById(item.appId);
      const name = app?.name || 'Corbeille';
      return <article key={item.id} aria-label={`${name} — Bureau ${item.workspace + 1}`}>
        <div className="window-manager__identity"><img src={app?.icon || '/ubuntu-apps/trash.png'} alt="" /><div><h2>{name}</h2>{item.filePath && <p>{item.filePath.split('/').at(-1)}</p>}<small>{item.minimized ? 'Réduite' : 'Ouverte'}{item.alwaysOnTop ? ' · Toujours au-dessus' : ''}</small></div></div>
        <label>Bureau<select aria-label={`Bureau de ${name}`} value={item.workspace} onChange={(event) => onMove(item.id, Number(event.target.value))}>{Array.from({ length: workspaceCount }, (_, index) => <option key={index} value={index}>Bureau {index + 1}</option>)}</select></label>
        <div className="window-manager__actions"><button onClick={() => onFocus(item.id)}>{item.minimized ? 'Restaurer' : 'Afficher'}</button><button disabled={item.minimized} onClick={() => onMinimize(item.id)}>Réduire</button><button onClick={() => onClose(item.id)}>Fermer</button></div>
      </article>;
    })}{!matching.length && <p>Aucune fenêtre ne correspond à « {query} ».</p>}</div>
  </section>;
}
