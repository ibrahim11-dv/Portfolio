import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { PROJECTS } from './portfolioData';
import { appById } from './apps';
import { ProfileView, ProjectsView, SkillsView, JourneyView, ContactView } from './PortfolioViews';
import ProjectReport from './ProjectReport';
import { CVAction, PortfolioActions } from './PortfolioActions';
import { applyProjectRequest } from './projectRoute';
import './PortfolioApp.css';
import './PortfolioReadability.css';

// Session state belongs to the shell and survives a window closing.
export default function PortfolioApp({ appId, session, onSaveSession, projectRequest, navigationRequest, restoreContext, onOpenApp, onProjectRouteChange, onOpenCV, onNotify }) {
  const initial = restoreContext || session;
  const [state, setState] = useState(() => applyProjectRequest({ projectId: initial.projectId ?? null, filters: initial.filters || { group: 'main', query: '', category: 'all' }, scroll: initial.scroll || 0, returnTo: initial.returnTo || { scroll: 0, id: null }, collections: initial.collections || {} }, projectRequest));
  const [request, setRequest] = useState(navigationRequest);
  const contentRef = useRef(null);
  const restoredRequest = useRef(null);
  if (request !== navigationRequest) {
    setRequest(navigationRequest);
    if (restoreContext) setState(restoreContext);
    else if (projectRequest !== undefined) setState(applyProjectRequest(state, projectRequest));
  }
  const selectedProject = appId === 'projects' ? PROJECTS.find((project) => project.id === state.projectId) : null;
  const app = appById(appId);
  useLayoutEffect(() => { onSaveSession(appId, state); }, [appId, onSaveSession, state]);
  useLayoutEffect(() => {
    const content = contentRef.current;
    content.scrollTop = state.scroll;
    const cvIndex = restoredRequest.current !== request ? restoreContext?.cvActionIndex : null;
    restoredRequest.current = request;
    const cvAction = cvIndex != null ? content.closest('.portfolio-app').querySelectorAll('a[href="/cv.pdf"]')[cvIndex] : null;
    const card = !selectedProject && state.returnTo.id ? [...content.querySelectorAll('[data-project-id]')].find((item) => item.dataset.projectId === state.returnTo.id) : null;
    const target = cvAction || card || content.querySelector('h1') || content;
    if (target.tagName === 'H1') target.tabIndex = -1;
    target.focus({ preventScroll: true });
  // Restore only on page changes, not every scroll or filter edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.projectId, request]);
  function selectProject(id) {
    if (appId !== 'projects') { onOpenApp('projects', { projectId: id }); onProjectRouteChange?.(id); return; }
    setState((current) => ({ ...current, projectId: id, scroll: 0, returnTo: current.projectId ? current.returnTo : { scroll: contentRef.current.scrollTop, id } }));
    onProjectRouteChange?.(id);
  }
  function returnToProjects() { setState((current) => ({ ...current, projectId: null, scroll: current.returnTo.scroll })); onProjectRouteChange?.(null); }
  function updateFilters(update) {
    const next = typeof update === 'function' ? update(state.filters) : update;
    if (next.group === state.filters.group) { setState({ ...state, filters: next }); return; }
    const collections = { ...state.collections, [state.filters.group]: { filters: state.filters, scroll: contentRef.current.scrollTop } };
    const restored = collections[next.group] || { filters: next, scroll: 0 };
    setState({ ...state, filters: restored.filters, scroll: restored.scroll, collections });
    requestAnimationFrame(() => { if (contentRef.current) contentRef.current.scrollTop = restored.scroll; });
  }
  function openCV(trigger) {
    const actions = [...trigger.closest('.portfolio-app').querySelectorAll('a[href="/cv.pdf"]')];
    onOpenCV(trigger, { ...state, scroll: contentRef.current.scrollTop, cvActionIndex: actions.indexOf(trigger) });
  }
  return <PortfolioActions onOpenCV={openCV} onNotify={onNotify}><div className="portfolio-app portfolio-app--standalone" onClick={(event) => { if (event.target.closest('a[target="_blank"]')) onNotify?.('Ouverture du lien dans un nouvel onglet.'); }}>
    <div className="portfolio-app__main">
      <header className={`portfolio-app__toolbar ${selectedProject ? 'has-project' : ''}`}>
        {selectedProject ? <button className="portfolio-app__back" onClick={returnToProjects}><ArrowLeft size={16} />Retour aux projets</button> : <span className="portfolio-app__toolbar-title">{app.name}</span>}
        <span className="portfolio-app__toolbar-caption">{selectedProject?.name || 'IBRAHIMOS'}</span>
        <CVAction className="portfolio-app__toolbar-cv"><FileText size={15} />Lire le CV</CVAction>
        {appId !== 'contact' && <button className="portfolio-app__toolbar-contact" onClick={() => onOpenApp('contact')}>Contact</button>}
      </header>
      <main key={state.projectId || appId} ref={contentRef} tabIndex={-1} aria-label={selectedProject?.name || app.name} className={`portfolio-app__content ${selectedProject ? 'is-report' : ''}`} onScroll={(event) => { const scroll = event.currentTarget.scrollTop; setState((current) => current.scroll === scroll ? current : { ...current, scroll }); }}>
        {selectedProject ? <ProjectReport project={selectedProject} onBack={returnToProjects} onSelectProject={selectProject} /> : appId === 'presentation' ? <ProfileView navigate={onOpenApp} onSelectProject={selectProject} /> : appId === 'projects' ? <ProjectsView onSelectProject={selectProject} filters={state.filters} setFilters={updateFilters} /> : appId === 'skills' ? <SkillsView onSelectProject={selectProject} /> : appId === 'journey' ? <JourneyView /> : <ContactView />}
      </main>
    </div>
  </div></PortfolioActions>;
}
