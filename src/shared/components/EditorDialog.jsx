import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function EditorDialog({ title, children, actions, onCancel }) {
  const ref = useRef(null), id = useId();
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = ref.current;
    dialog.showModal(); dialog.querySelector('[data-default-action]')?.focus();
    return () => { dialog.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} className="ubuntu-editor-save-dialog" aria-labelledby={id} onCancel={(event) => { event.preventDefault(); onCancel(); }} onKeyDown={(event) => event.stopPropagation()}><h2 id={id}>{title}</h2>{children}<div>{actions.map(({ label, onClick, style, defaultAction }, index) => <button key={index} className={style ? `is-${style}` : undefined} data-default-action={defaultAction || undefined} onClick={onClick}>{label}</button>)}</div></dialog>, document.fullscreenElement || document.body);
}
