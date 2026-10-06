import { isDirectory, listDirectory, normalizePath, ROOT } from './virtualFs.js';

export function locationCompletions(files, input, cwd = ROOT) {
  if (!input || input.includes('://')) return { matches: [], prefix: input };
  const base = cwd === 'trash' ? ROOT : cwd;
  if (input === '~') return { matches: [{ value: '~/', name: 'Dossier personnel', type: 'dir' }], prefix: '~/' };
  const slash = input.lastIndexOf('/');
  const typedParent = slash < 0 ? '' : input.slice(0, slash + 1);
  const fragment = input.slice(slash + 1);
  const expandedParent = typedParent.startsWith('~/') ? `${ROOT}/${typedParent.slice(2)}` : typedParent;
  const directory = normalizePath(expandedParent || '.', base);
  if (!isDirectory(files, directory)) return { matches: [], prefix: input };
  const matches = listDirectory(files, directory)
    .filter(([name]) => name.startsWith(fragment) && (fragment.startsWith('.') || !name.startsWith('.')))
    .map(([name, type]) => ({ name, type, value: `${typedParent}${name}${type === 'dir' ? '/' : ''}` }));
  let prefix = matches[0]?.value || input;
  for (const match of matches.slice(1)) {
    let end = 0;
    while (end < prefix.length && prefix[end] === match.value[end]) end += 1;
    prefix = prefix.slice(0, end);
  }
  return { matches, prefix };
}
