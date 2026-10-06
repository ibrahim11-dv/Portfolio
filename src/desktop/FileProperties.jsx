import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, FolderOpen, LockKeyhole, X } from 'lucide-react';
import { canDeletePath, isDirectory, normalizePath, ROOT } from './virtualFs';
import { fileMetadata, formatFileSize, summarizeFiles } from './fileMetadata';
import './FileProperties.css';

const basename = (path) => path.split('/').filter(Boolean).pop() || 'Ordinateur';

export default function FileProperties({ files, paths, onClose, onOpenDirectory }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [page, setPage] = useState('main');
  const existing = paths.filter((path) => Object.hasOwn(files, path) || isDirectory(files, path));
  const single = paths.length === 1;
  const path = paths[0];
  const metadata = single && existing.length ? fileMetadata(files, path) : null;
  const summary = summarizeFiles(files, existing);
  const parent = single ? normalizePath('..', path) : existing.length && existing.every((entry) => normalizePath('..', entry) === normalizePath('..', existing[0])) ? normalizePath('..', existing[0]) : null;
  const protectedCount = existing.filter((entry) => !canDeletePath(files, entry)).length;
  const access = !existing.length ? 'Élément indisponible' : protectedCount === existing.length ? 'Lecture seule' : protectedCount ? 'Accès différents' : 'Lecture et écriture';
  const name = single ? basename(path) : `${paths.length} éléments`;
  const icon = metadata?.icon || (existing.length && existing.every((entry) => isDirectory(files, entry)) ? '/ubuntu-apps/folder.png' : '/ubuntu-apps/file.png');
  const content = `${summary.fileCount} fichier${summary.fileCount === 1 ? '' : 's'}${summary.folderCount ? `, ${summary.folderCount} dossier${summary.folderCount === 1 ? '' : 's'}` : ''}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    dialog.querySelector('button[aria-label="Fermer"]')?.focus({ preventScroll: true });
    return () => { dialog.close(); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector('header button')?.focus({ preventScroll: true });
  }, [page]);

  function openParent() { onClose(); onOpenDirectory(parent, existing); }

  return createPortal(<dialog ref={dialogRef} className="nautilus-properties" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
    event.stopPropagation();
    if (page !== 'main' && event.altKey && event.key === 'ArrowLeft') { event.preventDefault(); setPage('main'); }
  }}>
    <header>{page !== 'main' && <button aria-label="Retour aux propriétés" onClick={() => setPage('main')}><ChevronLeft size={18} /></button>}<h2 id={titleId}>{page === 'main' ? 'Propriétés' : 'Permissions'}</h2><button aria-label="Fermer" onClick={onClose}><X size={16} /></button></header>
    <div className="nautilus-properties__body">
      {page === 'main' ? <>
        <div className="nautilus-properties__identity"><img src={icon} alt="" /><h3>{name}</h3>{metadata && <span>{metadata.type}</span>}<small>{formatFileSize(summary.totalSize)}{single && !isDirectory(files, path) && summary.totalSize >= 1000 ? ` (${summary.totalSize.toLocaleString('fr-FR')} octets)` : ''}</small>{(!single || isDirectory(files, path)) && <span>{content}</span>}</div>
        {!existing.length ? <p role="status" className="nautilus-properties__unavailable">Cet élément a été déplacé ou supprimé.</p> : <>
          {parent && <section className="nautilus-properties__group"><div className="nautilus-properties__row"><div><span>Dossier parent</span><p>{parent === ROOT ? 'Dossier personnel' : parent}</p></div><button aria-label="Ouvrir le dossier parent" title="Ouvrir le dossier parent" onClick={openParent}><FolderOpen size={19} /></button></div></section>}
          <section className="nautilus-properties__group"><button className="nautilus-properties__row is-navigation" onClick={() => setPage('permissions')}><span>Permissions</span><span className="nautilus-properties__access">{access}</span><ChevronRight size={17} /></button></section>
          {protectedCount > 0 && <p className="nautilus-properties__protection"><LockKeyhole size={14} />{protectedCount === existing.length ? 'Élément du portfolio protégé' : `${protectedCount} élément${protectedCount > 1 ? 's' : ''} du portfolio protégé${protectedCount > 1 ? 's' : ''}`}</p>}
        </>}
      </> : <>
        <section className="nautilus-properties__group"><div className="nautilus-properties__row"><div><span>Accès</span><p>{access}</p></div></div><div className="nautilus-properties__row"><div><span>Modification, renommage et suppression</span><p>{protectedCount === existing.length ? 'Non autorisés pour les éléments du portfolio' : protectedCount ? 'Autorisés pour vos créations et copies uniquement' : 'Autorisés pour vos créations et copies'}</p></div></div></section>
        <p className="nautilus-properties__explanation">Les documents originaux restent disponibles pour tous les visiteurs. Vous pouvez les copier pour créer votre propre version.</p>
        {existing.map((entry) => <div key={entry} className="nautilus-properties__permission-item"><span>{basename(entry)}</span><small>{canDeletePath(files, entry) ? 'Lecture et écriture' : 'Lecture seule'}</small></div>)}
      </>}
    </div>
  </dialog>, document.body);
}
