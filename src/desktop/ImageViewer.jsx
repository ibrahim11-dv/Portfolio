import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, FolderOpen, Image, Info, Maximize, Menu, Minimize, Minus, Plus, RotateCcw, RotateCw, X, ZoomIn } from 'lucide-react';
import { canDeletePath, normalizePath, ROOT, trashPaths, uniquePath, writeFiles } from './virtualFs';
import { fitImage, imageFile, readImage } from './imageFiles';
import { formatFileSize } from './fileMetadata';
import EditorDialog from './EditorDialog';
import { MIME_FILES, readFileDrag } from './dragDrop';
import './ImageViewer.css';

const clampZoom = (value) => Math.min(20, Math.max(.05, value));
const basename = (path) => path?.split('/').at(-1) || '';

export default function ImageViewer({ files, setFiles, filePath, onNavigate, onOpenDirectory, onNewWindow, onClose }) {
  const [path, setPath] = useState(filePath || null);
  const [metadata, setMetadata] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(null);
  const [zoomEntry, setZoomEntry] = useState('100');
  const [properties, setProperties] = useState(false);
  const [menu, setMenu] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loadGeneration, setLoadGeneration] = useState(0);
  const rootRef = useRef(null), stageRef = useRef(null), scrollRef = useRef(null), imageRef = useRef(null), menuRef = useRef(null), inputRef = useRef(null), dragRef = useRef(null), filesRef = useRef(files);
  const image = useMemo(() => readImage(files[path]), [files, path]);
  const imageSource = image?.src;
  const dimensions = metadata?.path === path && metadata?.src === image?.src ? metadata : { width: 0, height: 0 };
  const scale = zoom ?? fitImage(dimensions.width, dimensions.height, viewport, rotation);
  const zoomControls = zoom !== null;
  const sideways = Math.abs(rotation % 180) === 90;
  const width = (sideways ? dimensions.height : dimensions.width) * scale;
  const height = (sideways ? dimensions.width : dimensions.height) * scale;
  const directory = path ? normalizePath('..', path) : `${ROOT}/Pictures`;
  const images = useMemo(() => Object.keys(files).filter((candidate) => readImage(files[candidate]) && normalizePath('..', candidate) === directory).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true })), [files, directory]);
  const index = images.indexOf(path);
  const editable = image && canDeletePath(files, path);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => {
    const stage = stageRef.current;
    const resize = () => setViewport({ width: stage.clientWidth, height: stage.clientHeight });
    resize(); const observer = new ResizeObserver(resize); observer.observe(stage);
    const focusFrame = requestAnimationFrame(() => { if (rootRef.current?.closest('.ubuntu-window')?.classList.contains('is-active-window')) rootRef.current.focus({ preventScroll: true }); });
    const fullscreenChanged = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', fullscreenChanged);
    return () => { observer.disconnect(); cancelAnimationFrame(focusFrame); document.removeEventListener('fullscreenchange', fullscreenChanged); };
  }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!menu) return undefined;
    const element = menuRef.current;
    (element.querySelector('input') || element.querySelector('button:not(:disabled)'))?.focus();
    const dismiss = (event) => { if (!element.contains(event.target) && !event.target.closest('[data-loupe-menu]')) setMenu(null); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [menu]);
  useEffect(() => {
    if (!imageSource) return undefined;
    const scroller = scrollRef.current;
    const frame = requestAnimationFrame(() => {
      scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
      scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [path, imageSource, scale, rotation, viewport.width, viewport.height]);
  useEffect(() => {
    const scroller = scrollRef.current;
    function wheel(event) {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setZoom(clampZoom(scale * (event.deltaY < 0 ? 1.1 : 1 / 1.1)));
    }
    scroller.addEventListener('wheel', wheel, { passive: false });
    return () => scroller.removeEventListener('wheel', wheel);
  }, [scale]);

  function focusImage() { requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true })); }
  function selectImage(nextPath) { setPath(nextPath); onNavigate?.(nextPath); setMetadata(null); setRotation(0); setZoom(null); setError(''); setMenu(null); setDialog(null); focusImage(); }
  function navigate(step) { const next = images[index + step]; if (next) selectImage(next); }
  function setScale(value) { setZoom(value === null ? null : clampZoom(value)); setMenu(null); focusImage(); }
  function rotate(step) { setRotation((current) => (current + step + 360) % 360); focusImage(); }
  async function toggleFullscreen() {
    try { if (document.fullscreenElement === rootRef.current) await document.exitFullscreen(); else await rootRef.current.requestFullscreen(); focusImage(); }
    catch { setNotice('Le plein écran n’est pas disponible.'); }
  }
  function deleteImage() {
    setMenu(null);
    if (!editable) { setNotice('Cette image du portfolio est protégée.'); return; }
    const nextPath = images[index + 1] || images[index - 1] || null;
    setFiles(writeFiles(trashPaths(files, [path]))); selectImage(nextPath); setNotice('Image déplacée dans la corbeille.');
  }
  async function importImages(fileList) {
    const selected = [...fileList];
    if (!selected.length) return;
    try {
      const imported = await Promise.all(selected.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onerror = () => reject(new Error('Lecture impossible.'));
        reader.onload = () => {
          const content = imageFile(reader.result, file.type || 'image/jpeg', file.size);
          if (!readImage(content)) reject(new Error('Ce format d’image n’est pas pris en charge.'));
          else resolve({ name: file.name, content });
        };
        reader.readAsDataURL(file);
      })));
      if (!rootRef.current?.isConnected) return;
      let next = filesRef.current; let first;
      imported.forEach(({ name, content }) => {
        const safeName = [...name].map((character) => character === '/' || character === '\\' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? '_' : character).join('');
        const destination = uniquePath(next, `${ROOT}/Pictures`, safeName || 'Image');
        next = { ...next, [destination]: content }; first ||= destination;
      });
      filesRef.current = writeFiles(next); setFiles(filesRef.current); selectImage(first);
    } catch (failure) { setNotice(failure.message || 'Impossible d’ouvrir cette image.'); }
  }
  async function copyImage() {
    if (!image || !imageRef.current?.complete || !dimensions.width) return;
    try {
      const canvas = document.createElement('canvas'); canvas.width = sideways ? dimensions.height : dimensions.width; canvas.height = sideways ? dimensions.width : dimensions.height;
      const context = canvas.getContext('2d'); context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180); context.drawImage(imageRef.current, -dimensions.width / 2, -dimensions.height / 2);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob || !navigator.clipboard?.write || !window.ClipboardItem) throw new Error('Clipboard unavailable');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); setNotice('Image copiée.');
    } catch { setNotice('La copie de l’image n’est pas disponible dans ce navigateur.'); }
  }
  function keyDown(event) {
    if (event.target.closest('input, textarea, [role="menu"]')) return;
    const key = event.key.toLowerCase();
    if (event.altKey && event.key !== 'Enter' || event.metaKey || event.ctrlKey && event.shiftKey && !['r', 'w'].includes(key)) return;
    if (event.key === 'F11') { event.preventDefault(); toggleFullscreen(); }
    else if (event.key === 'Escape') { event.preventDefault(); if (menu) setMenu(null); else if (fullscreen) toggleFullscreen(); else if (properties) setProperties(false); }
    else if (event.key === 'F9' || event.altKey && event.key === 'Enter') { event.preventDefault(); setProperties(!properties); }
    else if (event.key === 'F10') { event.preventDefault(); setMenu(menu ? null : 'main'); }
    else if (event.key === 'F5') { event.preventDefault(); setError(''); setMetadata(null); setZoom(null); setLoadGeneration((current) => current + 1); }
    else if (event.ctrlKey && key === 'o') { event.preventDefault(); setDialog('open'); }
    else if (event.ctrlKey && key === 'n') { event.preventDefault(); onNewWindow(); }
    else if (event.ctrlKey && key === 'w') { event.preventDefault(); onClose(); }
    else if (event.ctrlKey && key === 'c' && !window.getSelection()?.toString()) { event.preventDefault(); copyImage(); }
    else if (event.ctrlKey && key === 'r') { event.preventDefault(); rotate(event.shiftKey ? -90 : 90); }
    else if (['+', '=', '-'].includes(key)) { event.preventDefault(); setScale(scale * (key === '-' ? .8 : 1.25)); }
    else if (['0', '1', '2', '3'].includes(key)) { event.preventDefault(); setScale(key === '0' ? null : Number(key)); }
    else if (event.key === 'Delete' && !event.shiftKey) { event.preventDefault(); deleteImage(); }
    else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      if (event.ctrlKey) scrollRef.current.scrollBy({ left: event.key === 'ArrowLeft' ? -80 : event.key === 'ArrowRight' ? 80 : 0, top: event.key === 'ArrowUp' ? -80 : event.key === 'ArrowDown' ? 80 : 0 });
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') navigate(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); selectImage(event.key === 'Home' ? images[0] : images.at(-1)); }
  }
  function menuKeys(event) {
    event.stopPropagation();
    if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); setMenu(null); focusImage(); }
    if (event.target.tagName === 'INPUT') return;
    if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); const buttons = [...menuRef.current.querySelectorAll('button:not(:disabled)')]; const current = buttons.indexOf(document.activeElement);
      buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    }
  }
  function beginPan(event) {
    if (event.button !== 0 || !image || event.target.closest('button, input')) return;
    rootRef.current.focus({ preventScroll: true });
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: scrollRef.current.scrollLeft, top: scrollRef.current.scrollTop, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pan(event) {
    const drag = dragRef.current; if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 3) { drag.moved = true; setDragging(true); }
    scrollRef.current.scrollLeft = drag.left - dx; scrollRef.current.scrollTop = drag.top - dy;
  }
  function endPan(event) {
    if (dragRef.current?.id !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null; setDragging(false);
  }

  return <div ref={rootRef} className={`loupe ${fullscreen ? 'is-fullscreen' : ''}`} tabIndex={0} onKeyDown={keyDown}>
    <header className="loupe__toolbar"><button aria-label={fullscreen ? 'Quitter le plein écran' : 'Plein écran'} title="Plein écran (F11)" onClick={toggleFullscreen}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button><strong title={path || ''}>{basename(path) || 'Visionneur d’images'}</strong><button aria-label="Propriétés de l’image" aria-pressed={properties} disabled={!image} title="Propriétés de l’image (F9)" onClick={() => { setProperties(!properties); focusImage(); }}><Info size={19} /></button><button data-loupe-menu aria-label="Menu du visionneur" aria-expanded={menu === 'main'} onClick={() => setMenu(menu === 'main' ? null : 'main')}><Menu size={18} /></button></header>
    <div className="loupe__body"><div ref={stageRef} className="loupe__stage" onDragOver={(event) => { if (Array.from(event.dataTransfer.types).some((type) => type === 'Files' || type === MIME_FILES)) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); const dropped = readFileDrag(event).find((candidate) => readImage(files[candidate])); if (dropped) selectImage(dropped); else importImages(event.dataTransfer.files); }}>
      <div ref={scrollRef} className={`loupe__scroll ${dragging ? 'is-panning' : ''}`} onPointerDown={beginPan} onPointerMove={pan} onPointerUp={endPan} onPointerCancel={endPan} onDoubleClick={() => setScale(zoom === null ? 1 : null)}>
        {image && !error ? <div className="loupe__space" style={{ width: Math.max(viewport.width, width + 24), height: Math.max(viewport.height, height + 24) }}><img ref={imageRef} key={`${path}-${loadGeneration}`} src={image.src} alt={basename(path)} draggable={false} onLoad={(event) => setMetadata({ path, src: image.src, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => setError('Cette image ne peut pas être affichée.')} style={{ width: dimensions.width * scale || undefined, height: dimensions.height * scale || undefined, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }} /></div> : <div className="loupe__empty"><Image size={80} strokeWidth={1.25} /><h2>{error || (path ? 'Image introuvable' : 'Afficher des images')}</h2><p>{path ? 'Ouvrez une autre image pour continuer.' : 'Glissez et déposez des images ici'}</p><button onClick={() => setDialog('open')}>Ouvrir des fichiers…</button></div>}
      </div>
      {image && !error && <><div className="loupe__osd loupe__navigation"><button aria-label="Image précédente" disabled={index <= 0} onClick={() => navigate(-1)}><ArrowLeft size={19} /></button><button aria-label="Image suivante" disabled={index < 0 || index >= images.length - 1} onClick={() => navigate(1)}><ArrowRight size={19} /></button></div><div className="loupe__osd loupe__zoom">{zoomControls && <><button aria-label="Réduire l’image" disabled={scale <= .05} onClick={() => setScale(scale * .8)}><Minus size={20} /></button><button aria-label="Agrandir l’image" disabled={scale >= 20} onClick={() => setScale(scale * 1.25)}><Plus size={20} /></button></>}<button aria-label="Basculer le zoom" title="Basculer le zoom" aria-pressed={zoomControls} onClick={() => setScale(zoomControls ? null : scale * 1.25)}><ZoomIn size={19} /></button><button data-loupe-menu aria-label="Choisir le niveau de zoom" aria-expanded={menu === 'zoom'} onClick={() => { setZoomEntry(String(Math.round(scale * 100))); setMenu(menu === 'zoom' ? null : 'zoom'); }}><span>{Math.round(scale * 100)} %</span><ChevronDown size={13} /></button></div></>}
      {menu === 'zoom' && <div ref={menuRef} className="loupe__menu loupe__zoom-menu" role="menu" aria-label="Niveaux de zoom" onKeyDown={menuKeys}>{[3, 2, 1, .66, .5].map((value) => <button role="menuitem" key={value} onClick={() => setScale(value)}>{value * 100} %{value >= 1 && <kbd>Ctrl+{value}</kbd>}</button>)}<form onSubmit={(event) => { event.preventDefault(); const value = Number(zoomEntry.replace(',', '.')); if (value >= 5 && value <= 2000) setScale(value / 100); }}><input aria-label="Niveau de zoom personnalisé" type="text" inputMode="decimal" value={zoomEntry} onChange={(event) => setZoomEntry(event.target.value)} /><button aria-label="Appliquer le zoom" disabled={!Number.isFinite(Number(zoomEntry.replace(',', '.'))) || Number(zoomEntry.replace(',', '.')) < 5 || Number(zoomEntry.replace(',', '.')) > 2000}><Check size={18} /></button></form><button role="menuitem" onClick={() => setScale(null)}>Ajustement optimal<kbd>Ctrl+0</kbd></button></div>}
    </div>
    {properties && image && <aside className="loupe__properties" aria-label="Propriétés de l’image"><div className="loupe__properties-title"><strong>Propriétés de l’image</strong><button aria-label="Fermer les propriétés" onClick={() => { setProperties(false); focusImage(); }}><X size={16} /></button></div><dl><div><dt>Dossier</dt><dd><span>{directory.replace(ROOT, '~')}</span><button aria-label="Ouvrir le dossier contenant l’image" onClick={() => onOpenDirectory(directory)}><FolderOpen size={18} /></button></dd></div><div><dt>URI</dt><dd>{`file://${path}`}</dd></div></dl><dl><div><dt>Dimensions de l’image</dt><dd>{dimensions.width} × {dimensions.height} pixels</dd></div><div><dt>Format de l’image</dt><dd>{image.mime.split('/')[1].replace('svg+xml', 'SVG').toUpperCase()}</dd></div><div><dt>Taille du fichier</dt><dd>{formatFileSize(image.size)}</dd></div></dl></aside>}
    </div>
    {menu === 'main' && <div ref={menuRef} className="loupe__menu loupe__main-menu" role="menu" aria-label="Actions du visionneur" onKeyDown={menuKeys}><button role="menuitem" onClick={() => { setMenu(null); onNewWindow(); }}>Nouvelle fenêtre<kbd>Ctrl+N</kbd></button><button role="menuitem" onClick={() => { setMenu(null); setDialog('open'); }}>Ouvrir…<kbd>Ctrl+O</kbd></button><hr /><div className="loupe__rotate"><span>Rotation</span><button aria-label="Tourner à gauche" disabled={!image} onClick={() => rotate(-90)}><RotateCcw size={19} /></button><button aria-label="Tourner à droite" disabled={!image} onClick={() => rotate(90)}><RotateCw size={19} /></button></div><button role="menuitem" disabled={!editable} onClick={deleteImage}>Supprimer<kbd>Suppr</kbd></button><hr /><button role="menuitem" onClick={() => { setMenu(null); setDialog('shortcuts'); }}>Raccourcis clavier</button><button role="menuitem" onClick={() => { setMenu(null); setDialog('about'); }}>À propos du Visionneur d’images</button></div>}
    <input hidden ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" onChange={(event) => { importImages(event.target.files); event.target.value = ''; }} />
    {dialog && <EditorDialog title={dialog === 'open' ? 'Ouvrir une image' : dialog === 'about' ? 'Visionneur d’images' : 'Raccourcis clavier'} onCancel={() => { setDialog(null); focusImage(); }} actions={[{ label: 'Fermer', defaultAction: true, onClick: () => { setDialog(null); focusImage(); } }]}>{dialog === 'open' ? <div className="loupe__picker">{Object.keys(files).filter((candidate) => readImage(files[candidate])).map((candidate) => <button key={candidate} onClick={() => selectImage(candidate)}><img src={readImage(files[candidate]).src} alt="" /><span>{basename(candidate)}<small>{normalizePath('..', candidate).replace(ROOT, '~')}</small></span></button>)}<button className="loupe__import" onClick={() => inputRef.current.click()}><FolderOpen size={19} />Ouvrir depuis cet ordinateur…</button></div> : dialog === 'about' ? <div className="loupe__about"><img src="/ubuntu-apps/loupe.svg" alt="" /><p>Afficher des images</p><p>Parcourez vos images, ajustez le zoom et consultez leurs propriétés.</p></div> : <dl className="loupe__shortcuts">{[['Image précédente / suivante', '← / →'], ['Première / dernière image', 'Début / Fin'], ['Zoom avant / arrière', '+ / −'], ['Ajustement optimal', 'Ctrl+0'], ['Taille réelle / 200 % / 300 %', 'Ctrl+1 / 2 / 3'], ['Déplacer la vue', 'Ctrl+Flèches'], ['Tourner à droite / gauche', 'Ctrl+R / Ctrl+Maj+R'], ['Propriétés', 'F9 / Alt+Entrée'], ['Plein écran', 'F11'], ['Copier l’image', 'Ctrl+C']].map(([label, keys]) => <div key={label}><dt>{label}</dt><dd><kbd>{keys}</kbd></dd></div>)}</dl>}</EditorDialog>}
    {notice && <div className="loupe__notice" role="status">{notice}<button aria-label="Masquer la notification" onClick={() => { setNotice(''); focusImage(); }}><X size={16} /></button></div>}
  </div>;
}
