export function linePosition(text, requested) {
  const line = Number(requested);
  const lines = text.split('\n');
  if (!Number.isInteger(line) || line < 1 || line > lines.length) return null;
  return lines.slice(0, line - 1).reduce((offset, value) => offset + value.length + 1, 0);
}
