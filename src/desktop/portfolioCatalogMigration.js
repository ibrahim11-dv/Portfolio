import legacyFiles from './legacyProjectFiles.js';
import { HOME, PORTFOLIO_FILES } from './portfolioData.js';

const retiredFolder = `${HOME}/Projets/ParcVision Mobile`;
export const isRetiredCatalogPath = (path) => path === retiredFolder || path === `${retiredFolder}/README.md`;
export const PROJECT_CATALOG_SNAPSHOT = Object.fromEntries(Object.entries(PORTFOLIO_FILES).filter(([path]) => path.startsWith(`${HOME}/Projets/`) && path.endsWith('/README.md')));

export function migratePortfolioCatalog(files, previousCatalog = {}) {
  const next = { ...files };
  const catalog = previousCatalog && typeof previousCatalog === 'object' && !Array.isArray(previousCatalog) ? previousCatalog : {};
  // Only replace exact generated text. A visitor's changed document is preserved.
  const paths = new Set([...Object.keys(legacyFiles), ...Object.keys(PROJECT_CATALOG_SNAPSHOT)]);
  paths.forEach((path) => {
    const knownVersions = [legacyFiles[path], catalog[path]].filter((content) => typeof content === 'string');
    if (!knownVersions.includes(next[path])) return;
    if (Object.hasOwn(PORTFOLIO_FILES, path)) next[path] = PORTFOLIO_FILES[path];
    else delete next[path];
  });
  if (next[retiredFolder] === null && !Object.keys(next).some((path) => path.startsWith(`${retiredFolder}/`))) delete next[retiredFolder];
  return next;
}
