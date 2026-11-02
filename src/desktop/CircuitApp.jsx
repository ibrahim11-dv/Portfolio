import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Lightbulb, Monitor, RotateCw, Trophy, Zap } from 'lucide-react';
import { CIRCUIT_LEVELS, DIRECTIONS, circuitGame, hintCell, neighbor, newCircuitSession, poweredCells, turnCircuit } from './circuitGame';
import './CircuitApp.css';

const portNames = ['haut', 'droite', 'bas', 'gauche'];
const lines = ['M50 50V0', 'M50 50H100', 'M50 50V100', 'M50 50H0'];
export default function CircuitApp({ session, onSaveSession }) {
  const state = session || newCircuitSession();
  const [playing, setPlaying] = useState(Boolean(session));
  const [focused, setFocused] = useState(0);
  const [notice, setNotice] = useState('');
  const cells = useRef([]);
  const heading = useRef(null);
  const result = useRef(null);
  const level = CIRCUIT_LEVELS[state.level];
  const game = circuitGame(state, level);
  const powered = poweredCells(level, game.ports);
  const won = powered.has(level.target);
  useEffect(() => {
    if (won) result.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [won]);
  function save(next) { onSaveSession('circuit', next); }
  function choose(index, restart = false) {
    const nextLevel = CIRCUIT_LEVELS[index];
    const games = restart ? { ...state.games, [nextLevel.id]: { ports: [...nextLevel.initial], moves: 0, hints: 0 } } : state.games;
    save({ ...state, level: index, games }); setNotice(''); setFocused(0); setPlaying(true);
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  function rotate(cell) { save(turnCircuit(state, cell)); setNotice(''); }
  function hint() {
    const cell = hintCell(level, game.ports);
    if (cell === undefined || won) return;
    save(turnCircuit(state, cell, true)); setFocused(cell); cells.current[cell]?.focus();
    setNotice(`Indice : rotation du câble ligne ${Math.floor(cell / level.size) + 1}, colonne ${cell % level.size + 1}.`);
  }
  function keys(event, cell) {
    const direction = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(event.key);
    if (direction >= 0) {
      event.preventDefault(); event.stopPropagation();
      let next = neighbor(cell, direction, level.size);
      while (next >= 0 && !game.ports[next]) next = neighbor(next, direction, level.size);
      if (next >= 0) { setFocused(next); cells.current[next]?.focus(); }
    }
  }
  return <div className={`circuit-app ${playing ? 'is-playing' : 'is-title-screen'} ${won && playing ? 'has-won' : ''}`}>
    <header className="circuit-header"><div><span className="circuit-eyebrow">CASSE-TÊTE / 10 CIRCUITS</span><h1>Circuit <Zap size={25} aria-hidden="true" /></h1></div><div className="circuit-header-actions"><span className="circuit-progress"><Trophy size={16} />{state.completed.length} / 10</span>{playing && <button onClick={() => setPlaying(false)}>Menu</button>}</div></header>
    {!playing ? <section className="circuit-welcome"><div className="circuit-demo" aria-hidden="true"><Zap /><span /><RotateCw /><span /><Monitor /></div><span className="circuit-title-label">CONNECTER. TOURNER. RÉUSSIR.</span><h2>Rétablissez<br /><em>le courant.</em></h2><p>Tournez les câbles pour relier la source <Zap size={18} aria-label="éclair" /> à l’ordinateur <Monitor size={18} aria-label="ordinateur" />.</p><p>10 niveaux, à votre rythme. Sans chronomètre.</p><button className="circuit-primary" onClick={() => choose(state.level)}>{session ? 'Continuer la partie' : 'Jouer'} <ArrowRight size={18} /></button><small>Clic ou toucher : un quart de tour. Clavier : flèches, puis Entrée ou Espace.</small></section> : <>
      <nav className="circuit-levels" aria-label="Choisir un niveau">{CIRCUIT_LEVELS.map((item, index) => <button key={item.id} aria-current={index === state.level ? 'step' : undefined} aria-label={`Niveau ${item.id} : ${item.name}${state.completed.includes(item.id) ? ', terminé' : ''}`} onClick={() => choose(index)}>{item.id}{state.completed.includes(item.id) && <Check size={12} aria-hidden="true" />}</button>)}</nav>
      <section className="circuit-play"><div className="circuit-instructions"><span className="circuit-eyebrow">SECTEUR {String(level.id).padStart(2, '0')} / 10 · {level.size} × {level.size}</span><h2 ref={heading} tabIndex={-1}>{level.name}</h2><p id="circuit-help">Tournez les câbles pour relier <strong>la source</strong> à <strong>l’ordinateur</strong>. Les deux bornes restent fixes.</p><div className="circuit-legend"><span><Zap size={17} /> Source</span><span><Monitor size={17} /> Destination</span><span><i /> Sous tension</span></div><details className="circuit-controls"><summary>Comment jouer ?</summary><p>Clic ou toucher : un quart de tour. Au clavier : flèches pour naviguer, Entrée ou Espace pour tourner.</p><p>Les bornes sont fixes. Les câbles lumineux transportent le courant.</p></details><p className="circuit-spares">{level.id >= 4 ? 'Certains câbles sont des leurres : inutile de tous les connecter.' : 'Suivez les câbles alimentés pour trouver le chemin.'}</p></div>
      <div className="circuit-board-area"><div className="circuit-board" role="group" aria-label={`Circuit du niveau ${level.id}`} aria-describedby="circuit-help" style={{ '--circuit-size': level.size }}>{game.ports.map((mask, cell) => {
        if (!mask) return <div key={cell} className="circuit-empty" aria-hidden="true" />;
        const endpoint = cell === level.source || cell === level.target;
        const label = cell === level.source ? 'Source fixe' : cell === level.target ? 'Ordinateur fixe' : 'Câble, tourner';
        return <button key={cell} ref={node => { cells.current[cell] = node; }} className={`circuit-cell ${powered.has(cell) ? 'is-powered' : ''} ${endpoint ? 'is-terminal' : ''}`} tabIndex={cell === focused || !game.ports[focused] && cell === game.ports.findIndex(Boolean) ? 0 : -1} aria-disabled={endpoint || won} aria-label={`Ligne ${Math.floor(cell / level.size) + 1}, colonne ${cell % level.size + 1} : ${label}. Connexions ${DIRECTIONS.filter(port => mask & port).map(port => portNames[DIRECTIONS.indexOf(port)]).join(', ')}. ${powered.has(cell) ? 'Sous tension' : 'Hors tension'}`} onFocus={() => setFocused(cell)} onKeyDown={event => keys(event, cell)} onClick={() => rotate(cell)}><svg className="circuit-wires" viewBox="0 0 100 100" aria-hidden="true">{DIRECTIONS.map((port, d) => mask & port ? <g key={`${port}-${mask}`}><path d={lines[d]} />{powered.has(cell) && <path className="circuit-current" d={lines[d]} />}</g> : null)}<circle cx="50" cy="50" r="7" /></svg>{endpoint && <span className="circuit-terminal">{cell === level.source ? <Zap /> : <Monitor />}</span>}</button>;
      })}</div><div className="circuit-meter"><span><b>{String(game.moves).padStart(2, '0')}</b>ROTATIONS</span><span><b>{powered.size}<small> / {game.ports.filter(Boolean).length}</small></b>SOUS TENSION</span><span><b>{String(game.hints).padStart(2, '0')}</b>INDICES</span></div></div></section>
      <div ref={result} className={`circuit-result ${won ? 'is-complete' : ''}`} role="status" aria-live="polite">{won ? <><Trophy size={32} /><span><strong>{state.completed.length === 10 ? 'Les 10 niveaux sont terminés !' : 'Connexion établie !'}</strong> {state.completed.length === 10 ? 'Le système est en ligne. Vous pouvez rejouer vos niveaux préférés.' : 'L’ordinateur est alimenté.'}</span></> : notice || 'Circuit ouvert — trouvez le chemin vers l’ordinateur.'}</div>
      <footer className="circuit-actions"><button onClick={() => { save({ ...state, games: { ...state.games, [level.id]: { ports: [...level.initial], moves: 0, hints: 0 } } }); setNotice('Niveau recommencé.'); }}><RotateCw size={17} />Recommencer</button><button disabled={won} onClick={hint}><Lightbulb size={17} />Indice</button>{won && level.id < 10 && <button className="circuit-primary" onClick={() => choose(state.level + 1)}>Niveau suivant <ArrowRight size={17} /></button>}{won && level.id === 10 && <button className="circuit-primary" onClick={() => choose(state.completed.length === 10 ? 0 : CIRCUIT_LEVELS.findIndex(item => !state.completed.includes(item.id)), state.completed.length === 10)}>{state.completed.length === 10 ? 'Rejouer' : 'Continuer les niveaux'}</button>}</footer>
    </>}
  </div>;
}
