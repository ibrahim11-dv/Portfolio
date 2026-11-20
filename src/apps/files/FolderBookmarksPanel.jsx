import { Star, X } from 'lucide-react';
import { isDirectory } from '../../shared/filesystem/virtualFs';

export default function FolderBookmarks({ paths, files, cwd, onOpen, onRemove, labelFor }) {
  return <section className="ubuntu-files__bookmarks" aria-label="Dossiers favoris">
    <h2>Favoris</h2>
    {!paths.length && <p>Ajoutez un dossier avec l’étoile de la barre d’outils.</p>}
    {paths.map((path) => {
      const available = isDirectory(files, path);
      const label = labelFor(path);
      return <div className="ubuntu-files__bookmark" key={path}>
        <button disabled={!available} title={path} aria-label={`${label} · ${available ? 'dossier favori' : 'dossier indisponible'}`} aria-current={cwd === path ? 'location' : undefined} className={cwd === path ? 'is-selected' : ''} onClick={() => onOpen(path)}><Star size={16} /><span>{label}{!available && <small>Indisponible</small>}</span></button>
        <button title="Retirer des favoris" aria-label={`Retirer ${label} des favoris`} onClick={() => onRemove(path)}><X size={15} /></button>
      </div>;
    })}
  </section>;
}
