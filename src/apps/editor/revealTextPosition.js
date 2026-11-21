// Measure the rendered text, including soft wraps, without changing the document.
export function revealTextPosition(view, position) {
  const mirror = document.createElement('div');
  const style = getComputedStyle(view);
  for (const property of ['font', 'letterSpacing', 'tabSize', 'padding', 'lineHeight', 'wordSpacing']) mirror.style[property] = style[property];
  Object.assign(mirror.style, { position: 'fixed', left: '-100000px', top: '0', visibility: 'hidden', boxSizing: 'border-box', width: `${view.clientWidth}px`, whiteSpace: view.wrap === 'off' ? 'pre' : 'pre-wrap', overflowWrap: 'break-word' });
  mirror.append(document.createTextNode(view.value.slice(0, position)));
  const marker = document.createElement('span');
  marker.textContent = view.value.slice(position, position + 1) || '\u200b';
  mirror.append(marker);
  document.body.append(mirror);
  try {
    const top = marker.getBoundingClientRect().top - mirror.getBoundingClientRect().top;
    view.scrollTop = Math.max(0, top - view.clientHeight / 2);
    view.scrollLeft = 0;
  } finally { mirror.remove(); }
}
