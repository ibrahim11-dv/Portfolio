export const PROJECT_QUERY_KEY = 'project';

// An explicit null means return to the collection; undefined means resume.
export function applyProjectRequest(state, projectId) {
  if (projectId === undefined) return state;
  if (projectId === state.projectId) return state;
  return {
    ...state,
    projectId,
    scroll: projectId === null ? state.returnTo?.scroll || 0 : 0,
    returnTo: state.projectId || projectId === null
      ? state.returnTo
      : { scroll: state.scroll || 0, id: projectId },
  };
}

export function projectIdFromSearch(search, projectIds) {
  const value = new URLSearchParams(search || '').get(PROJECT_QUERY_KEY);
  return value && projectIds.includes(value) ? value : null;
}

export function searchWithProject(search, projectId) {
  const params = new URLSearchParams(search || '');
  if (projectId) params.set(PROJECT_QUERY_KEY, projectId);
  else params.delete(PROJECT_QUERY_KEY);
  const value = params.toString();
  return value ? `?${value}` : '';
}
