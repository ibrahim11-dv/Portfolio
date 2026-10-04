import { Grid2X2 } from 'lucide-react';
import { DOCK_APPS, appById } from './apps';
import './DesktopDock.css';

export default function DesktopDock({ openApps, activeApp, onOpen, onShowApps }) {
  return (
    <aside className="ubuntu-dock" aria-label="Applications favorites">
      <div className="ubuntu-dock__apps">
        {DOCK_APPS.map((id) => {
          const app = appById(id);
          const isOpen = openApps.includes(id);
          return <button key={id} className={`ubuntu-dock__item ${activeApp === id ? 'is-active' : ''}`} title={app.name}
            aria-label={`${app.name}${isOpen ? ' · ouvert' : ''}`} aria-pressed={activeApp === id} onClick={() => onOpen(id)}>
            <span className="ubuntu-dock__icon"><img src={app.icon} alt="" /></span>
            {isOpen && <span className="ubuntu-dock__running" aria-hidden="true" />}
          </button>;
        })}
      </div>
      <div className="ubuntu-dock__bottom">
        <button className="ubuntu-dock__item" title="Afficher les applications" aria-label="Afficher les applications" onClick={onShowApps}>
          <span className="ubuntu-dock__icon ubuntu-dock__icon--grid"><Grid2X2 size={22} strokeWidth={1.7} /></span>
        </button>
        <span className="ubuntu-dock__separator" />
        <button className="ubuntu-dock__item ubuntu-dock__trash" title="Corbeille" aria-label="Corbeille" onClick={() => onOpen('trash')}>
          <span className="ubuntu-dock__icon"><img src="/ubuntu-apps/trash.png" alt="" /></span>
        </button>
      </div>
    </aside>
  );
}
