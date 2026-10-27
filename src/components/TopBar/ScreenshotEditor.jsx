import { useEffect, useRef, useState } from 'react';
import { Camera, Download, Maximize, Scan, X, ArrowLeft } from 'lucide-react';
import './ScreenshotEditor.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export default function ScreenshotEditor({ source, onClose, onNotify }) {
  const dialogRef = useRef(null);
  const imageRef = useRef(null);
  const selectionRef = useRef(null);
  const drag = useRef(null);
  const outputRef = useRef(null);
  const alive = useRef(false);
  const [size, setSize] = useState(null);
  const [area, setArea] = useState(null);
  const [mode, setMode] = useState('area');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [filename] = useState(() => `Capture-${new Date().toISOString().replaceAll(':', '-').slice(0, 19)}.png`);

  useEffect(() => {
    alive.current = true;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      alive.current = false;
      dialog.close();
      if (outputRef.current) URL.revokeObjectURL(outputRef.current);
      document.querySelector('.ubuntu-topbar__system-btn')?.focus();
    };
  }, []);

  function loaded() {
    if (size) return;
    const { naturalWidth: width, naturalHeight: height } = imageRef.current;
    setSize({ width, height });
  }
  function point(event) {
    const rect = imageRef.current.getBoundingClientRect();
    return { x: clamp(Math.round((event.clientX - rect.left) * size.width / rect.width), 0, size.width), y: clamp(Math.round((event.clientY - rect.top) * size.height / rect.height), 0, size.height) };
  }
  function start(event, kind) {
    if (!size || mode !== 'area' || busy || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { kind, start: point(event), area: area || { x: 0, y: 0, ...size }, pointerId: event.pointerId };
    selectionRef.current?.focus({ preventScroll: true });
  }
  function move(event) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const p = point(event), dx = p.x - current.start.x, dy = p.y - current.start.y, a = current.area;
    if (current.kind === 'move') {
      setArea({ ...a, x: clamp(a.x + dx, 0, size.width - a.width), y: clamp(a.y + dy, 0, size.height - a.height) });
      return;
    }
    let left = a.x, top = a.y, right = a.x + a.width, bottom = a.y + a.height;
    if (current.kind === 'new') {
      left = Math.min(current.start.x, p.x); right = Math.max(current.start.x, p.x);
      top = Math.min(current.start.y, p.y); bottom = Math.max(current.start.y, p.y);
    } else {
      if (current.kind.includes('w')) left = clamp(a.x + dx, 0, right - 1);
      if (current.kind.includes('e')) right = clamp(a.x + a.width + dx, left + 1, size.width);
      if (current.kind.includes('n')) top = clamp(a.y + dy, 0, bottom - 1);
      if (current.kind.includes('s')) bottom = clamp(a.y + a.height + dy, top + 1, size.height);
    }
    left = Math.min(left, size.width - 1); top = Math.min(top, size.height - 1);
    setArea({ x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) });
  }
  function keyboard(event) {
    if (!size || mode !== 'area') return;
    const offsets = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!offsets[event.key]) return;
    event.preventDefault();
    const [dx, dy] = offsets[event.key].map(value => value * (event.altKey ? 1 : 10));
    setArea(a => event.shiftKey
      ? { ...a, width: clamp(a.width + dx, 1, size.width - a.x), height: clamp(a.height + dy, 1, size.height - a.y) }
      : { ...a, x: clamp(a.x + dx, 0, size.width - a.width), y: clamp(a.y + dy, 0, size.height - a.height) });
  }
  async function capture() {
    if (!size || busy || (mode === 'area' && !area)) return;
    setBusy(true); setError(''); setFeedback('');
    try {
      const crop = mode === 'full' ? { x: 0, y: 0, ...size } : area;
      const canvas = document.createElement('canvas');
      canvas.width = crop.width; canvas.height = crop.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Le navigateur ne peut pas préparer cette image.');
      context.drawImage(imageRef.current, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Impossible de préparer la capture. Réessayez avec une zone plus petite.');
      if (!alive.current) return;
      if (outputRef.current) URL.revokeObjectURL(outputRef.current);
      outputRef.current = URL.createObjectURL(blob);
      setResult({ url: outputRef.current, width: crop.width, height: crop.height });
      requestAnimationFrame(() => dialogRef.current?.querySelector('a[download]')?.focus());
    } catch (reason) { if (alive.current) setError(reason.message); }
    finally { if (alive.current) setBusy(false); }
  }
  function selectMode() {
    setMode('area');
    if (!area && size) setArea({ x: Math.floor(size.width * .1), y: Math.floor(size.height * .1), width: Math.max(1, Math.floor(size.width * .8)), height: Math.max(1, Math.floor(size.height * .8)) });
    requestAnimationFrame(() => selectionRef.current?.focus());
  }
  return <dialog ref={dialogRef} className={`ubuntu-capture${result ? '' : ' is-selecting'}`} aria-labelledby="capture-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><h2 id="capture-title">{result ? 'Votre capture' : 'Capture d’écran'}</h2><p id="capture-help">{result ? `${result.width} × ${result.height} pixels · PNG` : 'Tracez une zone, déplacez-la ou ajustez ses poignées.'}</p></div><button className="ubuntu-capture__close" aria-label="Fermer la capture" onClick={onClose}><X size={22} /></button></header>
    {result ? <div className="ubuntu-capture__preview"><img src={result.url} alt="Aperçu de la zone capturée" /></div> : <div className="ubuntu-capture__stage">
      <div className={`ubuntu-capture__image ${mode === 'full' ? 'is-full' : ''} ${!area && mode === 'area' ? 'awaiting-selection' : ''}`} onPointerDown={event => start(event, 'new')} onPointerMove={move} onPointerUp={() => { drag.current = null; selectionRef.current?.focus({ preventScroll: true }); }} onPointerCancel={() => { drag.current = null; }}>
        <img ref={imageRef} src={source} alt="Surface partagée à recadrer" draggable={false} onLoad={loaded} onError={() => setError('Impossible de lire la capture. Fermez et relancez la capture.')} />
        {size && area && mode === 'area' && <div ref={selectionRef} tabIndex={0} role="group" aria-label="Zone de capture" aria-describedby="capture-keyboard" className="ubuntu-capture__selection" style={{ left: `${area.x / size.width * 100}%`, top: `${area.y / size.height * 100}%`, width: `${area.width / size.width * 100}%`, height: `${area.height / size.height * 100}%` }} onPointerDown={event => start(event, 'move')} onKeyDown={keyboard}>
          <span className="ubuntu-capture__dimensions">{area.width} × {area.height}</span>
          {handles.map(handle => <span key={handle} aria-hidden="true" className={`ubuntu-capture__handle is-${handle}`} onPointerDown={event => start(event, handle)} />)}
        </div>}
      </div>
    </div>}
    <footer>
      {result ? <><button onClick={() => { setResult(null); setFeedback(''); requestAnimationFrame(() => selectionRef.current?.focus()); }}><ArrowLeft size={18} />Modifier la zone</button><a href={result.url} download={filename} className="ubuntu-capture__download" onClick={() => { setFeedback('Téléchargement demandé.'); onNotify?.('Téléchargement de la capture demandé.'); }}><Download size={18} />Télécharger le PNG</a></> : <><div className="ubuntu-capture__modes" aria-label="Type de capture"><button aria-pressed={mode === 'area'} onClick={selectMode}><Scan size={21} />Sélection</button><button aria-pressed={mode === 'full'} onClick={() => setMode('full')}><Maximize size={21} />Tout l’écran</button></div><button className="ubuntu-capture__shutter" disabled={!size || busy || (mode === 'area' && !area)} onClick={capture}><Camera size={22} />{busy ? 'Préparation…' : 'Capturer'}</button></>}
    </footer>
    {!result && <p id="capture-keyboard" className="ubuntu-capture__hint">Flèches : déplacer · Maj + flèches : redimensionner · Alt : précision · Échap : annuler</p>}
    <p className="ubuntu-capture__error" role="status">{error}</p>
    {result && <p className="ubuntu-capture__hint" role="status">{feedback}</p>}
  </dialog>;
}
