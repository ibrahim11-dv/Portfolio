// Ports clockwise: north, east, south, west. The authored paths also serve as hints.
export const DIRECTIONS = [1, 2, 4, 8];
export function rotatePorts(mask, turns = 1) {
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) mask = ((mask << 1) & 15) | ((mask >> 3) & 1);
  return mask;
}
const designs = [
  ['Premier courant', 3, [3, 4, 5]],
  ['Le virage', 3, [0, 1, 4, 7, 8]],
  ['Le détour', 3, [6, 3, 0, 1, 4, 5, 8]],
  ['Nouvelle ligne', 4, [0, 4, 5, 6, 2, 3, 7, 11, 15]],
  ['En zigzag', 4, [12, 8, 9, 5, 6, 10, 11, 7, 3]],
  ['La boucle ouverte', 4, [0, 1, 2, 3, 7, 11, 15, 14, 13, 9, 5, 6, 10]],
  ['Passage étroit', 5, [0, 5, 10, 11, 6, 7, 12, 17, 18, 13, 8, 9, 14, 19, 24]],
  ['Les méandres', 5, [20, 15, 10, 5, 0, 1, 6, 11, 16, 21, 22, 17, 12, 7, 2, 3, 8, 13, 18, 23, 24]],
  ['Au cœur du circuit', 5, [0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 10, 5, 6, 7, 8, 13, 18, 17, 16, 11, 12]],
  ['Remise en ligne', 5, [4, 3, 8, 9, 14, 13, 12, 7, 2, 1, 0, 5, 6, 11, 10, 15, 20, 21, 16, 17, 22, 23, 24, 19, 18]],
];
export function neighbor(index, direction, size) {
  const row = Math.floor(index / size), col = index % size;
  return [row > 0 ? index - size : -1, col < size - 1 ? index + 1 : -1, row < size - 1 ? index + size : -1, col > 0 ? index - 1 : -1][direction];
}
function connection(a, b, size) {
  const direction = DIRECTIONS.findIndex((_, d) => neighbor(a, d, size) === b);
  if (direction < 0) throw new Error('Circuit path must use adjacent cells');
  return DIRECTIONS[direction];
}
export function poweredCells(level, ports) {
  const powered = new Set([level.source]);
  const queue = [level.source];
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i];
    DIRECTIONS.forEach((port, direction) => {
      const next = neighbor(cell, direction, level.size);
      if (next >= 0 && (ports[cell] & port) && (ports[next] & DIRECTIONS[(direction + 2) % 4]) && !powered.has(next)) {
        powered.add(next); queue.push(next);
      }
    });
  }
  return powered;
}
export const CIRCUIT_LEVELS = designs.map(([name, size, path], index) => {
  const solution = Array(size * size).fill(0);
  path.forEach((cell, p) => {
    if (p > 0) solution[cell] |= connection(cell, path[p - 1], size);
    if (p < path.length - 1) solution[cell] |= connection(cell, path[p + 1], size);
  });
  // Later levels include disconnected spare cables; never required for completion.
  if (index >= 3) solution.forEach((mask, cell) => { if (!mask && cell % 2 === 0) solution[cell] = cell % 3 === 0 ? 5 : 3; });
  const level = { id: index + 1, name, size, source: path[0], target: path.at(-1), path, solution };
  level.initial = solution.map((mask, cell) => cell === level.source || cell === level.target ? mask : rotatePorts(mask, 1 + (cell + index) % 3));
  // Make the source's first connection wrong even if the scramble created another route.
  const first = path[1], back = connection(first, level.source, size);
  while (level.initial[first] & back) level.initial[first] = rotatePorts(level.initial[first]);
  return level;
});
export function newCircuitSession() { return { level: 0, games: {}, completed: [] }; }
export function circuitGame(session, level) {
  return session.games[level.id] || { ports: [...level.initial], moves: 0, hints: 0 };
}
export function turnCircuit(session, cell, hint = false) {
  const level = CIRCUIT_LEVELS[session.level];
  const game = circuitGame(session, level);
  if (cell === level.source || cell === level.target || !game.ports[cell] || poweredCells(level, game.ports).has(level.target)) return session;
  const ports = game.ports.map((mask, i) => i === cell ? rotatePorts(mask) : mask);
  const completed = poweredCells(level, ports).has(level.target) ? [...new Set([...session.completed, level.id])] : session.completed;
  return { ...session, completed, games: { ...session.games, [level.id]: { ports, moves: game.moves + 1, hints: game.hints + Number(hint) } } };
}
export function hintCell(level, ports) { return level.path.slice(1, -1).find(cell => ports[cell] !== level.solution[cell]); }
