export function desktopVisibilityAction(windows, workspace, hiddenIds = []) {
  const restore = windows.filter((item) => item.workspace === workspace && item.minimized && hiddenIds.includes(item.id)).map((item) => item.id);
  return restore.length ? { type: 'restore', ids: restore } : {
    type: 'hide', ids: windows.filter((item) => item.workspace === workspace && !item.minimized).map((item) => item.id),
  };
}
