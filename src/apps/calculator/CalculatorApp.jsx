import { useRef, useState } from 'react';
import { calculate } from './calculator';
import { updateMemory } from './calculatorMemory';
import './CalculatorApp.css';

const KEYS = ['(', ')', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', 'C', '0', ',', '='];
const LABELS = { C: 'Effacer le calcul', '=': 'Calculer', '÷': 'Diviser', '×': 'Multiplier', '−': 'Soustraire', '+': 'Additionner', '%': 'Pourcentage', ',': 'Virgule' };
export default function CalculatorApp({ session = {}, onSaveSession, onNotify }) {
  const { expression = '', history = [], memory = null } = session;
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const input = useRef(null);
  function update(next) { setError(''); setAnswer(''); onSaveSession('calculator', { ...session, expression: next }); }
  function solve() {
    try {
      const result = calculate(expression);
      onSaveSession('calculator', { ...session, expression: result, history: [{ expression, result }, ...history].slice(0, 20) });
      setError(''); setAnswer(`Résultat : ${result}`);
    } catch (failure) { setError(failure.message); }
  }
  function key(value) {
    if (value === '=') { solve(); return; }
    if (value === 'C') { update(''); input.current.focus(); return; }
    const start = input.current.selectionStart ?? expression.length;
    const end = input.current.selectionEnd ?? start;
    const next = expression.slice(0, start) + value + expression.slice(end);
    if (next.length > 200) return;
    update(next);
    requestAnimationFrame(() => { input.current.focus(); input.current.setSelectionRange(start + value.length, start + value.length); });
  }
  function memorize(subtract) {
    try {
      const next = updateMemory(memory, expression, subtract);
      onSaveSession('calculator', { ...session, memory: next });
      setError(''); setAnswer(`Mémoire : ${next}`);
    } catch (failure) { setError(failure.message); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(expression); onNotify('Résultat copié.'); }
    catch { input.current.focus(); input.current.select(); onNotify('Copie indisponible. Le résultat est sélectionné : utilisez Ctrl+C.'); }
  }
  return <section className="calculator-app" aria-label="Calculatrice">
    <label htmlFor="calculator-expression">Calcul<input id="calculator-expression" ref={input} value={expression} maxLength={200} placeholder="0" autoComplete="off" spellCheck={false} inputMode="text" aria-describedby="calculator-hint" aria-invalid={Boolean(error)} onChange={(event) => update(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); solve(); } }} /></label>
    <div className="calculator-app__feedback" role="status">{error || answer || 'Entrée pour calculer'}</div>
    <div className="calculator-app__memory" role="group" aria-label="Mémoire de calcul">
      <button title="Effacer la mémoire" aria-label="Effacer la mémoire" disabled={memory === null} onClick={() => { onSaveSession('calculator', { ...session, memory: null }); setError(''); setAnswer('Mémoire effacée.'); }}>MC</button>
      <button title="Rappeler la mémoire" aria-label="Rappeler la mémoire" disabled={memory === null} onClick={() => { update(memory); input.current.focus(); }}>MR</button>
      <button title="Ajouter le calcul à la mémoire" aria-label="Ajouter le calcul à la mémoire" onClick={() => memorize(false)}>M+</button>
      <button title="Soustraire le calcul de la mémoire" aria-label="Soustraire le calcul de la mémoire" onClick={() => memorize(true)}>M−</button>
    </div>
    {memory !== null && <p className="calculator-app__memory-value">Mémoire : {memory}</p>}
    <div className="calculator-app__keys">{KEYS.map((value) => <button key={value} className={value === '=' ? 'is-primary' : ''} aria-label={LABELS[value] || value} onMouseDown={(event) => event.preventDefault()} onClick={() => key(value)}>{value}</button>)}</div>
    <div className="calculator-app__actions"><button onClick={() => { update(expression.slice(0, -1)); input.current.focus(); }}>Effacer un chiffre</button><button onClick={copy} disabled={!expression}>Copier</button></div>
    <p id="calculator-hint">Parenthèses et priorités usuelles. 10 % = 0,1 ; pour ajouter 10 %, utilisez × 1,1.</p>
    <details><summary>Historique · {history.length} calcul{history.length !== 1 ? 's' : ''}</summary>{history.length ? <><button onClick={() => onSaveSession('calculator', { ...session, history: [] })}>Effacer l’historique</button><ol>{history.map((item, index) => <li key={index}><button onClick={() => { update(item.result); input.current.focus(); }} aria-label={`Réutiliser ${item.result}`}><span>{item.expression}</span><strong>= {item.result}</strong></button></li>)}</ol></> : <p>Vos calculs apparaîtront ici pendant cette session.</p>}</details>
  </section>;
}
