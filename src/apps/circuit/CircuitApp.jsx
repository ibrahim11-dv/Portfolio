import { useRef, useState } from 'react';
import { ArrowRight, Check, Lightbulb, Monitor, RotateCw, X, Zap } from 'lucide-react';
import { CIRCUIT_LEVELS, DIRECTIONS, circuitGame, hintCell, neighbor, newCircuitSession, poweredCells, turnCircuit } from './circuitGame';
import './CircuitApp.css';

const portNames = ['haut', 'droite', 'bas', 'gauche'];
const lines = ['M50 50V0', 'M50 50H100', 'M50 50V100', 'M50 50H0'];

export default function CircuitApp({ session, onSaveSession }) {
  const state = session || newCircuitSession();
  const level = CIRCUIT_LEVELS[state.level];
  const game = circuitGame(state, level);
  const powered = poweredCells(level, game.ports);
  const won = powered.has(level.target);
  const [focused, setFocused] = useState(level.path[1]);
  const [notice, setNotice] = useState('');
  const [lastTurn, setLastTurn] = useState(null);
  const cells = useRef([]);
  const heading = useRef(null);
  const helpDialog = useRef(null);
  const helpTrigger = useRef(null);

  function save(next) { onSaveSession('circuit', next); }
  function choose(index, restart = false) {
    const nextLevel = CIRCUIT_LEVELS[index];
    const games = restart
      ? { ...state.games, [nextLevel.id]: { ports: [...nextLevel.initial], moves: 0, hints: 0 } }
      : state.games;
    save({ ...state, level: index, games });
    setNotice('');
    setLastTurn(null);
    setFocused(nextLevel.path[1]);
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  function rotate(cell) {
    const next = turnCircuit(state, cell);
    if (next === state) return;
    setLastTurn(cell);
    save(next);
    setNotice('');
  }
  function hint() {
    const cell = hintCell(level, game.ports);
    if (cell === undefined || won) return;
    save(turnCircuit(state, cell, true));
    setLastTurn(cell);
    setFocused(cell);
    cells.current[cell]?.focus({ preventScroll: true });
    setNotice(`Câble tourné : ligne ${Math.floor(cell / level.size) + 1}, colonne ${cell % level.size + 1}.`);
  }
  function keys(event, cell) {
    const direction = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(event.key);
    if (direction >= 0) {
      event.preventDefault();
      event.stopPropagation();
      let next = neighbor(cell, direction, level.size);
      while (next >= 0 && !game.ports[next]) next = neighbor(next, direction, level.size);
      if (next >= 0) { setFocused(next); cells.current[next]?.focus(); }
    }
  }
  function closeHelp() {
    helpDialog.current.close();
    helpTrigger.current?.focus({ preventScroll: true });
  }
  function nextLevel() {
    if (level.id < 10) choose(state.level + 1);
    else if (state.completed.length === 10) choose(0, true);
    else choose(CIRCUIT_LEVELS.findIndex(item => !state.completed.includes(item.id)));
  }

  return <div className="circuit-app">
    <header className="circuit-toolbar">
      <h1>Circuit</h1>
      <select aria-label="Choisir un niveau" value={state.level} onChange={event => choose(Number(event.target.value))}>
        {CIRCUIT_LEVELS.map((item, index) => <option key={item.id} value={index}>
          Niveau {item.id} / 10{state.completed.includes(item.id) ? ' — terminé' : ''}
        </option>)}
      </select>
      <button ref={helpTrigger} className="circuit-help-button" aria-label="Comment jouer ?" aria-haspopup="dialog" onClick={() => helpDialog.current.showModal()}>?</button>
    </header>

    <main className="circuit-stage" aria-label="Plateau de Circuit">
      <div className="circuit-board-area">
        <div className="circuit-level-caption">
          <h2 ref={heading} tabIndex={-1}>{level.name}</h2>
          <span>{game.moves} rotation{game.moves !== 1 ? 's' : ''}</span>
        </div>
        <div className={`circuit-board ${won ? 'is-connected' : ''}`} role="group" aria-label={`Circuit du niveau ${level.id}`} style={{ '--circuit-size': level.size }}>
          {game.ports.map((mask, cell) => {
            if (!mask) return <div key={cell} className="circuit-empty" aria-hidden="true" />;
            const endpoint = cell === level.source || cell === level.target;
            const label = cell === level.source ? 'Source fixe' : cell === level.target ? 'Ordinateur fixe' : 'Câble, tourner';
            return <button key={cell} ref={node => { cells.current[cell] = node; }}
              className={`circuit-cell ${powered.has(cell) ? 'is-powered' : ''} ${endpoint ? 'is-terminal' : ''}`}
              tabIndex={cell === focused ? 0 : -1} aria-disabled={endpoint || won}
              aria-label={`Ligne ${Math.floor(cell / level.size) + 1}, colonne ${cell % level.size + 1} : ${label}. Connexions ${DIRECTIONS.filter(port => mask & port).map(port => portNames[DIRECTIONS.indexOf(port)]).join(', ')}. ${powered.has(cell) ? 'Sous tension' : 'Hors tension'}`}
              onFocus={() => setFocused(cell)} onKeyDown={event => keys(event, cell)} onClick={() => rotate(cell)}>
              <svg className="circuit-wires" viewBox="0 0 100 100" aria-hidden="true">
                <g key={mask} className={lastTurn === cell ? 'circuit-cable' : undefined}>
                  {DIRECTIONS.map((port, d) => mask & port ? <path key={port} d={lines[d]} /> : null)}
                </g>
                <circle cx="50" cy="50" r="6" />
              </svg>
              {endpoint && <span className="circuit-terminal">{cell === level.source ? <Zap /> : <Monitor />}</span>}
            </button>;
          })}
        </div>
        <p className="circuit-board-note">{level.id === 1 && game.moves === 0
          ? <>Tournez le câble pour relier <Zap size={16} aria-label="la source" /> à <Monitor size={16} aria-label="l’ordinateur" />.</>
          : <><Zap size={15} aria-hidden="true" /> Source <span aria-hidden="true">·</span> <Monitor size={15} aria-hidden="true" /> Destination</>}
        </p>
      </div>
    </main>

    <footer className="circuit-footer">
      <p className={`circuit-result ${won ? 'is-complete' : ''}`} role="status" aria-live="polite">
        {won ? <><Check size={18} aria-hidden="true" />{state.completed.length === 10 ? 'Les 10 niveaux sont terminés !' : 'Connecté !'}</> : notice || 'Un clic ou un toucher pour tourner.'}
      </p>
      <div className="circuit-actions">
        <button onClick={() => { choose(state.level, true); setNotice('Niveau recommencé.'); }}><RotateCw size={17} aria-hidden="true" /><span>Recommencer</span></button>
        <button disabled={won} onClick={hint} title={`${game.hints} indice${game.hints !== 1 ? 's' : ''} utilisé${game.hints !== 1 ? 's' : ''}`}><Lightbulb size={17} aria-hidden="true" /><span>Indice</span></button>
        <button className="circuit-next" disabled={!won} onClick={nextLevel} aria-label={level.id < 10 ? 'Niveau suivant' : state.completed.length === 10 ? 'Rejouer' : 'Continuer les niveaux'}>
          {level.id < 10 ? 'Suivant' : state.completed.length === 10 ? 'Rejouer' : 'Continuer'}<ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </footer>

    <dialog ref={helpDialog} className="circuit-help" aria-labelledby="circuit-help-title" onKeyDown={event => event.stopPropagation()} onCancel={event => { event.preventDefault(); closeHelp(); }}>
      <header><h2 id="circuit-help-title">Comment jouer</h2><button onClick={closeHelp} aria-label="Fermer l’aide" autoFocus><X size={20} /></button></header>
      <p>Reliez la source à l’ordinateur. Cliquez ou touchez un câble pour le tourner d’un quart de tour. Les deux bornes restent fixes.</p>
      <p>Les câbles alimentés sont colorés. Certains câbles sont des leurres : inutile de tous les connecter.</p>
      <p><strong>Au clavier :</strong> utilisez les flèches pour vous déplacer, puis Entrée ou Espace pour tourner.</p>
      <p><strong>Indice</strong> tourne un câble du chemin vers la solution. Vous pouvez recommencer ou choisir un autre niveau à tout moment.</p>
      <p className="circuit-help-progress">{state.completed.length} / 10 niveaux terminés · {game.hints} indice{game.hints !== 1 ? 's' : ''} utilisé{game.hints !== 1 ? 's' : ''} sur ce niveau.</p>
    </dialog>
  </div>;
}
