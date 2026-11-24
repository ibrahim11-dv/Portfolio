export function eraseCalculation(text, start = text.length, end = start) {
  const from = Math.max(0, Math.min(text.length, start));
  const to = Math.max(from, Math.min(text.length, end));
  const cursor = from === to ? Math.max(0, from - 1) : from;
  return { expression: text.slice(0, cursor) + text.slice(to), cursor };
}
