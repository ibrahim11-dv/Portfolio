export function recordCalculation(session = {}, expression, result) {
  return {
    ...session,
    expression: result,
    history: [{ expression, result }, ...(session.history || [])].slice(0, 20),
  };
}
