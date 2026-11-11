// Small arithmetic parser: no JavaScript evaluation, identifiers or function calls.
export function calculate(expression) {
  const source = expression.replaceAll(',', '.').replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-').replace(/\s/g, '');
  if (!source || source.length > 200) throw new Error('Saisissez un calcul de 200 caractères maximum.');
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[()+*/%-]/g) || [];
  if (tokens.join('') !== source) throw new Error('Utilisez uniquement des nombres, parenthèses et opérateurs.');
  let cursor = 0;
  function primary() {
    let value;
    if (tokens[cursor] === '+') { cursor++; return primary(); }
    if (tokens[cursor] === '-') { cursor++; return -primary(); }
    if (tokens[cursor] === '(') {
      cursor++;
      value = sum();
      if (tokens[cursor++] !== ')') throw new Error('Fermez les parenthèses du calcul.');
    } else {
      const token = tokens[cursor++];
      if (!token || !/^(?:\d|\.)/.test(token)) throw new Error('Le calcul est incomplet.');
      value = Number(token);
    }
    while (tokens[cursor] === '%') { cursor++; value /= 100; }
    return value;
  }
  function product() {
    let value = primary();
    while (['*', '/'].includes(tokens[cursor])) {
      const op = tokens[cursor++];
      const right = primary();
      if (op === '/' && right === 0) throw new Error('La division par zéro est impossible.');
      value = op === '*' ? value * right : value / right;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (['+', '-'].includes(tokens[cursor])) {
      const op = tokens[cursor++];
      const right = product();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }
  const value = sum();
  if (cursor !== tokens.length) throw new Error('Ajoutez un opérateur entre les nombres ou les parenthèses.');
  if (!Number.isFinite(value)) throw new Error('Ce résultat dépasse les limites de la calculatrice.');
  return String(Number(value.toPrecision(12)));
}
