import { calculate } from './calculator.js';

export function updateMemory(memory, expression, subtract = false) {
  const value = calculate(expression);
  return calculate(`(${memory ?? '0'}) ${subtract ? '-' : '+'} (${value})`);
}
