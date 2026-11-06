import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function DesktopDialog({ title, children, onClose, dismissible = true, variant }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.querySelector('.ubuntu-topbar__system-btn')?.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="desktop-dialog" data-variant={variant} aria-labelledby="desktop-dialog-title"
      onCancel={(event) => { event.preventDefault(); if (dismissible) onClose(); }}
      onClick={(event) => { if (dismissible && event.target === event.currentTarget) onClose(); }}>
      <div className="desktop-dialog__body">
        <header><h2 id="desktop-dialog-title">{title}</h2>
          {dismissible && <button onClick={onClose} aria-label="Fermer" className="ubuntu-qs-footer__btn"><X size={18} /></button>}
        </header>
        {children}
      </div>
    </dialog>
  );
}
