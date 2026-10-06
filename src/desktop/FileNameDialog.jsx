import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { canModifyPath, isDirectory, normalizePath, uniquePath } from './virtualFs';
import './FileNameDialog.css';

const basename = (path) => path.split('/').filter(Boolean).pop() || path;

export default function FileNameDialog({ operation, directory, directoryLabel = basename(directory), files, onSave, onClose, presentation = 'desktop' }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const restoreFocusRef = useRef(true);
  const showingRef = useRef(false);
  const id = useId();
  const [name, setName] = useState(() => operation.path ? basename(operation.path) : presentation === 'files' ? '' : basename(uniquePath(files, directory, operation.kind === 'folder' ? 'Nouveau dossier' : 'Nouveau document.txt')));
  const [submitError, setSubmitError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const clean = name.trim();
  const destination = normalizePath(clean, directory);
  const title = operation.path ? 'Renommer' : operation.kind === 'folder' ? 'Nouveau dossier' : 'Nouveau document';
  const error = !clean ? 'Le nom ne peut pas être vide.'
    : clean === '.' || clean === '..' ? 'Ce nom est réservé.'
      : /[\\/]/.test(clean) || [...clean].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ? 'Le nom ne peut pas contenir de barre oblique ou de caractère de contrôle.'
        : new TextEncoder().encode(clean).length > 255 ? 'Ce nom est trop long.'
          : !isDirectory(files, directory) ? 'Ce dossier n’existe plus.'
            : operation.path && !Object.hasOwn(files, operation.path) && !isDirectory(files, operation.path) ? 'Cet élément a été déplacé ou supprimé.'
              : destination !== operation.path && (Object.hasOwn(files, destination) || Object.keys(files).some((path) => path.startsWith(`${destination}/`))) ? 'Un élément porte déjà ce nom.'
                : destination !== operation.path && !canModifyPath(files, destination) ? 'Ce nom appartient à un élément protégé du portfolio.' : '';
  const visibleError = submitError || (attempted ? error : '');

  useEffect(() => {
    showingRef.current = true;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    if (presentation === 'popover') dialog.show();
    else dialog.showModal();
    const input = inputRef.current;
    input.focus();
    const extension = input.value.lastIndexOf('.');
    input.setSelectionRange(0, operation.kind === 'folder' || extension < 1 ? input.value.length : extension);
    return () => {
      showingRef.current = false;
      dialog.close();
      if (restoreFocusRef.current && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [operation.kind, presentation]);

  useEffect(() => {
    if (presentation !== 'popover') return undefined;
    const dialog = dialogRef.current;
    function position() {
      const anchor = operation.anchor;
      if (!anchor?.isConnected) { restoreFocusRef.current = false; onClose(false); return; }
      const rect = anchor.getBoundingClientRect();
      const popup = dialog.getBoundingClientRect();
      const left = Math.max(8, Math.min(window.innerWidth - popup.width - 8, rect.left + (rect.width - popup.width) / 2));
      const top = rect.bottom + popup.height + 10 < window.innerHeight ? rect.bottom + 10 : Math.max(40, rect.top - popup.height - 10);
      dialog.style.left = `${left}px`;
      dialog.style.top = `${top}px`;
      dialog.style.setProperty('--name-arrow-left', `${Math.max(20, Math.min(popup.width - 20, rect.left + rect.width / 2 - left))}px`);
      dialog.dataset.above = top < rect.top ? 'true' : 'false';
    }
    function dismiss(event) { if (showingRef.current && !dialog.contains(event.target)) { restoreFocusRef.current = false; onClose(false); } }
    position();
    const observer = new ResizeObserver(position);
    observer.observe(dialog);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);
    document.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);
    return () => {
      observer.disconnect();
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('focusin', dismiss);
      document.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
    };
  }, [presentation, operation.anchor, onClose]);

  function submit(event) {
    event.preventDefault();
    setAttempted(true);
    if (error) { inputRef.current.focus(); return; }
    const failure = onSave(clean);
    if (failure) { setSubmitError(failure); inputRef.current.focus(); }
  }

  return createPortal(<dialog ref={dialogRef} className={`ubuntu-name-dialog is-${presentation}`} aria-labelledby={`${id}-title`} onClick={(event) => event.stopPropagation()} onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => { event.stopPropagation(); if (presentation === 'popover' && event.key === 'Escape') { event.preventDefault(); onClose(); } }}>
    <form onSubmit={submit}>
      <header><h2 id={`${id}-title`}>{title}</h2>{presentation === 'files' && <button type="button" aria-label="Fermer" onClick={onClose}><X size={16} /></button>}</header>
      {presentation === 'desktop' && <p>Dans le dossier {directoryLabel}</p>}
      <div className="ubuntu-name-dialog__entry"><label htmlFor={`${id}-name`}>{presentation === 'popover' ? 'Nouveau nom' : operation.kind === 'folder' ? 'Nom du dossier' : 'Nom du fichier'}</label>
      <input ref={inputRef} id={`${id}-name`} value={name} onChange={(event) => { setName(event.target.value); setSubmitError(''); setAttempted(true); }} autoComplete="off" spellCheck={false} aria-invalid={Boolean(visibleError)} aria-describedby={`${id}-feedback`} /></div>
      <div id={`${id}-feedback`} hidden={presentation !== 'desktop' && !visibleError && !clean.startsWith('.')} className={`ubuntu-name-dialog__feedback ${visibleError ? 'is-error' : ''}`} role={visibleError ? 'alert' : undefined}>{visibleError || (clean.startsWith('.') ? 'Les noms commençant par un point sont masqués par défaut.' : '\u00a0')}</div>
      <footer>{presentation === 'desktop' && <button type="button" onClick={onClose}>Annuler</button>}<button type="submit" className="is-primary" disabled={Boolean(error)}>{operation.path ? 'Renommer' : 'Créer'}</button></footer>
    </form>
  </dialog>, document.body);
}
