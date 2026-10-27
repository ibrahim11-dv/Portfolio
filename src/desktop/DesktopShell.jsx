import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { HelpCircle, PackageOpen } from 'lucide-react';
import AppearanceApp from './AppearanceApp';
import TopBar from '../components/TopBar/TopBar';
import DesktopDock from './DesktopDock';
import DesktopWindow from './DesktopWindow';
import FileManager from './FileManager';
import TextEditor from './TextEditor';
import ImageViewer from './ImageViewer';
import { readImage } from './imageFiles';
import { createDocument } from './editorDocument';
import VirtualTerminal from './VirtualTerminal';
import AppGrid from './AppGrid';
import PortfolioApp from './PortfolioApp';
import DesktopItems from './DesktopItems';
import DesktopIntroduction from './DesktopIntroduction';
import WindowOverview from './WindowOverview';
import WorkspaceTransition from './WorkspaceTransition';
import { CV_DOCUMENT, PROFILE, PROJECTS } from './portfolioData';
import { appById, DESKTOP_APPS, readAppShortcut, PORTFOLIO_APP_IDS, resolveAppId } from './apps';
import { canDeletePath, readFiles, ROOT, trashPaths, uniquePath, writeFiles } from './virtualFs';
import './DesktopShell.css';
import './FileManager.css';
import './Applications.css';
import { findReusableWindow, shouldStartMaximized } from './recruiterJourney';
import { completeIntroduction, initialIntroductionState, transitionIntroduction } from './introJourney';
import { projectIdFromSearch, searchWithProject } from './projectRoute';

const DocumentViewer = lazy(() => import('./DocumentViewer'));

function SimpleApp({ kind, onOpen, onReplayIntroduction }) {
  if (kind === 'help') return <div className="ubuntu-simple-app"><HelpCircle size={44} /><h2>Guide du bureau IbrahimOS</h2><p>Tout ce dont vous avez besoin pour commencer.</p><div className="ubuntu-help-topics"><article><h3>Fichiers et dossiers</h3><p>Cliquez dans un espace vide du bureau pour créer un document ou un dossier. Ouvrez-le par double-clic, renommez-le avec F2 et supprimez-le avec Suppr. Les éléments du portfolio sont protégés.</p></article><article><h3>Terminal</h3><p>Ouvrez le terminal avec Ctrl+Alt+T. Tapez help pour afficher les commandes disponibles et Ctrl+Maj+T pour créer un onglet.</p></article><article><h3>Corbeille</h3><p>Vos créations supprimées vont dans la corbeille. Vous pouvez les restaurer à leur emplacement d’origine ou vider la corbeille.</p></article><article><h3>Fenêtres</h3><p>Utilisez le bouton d’agrandissement ou double-cliquez sur la barre supérieure. Déplacez la fenêtre vers un bord pour l’ancrer et tirez ses bords pour la redimensionner. Le dock permet de réduire et rouvrir les applications.</p></article></div><div className="ubuntu-help-actions"><button className="desktop-action" onClick={(event) => onReplayIntroduction?.(event.currentTarget)}>Revoir l’accueil et la visite</button><button className="desktop-action" onClick={() => window.open('https://help.ubuntu.com/', '_blank', 'noopener,noreferrer')}>Documentation Ubuntu</button></div></div>;
  if (kind === 'store') return <div className="ubuntu-simple-app"><PackageOpen size={44} /><h2>Applications installées</h2><p>Retrouvez les applications de votre bureau.</p>{DESKTOP_APPS.filter((app) => app.id !== 'store').map((app) => <div className="ubuntu-store-card" key={app.id}><img src={app.icon} alt="" /><div><strong>{app.name}</strong><small>Installé</small></div><button onClick={() => onOpen(app.id)}>Ouvrir</button></div>)}</div>;
  return null;
}

function frontWindow(windows, excluding, workspace) {
  return windows.filter((item) => !item.minimized && item.id !== excluding && (workspace === undefined || item.workspace === workspace)).sort((a, b) => Number(Boolean(b.alwaysOnTop)) - Number(Boolean(a.alwaysOnTop)) || b.zIndex - a.zIndex)[0]?.id || null;
}

export default function DesktopShell() {
  const initialProjectRoute = projectIdFromSearch(window.location.search, PROJECTS.map((project) => project.id));
  const [files, setFiles] = useState(readFiles);
  const [windows, setWindows] = useState(() => initialProjectRoute ? [{
    id: 'projects',
    appId: 'projects',
    projectId: initialProjectRoute,
    workspace: 0,
    navigationRequest: 11,
    initialMaximized: true,
    initialPosition: { x: 92, y: 44 },
    minimized: false,
    zIndex: 11,
  }] : []);
  const [activeApp, setActiveApp] = useState(() => initialProjectRoute ? 'projects' : null);
  const [showApps, setShowApps] = useState(false);
  const [switcher, setSwitcher] = useState(null);
  const [workspace, setWorkspace] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState(null);
  const [desktopNotice, updateDesktopNotice] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [quiet, setQuiet] = useState(false);
  const setDesktopNotice = useCallback((text) => {
    updateDesktopNotice(text);
    if (text) setNotifications(current => [{ id: Math.max(Date.now(), (current[0]?.id || 0) + 1), text }, ...current].slice(0, 30));
  }, []);
  const [introduction, setIntroduction] = useState(() => initialProjectRoute ? { phase: 'done', step: 0 } : initialIntroductionState());
  const zIndex = useRef(initialProjectRoute ? 11 : 10);
  const nextInstance = useRef(1);
  const pendingLaunches = useRef(new Map());
  const cvOrigin = useRef(null);
  const [appSessions, setAppSessions] = useState(() => Object.fromEntries(PORTFOLIO_APP_IDS.map((id) => [id, {}])));
  const saveAppSession = useCallback((id, state) => setAppSessions((current) => current[id] === state ? current : { ...current, [id]: state }), []);
  const [cvBackLabel, setCVBackLabel] = useState('Retour au portfolio');
  const [cvReadingState, setCVReadingState] = useState(null);
  const metaChord = useRef(false);
  const hiddenByDesktop = useRef({});
  const workspaceTransition = useRef(null);
  const introductionTrigger = useRef(null);
  const workspaceCount = Math.max(2, workspace + 1, ...windows.map((item) => item.workspace + 2));
  if (activeApp && !windows.some((item) => item.id === activeApp)) setActiveApp(frontWindow(windows, null, workspace));

  useEffect(() => {
    if (workspaceNotice === null) return undefined;
    const timer = setTimeout(() => setWorkspaceNotice(null), 900);
    return () => clearTimeout(timer);
  }, [workspaceNotice]);
  useEffect(() => {
    if (!desktopNotice) return undefined;
    const timer = setTimeout(() => setDesktopNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [desktopNotice, setDesktopNotice]);

  function switchWorkspace(index, movingWindow) {
    const target = Math.max(0, Math.min(workspaceCount - 1, index));
    if (target === workspace) return;
    if (!showOverview && !showApps) workspaceTransition.current?.start({ from: workspace, to: target, windows, movingWindow });
    setWorkspace(target);
    setActiveApp(frontWindow(windows, null, target));
    setWorkspaceNotice(target);
    setSwitcher(null);
  }

  function moveWindowToWorkspace(id, index) {
    const target = Math.max(0, Math.min(workspaceCount - 1, index));
    setWindows((current) => current.map((item) => item.id === id ? { ...item, workspace: target } : item));
    if (activeApp === id && target !== workspace) setActiveApp(frontWindow(windows, id, workspace));
  }

  function focusApp(id, reason) {
    if (reason === 'minimize') {
      setWindows((current) => current.map((window) => window.id === id ? { ...window, minimized: true } : window));
      setActiveApp((current) => current === id ? frontWindow(windows, id, workspace) : current);
      return;
    }
    zIndex.current += 1;
    const layer = zIndex.current;
    const target = windows.find((item) => item.id === id);
    if (target && target.workspace !== workspace) switchWorkspace(target.workspace);
    setShowOverview(false);
    setShowApps(false);
    setActiveApp(id);
    setWindows((current) => current.map((window) => window.id === id ? { ...window, minimized: false, zIndex: layer } : window));
  }

  function openApp(appId, payload = {}) {
    appId = resolveAppId(appId, payload.section);
    setShowApps(false);
    setShowOverview(false);
    setSwitcher(null);
    const { newWindow = false, workspace: requestedWorkspace, ...options } = payload;
    const pendingLaunch = pendingLaunches.current.get(appId);
    const candidates = [...windows.filter((item) => item.appId === appId), ...(pendingLaunch && !windows.some((item) => item.id === pendingLaunch.id) ? [pendingLaunch] : [])].sort((a, b) => b.zIndex - a.zIndex);
    const existing = findReusableWindow(candidates, appId, options.filePath, newWindow && !PORTFOLIO_APP_IDS.includes(appId));
    if (existing) {
      zIndex.current += 1;
      const layer = zIndex.current;
      const navigation = options.directory || PORTFOLIO_APP_IDS.includes(appId) && (options.projectId !== undefined || options.restoreContext) || appId === 'trash' || (appId === 'editor' || appId === 'images') && options.filePath ? { navigationRequest: layer, restoreContext: options.restoreContext || null } : {};
      const targetWorkspace = requestedWorkspace ?? existing.workspace;
      if (targetWorkspace !== workspace) switchWorkspace(targetWorkspace);
      setActiveApp(existing.id);
      setWindows((current) => current.map((item) => item.id === existing.id ? { ...item, ...options, ...navigation, ...(appId === 'editor' && options.filePath ? { editorRequests: [...(item.editorRequests || []), { id: layer, path: options.filePath }].slice(-100) } : {}), workspace: targetWorkspace, minimized: false, zIndex: layer } : item));
      return;
    }
    zIndex.current += 1;
    const layer = zIndex.current;
    const id = candidates.length || windows.some((item) => item.id === appId) ? `${appId}-${nextInstance.current++}` : appId;
    const targetWorkspace = requestedWorkspace ?? workspace;
    if (targetWorkspace !== workspace) switchWorkspace(targetWorkspace);
    setActiveApp(id);
    const created = { id, appId, ...options, workspace: targetWorkspace, navigationRequest: layer, initialMaximized: shouldStartMaximized(appId, windows, targetWorkspace, PORTFOLIO_APP_IDS), ...(appId === 'editor' && options.filePath ? { editorRequests: [{ id: layer, path: options.filePath }] } : {}), minimized: false, zIndex: layer };
    // Coordinate launches issued in one event before React has rendered the first window.
    pendingLaunches.current.set(appId, created);
    queueMicrotask(() => { if (pendingLaunches.current.get(appId)?.id === id) pendingLaunches.current.delete(appId); });
    setWindows((current) => [...current, { ...created, initialPosition: { x: 92 + current.length % 6 * 28, y: 44 + Math.min(current.length * 8, 16) } }]);
  }

  function syncProjectRoute(projectId) {
    const search = searchWithProject(window.location.search, projectId);
    if (search === window.location.search) return;
    window.history.pushState({ projectId: projectId || null }, '', `${window.location.pathname}${search}${window.location.hash}`);
  }

  useEffect(() => {
    function restoreProjectRoute() {
      const projectId = projectIdFromSearch(window.location.search, PROJECTS.map((project) => project.id));
      openApp('projects', { projectId });
    }
    window.addEventListener('popstate', restoreProjectRoute);
    return () => window.removeEventListener('popstate', restoreProjectRoute);
  // The handler needs the latest window state to reuse the active Projets window.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows, workspace]);

  function finishIntroduction({ openPresentation = false } = {}) {
    completeIntroduction();
    const trigger = introductionTrigger.current;
    introductionTrigger.current = null;
    setIntroduction((current) => transitionIntroduction(current, openPresentation ? 'open-presentation' : 'explore'));
    if (openPresentation) { openApp('presentation'); return; }
    requestAnimationFrame(() => (trigger?.isConnected ? trigger : document.querySelector('[data-intro-app="presentation"]'))?.focus({ preventScroll: true }));
  }

  function replayIntroduction(trigger) {
    introductionTrigger.current = trigger || document.activeElement;
    setShowApps(false); setShowOverview(false); setSwitcher(null);
    setIntroduction((current) => transitionIntroduction(current, 'replay'));
  }

  function closeApp(id) {
    setWindows((current) => current.filter((window) => window.id !== id));
    setActiveApp((current) => current === id ? frontWindow(windows, id, workspace) : current);
    setSwitcher(null);
  }

  function openCV(sourceId, trigger, context) {
    const sourceApp = windows.find((item) => item.id === sourceId)?.appId;
    cvOrigin.current = { sourceId, sourceApp, trigger, context };
    setCVBackLabel(sourceApp ? (sourceApp === 'projects' ? 'Retour aux Projets' : 'Retour à ' + appById(sourceApp).name) : 'Retour au bureau');
    openApp('cv');
    setDesktopNotice('CV ouvert dans le lecteur.');
  }
  function returnFromCV() {
    const origin = cvOrigin.current;
    const source = windows.find((item) => item.id === origin?.sourceId);
    const cv = windows.find((item) => item.id === activeApp && item.appId === 'cv');
    if (cv) focusApp(cv.id, 'minimize');
    if (source) {
      focusApp(source.id);
      if (origin.context) {
        const request = ++zIndex.current;
        setWindows((current) => current.map((item) => item.id === source.id ? { ...item, restoreContext: origin.context, navigationRequest: request } : item));
      }
    }
    else if (origin?.sourceApp) openApp(origin.sourceApp, { restoreContext: origin.context });
    requestAnimationFrame(() => { if (origin?.trigger?.isConnected) origin.trigger.focus({ preventScroll: true }); });
  }

  function dockAction(id) {
    const existing = windows.find((item) => item.id === activeApp && item.appId === id);
    if (existing && !existing.minimized) window.dispatchEvent(new CustomEvent('portfolio:window-minimize', { detail: { id: existing.id } }));
    else openApp(id);
  }

  function quitApp(appId) {
    windows.filter((item) => item.appId === appId).forEach((item) => window.dispatchEvent(new CustomEvent('portfolio:window-close', { detail: { id: item.id } })));
  }

  function trashDrop(paths) {
    const allowed = paths.filter((path) => canDeletePath(files, path));
    if (!allowed.length) { setDesktopNotice('Les éléments du portfolio sont protégés.'); return; }
    setFiles(writeFiles(trashPaths(files, allowed)));
    setDesktopNotice(`${allowed.length} élément${allowed.length > 1 ? 's' : ''} déplacé${allowed.length > 1 ? 's' : ''} dans la corbeille.`);
  }

  function openFile(path) {
    const shortcut = readAppShortcut(files[path]);
    if (shortcut) openApp(shortcut.id);
    else if (files[path] === CV_DOCUMENT) openApp('cv', { filePath: path });
    else if (readImage(files[path])) openApp('images', { filePath: path });
    else openApp('editor', { filePath: path });
  }

  useEffect(() => {
    function handleShortcuts(event) {
      if (introduction.phase !== 'done') return;
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Meta') metaChord.current = false;
      else if (event.metaKey) metaChord.current = true;
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 't') { event.preventDefault(); openApp('terminal'); }
      if (event.metaKey && event.key.toLowerCase() === 'e') { event.preventDefault(); openApp('files'); }
      if (event.metaKey && event.key.toLowerCase() === 'a') { event.preventDefault(); setShowOverview(false); setShowApps((value) => !value); }
      if (event.metaKey && ['v', 'l'].includes(event.key.toLowerCase())) { setShowOverview(false); setShowApps(false); setSwitcher(null); }
      if (event.metaKey && event.key.toLowerCase() === 's') { event.preventDefault(); setShowApps(false); setShowOverview((value) => !value); }
      if ((event.metaKey && ['PageUp', 'PageDown'].includes(event.key)) || (event.ctrlKey && event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key))) {
        event.preventDefault();
        const direction = event.key === 'PageUp' || event.key === 'ArrowLeft' ? -1 : 1;
        const target = Math.max(0, Math.min(workspaceCount - 1, workspace + direction));
        if (event.shiftKey && activeApp) {
          moveWindowToWorkspace(activeApp, target);
          switchWorkspace(target, activeApp);
          setActiveApp(activeApp);
        } else switchWorkspace(target);
      }
      if (event.metaKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        const hidden = hiddenByDesktop.current[workspace] || [];
        const ids = hidden.filter((id) => windows.some((item) => item.id === id && item.workspace === workspace));
        if (ids.length) {
          setWindows((current) => current.map((item) => ids.includes(item.id) ? { ...item, minimized: false } : item));
          setActiveApp(frontWindow(windows.map((item) => ids.includes(item.id) ? { ...item, minimized: false } : item), null, workspace));
          hiddenByDesktop.current[workspace] = [];
        } else {
          const visible = windows.filter((item) => item.workspace === workspace && !item.minimized);
          hiddenByDesktop.current[workspace] = visible.map((item) => item.id);
          visible.forEach((item) => window.dispatchEvent(new CustomEvent('portfolio:window-minimize', { detail: { id: item.id } })));
          setActiveApp(null);
        }
      }
      if (event.ctrlKey && event.altKey && event.key === 'Tab') { event.preventDefault(); document.querySelector('.ubuntu-topbar__workspace-track')?.focus(); return; }
      if ((event.altKey || event.metaKey) && !event.ctrlKey && event.key === 'Tab' && windows.length > 1) {
        event.preventDefault();
        const modifier = event.metaKey ? 'Meta' : 'Alt';
        const ordered = [...windows].sort((a, b) => b.zIndex - a.zIndex);
        const candidates = event.metaKey ? ordered.filter((item, index) => ordered.findIndex((candidate) => candidate.appId === item.appId) === index) : ordered;
        const ids = switcher?.modifier === modifier ? switcher.ids : candidates.map((item) => item.id);
        if (!ids.length) return;
        const current = switcher?.modifier === modifier ? switcher.index : (activeApp ? Math.max(0, ids.indexOf(activeApp)) : event.shiftKey ? 0 : -1);
        setSwitcher({ ids, modifier, index: (current + (event.shiftKey ? -1 : 1) + ids.length) % ids.length });
      }
      if (event.key === 'Escape') { setShowApps(false); setShowOverview(false); setSwitcher(null); }
    }
    function releaseShortcut(event) {
      if (introduction.phase !== 'done') return;
      if (switcher && event.key === switcher.modifier) { focusApp(switcher.ids[switcher.index]); setSwitcher(null); return; }
      if (event.key === 'Meta' && !metaChord.current && !document.querySelector('dialog[open]')) { setShowApps(false); setShowOverview((value) => !value); }
    }
    function releaseOnBlur() { setSwitcher(null); }
    function markPointerChord(event) { if (event.metaKey) metaChord.current = true; }
    window.addEventListener('keydown', handleShortcuts);
    window.addEventListener('keyup', releaseShortcut);
    window.addEventListener('blur', releaseOnBlur);
    window.addEventListener('pointerdown', markPointerChord, true);
    return () => { window.removeEventListener('keydown', handleShortcuts); window.removeEventListener('keyup', releaseShortcut); window.removeEventListener('blur', releaseOnBlur); window.removeEventListener('pointerdown', markPointerChord, true); };
  // Keyboard shortcuts intentionally use the current window action.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showApps, windows, activeApp, switcher, workspace, workspaceCount, introduction.phase]);

  return <div className="desktop-shell">
    <TopBar notifications={notifications} quiet={quiet} onQuiet={setQuiet} onClearNotifications={() => setNotifications([])} onDismissNotification={(id) => setNotifications(current => current.filter(item => item.id !== id))} appName="" workspaceCount={workspaceCount} workspace={workspace} onWorkspaceChange={switchWorkspace} onOpenAppearance={() => openApp('appearance')} overviewOpen={showOverview} onOverview={() => { setShowApps(false); setShowOverview((value) => !value); }} />
    <DesktopDock openApps={[...new Set(windows.map((item) => item.appId))]} activeApp={windows.find((item) => item.id === activeApp)?.appId} onOpen={dockAction} onLaunch={openApp} onQuit={quitApp} onTrashPaths={trashDrop} isFileProtected={(path) => !canDeletePath(files, path)} onShowApps={() => { setShowOverview(false); setShowApps((value) => !value); }} />
    <DesktopItems files={files} setFiles={setFiles} onOpen={openApp} onOpenFile={openFile} onOpenExternal={(url, label) => { window.open(url, '_blank', 'noopener,noreferrer'); setDesktopNotice(`${label} ouvert dans un nouvel onglet.`); }} onOpenAppearance={() => openApp('appearance')} onFocusDesktop={() => setActiveApp(null)} />
    <main className="desktop-shell__workspace" aria-label="Espace de travail">
      {windows.map((window) => {
        const kind = window.appId;
        const app = appById(kind);
        const title = kind === 'trash' ? 'Corbeille' : app?.name || 'Application';
        const icon = app?.icon || '/ubuntu-apps/trash.png';
        let content;
        if (PORTFOLIO_APP_IDS.includes(kind)) content = <PortfolioApp appId={kind} session={appSessions[kind]} onSaveSession={saveAppSession} projectRequest={window.projectId} onOpenApp={openApp} onProjectRouteChange={syncProjectRoute} navigationRequest={window.navigationRequest} restoreContext={window.restoreContext} onOpenCV={(trigger, context) => openCV(window.id, trigger, context)} onNotify={setDesktopNotice} />;
        else if (kind === 'appearance') content = <AppearanceApp onNotify={setDesktopNotice} />;
        else if (kind === 'cv') content = <Suspense fallback={<div className="ubuntu-simple-app" role="status">Ouverture du document…<a href={PROFILE.cvUrl} download>Télécharger le CV</a></div>}><DocumentViewer filename={window.filePath?.split('/').at(-1) || 'CV.pdf'} initialReadingState={cvReadingState} onReadingState={setCVReadingState} onBack={returnFromCV} backLabel={cvBackLabel} onContact={() => openApp('contact')} onNotify={setDesktopNotice} onOpenCopy={() => openApp('cv', { newWindow: true, filePath: window.filePath })} onOpenFiles={() => openApp('files', { directory: `${ROOT}/Documents` })} /></Suspense>;
        else if (kind === 'terminal') content = <VirtualTerminal initialDirectory={window.directory} initialTerminal={window.terminalSession} navigationRequest={window.navigationRequest} files={files} setFiles={setFiles} onClose={() => globalThis.window.dispatchEvent(new CustomEvent('portfolio:window-close', { detail: { id: window.id } }))} onNewWindow={(terminalSession) => openApp('terminal', { newWindow: true, terminalSession })} onOpenFile={openFile} onOpenPortfolio={(section) => openApp('portfolio', { section })} onOpenCV={() => openApp('cv')} />;
        else if (kind === 'files' || kind === 'trash') content = <FileManager initialDirectory={window.directory} navigationRequest={window.navigationRequest} initialLocation={kind === 'trash' ? 'trash' : undefined} files={files} setFiles={setFiles} onOpenFile={openFile} />;
        else if (kind === 'editor') content = <TextEditor key={window.id} windowId={window.id} files={files} filePath={window.filePath} navigationRequest={window.navigationRequest} openRequests={window.editorRequests} initialDocument={window.editorDocument} setFiles={setFiles} onNewWindow={(editorDocument) => openApp('editor', { newWindow: true, editorDocument: editorDocument || createDocument(files, uniquePath(files, `${ROOT}/Documents`, 'Sans titre.txt'), 0, true) })} onOpenDirectory={(directory) => openApp('files', { directory })} onClose={() => globalThis.window.dispatchEvent(new CustomEvent('portfolio:window-close', { detail: { id: window.id } }))} />;
        else if (kind === 'images') content = <ImageViewer key={`${window.id}-${window.navigationRequest || 0}`} files={files} setFiles={setFiles} filePath={window.filePath} onNavigate={(filePath) => setWindows((current) => current.map((item) => item.id === window.id ? { ...item, filePath: filePath || undefined } : item))} onOpenDirectory={(directory) => openApp('files', { directory })} onNewWindow={() => openApp('images', { newWindow: true })} onClose={() => globalThis.window.dispatchEvent(new CustomEvent('portfolio:window-close', { detail: { id: window.id } }))} />;
        else content = <SimpleApp kind={kind} onOpen={openApp} onReplayIntroduction={replayIntroduction} />;
        return <DesktopWindow key={window.id} windowId={window.id} appId={kind} title={title} icon={icon} initialPosition={window.initialPosition} initialMaximized={window.initialMaximized} minimized={window.minimized} workspaceHidden={window.workspace !== workspace} isActive={activeApp === window.id && window.workspace === workspace && !showOverview && !showApps} zIndex={(window.zIndex || 10) + (window.alwaysOnTop ? 2000 : 0)} alwaysOnTop={window.alwaysOnTop} onToggleAbove={() => setWindows((current) => current.map((item) => item.id === window.id ? { ...item, alwaysOnTop: !item.alwaysOnTop } : item))} workspace={window.workspace} workspaceCount={workspaceCount} onMoveWorkspace={(index) => moveWindowToWorkspace(window.id, index)} onFocus={(reason) => focusApp(window.id, reason)} onClose={() => closeApp(window.id)}>{content}</DesktopWindow>;
      })}
    </main>
    <WorkspaceTransition ref={workspaceTransition} />
    {switcher && <div className="ubuntu-app-switcher" role="dialog" aria-label="Changer d’application"><div className="ubuntu-app-switcher__apps">{switcher.ids.map((id, index) => { const item = windows.find((candidate) => candidate.id === id); const app = appById(item?.appId); return <button key={id} className={switcher.index === index ? 'is-selected' : ''} aria-pressed={switcher.index === index} onClick={() => { focusApp(id); setSwitcher(null); }}><img src={app?.icon || '/ubuntu-apps/trash.png'} alt="" /><span>{app?.name || 'Corbeille'}</span></button>; })}</div></div>}
    {workspaceNotice !== null && !showOverview && <div className="ubuntu-workspace-osd" role="status">{Array.from({ length: workspaceCount }, (_, index) => <span key={index} className={workspaceNotice === index ? 'is-current' : ''}>{index + 1}</span>)}</div>}
    {desktopNotice && !quiet && <div className="ubuntu-shell-notice" role="status">{desktopNotice}</div>}
    <WindowOverview open={showOverview} windows={windows} workspaceCount={workspaceCount} activeWorkspace={workspace} onWorkspace={switchWorkspace} onMoveWindow={moveWindowToWorkspace} onOpen={openApp} onFocus={focusApp} onCloseWindow={(id) => window.dispatchEvent(new CustomEvent('portfolio:window-close', { detail: { id } }))} onClose={() => setShowOverview(false)} onShowApps={() => { setShowOverview(false); setShowApps(true); }} revision={files} />
    <AppGrid open={showApps} onOpen={openApp} onClose={() => setShowApps(false)} />
    <DesktopIntroduction phase={introduction.phase} step={introduction.step}
      onBootComplete={() => setIntroduction((current) => transitionIntroduction(current, 'boot-complete'))}
      onSkip={() => finishIntroduction()} onExplore={() => finishIntroduction()}
      onStartGuide={() => setIntroduction((current) => transitionIntroduction(current, 'start-guide'))}
      onPrevious={() => setIntroduction((current) => transitionIntroduction(current, 'previous'))}
      onNext={() => setIntroduction((current) => transitionIntroduction(current, 'next'))}
      onOpenPresentation={() => finishIntroduction({ openPresentation: true })} />
  </div>;
}
