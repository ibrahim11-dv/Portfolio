import { useEffect, useEffectEvent, useState } from 'react';
import { nextSlide, slideshowDelay } from './slideshow.js';

export function useSlideshow({ enabled, paths, path, seconds, loop, onAdvance, onFinish }) {
  const [visible, setVisible] = useState(() => !document.hidden);
  const advance = useEffectEvent(onAdvance);
  const finish = useEffectEvent(onFinish);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!enabled || !visible) return undefined;
    // Each loaded image gets the full duration; returning from the background
    // starts a fresh delay instead of skipping images that were never seen.
    const timer = setTimeout(() => {
      const next = nextSlide(paths, path, loop);
      if (next) advance(next);
      else finish();
    }, slideshowDelay(seconds));
    return () => clearTimeout(timer);
  }, [enabled, visible, paths, path, seconds, loop]);
}
