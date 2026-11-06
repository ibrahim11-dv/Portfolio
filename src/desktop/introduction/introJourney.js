export const INTRODUCTION_STORAGE_KEY = 'ibrahimos.introduction.v1';
export const INTRODUCTION_VERSION = 'complete';
export const INTRODUCTION_STEPS = [
  {
    title: 'Découvrez mon univers',
    text: 'Présentation, Projets, Compétences, Parcours et Contact sont des applications indépendantes. Double-cliquez sur ordinateur ; touchez une fois sur mobile.',
    selectors: ['[data-intro-app="presentation"]', '[data-intro-app="projects"]', '[data-intro-app="skills"]', '[data-intro-app="journey"]', '[data-intro-app="contact"]'],
  },
  {
    title: 'Retrouvez vos applications',
    text: 'Le dock donne accès aux favoris et aux fenêtres ouvertes. La grille rassemble toutes les applications.',
    selectors: ['[data-intro-target="dock"]', '[data-intro-target="app-grid"]'],
  },
  {
    title: 'Gardons le contact',
    text: 'Le CV se lit directement dans le bureau ; Contact permet de retrouver l’adresse e-mail et GitHub.',
    selectors: ['[data-intro-app="cv"]', '[data-intro-app="contact"]'],
  },
];

let completedInSession = false;

export function hasStoredIntroduction(storage) {
  try {
    if (storage === undefined) storage = globalThis.localStorage;
    return storage?.getItem(INTRODUCTION_STORAGE_KEY) === INTRODUCTION_VERSION;
  } catch {
    return false;
  }
}

export function hasCompletedIntroduction(storage) {
  if (completedInSession) return true;
  completedInSession = hasStoredIntroduction(storage);
  return completedInSession;
}

export function completeIntroduction(storage) {
  completedInSession = true;
  try {
    if (storage === undefined) storage = globalThis.localStorage;
    storage?.setItem(INTRODUCTION_STORAGE_KEY, INTRODUCTION_VERSION);
    return true;
  } catch {
    return false;
  }
}

export function initialIntroductionPhase(storage) {
  return hasCompletedIntroduction(storage) ? 'done' : 'boot';
}

export function initialIntroductionState(storage) {
  return { phase: initialIntroductionPhase(storage), step: 0 };
}

export function guideStepAfter(step, direction, count = 3) {
  return Math.max(0, Math.min(count - 1, step + direction));
}

export function transitionIntroduction(state, event) {
  if (event === 'replay') return { phase: 'boot', step: 0 };
  if (event === 'boot-complete' && state.phase === 'boot') return { phase: 'presentation', step: 0 };
  if (event === 'start-guide' && state.phase === 'presentation') return { phase: 'guide', step: 0 };
  if (event === 'previous' && state.phase === 'guide') return { ...state, step: guideStepAfter(state.step, -1, INTRODUCTION_STEPS.length) };
  if (event === 'next' && state.phase === 'guide') return { ...state, step: guideStepAfter(state.step, 1, INTRODUCTION_STEPS.length) };
  if (['skip', 'explore', 'open-presentation'].includes(event)) return { phase: 'done', step: 0 };
  return state;
}
