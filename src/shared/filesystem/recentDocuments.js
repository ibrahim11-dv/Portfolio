export function rememberDocument(recent, path) {
  return [path, ...recent.filter((item) => item !== path)].slice(0, 20);
}

export function availableRecentDocuments(recent, files) {
  return recent.filter((path) => Object.hasOwn(files, path) && files[path] !== null);
}
