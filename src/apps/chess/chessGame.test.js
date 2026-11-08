import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { restoreChess, robotMove, undoTurn, chessStatus } from './chessGame.js';
import { appById, DOCK_APPS } from '../../config/apps.js';

test('chess is registered independently without changing dock favorites', () => {
  assert.equal(appById('chess').name, 'Échecs');
  assert.equal(DOCK_APPS.includes('chess'), false);
});
test('robot waits for black and only selects legal replies', () => {
  const game = restoreChess();
  assert.equal(robotMove(game), null);
  game.move('e4');
  for (const value of [0, .2, .5, .99, 1]) assert.ok(game.moves().includes(robotMove(game, () => value)));
  const before = game.fen();
  robotMove(game);
  assert.equal(game.fen(), before);
});
test('session history preserves repetition and stops the robot at game end', () => {
  const game = restoreChess(['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']);
  assert.equal(game.isThreefoldRepetition(), true);
  assert.match(chessStatus(game), /répétition/);
  const mate = restoreChess(['f3', 'e5', 'g4', 'Qh4#']);
  assert.match(chessStatus(mate), /robot gagne/);
  assert.equal(robotMove(mate), null);
});
test('undo cancels a pending reply or removes a whole turn without mutating history', () => {
  assert.deepEqual(undoTurn([]), []);
  assert.deepEqual(undoTurn(['e4']), []);
  const moves = ['e4', 'e5', 'Nf3', 'Nc6'];
  assert.deepEqual(undoTurn(moves), ['e4', 'e5']);
  assert.deepEqual(undoTurn(moves.slice(0, 3)), ['e4', 'e5']);
  assert.equal(moves.length, 4);
  assert.equal(restoreChess(undoTurn(moves)).turn(), 'w');
});
test('rules support castling, en passant and every promotion choice', () => {
  const castle = restoreChess(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'O-O']);
  assert.equal(castle.get('g1').type, 'k');
  assert.equal(castle.get('f1').type, 'r');
  const passing = restoreChess(['e4', 'a6', 'e5', 'd5', 'exd6']);
  assert.equal(passing.get('d5'), undefined);
  assert.equal(passing.get('d6').color, 'w');
  for (const promotion of ['q', 'r', 'b', 'n']) {
    const game = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
    game.move({ from: 'a7', to: 'a8', promotion });
    assert.equal(game.get('a8').type, promotion);
  }
});
test('illegal moves and exposing the king are rejected; pat is identified', () => {
  assert.throws(() => restoreChess(['e5']));
  const pinned = new Chess('4r2k/8/8/8/8/8/4R3/4K3 w - - 0 1');
  assert.throws(() => pinned.move({ from: 'e2', to: 'd2' }));
  const pat = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(robotMove(pat), null);
  assert.match(chessStatus(pat), /pat/);
});
