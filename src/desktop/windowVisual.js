// DOM cloning does not preserve canvas pixels, form values or scroll positions.
// Preserve them in the inert visuals used by Activities and workspace movement.
export function cloneWindowVisual(source, scrollPositions) {
  const clone = source.cloneNode(true);
  const originals = [source, ...source.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  copies.forEach((node, index) => {
    const original = originals[index];
    node.removeAttribute('id');
    node.removeAttribute('data-window-id');
    node.removeAttribute('autofocus');
    if ('value' in node) node.value = original.value;
    if (node.tagName === 'CANVAS' && original.width && original.height) {
      node.getContext('2d')?.drawImage(original, 0, 0);
    }
    if (original.scrollTop || original.scrollLeft) {
      scrollPositions.push({ node, top: original.scrollTop, left: original.scrollLeft });
    }
  });
  clone.inert = true;
  clone.setAttribute('aria-hidden', 'true');
  return clone;
}

export function restoreVisualScroll(scrollPositions) {
  scrollPositions.forEach(({ node, top, left }) => {
    node.scrollTop = top;
    node.scrollLeft = left;
  });
}
