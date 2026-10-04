import { useState } from 'react';
import { Search } from 'lucide-react';
import { DESKTOP_APPS } from './apps';
import './AppGrid.css';

export default function AppGrid({ onOpen, onClose }) {
  const [query, setQuery] = useState('');
  const apps = DESKTOP_APPS.filter((app) => app.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <div className="ubuntu-overview" role="dialog" aria-label="Applications" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="ubuntu-overview__panel"><div className="ubuntu-overview__search"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" aria-label="Rechercher une application" /></div><div className="ubuntu-overview__grid">{apps.map((app) => <button key={app.id} className="ubuntu-overview__app" onClick={() => onOpen(app.id)}><img src={app.icon} alt="" /><span>{app.name}</span></button>)}</div>{!apps.length && <p className="ubuntu-overview__empty">Aucune application trouvée</p>}</div>
  </div>;
}
