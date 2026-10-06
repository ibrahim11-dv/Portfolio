import { useEffect, useImperativeHandle, useRef } from 'react';
import { cloneWindowVisual, restoreVisualScroll } from './windowVisual';
import './WorkspaceTransition.css';

// Keep applications mounted while animating visual copies, like Shell's workspace groups.
export default function WorkspaceTransition({ ref }) {
  const overlayRef = useRef(null);
  const cleanupRef = useRef(() => {});

  useImperativeHandle(ref, () => ({
    start({ from, to, windows, movingWindow }) {
      cleanupRef.current();
      if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const overlay = overlayRef.current;
      const desktop = document.querySelector('.desktop');
      if (!overlay || !desktop) return;
      const desktopStyle = getComputedStyle(desktop);
      const direction = to > from ? 1 : -1;
      const distance = window.innerWidth + 100;
      const animations = [];
      const scrollPositions = [];

      function addWindow(group, record) {
        const source = [...document.querySelectorAll('.desktop-shell__workspace > [data-window-id]')].find((node) => node.dataset.windowId === record.id);
        if (!source) return;
        const clone = cloneWindowVisual(source, scrollPositions);
        clone.classList.remove('is-off-workspace', 'is-opening-window', 'is-changing-size', 'is-unminimizing');
        clone.classList.add('workspace-transition__window');
        ['left', 'top', 'width', 'height'].forEach((property) => clone.style.setProperty(property, source.style.getPropertyValue(`--window-${property}`), 'important'));
        clone.style.zIndex = (record.zIndex || 10) + (record.alwaysOnTop ? 2000 : 0);
        group.append(clone);
      }

      [from, to].forEach((workspace, index) => {
        const pane = document.createElement('div');
        pane.className = 'workspace-transition__pane';
        const wallpaper = document.createElement('div');
        wallpaper.className = 'workspace-transition__wallpaper';
        wallpaper.style.background = desktopStyle.background;
        wallpaper.style.backgroundSize = `${window.innerWidth}px ${window.innerHeight}px`;
        const shade = document.createElement('div');
        shade.className = 'workspace-transition__shade';
        shade.style.background = getComputedStyle(desktop, '::after').background;
        wallpaper.append(shade);
        pane.append(wallpaper);
        ['.desktop-items', '.portfolio-desktop'].forEach((selector) => {
          const source = document.querySelector(selector);
          if (!source) return;
          const clone = cloneWindowVisual(source, scrollPositions);
          clone.style.top = '0';
          pane.append(clone);
        });
        windows.filter((record) => record.workspace === workspace && !record.minimized && record.id !== movingWindow).forEach((record) => addWindow(pane, record));
        overlay.append(pane);
        const offset = direction * distance;
        animations.push(pane.animate([
          { transform: `translateX(${index ? offset : 0}px)` },
          { transform: `translateX(${index ? 0 : -offset}px)` },
        ], { duration: 250, easing: 'cubic-bezier(.215,.61,.355,1)', fill: 'both' }));
      });
      const moving = windows.find((record) => record.id === movingWindow && !record.minimized);
      if (moving) addWindow(overlay, moving);
      overlay.hidden = false;
      restoreVisualScroll(scrollPositions);
      let timer;
      const finish = () => {
        clearTimeout(timer);
        animations.forEach((animation) => animation.cancel());
        overlay.replaceChildren();
        overlay.hidden = true;
        window.removeEventListener('resize', finish);
        cleanupRef.current = () => {};
      };
      cleanupRef.current = finish;
      window.addEventListener('resize', finish);
      timer = setTimeout(finish, 250);
    },
  }), []);

  useEffect(() => () => cleanupRef.current(), []);
  return <div ref={overlayRef} className="workspace-transition" aria-hidden="true" hidden />;
}
