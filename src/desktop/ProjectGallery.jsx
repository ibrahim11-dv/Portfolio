import { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react';

export default function ProjectGallery({ project, images }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();
  const current = images[index];
  function select(next) {
    setIndex((next + images.length) % images.length);
    setZoomed(false);
  }
  function close() {
    dialogRef.current.close();
    setZoomed(false);
    triggerRef.current?.focus({ preventScroll: true });
  }
  function keys(event) {
    // Keep the desktop's shortcuts from acting on a modal image viewer.
    event.stopPropagation();
    if (event.target.tagName === 'INPUT') return;
    if (event.key === 'ArrowRight') { event.preventDefault(); select(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); select(index - 1); }
    if (event.key === 'Home') { event.preventDefault(); select(0); }
    if (event.key === 'End') { event.preventDefault(); select(images.length - 1); }
  }
  const caption = <><strong>{current.title}</strong><p>{current.caption}</p></>;
  return <section className="project-gallery" aria-label={`Captures de ${project.name}`} onKeyDown={keys}>
    <header><div><span className="project-report__eyebrow">CAPTURES DU PROJET</span><h2>L’application à l’écran.</h2></div><span>{images.length} vues</span></header>
    <figure>
      <button ref={triggerRef} className="project-gallery__preview" onClick={() => dialogRef.current.showModal()} aria-label={`Agrandir : ${current.title}`}>
        <img src={current.src} alt={`${project.name} — ${current.title}`} loading="lazy" decoding="async" />
        <span><Expand size={15} />Agrandir</span>
      </button>
      <figcaption aria-live="polite">{caption}</figcaption>
    </figure>
    <div className="project-gallery__thumbnails" aria-label="Choisir une capture">{images.map((item, position) => <button key={item.src} onClick={() => select(position)} aria-pressed={position === index} aria-label={`Capture ${position + 1} : ${item.title}`}><img src={item.src} alt="" loading="lazy" /><span>{String(position + 1).padStart(2, '0')} / {item.title}</span></button>)}</div>
    <p className="project-gallery__note">Captures fournies par Ibrahim · les données visibles appartiennent aux écrans capturés.</p>
    <dialog ref={dialogRef} className="project-gallery__dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <header><h2 id={titleId}>{project.name} / {current.title}</h2><button aria-label="Fermer la capture" onClick={close} autoFocus><X size={20} /></button></header>
      <div className={`project-gallery__canvas ${zoomed ? 'is-zoomed' : ''}`}><img src={current.src} alt={`${project.name} — ${current.title}`} /></div>
      <footer><button aria-label="Capture précédente" onClick={() => select(index - 1)}><ArrowLeft size={18} /></button><span role="status">{index + 1} / {images.length}</span><button aria-label="Capture suivante" onClick={() => select(index + 1)}><ArrowRight size={18} /></button><button aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? 'Adapter à l’écran' : 'Taille originale'}</button></footer>
      <div className="project-gallery__caption">{caption}</div>
    </dialog>
  </section>;
}
