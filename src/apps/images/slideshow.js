export const SLIDESHOW_DELAYS = [3, 5, 10];

export function nextSlide(paths, current, loop = false) {
  const index = paths.indexOf(current);
  if (paths.length < 2 || index < 0) return null;
  return paths[index + 1] || (loop ? paths[0] : null);
}

export function slideshowDelay(seconds) {
  return (SLIDESHOW_DELAYS.includes(seconds) ? seconds : 5) * 1000;
}
