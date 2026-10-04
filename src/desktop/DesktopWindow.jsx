import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, X } from 'lucide-react';

export default function DesktopWindow({ title, icon, children, appId, initialPosition, onClose, onFocus, zIndex, minimized = false }) {
  const [maximized, setMaximized] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const dragRef = useRef(null);
  useEffect(() => {
    function move(event) {
      if (!dragRef.current || maximized) return;
      const next = { x: event.clientX - dragRef.current.offsetX, y: event.clientY - dragRef.current.offsetY };
      setPosition({ x: Math.max(60, Math.min(window.innerWidth - 240, next.x)), y: Math.max(38, Math.min(window.innerHeight - 90, next.y)) });
    }
    function up() { dragRef.current = null; document.body.style.userSelect = ''; }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [maximized]);
  function startDrag(event) {
    if (event.target.closest('button, input, select, a')) return;
    if (maximized || event.button !== 0) return;
    const rect = event.currentTarget.closest('.ubuntu-window').getBoundingClientRect();
    dragRef.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    document.body.style.userSelect = 'none';
  }
  if (minimized) return null;
  return <section className={`ubuntu-window ${maximized ? 'is-maximized' : ''}`} style={maximized ? { zIndex } : { left: position.x, top: position.y, zIndex }} data-app={appId} onPointerDown={onFocus}>
    <header className="ubuntu-window__header" onDoubleClick={() => setMaximized((value) => !value)} onPointerDown={startDrag}>
      <span className="ubuntu-window__title"><img src={icon} alt="" />{title}</span>
      <div className="ubuntu-window__controls">
        <button aria-label="Réduire" onClick={(event) => { event.stopPropagation(); onFocus('minimize'); }}><Minus size={15} /></button>
        <button aria-label={maximized ? 'Restaurer' : 'Maximiser'} onClick={(event) => { event.stopPropagation(); setMaximized((value) => !value); }}><Maximize2 size={14} /></button>
        <button aria-label="Fermer" onClick={(event) => { event.stopPropagation(); onClose(); }}><X size={15} /></button>
      </div>
    </header>
    <div className="ubuntu-window__content" onPointerDown={(event) => { if (event.target.closest('.ubuntu-files__toolbar, .ubuntu-terminal__chrome, .ubuntu-editor__toolbar')) startDrag(event); }} onDoubleClick={(event) => { if (event.target.closest('.ubuntu-files__toolbar, .ubuntu-terminal__chrome, .ubuntu-editor__toolbar') && !event.target.closest('button, input, select')) setMaximized((value) => !value); }}>{children}</div>
  </section>;
}
