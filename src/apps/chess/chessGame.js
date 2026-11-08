import { Chess } from 'chess.js';

export function restoreChess(moves = []) {
  const game = new Chess();
  for (const move of moves) game.move(move);
  return game;
}

export function robotMove(game, random = Math.random) {
  if (game.turn() !== 'b' || game.isGameOver()) return null;
  const moves = game.moves();
  return moves[Math.min(moves.length - 1, Math.max(0, Math.floor(random() * moves.length)))];
}

export function undoTurn(moves) {
  return moves.slice(0, Math.max(0, moves.length - (moves.length % 2 ? 1 : 2)));
}

export function chessStatus(game) {
  if (game.isCheckmate()) return game.turn() === 'b' ? 'Échec et mat. Vous avez gagné !' : 'Échec et mat. Le robot gagne.';
  if (game.isStalemate()) return 'Partie nulle : pat.';
  if (game.isThreefoldRepetition()) return 'Partie nulle : répétition de la position.';
  if (game.isInsufficientMaterial()) return 'Partie nulle : matériel insuffisant.';
  if (game.isDraw()) return 'Partie nulle : règle des 50 coups.';
  return `${game.turn() === 'w' ? 'À vous de jouer' : 'Le robot réfléchit…'}${game.isCheck() ? ' — échec !' : ''}`;
}
