import { useEffect, useRef, useState } from 'react';
import { HelpCircle, PackageOpen, Trash2 } from 'lucide-react';
import TopBar from '../components/TopBar/TopBar';
import DesktopDock from './DesktopDock';
import DesktopWindow from './DesktopWindow';
import FileManager from './FileManager';
import TextEditor from './TextEditor';
import VirtualTerminal from './VirtualTerminal';
import AppGrid from './AppGrid';
import { appById, DESKTOP_APPS } from './apps';
import { readFiles } from './virtualFs';
import './DesktopShell.css';
import './FileManager.css';
import './Applications.css';

function TrashApp() {
  const [trash, setTrash] = useState(() => {
    try { return JSON.parse(localStorage.getItem('portfolio.virtual-trash.v1') || '{}'); } catch { return {}; }
  });
  const names = Object.keys(trash).filter((path) => !Object.keys(trash).some((other) => other !== path && other.startsWith(`${path}/`)));
  function emptyTrash() {
    localStorage.removeItem('portfolio.virtual-trash.v1');
    setTrash({});
  }
  return <div className="ubuntu-simple-app ubuntu-trash-app"><Trash2 size={44} /><h2>Corbeille</h2>{names.length ? <><p>{names.length} élément{names.length === 1 ? '' : 's'} dans la corbeille.</p><div className="ubuntu-trash-list">{names.map((path) => <div key={path}>{path.split('/').pop()}</div>)}</div><button className="desktop-action" onClick={emptyTrash}>Vider la corbeille</button></> : <p>La corbeille est vide.</p>}</div>;
}

function SimpleApp({ kind, onOpen }) {
  if (kind === 'help') return <div className="ubuntu-simple-app"><HelpCircle size={44} /><h2>Guide du bureau Ubuntu</h2><p>Tout ce dont vous avez besoin pour commencer.</p><div className="ubuntu-help-topics"><article><h3>Fichiers et dossiers</h3><p>Ouvrez vos documents par double-clic. Utilisez le clic droit pour les copier, les renommer ou les déplacer.</p></article><article><h3>Terminal</h3><p>Ouvrez le terminal avec Ctrl+Alt+T. Tapez help pour afficher les commandes disponibles et Ctrl+Maj+T pour créer un onglet.</p></article><article><h3>Éditeur de texte</h3><p>Créez vos notes, recherchez du texte avec Ctrl+F et enregistrez avec Ctrl+S.</p></article><article><h3>Fenêtres</h3><p>Déplacez une fenêtre par sa barre supérieure. Double-cliquez sur cette barre pour la maximiser.</p></article></div><button className="desktop-action" onClick={() => window.open('https://help.ubuntu.com/', '_blank', 'noopener,noreferrer')}>Documentation Ubuntu</button></div>;
  if (kind === 'store') return <div className="ubuntu-simple-app"><PackageOpen size={44} /><h2>Applications installées</h2><p>Retrouvez les applications de votre bureau.</p>{DESKTOP_APPS.filter((app) => app.id !== 'store').map((app) => <div className="ubuntu-store-card" key={app.id}><img src={app.icon} alt="" /><div><strong>{app.name}</strong><small>Installé</small></div><button onClick={() => onOpen(app.id)}>Ouvrir</button></div>)}</div>;
  return <TrashApp />;
}

export default function DesktopShell() {
  const [files, setFiles] = useState(readFiles);
  const [windows, setWindows] = useState([]);
  const [activeApp, setActiveApp] = useState(null);
  const [showApps, setShowApps] = useState(false);
  const zIndex = useRef(10);

  function focusApp(id, reason) {
    if (reason === 'minimize') {
      setWindows((current) => current.map((window) => window.id === id ? { ...window, minimized: true } : window));
      return;
    }
    zIndex.current += 1;
    setActiveApp(id);
    setWindows((current) => current.map((window) => window.id === id ? { ...window, minimized: false, zIndex: zIndex.current } : window));
  }

  function openApp(id, payload = {}) {
    setShowApps(false);
    const existing = windows.find((window) => window.id === id);
    if (existing) {
      zIndex.current += 1;
      setActiveApp(id);
      setWindows((current) => current.map((window) => window.id === id ? { ...window, ...payload, minimized: false, zIndex: zIndex.current } : window));
      return;
    }
    zIndex.current += 1;
    setActiveApp(id);
    setWindows((current) => [...current, { id, ...payload, minimized: false, zIndex: zIndex.current, initialPosition: { x: 92 + current.length * 28, y: 76 + current.length * 22 } }]);
  }

  function closeApp(id) {
    setWindows((current) => current.filter((window) => window.id !== id));
    setActiveApp((current) => current === id ? null : current);
  }

  useEffect(() => {
    function handleShortcuts(event) {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 't') { event.preventDefault(); openApp('terminal'); }
      if (event.key === 'Escape' && showApps) setShowApps(false);
    }
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  // Keyboard shortcuts intentionally use the current window action.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showApps, windows]);

  return <div className="desktop-shell">
    <TopBar appName="" workspaceCount={2} />
    <DesktopDock openApps={windows.filter((window) => !window.minimized).map((window) => window.id)} activeApp={activeApp} onOpen={openApp} onShowApps={() => setShowApps((value) => !value)} />
    <main className="desktop-shell__workspace" aria-label="Espace de travail">
      {windows.map((window) => {
        const app = appById(window.id);
        const title = window.id === 'trash' ? 'Corbeille' : app?.name || 'Application';
        const icon = app?.icon || '/ubuntu-apps/trash.png';
        let content;
        if (window.id === 'terminal') content = <VirtualTerminal files={files} setFiles={setFiles} onClose={() => closeApp('terminal')} onOpenFile={(path) => openApp('editor', { filePath: path })} />;
        else if (window.id === 'files') content = <FileManager files={files} setFiles={setFiles} onOpenFile={(path) => openApp('editor', { filePath: path })} />;
        else if (window.id === 'editor') content = <TextEditor key={window.filePath || 'default'} files={files} filePath={window.filePath} setFiles={setFiles} />;
        else content = <SimpleApp kind={window.id} onOpen={openApp} />;
        return <DesktopWindow key={window.id} appId={window.id} title={title} icon={icon} initialPosition={window.initialPosition} minimized={window.minimized} zIndex={window.zIndex || 10} onFocus={(reason) => focusApp(window.id, reason)} onClose={() => closeApp(window.id)}>{content}</DesktopWindow>;
      })}
    </main>
    {showApps && <AppGrid onOpen={openApp} onClose={() => setShowApps(false)} />}
  </div>;
}
