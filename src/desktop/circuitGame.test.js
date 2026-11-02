import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCUIT_LEVELS, circuitGame, hintCell, neighbor, newCircuitSession, poweredCells, rotatePorts, turnCircuit } from './circuitGame.js';
import { appById, DOCK_APPS } from './apps.js';

test('Circuit is available as an app without changing the default dock', () => {
  assert.equal(appById('circuit').name, 'Circuit');
  assert.equal(DOCK_APPS.includes('circuit'), false);
});
test('all ten authored levels are valid, scrambled, and solvable', () => {
  assert.equal(CIRCUIT_LEVELS.length, 10);
  for (const level of CIRCUIT_LEVELS) {
    assert.equal(new Set(level.path).size, level.path.length);
    assert.equal(level.initial.length, level.size ** 2);
    assert.ok(level.path.every(cell => cell >= 0 && cell < level.size ** 2));
    assert.equal(poweredCells(level, level.initial).has(level.target), false, `level ${level.id} starts unsolved`);
    assert.ok(poweredCells(level, level.solution).has(level.target), `level ${level.id} has a solution`);
    level.initial.forEach((mask, cell) => assert.ok([0, 1, 2, 3].some(turns => rotatePorts(mask, turns) === level.solution[cell])));
  }
});
test('ports rotate clockwise and cannot jump across board edges or mismatched connections', () => {
  assert.equal(rotatePorts(1), 2);
  assert.equal(rotatePorts(8), 1);
  assert.equal(rotatePorts(3, 4), 3);
  assert.equal(neighbor(2, 1, 3), -1);
  assert.equal(neighbor(3, 3, 3), -1);
  const level = { size: 3, source: 3, target: 5 };
  assert.equal(poweredCells(level, [0, 0, 0, 2, 5, 8, 0, 0, 0]).has(5), false);
  assert.equal(poweredCells(level, [0, 0, 0, 2, 10, 8, 0, 0, 0]).has(5), true);
});
test('a complete ten-level playthrough records victories, rotations and hints without duplicates', () => {
  let session = newCircuitSession();
  for (const [index, level] of CIRCUIT_LEVELS.entries()) {
    session = { ...session, level: index };
    const before = session;
    assert.equal(turnCircuit(session, level.source), before);
    assert.equal(turnCircuit(session, level.target), before);
    let moves = 0;
    while (!poweredCells(level, circuitGame(session, level).ports).has(level.target) && moves < 100) {
      const cell = hintCell(level, circuitGame(session, level).ports);
      assert.notEqual(cell, undefined);
      session = turnCircuit(session, cell, true); moves++;
    }
    assert.ok(session.completed.includes(level.id));
    assert.equal(circuitGame(session, level).moves, moves);
    assert.equal(circuitGame(session, level).hints, moves);
    assert.equal(turnCircuit(session, level.path[1]), session);
  }
  assert.deepEqual(session.completed, [1,2,3,4,5,6,7,8,9,10]);
  assert.deepEqual(JSON.parse(JSON.stringify(session)), session, 'session can survive closing and reopening the window');
});
