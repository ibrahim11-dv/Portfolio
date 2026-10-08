import { createContext, useContext } from 'react';
import { PROFILE } from './portfolioData';

const Actions = createContext({});
export function PortfolioActions({ onOpenCV, onNotify, children }) {
  return <Actions.Provider value={{ onOpenCV, onNotify }}>{children}</Actions.Provider>;
}
export function CVAction({ children = 'Lire le CV', className = '', download = false }) {
  const { onOpenCV, onNotify } = useContext(Actions);
  return <a className={className} href={PROFILE.cvUrl} download={download || undefined} onClick={(event) => {
    if (download) { onNotify?.('Téléchargement demandé.'); return; }
    if (onOpenCV && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault(); onOpenCV(event.currentTarget);
    }
  }}>{children}</a>;
}
