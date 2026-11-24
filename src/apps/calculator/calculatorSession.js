export function recordCalculation(session = {}, expression, result) {
  return {
    ...session,
    expression: result,
    history: [{ expression, result }, ...(session.history || [])].slice(0, 20),
  };
}

export function formatCalculationHistory(history) {
  return ['IbrahimOS — Historique de calculs', 'Du plus ancien au plus récent', '', ...history.slice().reverse().map(({ expression, result }) => `${expression} = ${result}`), ''].join('\n');
}
