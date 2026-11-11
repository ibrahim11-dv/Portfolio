export function desktopVisibilityAction(windows, workspace, hiddenIds = []) {
  const onWorkspace = (item) => item.workspace === workspace || Boolean(item.onAllWorkspaces);
  const restore = windows.filter((item) => onWorkspace(item) && item.minimized && hiddenIds.includes(item.id)).map((item) => item.id);
  return restore.length ? { type: 'restore', ids: restore } : {
    type: 'hide', ids: windows.filter((item) => onWorkspace(item) && !item.minimized).map((item) => item.id),
  };
}
