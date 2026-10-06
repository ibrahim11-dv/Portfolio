import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Minus, Square, X } from 'lucide-react';
import './DesktopWindowBehavior.css';

const TOP_BAR_HEIGHT = 32;
const MOBILE_BREAKPOINT = 620;
const INTERACTIVE = 'button, input, select, textarea, a, label, summary, [role="button"], [contenteditable="true"], [data-no-window-drag], .ubuntu-window__controls';
const APP_HEADER = '.ubuntu-files__toolbar, .ubuntu-terminal__chrome, .ubuntu-editor__toolbar, .papers__toolbar, .loupe__toolbar';
const RESIZE_EDGES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const MINIMUM_WINDOW_SIZE = [320, 210];
const APP_MINIMUMS = { images: [360, 294] };
const APP_SIZES = {
  files: [860, 610], trash: [860, 610], terminal: [900, 570], editor: [820, 600],
  portfolio: [1040, 710], cv: [1000, 760],
  images: [600, 498],
};
const WINDOW_SIZE_KEY = 'portfolio.window-sizes.v1';

function savedWindowSize(appId) {
  try {
    const size = JSON.parse(localStorage.getItem(WINDOW_SIZE_KEY))?.[appId];
    if (Array.isArray(size) && size.length === 2 && size.every((value) => Number.isFinite(value) && value > 0)) return size;
  } catch { /* Use the default size when storage is unavailable. */ }
  return APP_SIZES[appId] || [760, 560];
}

function rememberWindowSize(appId, rect) {
  try {
    const saved = JSON.parse(localStorage.getItem(WINDOW_SIZE_KEY));
    const sizes = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    localStorage.setItem(WINDOW_SIZE_KEY, JSON.stringify({ ...sizes, [appId]: [rect.width, rect.height] }));
  } catch { /* Resizing remains available without persistent storage. */ }
}

function workArea() {
  const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const x = mobile ? 0 : 82;
  return {
    x, y: 0,
    width: Math.max(1, window.innerWidth - x),
    height: Math.max(1, window.innerHeight - TOP_BAR_HEIGHT - (mobile ? 80 : 0)),
    mobile,
  };
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(Math.max(minimum, maximum), value));
}

function clampRect(rect, area = workArea(), minimum = MINIMUM_WINDOW_SIZE) {
  const width = clamp(rect.width, Math.min(minimum[0], area.width), area.width);
  const height = clamp(rect.height, Math.min(minimum[1], area.height), area.height);
  return {
    x: clamp(rect.x, area.x, area.x + area.width - width),
    y: clamp(rect.y, area.y, area.y + area.height - height),
    width, height,
  };
}

function initialLayout(appId, position) {
  const area = workArea();
  const [preferredWidth, preferredHeight] = savedWindowSize(appId);
  const rect = clampRect({
    x: area.mobile ? 8 : position?.x ?? area.x + 20,
    y: area.mobile ? 10 : position?.y ?? 32,
    width: Math.min(preferredWidth, area.width - (area.mobile ? 16 : 28)),
    height: Math.min(preferredHeight, area.height - (area.mobile ? 20 : 56)),
  }, area, APP_MINIMUMS[appId]);
  return { mode: 'normal', rect, normalRect: rect };
}

function snappedRect(mode, area = workArea()) {
  if (mode === 'maximized') return { x: area.x, y: area.y, width: area.width, height: area.height };
  const width = Math.floor(area.width / 2);
  return {
    x: mode === 'right' ? area.x + width : area.x,
    y: area.y,
    width: mode === 'right' ? area.width - width : width,
    height: area.height,
  };
}

function snapAtPointer(event, area, minimum = MINIMUM_WINDOW_SIZE) {
  if (event.clientY <= TOP_BAR_HEIGHT + 16) return 'maximized';
  if (area.mobile || Math.floor(area.width / 2) < minimum[0]) return null;
  if (event.clientX <= area.x + 16) return 'left';
  if (event.clientX >= area.x + area.width - 16) return 'right';
  return null;
}

function releasePointer(gesture, element) {
  if (!gesture) return;
  document.body.style.userSelect = gesture.previousUserSelect;
  document.body.style.cursor = gesture.previousCursor;
  if (element?.hasPointerCapture(gesture.pointerId)) element.releasePointerCapture(gesture.pointerId);
}

function resizedRect(origin, direction, dx, dy, area, minimum = MINIMUM_WINDOW_SIZE) {
  const minimumWidth = Math.min(minimum[0], area.width);
  const minimumHeight = Math.min(minimum[1], area.height);
  const right = origin.x + origin.width;
  const bottom = origin.y + origin.height;
  let { x, y, width, height } = origin;
  if (direction.includes('e')) width = clamp(origin.width + dx, Math.min(minimumWidth, area.x + area.width - x), area.x + area.width - x);
  if (direction.includes('s')) height = clamp(origin.height + dy, Math.min(minimumHeight, area.y + area.height - y), area.y + area.height - y);
  if (direction.includes('w')) {
    x = clamp(origin.x + dx, area.x, right - Math.min(minimumWidth, right - area.x));
    width = right - x;
  }
  if (direction.includes('n')) {
    y = clamp(origin.y + dy, area.y, bottom - Math.min(minimumHeight, bottom - area.y));
    height = bottom - y;
  }
  return { x, y, width, height };
}

export default function DesktopWindow({ title, icon, children, appId, windowId = appId, initialPosition, onClose, onFocus, zIndex, minimized = false, workspaceHidden = false, isActive = true, alwaysOnTop = false, onToggleAbove, workspace = 0, workspaceCount = 2, onMoveWorkspace }) {
  const [layout, setLayout] = useState(() => initialLayout(appId, initialPosition));
  const [animatedGeometry, setAnimatedGeometry] = useState(false);
  const [gestureKind, setGestureKind] = useState(null);
  const [snapTarget, setSnapTarget] = useState(null);
  const [closing, setClosing] = useState(false);
  const [minimizeTarget, setMinimizeTarget] = useState({ x: -200, y: 140, scaleX: .08, scaleY: .08 });
  const [appearance, setAppearance] = useState({ minimized, restoring: false, opening: !minimized });
  const [windowMenu, setWindowMenu] = useState(null);
  const [keyboardGesture, setKeyboardGesture] = useState(null);
  const keyboardOriginRef = useRef(null);
  const menuRef = useRef(null);
  const sectionRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const gestureRef = useRef(null);
  const closeTimerRef = useRef(null);
  const maximized = layout.mode === 'maximized';
  const minimumSize = APP_MINIMUMS[appId] || MINIMUM_WINDOW_SIZE;

  const restoreAppFocus = useCallback(() => {
    const element = sectionRef.current;
    if (!element?.isConnected || document.querySelector('dialog[open]')) return;
    const focusable = (candidate) => candidate?.isConnected && element.contains(candidate)
      && !candidate.matches(':disabled') && candidate.getClientRects().length > 0;
    const previous = lastFocusedRef.current;
    const fallback = [...element.querySelectorAll('.ubuntu-terminal__input-line input, .ubuntu-editor textarea, .ubuntu-files, .papers, .loupe')].find(focusable);
    (focusable(previous) ? previous : fallback || element).focus({ preventScroll: true });
  }, []);

  const startKeyboardGesture = useCallback((kind) => {
    setWindowMenu(null);
    setAppearance((current) => ({ ...current, opening: false, restoring: false }));
    keyboardOriginRef.current = layout;
    if (layout.mode !== 'normal') {
      const rect = clampRect(layout.normalRect, workArea(), minimumSize);
      setLayout({ mode: 'normal', rect, normalRect: rect });
    }
    setAnimatedGeometry(false);
    setKeyboardGesture(kind);
    sectionRef.current?.focus({ preventScroll: true });
  }, [layout, minimumSize]);

  function openWindowMenu(event) {
    if (event?.target.closest('.ubuntu-window__controls') || workspaceHidden || minimized || closing) return;
    event?.preventDefault();
    event?.stopPropagation();
    onFocus();
    const rect = sectionRef.current.getBoundingClientRect();
    setWindowMenu({ x: clamp(event?.clientX ?? rect.left + 16, 6, window.innerWidth - 278), y: clamp(event?.clientY ?? rect.top + 44, TOP_BAR_HEIGHT + 6, window.innerHeight - 315) });
  }

  useEffect(() => {
    if (!windowMenu) return undefined;
    menuRef.current?.querySelector('button:not(:disabled)')?.focus();
    function dismiss(event) {
      if (!menuRef.current?.contains(event.target)) setWindowMenu(null);
    }
    function dismissOnBlur() { setWindowMenu(null); }
    window.addEventListener('pointerdown', dismiss);
    window.addEventListener('blur', dismissOnBlur);
    window.addEventListener('resize', dismissOnBlur);
    return () => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('blur', dismissOnBlur);
      window.removeEventListener('resize', dismissOnBlur);
    };
  }, [windowMenu]);

  useEffect(() => {
    if (isActive && !minimized && !workspaceHidden) return undefined;
    const frame = requestAnimationFrame(() => {
      setWindowMenu(null);
      setKeyboardGesture(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [isActive, minimized, workspaceHidden]);

  // Track the prop transition so restoring animates from the dock without remounting app content.
  if (appearance.minimized !== minimized) setAppearance({ minimized, restoring: !minimized, opening: false });

  const changePlacement = useCallback((mode) => {
    if (['left', 'right'].includes(mode) && Math.floor(workArea().width / 2) < minimumSize[0]) return;
    setAppearance((current) => ({ ...current, opening: false, restoring: false }));
    setAnimatedGeometry(true);
    setSnapTarget(null);
    setLayout((current) => {
      const nextMode = mode === 'toggle' ? (current.mode === 'maximized' ? 'normal' : 'maximized') : mode;
      const normalRect = current.mode === 'normal' ? current.rect : current.normalRect;
      return {
        mode: nextMode,
        normalRect,
        rect: nextMode === 'normal' ? clampRect(normalRect, workArea(), minimumSize) : snappedRect(nextMode),
      };
    });
    requestAnimationFrame(restoreAppFocus);
  }, [restoreAppFocus, minimumSize]);

  const requestClose = useCallback(function closeWindow(confirmed = false) {
    if (closeTimerRef.current !== null) return;
    if (!confirmed) {
      const request = new CustomEvent('portfolio:window-before-close', { cancelable: true, detail: { id: windowId, close: () => closeWindow(true) } });
      if (!window.dispatchEvent(request)) { onFocus(); return; }
    }
    releasePointer(gestureRef.current, sectionRef.current);
    gestureRef.current = null;
    setGestureKind(null);
    setSnapTarget(null);
    setClosing(true);
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150;
    closeTimerRef.current = window.setTimeout(onClose, delay);
  }, [onClose, onFocus, windowId]);

  const requestMinimize = useCallback(() => {
    const element = sectionRef.current;
    const windowRect = element?.getBoundingClientRect();
    const launcher = document.querySelector(`[data-app-launcher="${appId}"]`)?.getBoundingClientRect();
    if (windowRect && launcher) setMinimizeTarget({
      x: launcher.left + launcher.width / 2 - windowRect.left - windowRect.width / 2,
      y: launcher.top + launcher.height / 2 - windowRect.top - windowRect.height / 2,
      scaleX: launcher.width / windowRect.width,
      scaleY: launcher.height / windowRect.height,
    });
    releasePointer(gestureRef.current, element);
    gestureRef.current = null;
    setGestureKind(null);
    setSnapTarget(null);
    if (element?.contains(document.activeElement)) document.activeElement.blur();
    onFocus('minimize');
  }, [appId, onFocus]);

  useEffect(() => {
    function minimizeFromDock(event) {
      if (event.detail?.id === windowId && !minimized && !closing) requestMinimize();
    }
    window.addEventListener('portfolio:window-minimize', minimizeFromDock);
    return () => window.removeEventListener('portfolio:window-minimize', minimizeFromDock);
  }, [windowId, minimized, closing, requestMinimize]);

  useEffect(() => {
    function closeFromShell(event) { if (event.detail?.id === windowId) requestClose(); }
    window.addEventListener('portfolio:window-close', closeFromShell);
    return () => window.removeEventListener('portfolio:window-close', closeFromShell);
  }, [windowId, requestClose]);

  useEffect(() => {
    const element = sectionRef.current;

    function move(event) {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      const area = workArea();
      if (!gesture.moved && Math.hypot(dx, dy) < 4) return;
      if (!gesture.moved) {
        if (!element.hasPointerCapture(gesture.pointerId)) element.setPointerCapture(gesture.pointerId);
        setAppearance((current) => current.opening || current.restoring ? { ...current, opening: false, restoring: false } : current);
      }
      gesture.moved = true;
      event.preventDefault();
      setAnimatedGeometry(false);
      setGestureKind(gesture.kind);
      if (gesture.kind === 'resize') {
        const rect = resizedRect(gesture.origin, gesture.direction, dx, dy, area, minimumSize);
        gesture.rect = rect;
        gesture.normalRect = rect;
        setLayout({ mode: 'normal', rect, normalRect: rect });
        return;
      }
      if (gesture.startMode !== 'normal' && !gesture.restored) {
        const rect = clampRect(gesture.normalRect, area, minimumSize);
        gesture.offsetX = rect.width * gesture.anchorRatio;
        gesture.offsetY = Math.min(gesture.offsetY, 44);
        gesture.restored = true;
      }
      const restored = gesture.restored ? clampRect(gesture.normalRect, area, minimumSize) : gesture.origin;
      const rect = {
        ...restored,
        x: clamp(event.clientX - gesture.offsetX, area.x, area.x + area.width - restored.width),
        y: clamp(event.clientY - TOP_BAR_HEIGHT - gesture.offsetY, area.y, area.y + area.height - restored.height),
      };
      gesture.rect = rect;
      gesture.normalRect = rect;
      gesture.snapTarget = snapAtPointer(event, area, minimumSize);
      setLayout({ mode: 'normal', rect, normalRect: rect });
      setSnapTarget(gesture.snapTarget);
    }

    function finish(event) {
      const gesture = gestureRef.current;
      if (!gesture || (event.pointerId !== undefined && gesture.pointerId !== event.pointerId)) return;
      gestureRef.current = null;
      releasePointer(gesture, element);
      setGestureKind(null);
      setSnapTarget(null);
      if (event.type === 'pointercancel') {
        setLayout({ mode: gesture.startMode, rect: gesture.origin, normalRect: gesture.originalNormalRect });
        return;
      }
      if (gesture.kind === 'resize' && gesture.moved) rememberWindowSize(appId, gesture.rect);
      if (event.type !== 'pointercancel' && event.type !== 'blur' && gesture.moved && gesture.snapTarget) {
        setAnimatedGeometry(true);
        setLayout({ mode: gesture.snapTarget, rect: snappedRect(gesture.snapTarget), normalRect: gesture.normalRect });
      }
    }

    function fitViewport() {
      releasePointer(gestureRef.current, element);
      gestureRef.current = null;
      setGestureKind(null);
      setSnapTarget(null);
      setAnimatedGeometry(false);
      setLayout((current) => ({
        ...current,
        rect: current.mode === 'normal' ? clampRect(current.rect, workArea(), minimumSize) : snappedRect(current.mode),
        normalRect: clampRect(current.normalRect, workArea(), minimumSize),
      }));
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('blur', finish);
    window.addEventListener('resize', fitViewport);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('blur', finish);
      window.removeEventListener('resize', fitViewport);
      releasePointer(gestureRef.current, element);
      window.clearTimeout(closeTimerRef.current);
    };
  }, [appId, minimumSize]);

  useEffect(() => {
    if (!isActive || minimized || closing || workspaceHidden) return undefined;
    const element = sectionRef.current;
    const frame = window.requestAnimationFrame(() => {
      if (!element?.isConnected || document.querySelector('dialog[open]') || element.contains(document.activeElement)) return;
      restoreAppFocus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isActive, minimized, closing, workspaceHidden, restoreAppFocus]);

  useEffect(() => {
    if (!isActive || minimized || closing || workspaceHidden) return undefined;
    function handleKeys(event) {
      if (event.key === 'Escape' && gestureRef.current) {
        event.preventDefault();
        event.stopPropagation();
        const gesture = gestureRef.current;
        releasePointer(gesture, sectionRef.current);
        gestureRef.current = null;
        setLayout({ mode: gesture.startMode, rect: gesture.origin, normalRect: gesture.originalNormalRect });
        setGestureKind(null);
        setSnapTarget(null);
        return;
      }
      if (keyboardGesture) {
        event.stopPropagation();
        event.preventDefault();
        if (event.key === 'Escape' || event.key === 'Enter') {
          event.preventDefault();
          if (event.key === 'Escape' && keyboardOriginRef.current) setLayout(keyboardOriginRef.current);
          if (event.key === 'Enter' && keyboardGesture === 'resize') rememberWindowSize(appId, layout.rect);
          setKeyboardGesture(null);
          requestAnimationFrame(restoreAppFocus);
          return;
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          const step = event.ctrlKey ? 1 : event.shiftKey ? 40 : 10;
          const dx = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
          const dy = event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
          setLayout((current) => {
            const rect = keyboardGesture === 'move' ? clampRect({ ...current.rect, x: current.rect.x + dx, y: current.rect.y + dy }, workArea(), minimumSize) : clampRect({ ...current.rect, width: current.rect.width + dx, height: current.rect.height + dy }, workArea(), minimumSize);
            return { mode: 'normal', rect, normalRect: rect };
          });
          return;
        }
        return;
      }
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey || document.querySelector('dialog[open]')) return;
      if (event.altKey && !event.metaKey) {
        if (event.code === 'Space') { event.preventDefault(); openWindowMenu(); }
        if (event.key === 'F5') { event.preventDefault(); changePlacement('normal'); }
        if (event.key === 'F7') { event.preventDefault(); startKeyboardGesture('move'); }
        if (event.key === 'F8' && !maximized) { event.preventDefault(); startKeyboardGesture('resize'); }
        if (event.key === 'F10') { event.preventDefault(); changePlacement('toggle'); }
        if (event.key === 'F9') { event.preventDefault(); requestMinimize(); }
        if (event.key === 'F4') { event.preventDefault(); requestClose(); }
      } else if (event.metaKey && !event.altKey) {
        if (event.key.toLowerCase() === 'h') { event.preventDefault(); requestMinimize(); }
        const placements = { ArrowUp: 'maximized', ArrowDown: 'normal', ArrowLeft: 'left', ArrowRight: 'right' };
        if (placements[event.key]) {
          event.preventDefault();
          changePlacement(placements[event.key]);
        }
      }
    }
    const capture = Boolean(keyboardGesture || gestureKind);
    window.addEventListener('keydown', handleKeys, capture);
    return () => window.removeEventListener('keydown', handleKeys, capture);
  // The menu opener intentionally uses this window's current geometry and focus callback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, minimized, closing, workspaceHidden, changePlacement, requestMinimize, requestClose, keyboardGesture, gestureKind, startKeyboardGesture, maximized, minimumSize, restoreAppFocus, appId, layout.rect]);

  function beginGesture(event, kind, direction) {
    if (event.button !== 0 || minimized || closing || workspaceHidden || gestureRef.current) return;
    if (kind === 'drag' && !event.metaKey && event.target.closest(INTERACTIVE)) return;
    if (kind === 'resize' && maximized) return;
    if (kind === 'resize') event.preventDefault();
    event.stopPropagation();
    onFocus();
    setWindowMenu(null);
    setKeyboardGesture(null);
    const rect = sectionRef.current.getBoundingClientRect();
    gestureRef.current = {
      kind, direction, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      startMode: layout.mode, origin: layout.rect, rect: layout.rect, normalRect: layout.normalRect,
      originalNormalRect: layout.normalRect,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      anchorRatio: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      previousUserSelect: document.body.style.userSelect, previousCursor: document.body.style.cursor,
      moved: false, restored: false, snapTarget: null,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = kind === 'drag' ? 'grabbing' : `${direction}-resize`;
  }

  function doubleClickHeader(event) {
    if (!event.target.closest(INTERACTIVE) && !closing && !minimized) changePlacement('toggle');
  }

  const classes = [
    'ubuntu-window',
    maximized && 'is-maximized',
    workspaceHidden && 'is-off-workspace',
    layout.mode !== 'normal' && layout.mode !== 'maximized' && 'is-tiled',
    appearance.opening && 'is-opening-window', minimized && 'is-minimized',
    appearance.restoring && 'is-unminimizing', closing && 'is-closing',
    animatedGeometry && 'is-changing-size',
    gestureKind && `is-${gestureKind === 'drag' ? 'dragging' : 'resizing'}`,
    isActive ? 'is-active-window' : 'is-inactive-window',
  ].filter(Boolean).join(' ');
  const previewRect = snapTarget ? snappedRect(snapTarget) : null;

  return <>
    {previewRect && <div className="ubuntu-window-snap-preview" aria-hidden="true" style={{
      left: previewRect.x + 4, top: previewRect.y + 4,
      width: Math.max(0, previewRect.width - 8), height: Math.max(0, previewRect.height - 8),
      zIndex: (zIndex || 10) - 1,
    }} />}
    <section ref={sectionRef} className={classes} data-managed-window="true" data-app={appId} data-window-id={windowId}
      aria-label={title} aria-hidden={minimized || closing || workspaceHidden} inert={minimized || closing || workspaceHidden ? true : undefined} tabIndex={-1}
      style={{
        '--window-left': `${layout.rect.x}px`, '--window-top': `${layout.rect.y}px`,
        '--window-width': `${layout.rect.width}px`, '--window-height': `${layout.rect.height}px`,
        '--minimize-x': `${minimizeTarget.x}px`, '--minimize-y': `${minimizeTarget.y}px`, zIndex,
        '--minimize-scale-x': minimizeTarget.scaleX, '--minimize-scale-y': minimizeTarget.scaleY,
      }}
      onPointerDown={(event) => { if (event.button === 0 && !minimized && !closing) onFocus(); }}
      onFocusCapture={(event) => {
        if (event.target !== event.currentTarget && !event.target.closest('.ubuntu-window__controls')) lastFocusedRef.current = event.target;
        if (!isActive && !minimized && !closing) onFocus();
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && ['ubuntu-window-show', 'ubuntu-window-unminimize'].includes(event.animationName)) {
          setAppearance((current) => ({ ...current, opening: false, restoring: false }));
        }
      }}
      onTransitionEnd={(event) => { if (event.target === event.currentTarget && ['width', 'height', 'left', 'top'].includes(event.propertyName)) setAnimatedGeometry(false); }}>
      <header className="ubuntu-window__header" onContextMenu={openWindowMenu} onDoubleClick={doubleClickHeader} onPointerDown={(event) => beginGesture(event, 'drag')}>
        <span className="ubuntu-window__title"><img src={icon} alt="" />{title}</span>
        <div className="ubuntu-window__controls" onPointerDown={(event) => { if (event.button === 0) event.preventDefault(); }}>
          <button aria-label="Réduire" title="Réduire (Alt+F9)" onClick={(event) => { event.stopPropagation(); requestMinimize(); }}><Minus size={15} /></button>
          <button aria-label={maximized ? 'Restaurer' : 'Maximiser'} aria-pressed={maximized} title={maximized ? 'Restaurer (Alt+F10)' : 'Maximiser (Alt+F10)'} onClick={(event) => { event.stopPropagation(); changePlacement('toggle'); }}>
            {maximized ? <Copy size={12} /> : <Square size={12} />}
          </button>
          <button aria-label="Fermer" title="Fermer (Alt+F4)" onClick={(event) => { event.stopPropagation(); requestClose(); }}><X size={15} /></button>
        </div>
      </header>
      <div className="ubuntu-window__content"
        onContextMenuCapture={(event) => { if (event.target.closest(APP_HEADER) && !event.target.closest(INTERACTIVE)) openWindowMenu(event); }}
        onPointerDownCapture={(event) => { if (event.metaKey && event.button === 0) { event.preventDefault(); beginGesture(event, 'drag'); } }}
        onPointerDown={(event) => { if (!event.metaKey && event.target.closest(APP_HEADER)) beginGesture(event, 'drag'); }}
        onDoubleClick={(event) => { if (event.target.closest(APP_HEADER)) doubleClickHeader(event); }}>{children}</div>
      {!maximized && RESIZE_EDGES.map((direction) => <div key={direction} aria-hidden="true"
        className={`ubuntu-window__resize ubuntu-window__resize--${direction}`}
        onPointerDown={(event) => beginGesture(event, 'resize', direction)} />)}
    </section>
    {windowMenu && isActive && !workspaceHidden && !minimized && createPortal(<div ref={menuRef} className="ubuntu-window-menu" role="menu" aria-label={`Actions de la fenêtre ${title}`} style={{ left: windowMenu.x, top: windowMenu.y, maxHeight: Math.max(60, window.innerHeight - windowMenu.y - 8) }} onKeyDown={(event) => {
      event.stopPropagation();
      const buttons = [...menuRef.current.querySelectorAll('button:not(:disabled)')];
      const index = buttons.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
      if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); setWindowMenu(null); restoreAppFocus(); }
    }}>
      <button role="menuitem" onClick={() => { setWindowMenu(null); requestMinimize(); }}>Masquer <kbd>Super+H</kbd></button>
      <button role="menuitem" onClick={() => { setWindowMenu(null); changePlacement('toggle'); }}>{maximized ? 'Restaurer' : 'Agrandir'}<kbd>Alt+F10</kbd></button>
      <button role="menuitem" onClick={() => startKeyboardGesture('move')}>Déplacer <kbd>Alt+F7</kbd></button>
      <button role="menuitem" disabled={maximized} onClick={() => startKeyboardGesture('resize')}>Redimensionner <kbd>Alt+F8</kbd></button>
      {onToggleAbove && <button role="menuitemcheckbox" aria-checked={alwaysOnTop} disabled={maximized} onClick={() => { setWindowMenu(null); onToggleAbove(); restoreAppFocus(); }}>Toujours au premier plan <span>{alwaysOnTop ? '✓' : ''}</span></button>}
      {onMoveWorkspace && workspace > 0 && <button role="menuitem" onClick={() => { setWindowMenu(null); onMoveWorkspace(workspace - 1); }}>Déplacer vers le bureau à gauche</button>}
      {onMoveWorkspace && workspace < workspaceCount - 1 && <button role="menuitem" onClick={() => { setWindowMenu(null); onMoveWorkspace(workspace + 1); }}>Déplacer vers le bureau à droite</button>}
      <div role="separator" />
      <button role="menuitem" onClick={() => { setWindowMenu(null); requestClose(); }}>Fermer <kbd>Alt+F4</kbd></button>
    </div>, document.body)}
    {keyboardGesture && isActive && !workspaceHidden && <div className="ubuntu-window-keyboard-hint" role="status">{keyboardGesture === 'move' ? 'Déplacer la fenêtre' : 'Redimensionner la fenêtre'} · Flèches · Entrée pour valider · Échap pour annuler</div>}
  </>;
}
