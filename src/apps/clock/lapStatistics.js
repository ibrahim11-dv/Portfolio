export function lapStatistics(laps) {
  const durations = laps.map((elapsed, index) => elapsed - (laps[index - 1] || 0));
  if (!durations.length) return { durations, average: 0, fastest: null, slowest: null };
  return {
    durations,
    average: laps.at(-1) / laps.length,
    fastest: Math.min(...durations),
    slowest: Math.max(...durations),
  };
}
