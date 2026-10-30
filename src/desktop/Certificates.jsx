import { useId, useRef, useState } from 'react';
import { ArrowUpRight, Download, Expand, X } from 'lucide-react';
import backend from '../assets/certifs/BackEndDevApis_Certificate.webp';
import frontend from '../assets/certifs/FrontEndLibr_Certificate.webp';
import git from '../assets/certifs/GIt_Certificate.webp';

const certificates = [
  { title: 'Back End Development and APIs', issuer: 'freeCodeCamp', date: '12 août 2025', src: backend },
  { title: 'Front End Development Libraries', issuer: 'freeCodeCamp', date: '20 août 2025', src: frontend },
  { title: 'Git Training', issuer: 'Simplilearn · SkillUp', date: '23 août 2025', src: git },
];

export default function Certificates() {
  const [selected, setSelected] = useState(certificates[0]);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const titleId = useId();
  function close() { dialog.current.close(); trigger.current?.focus({ preventScroll: true }); }
  return <section className="portfolio-certificates" aria-label="Certificats">
    <header><span className="portfolio-app__eyebrow">FORMATION CONTINUE</span><h2>Les certificats, à consulter.</h2><p>Trois formations complétées en 2025. Ouvrez un document pour le lire en grand.</p></header>
    <div className="portfolio-certificates__grid">{certificates.map((item) => <button key={item.title} onClick={(event) => { trigger.current = event.currentTarget; setSelected(item); dialog.current.showModal(); }} aria-label={`Consulter le certificat : ${item.title}`}>
      <img src={item.src} alt="" loading="lazy" width="1368" height="886" />
      <span>{item.issuer} · {item.date}</span><h3>{item.title}</h3><strong><Expand size={16} />Consulter le certificat</strong>
    </button>)}</div>
    <dialog ref={dialog} className="certificate-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close(); }} onKeyDown={(event) => event.stopPropagation()} onKeyUp={(event) => event.stopPropagation()} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <header><h2 id={titleId}>{selected.title}</h2><button onClick={close} aria-label="Fermer le certificat" autoFocus><X size={22} /></button></header>
      <div className="certificate-dialog__page"><img src={selected.src} alt={`Certificat ${selected.title}, délivré à Ibrahim Chehlafi par ${selected.issuer}, le ${selected.date}`} /></div>
      <footer><a href={selected.src} target="_blank" rel="noreferrer">Taille originale <ArrowUpRight size={16} /></a><a href={selected.src} download><Download size={16} />Télécharger</a></footer>
    </dialog>
  </section>;
}
