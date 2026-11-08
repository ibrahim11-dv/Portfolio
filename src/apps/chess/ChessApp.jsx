import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';
import ConfirmationDialog from '../../shared/components/ConfirmationDialog';
import { chessStatus, restoreChess, robotMove, undoTurn } from './chessGame';
import './ChessApp.css';
import ChessPiece from './ChessPiece';

const EMPTY = [];
const names = { p: 'Pion', n: 'Cavalier', b: 'Fou', r: 'Tour', q: 'Dame', k: 'Roi' };
const squares = Array.from({ length: 64 }, (_, i) => `${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)}`);

export default function ChessApp({ session, onSaveSession }) {
  const moves = session?.moves || EMPTY;
  const game = useMemo(() => restoreChess(moves), [moves]);
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState('');
  const [focus, setFocus] = useState('e2');
  const cells = useRef({});
  const promotionChoice = useRef(null);
  const possible = selected ? game.moves({ square: selected, verbose: true }) : [];
  const previous = game.history({ verbose: true }).at(-1);
  const finished = game.isGameOver();

  useEffect(() => {
    if (game.turn() !== 'b' || finished || confirm) return undefined;
    const timer = setTimeout(() => {
      const move = robotMove(game);
      if (move) onSaveSession('chess', { moves: [...moves, move] });
    }, 450);
    return () => clearTimeout(timer);
  }, [game, moves, finished, confirm, onSaveSession]);

  useEffect(() => { if (promotion) promotionChoice.current?.focus(); }, [promotion]);

  function save(next) {
    onSaveSession('chess', { moves: next });
    setSelected(null); setPromotion(null); setNotice('');
  }
  function play(from, to, piece) {
    const next = restoreChess(moves);
    try {
      next.move({ from, to, ...(piece ? { promotion: piece } : {}) });
      save(next.history()); setFocus(to);
      requestAnimationFrame(() => cells.current[to]?.focus());
    } catch { setNotice('Ce coup n’est pas autorisé. Choisissez une case indiquée.'); }
  }
  function choose(square) {
    if (game.turn() !== 'w' || finished || promotion) return;
    const candidates = possible.filter((move) => move.to === square);
    if (candidates.length) {
      if (candidates.some((move) => move.promotion)) setPromotion({ from: selected, to: square });
      else play(selected, square);
      return;
    }
    setSelected(game.get(square)?.color === 'w' && selected !== square ? square : null);
    setNotice('');
  }
  function boardKey(event, index) {
    const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
    if (event.key === 'Escape') { setSelected(null); return; }
    if (!(event.key in deltas)) return;
    event.preventDefault(); event.stopPropagation();
    const next = index + deltas[event.key];
    if (next < 0 || next > 63 || ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && Math.floor(index / 8) !== Math.floor(next / 8))) return;
    setFocus(squares[next]); cells.current[squares[next]]?.focus();
  }
  return <div className="chess-app">
    <header className="chess-app__header"><div><h1>Échecs</h1><p>Vous · Blancs <span>contre</span> Robot · Noirs</p></div><span className="chess-app__difficulty">Débutant</span></header>
    <div className="chess-app__scroll">
      <div className="chess-app__board" role="group" aria-label="Échiquier. Flèches pour parcourir, Entrée pour sélectionner puis jouer.">
        {squares.map((square, index) => {
          const piece = game.get(square);
          const legal = possible.some((move) => move.to === square);
          const checked = piece?.type === 'k' && piece.color === game.turn() && game.isCheck();
          return <button key={square} ref={(node) => { cells.current[square] = node; }}
            className={`chess-square ${(Math.floor(index / 8) + index % 8) % 2 ? 'is-dark' : 'is-light'} ${selected === square ? 'is-selected' : ''} ${legal ? 'is-legal' : ''} ${previous?.from === square || previous?.to === square ? 'is-last' : ''} ${checked ? 'is-check' : ''}`}
            aria-label={`${square} : ${piece ? `${names[piece.type]} ${piece.color === 'w' ? 'blanc' : 'noir'}` : 'vide'}${legal ? ', coup possible' : ''}${checked ? ', en échec' : ''}`}
            aria-pressed={selected === square} aria-disabled={game.turn() !== 'w' || finished || Boolean(promotion)}
            tabIndex={focus === square ? 0 : -1} onFocus={() => setFocus(square)} onKeyDown={(event) => boardKey(event, index)} onClick={() => choose(square)}>
            {index % 8 === 0 && <small className="chess-rank" aria-hidden="true">{square[1]}</small>}
            {index >= 56 && <small className="chess-file" aria-hidden="true">{square[0]}</small>}
            {piece && <ChessPiece type={piece.type} color={piece.color} />}
            {legal && <i aria-hidden="true" className={piece ? 'is-capture' : ''} />}
          </button>;
        })}
      </div>
      <p className="chess-app__hint">Sélectionnez une pièce, puis sa destination. Le robot joue des coups légaux au hasard.</p>
      <details className="chess-app__history"><summary>Historique · {moves.length} demi-coups</summary>{moves.length ? <ol>{moves.filter((_, i) => i % 2 === 0).map((move, i) => <li key={i}><span>{move}</span><span>{moves[i * 2 + 1] || '…'}</span></li>)}</ol> : <p>La partie commence avec les blancs.</p>}</details>
    </div>
    <footer className="chess-app__footer">
      <p role="status" aria-live="polite">{promotion ? 'Choisissez la pièce de promotion.' : notice || chessStatus(game)}</p>
      {promotion ? <div className="chess-app__promotion" role="group" aria-label="Promotion du pion">{['q', 'r', 'b', 'n'].map((piece, i) => <button key={piece} ref={i === 0 ? promotionChoice : undefined} onClick={() => play(promotion.from, promotion.to, piece)}>{names[piece]}</button>)}</div> : <div className="chess-app__actions"><button disabled={!moves.length} onClick={() => save(undoTurn(moves))}><Undo2 size={17} />Annuler un tour</button><button onClick={() => moves.length ? setConfirm(true) : save([])}><RotateCcw size={17} />Nouvelle partie</button></div>}
    </footer>
    {confirm && <ConfirmationDialog title="Recommencer la partie ?" message="La partie en cours sera remplacée par un nouvel échiquier." confirmLabel="Nouvelle partie" onCancel={() => setConfirm(false)} onConfirm={() => { save([]); setConfirm(false); }} />}
  </div>;
}
