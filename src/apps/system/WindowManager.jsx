import { useEffect, useRef, useState } from 'react';
import { Download, FolderOpen, HardDrive, Keyboard, Layers, Pin, Trash2, Upload } from 'lucide-react';
import { appById } from '../../config/apps';
import { exportVisitorFiles, importVisitorFiles, inspectStorage } from '../../shared/filesystem/storageStats';
import { displayPath, emptyTrash, readTrash, ROOT, TRASH_CHANGE_EVENT, writeFiles } from '../../shared/filesystem/virtualFs';
import './WindowManager.css';

const SYSTEM_SHORTCUTS = [
  { id: 'quick-launch', category: 'Système & Recherche', keys: 'Alt + F2', label: 'Lancement rapide et calculatrice express', actionLabel: 'Ouvrir' },
  { id: 'overview', category: 'Système & Recherche', keys: 'Super / Super + S', label: 'Vue d’ensemble des activités et bureaux', actionLabel: 'Afficher' },
  { id: 'app-grid', category: 'Système & Recherche', keys: 'Super + A', label: 'Grille de toutes les applications', actionLabel: 'Afficher' },
  { id: 'show-desktop', category: 'Système & Recherche', keys: 'Super + D', label: 'Afficher le bureau ou restaurer les fenêtres', actionLabel: 'Basculer' },
  { id: 'lock-session', category: 'Système & Recherche', keys: 'Super + L', label: 'Verrouiller la session IbrahimOS', actionLabel: 'Verrouiller' },
  { id: 'tile-left', category: 'Gestion des fenêtres', keys: 'Super + ← / →', label: 'Ancrer la fenêtre active à gauche ou à droite', actionLabel: null },
  { id: 'maximize', category: 'Gestion des fenêtres', keys: 'Alt + F10 / Super + ↑', label: 'Agrandir ou restaurer la fenêtre active', actionLabel: null },
  { id: 'minimize', category: 'Gestion des fenêtres', keys: 'Alt + F9 / Super + H', label: 'Masquer la fenêtre active dans le dock', actionLabel: null },
  { id: 'window-menu', category: 'Gestion des fenêtres', keys: 'Alt + Espace', label: 'Ouvrir le menu d’actions de la fenêtre active', actionLabel: null },
  { id: 'workspace-switch', category: 'Bureaux virtuels', keys: 'Ctrl + Alt + ← / →', label: 'Passer au bureau virtuel précédent ou suivant', actionLabel: 'Bureau suivant' },
  { id: 'open-terminal', category: 'Applications', keys: 'Ctrl + Alt + T', label: 'Ouvrir le Terminal Ptyxis', actionLabel: 'Ouvrir' },
  { id: 'open-files', category: 'Applications', keys: 'Super + E', label: 'Ouvrir le gestionnaire de fichiers', actionLabel: 'Ouvrir' },
  { id: 'open-calculator', category: 'Applications', keys: 'Ctrl + Alt + C', label: 'Ouvrir la Calculatrice', actionLabel: 'Ouvrir' },
  { id: 'open-clock', category: 'Applications', keys: 'Ctrl + Alt + H', label: 'Ouvrir l’Horloge (minuteur & chronomètre)', actionLabel: 'Ouvrir' },
];

export default function WindowManager({
  windows,
  workspaceCount,
  files = {},
  setFiles,
  initialTab = 'windows',
  navigationRequest = 0,
  onFocus,
  onMinimize,
  onClose,
  onMove,
  onToggleSticky,
  onOpenApp,
  onOpenFile,
  onSystemCommand,
  onNotify,
}) {
  const [tab, setTab] = useState(initialTab || 'windows');
  const [previousRequest, setPreviousRequest] = useState(navigationRequest);
  const [query, setQuery] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [shortcutQuery, setShortcutQuery] = useState('');
  const [trash, setTrash] = useState(readTrash);
  const [storageStatus, setStorageStatus] = useState('');
  const importRef = useRef(null);

  if (previousRequest !== navigationRequest) {
    setPreviousRequest(navigationRequest);
    if (initialTab) setTab(initialTab);
  }

  useEffect(() => {
    const syncTrash = () => setTrash(readTrash());
    window.addEventListener(TRASH_CHANGE_EVENT, syncTrash);
    return () => window.removeEventListener(TRASH_CHANGE_EVENT, syncTrash);
  }, []);

  const matching = windows.filter((item) => {
    if (workspaceFilter !== 'all' && !item.onAllWorkspaces && item.workspace !== Number(workspaceFilter)) return false;
    return `${appById(item.appId)?.name || 'Corbeille'} ${item.filePath || ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim());
  });

  const minimizedWindows = windows.filter((item) => item.minimized);
  const stats = inspectStorage(files, trash);
  const matchingShortcuts = SYSTEM_SHORTCUTS.filter((item) => `${item.category} ${item.keys} ${item.label}`.toLocaleLowerCase().includes(shortcutQuery.toLocaleLowerCase().trim()));

  function handleExportBackup() {
    const payload = exportVisitorFiles(files);
    const count = Object.keys(payload.files).length;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ibrahimos-fichiers.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const msg = count
      ? `${count} élément${count > 1 ? 's' : ''} personnel${count > 1 ? 's' : ''} exporté${count > 1 ? 's' : ''}.`
      : 'Sauvegarde exportée (aucun fichier personnel créé pour le moment).';
    setStorageStatus(msg);
    onNotify?.(msg);
  }

  async function handleImportBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const restored = importVisitorFiles(files, text);
      if (setFiles) setFiles(writeFiles(restored.files));
      const msg = `${restored.importedCount} élément${restored.importedCount !== 1 ? 's' : ''} importé${restored.importedCount !== 1 ? 's' : ''} dans le système de fichiers.`;
      setStorageStatus(msg);
      onNotify?.(msg);
    } catch (error) {
      const msg = error.message || 'Impossible de lire cette sauvegarde JSON.';
      setStorageStatus(msg);
      onNotify?.(msg);
    }
  }

  function handleEmptyTrash() {
    emptyTrash();
    setTrash({});
    const msg = 'Corbeille vidée.';
    setStorageStatus(msg);
    onNotify?.(msg);
  }

  return <section className="window-manager" aria-labelledby="window-manager-title">
    <header className="window-manager__header">
      <div>
        <h1 id="window-manager-title">Fenêtres ouvertes</h1>
        <p>Retrouvez vos applications, inspectez le stockage virtuel et consultez les raccourcis d’IbrahimOS.</p>
        <small>Cette liste concerne uniquement IbrahimOS, pas les programmes de votre ordinateur.</small>
      </div>
      <nav className="window-manager__tabs" aria-label="Rubriques du gestionnaire système">
        <button type="button" aria-pressed={tab === 'windows'} onClick={() => setTab('windows')}><Layers size={16} />Fenêtres ({windows.length})</button>
        <button type="button" aria-pressed={tab === 'storage'} onClick={() => setTab('storage')}><HardDrive size={16} />Stockage ({stats.totalSizeLabel})</button>
        <button type="button" aria-pressed={tab === 'shortcuts'} onClick={() => setTab('shortcuts')}><Keyboard size={16} />Raccourcis</button>
      </nav>
    </header>

    {tab === 'windows' && <>
      <div className="window-manager__toolbar">
        <label className="window-manager__search">Rechercher une fenêtre<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom d’application ou de fichier" /></label>
        <label className="window-manager__filter">Filtrer par bureau
          <select value={workspaceFilter} onChange={(event) => setWorkspaceFilter(event.target.value)}>
            <option value="all">Tous les bureaux ({workspaceCount})</option>
            {Array.from({ length: workspaceCount }, (_, index) => <option key={index} value={String(index)}>Bureau {index + 1}</option>)}
          </select>
        </label>
      </div>
      <div className="window-manager__summary-bar">
        <p role="status">{matching.length} fenêtre{matching.length !== 1 ? 's' : ''} · {workspaceCount} bureaux</p>
        {minimizedWindows.length > 0 && (
          <button type="button" className="window-manager__secondary-btn" onClick={() => minimizedWindows.forEach((item) => onClose(item.id))}>
            Fermer les fenêtres réduites ({minimizedWindows.length})
          </button>
        )}
      </div>
      <div className="window-manager__list">{matching.map((item) => {
        const app = appById(item.appId);
        const name = app?.name || 'Corbeille';
        return <article key={item.id} aria-label={`${name} — ${item.onAllWorkspaces ? 'Tous les bureaux' : `Bureau ${item.workspace + 1}`}`}>
          <div className="window-manager__identity"><img src={app?.icon || '/ubuntu-apps/trash.png'} alt="" /><div><h2>{name}</h2>{item.filePath && <p>{item.filePath.split('/').at(-1)}</p>}<small>{item.minimized ? 'Réduite' : 'Ouverte'}{item.alwaysOnTop ? ' · Toujours au-dessus' : ''}{item.onAllWorkspaces ? ' · Tous les bureaux' : ''}</small></div></div>
          <label>Bureau<select aria-label={`Bureau de ${name}`} disabled={Boolean(item.onAllWorkspaces)} value={item.workspace} onChange={(event) => onMove(item.id, Number(event.target.value))}>{Array.from({ length: workspaceCount }, (_, index) => <option key={index} value={index}>Bureau {index + 1}</option>)}</select></label>
          <div className="window-manager__actions">
            <button onClick={() => onFocus(item.id)}>{item.minimized ? 'Restaurer' : 'Afficher'}</button>
            <button disabled={item.minimized} onClick={() => onMinimize(item.id)}>Réduire</button>
            {onToggleSticky && <button aria-pressed={Boolean(item.onAllWorkspaces)} onClick={() => onToggleSticky(item.id)}><Pin size={14} />{item.onAllWorkspaces ? 'Bureau fixe' : 'Tous les bureaux'}</button>}
            <button onClick={() => onClose(item.id)}>Fermer</button>
          </div>
        </article>;
      })}{!matching.length && <p>{query.trim() ? `Aucune fenêtre ne correspond à « ${query} ».` : 'Aucune fenêtre ouverte sur ce filtre.'}</p>}</div>
    </>}

    {tab === 'storage' && <div className="window-manager__storage" role="region" aria-label="Inspection du stockage virtuel">
      <div className="window-manager__cards">
        <div className="window-manager__stat-card">
          <small>ESPACE VIRTUEL TOTAL</small>
          <strong>{stats.totalSizeLabel}</strong>
          <span>{stats.totalFiles} fichiers · {stats.totalFolders} dossiers</span>
        </div>
        <div className="window-manager__stat-card">
          <small>PORTFOLIO PROTÉGÉ</small>
          <strong>{stats.protectedCount} fichiers</strong>
          <span>Lecture garantie · Non supprimables</span>
        </div>
        <div className="window-manager__stat-card">
          <small>VOS CRÉATIONS</small>
          <strong>{stats.visitorCount} élément{stats.visitorCount !== 1 ? 's' : ''}</strong>
          <span>{stats.visitorSizeLabel} modifiables</span>
        </div>
        <div className="window-manager__stat-card">
          <small>CORBEILLE</small>
          <strong>{stats.trashCount} élément{stats.trashCount !== 1 ? 's' : ''}</strong>
          <span>{stats.trashSizeLabel} récupérables</span>
        </div>
      </div>

      <div className="window-manager__backup-bar">
        <button type="button" onClick={handleExportBackup}><Download size={16} />Exporter mes créations (.json)</button>
        <button type="button" onClick={() => importRef.current?.click()}><Upload size={16} />Importer une sauvegarde (.json)</button>
        <button type="button" disabled={!stats.trashCount} onClick={handleEmptyTrash}><Trash2 size={16} />Vider la corbeille</button>
        {onOpenApp && <button type="button" onClick={() => onOpenApp('files', { directory: ROOT })}><FolderOpen size={16} />Ouvrir Fichiers</button>}
        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={handleImportBackup} />
      </div>
      {storageStatus && <p className="window-manager__status" role="status">{storageStatus}</p>}

      <section className="window-manager__panel" aria-label="Répartition par type">
        <h2>Répartition du système de fichiers</h2>
        <div className="window-manager__categories">
          {stats.categories.map((cat) => (
            <div key={cat.id} className="window-manager__category-row">
              <div className="window-manager__category-head">
                <strong>{cat.label}</strong>
                <span>{cat.count} élément{cat.count !== 1 ? 's' : ''} · {cat.sizeLabel}</span>
              </div>
              <div className="window-manager__progress" aria-hidden="true">
                <span style={{ width: `${cat.bytes > 0 ? Math.max(4, cat.share) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="window-manager__panel" aria-label="Fichiers principaux">
        <h2>Fichiers les plus volumineux</h2>
        <div className="window-manager__list">
          {stats.largestFiles.map((file) => (
            <article key={file.path} className="window-manager__file-item">
              <div className="window-manager__identity">
                <img src={file.icon} alt="" />
                <div>
                  <h3>{file.name}</h3>
                  <small>{file.type} · {displayPath(file.path)} · {file.protected ? 'Protégé' : 'Personnel'}</small>
                </div>
              </div>
              <strong className="window-manager__file-size">{file.sizeLabel}</strong>
              <div className="window-manager__actions">
                {onOpenFile && <button type="button" onClick={() => onOpenFile(file.path)}>Ouvrir</button>}
                {onOpenApp && <button type="button" onClick={() => onOpenApp('files', { directory: file.path.slice(0, file.path.lastIndexOf('/')) || ROOT })}>Afficher le dossier</button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>}

    {tab === 'shortcuts' && <div className="window-manager__shortcuts" role="region" aria-label="Raccourcis clavier du système">
      <label className="window-manager__search">Filtrer les raccourcis<input type="search" value={shortcutQuery} onChange={(event) => setShortcutQuery(event.target.value)} placeholder="Ex. Super, Terminal, Bureau, F2…" /></label>
      <div className="window-manager__list">
        {matchingShortcuts.map((item) => (
          <article key={item.id} className="window-manager__shortcut-item">
            <div>
              <small>{item.category}</small>
              <h2>{item.label}</h2>
            </div>
            <div className="window-manager__shortcut-right">
              <kbd>{item.keys}</kbd>
              {item.actionLabel && onSystemCommand && (
                <button type="button" onClick={() => onSystemCommand(item.id)}>{item.actionLabel}</button>
              )}
            </div>
          </article>
        ))}
        {!matchingShortcuts.length && <p>Aucun raccourci ne correspond à « {shortcutQuery} ».</p>}
      </div>
    </div>}
  </section>;
}
