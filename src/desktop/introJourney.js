export const INTRODUCTION_STORAGE_KEY = 'ibrahimos.introduction.v1';
export const INTRODUCTION_VERSION = 'complete';

let completedInSession = false;

export function hasStoredIntroduction(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(INTRODUCTION_STORAGE_KEY) === INTRODUCTION_VERSION;
  } catch {
    return false;
  }
}

export function hasCompletedIntroduction(storage = globalThis.localStorage) {
  if (completedInSession) return true;
  completedInSession = hasStoredIntroduction(storage);
  return completedInSession;
}

export function completeIntroduction(storage = globalThis.localStorage) {
  completedInSession = true;
  try {
    storage?.setItem(INTRODUCTION_STORAGE_KEY, INTRODUCTION_VERSION);
    return true;
  } catch {
    return false;
  }
}

export function initialIntroductionPhase(storage = globalThis.localStorage) {
  return hasCompletedIntroduction(storage) ? 'done' : 'boot';
}

export function guideStepAfter(step, direction, count = 3) {
  return Math.max(0, Math.min(count - 1, step + direction));
}
