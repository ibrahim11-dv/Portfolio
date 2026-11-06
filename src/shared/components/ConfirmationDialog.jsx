import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmationDialog.css';

export default function ConfirmationDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    dialog.querySelector('button')?.focus();
    return () => { dialog.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return createPortal(<dialog ref={dialogRef} className="ubuntu-confirmation-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onCancel(); }} onKeyDown={(event) => {
    event.stopPropagation();
    if (event.key !== 'Tab') return;
    const buttons = [...dialogRef.current.querySelectorAll('button')];
    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
    if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
  }}>
    <h2 id={titleId}>{title}</h2>
    <p>{message}</p>
    <div><button onClick={onCancel}>Annuler</button><button className="is-destructive" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>, document.body);
}
