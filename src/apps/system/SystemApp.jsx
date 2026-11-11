import { useEffect, useState } from 'react';
import { HelpCircle, PackageOpen, Pin, Search } from 'lucide-react';
import { APPS_LAYOUT_EVENT, DESKTOP_APPS, PORTFOLIO_APP_IDS, readDockFavorites, writeDockFavorites } from '../../config/apps';

const APP_META = {
  presentation: { category: 'portfolio', desc: 'Profil ingénieur, vision technique et accès rapide aux sections clés.' },
  projects: { category: 'portfolio', desc: 'Projets logiciels, embarqués et systèmes avec dépôts et détails techniques.' },
  skills: { category: 'portfolio', desc: 'Compétences en développement, électronique, Linux et architecture.' },
  journey: { category: 'portfolio', desc: 'Parcours académique et jalons d’apprentissage d’Ibrahim Chehlafi.' },
  contact: { category: 'portfolio', desc: 'Coordonnées directes, liens GitHub/LinkedIn et prise de contact.' },
  cv: { category: 'portfolio', desc: 'Lecteur de CV PDF intégré avec téléchargement direct.' },
  files: { category: 'office', desc: 'Gestionnaire de fichiers virtuel avec glisser-déposer, corbeille et recherche.' },
  editor: { category: 'office', desc: 'Éditeur de texte multi-onglets avec recherche regex et aperçu Markdown (Alt+P).' },
  images: { category: 'office', desc: 'Visionneur d’images avec zoom, rotation et métadonnées.' },
  calculator: { category: 'office', desc: 'Calculatrice arithmétique avec mémoire, historique et copie rapide.' },
  clock: { category: 'office', desc: 'Minuteur persistant, chronomètre à tours et horloges mondiales.' },
  terminal: { category: 'system', desc: 'Terminal bash simulé (ps, kill, focus, tree, find, du, df, grep, neofetch).' },
  windows: { category: 'system', desc: 'Gestionnaire de fenêtres, inspecteur de stockage JSON et catalogue de raccourcis.' },
  appearance: { category: 'system', desc: 'Personnalisation du thème clair/sombre et des fonds d’écran Ubuntu.' },
  settings: { category: 'system', desc: 'Centre de paramètres GNOME : affichage, son, dock, multitâche et informations système.' },
  help: { category: 'system', desc: 'Guide interactif du bureau IbrahimOS et documentation des raccourcis.' },
  circuit: { category: 'lab', desc: 'Atelier interactif de simulation de circuits logiques et électroniques.' },
  chess: { category: 'lab', desc: 'Jeu d’échecs complet avec moteur tactique et historique des coups.' },
};

const HELP_TOPICS = [
  { title: 'Fichiers et dossiers', body: 'Cliquez dans un espace vide du bureau ou dans Fichiers pour créer un document ou un dossier. Renommez avec F2, dupliquez avec Ctrl+D, ouvrez un dossier dans le terminal par clic droit et restaurez depuis la corbeille. Les éléments du portfolio sont protégés.' },
  { title: 'Terminal & Commandes système', body: 'Ouvrez le terminal avec Ctrl+Alt+T. Utilisez ps, focus <app> et kill <app> pour piloter les fenêtres, tree et find pour explorer l’arborescence, du et df pour analyser le stockage, ou neofetch et uname -a.' },
  { title: 'Fenêtres & Ancrage 4 coins', body: 'Déplacez une fenêtre vers les bords gauche/droit pour l’ancrer à 50 %, vers le haut pour la maximiser, ou dans l’un des 4 angles de l’écran pour l’ancrer en quart d’écran (25 %). Utilisez le menu d’application dans la barre supérieure ou Alt+Espace.' },
  { title: 'Éditeur & Aperçu Markdown', body: 'Ouvrez n’importe quel fichier .md (À propos.md, README.md des projets) dans l’Éditeur de texte et cliquez sur l’icône d’œil (Alt+P) pour basculer entre le code source et l’aperçu Markdown formaté.' },
  { title: 'Lancement rapide & Calcul direct', body: 'Alt+F2 recherche applications, fenêtres, fichiers, récents et actions système. Saisissez directement une expression mathématique (ex. 15 * 24 ou = 120 / 4) pour obtenir et copier le résultat instantanément.' },
  { title: 'Gestionnaire système & Sauvegarde', body: 'Ctrl+Alt+M ouvre le Gestionnaire de fenêtres avec ses 3 onglets : Fenêtres (bureaux, épinglage sur tous les bureaux), Stockage (répartition par type et export/import JSON de vos fichiers) et Raccourcis.' },
  { title: 'Horloge, Minuteur & Agenda', body: 'Ctrl+Alt+H ouvre le minuteur persistant, le chronomètre et les horloges mondiales. Cliquez sur la date en haut de l’écran pour ajouter des notes personnelles sur n’importe quel jour du calendrier.' },
];

export default function SystemApp({ kind, onOpen, onReplayIntroduction, onQuickLaunch }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState(readDockFavorites);

  useEffect(() => {
    const sync = () => setFavorites(readDockFavorites());
    window.addEventListener(APPS_LAYOUT_EVENT, sync);
    return () => window.removeEventListener(APPS_LAYOUT_EVENT, sync);
  }, []);

  function togglePin(appId) {
    const next = favorites.includes(appId)
      ? favorites.filter((id) => id !== appId)
      : [...favorites, appId];
    setFavorites(writeDockFavorites(next));
  }

  if (kind === 'help') {
    const filteredTopics = HELP_TOPICS.filter((topic) => `${topic.title} ${topic.body}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    return <div className="ubuntu-simple-app">
      <div className="ubuntu-simple-app__header">
        <HelpCircle size={40} />
        <div>
          <h2>Guide du bureau IbrahimOS</h2>
          <p>Tout ce dont vous avez besoin pour maîtriser le bureau, les applications et les raccourcis.</p>
        </div>
      </div>
      <label className="ubuntu-simple-app__search">
        <Search size={16} />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans l’aide (terminal, ancrage, markdown, stockage…)" aria-label="Rechercher dans l’aide" />
      </label>
      <div className="ubuntu-help-topics">
        {filteredTopics.map((topic) => <article key={topic.title}><h3>{topic.title}</h3><p>{topic.body}</p></article>)}
      </div>
      <div className="ubuntu-help-actions">
        <button className="desktop-action" onClick={onQuickLaunch}>Lancement rapide (Alt+F2)</button>
        <button className="desktop-action" onClick={() => onOpen('windows')}>Gestionnaire système</button>
        <button className="desktop-action" onClick={() => onOpen('settings')}>Paramètres</button>
        <button className="desktop-action" onClick={(event) => onReplayIntroduction?.(event.currentTarget)}>Revoir l’accueil et la visite</button>
        <button className="desktop-action" onClick={() => window.open('https://help.ubuntu.com/', '_blank', 'noopener,noreferrer')}>Documentation Ubuntu</button>
      </div>
    </div>;
  }

  if (kind === 'store') {
    const apps = DESKTOP_APPS.filter((app) => app.id !== 'store').filter((app) => {
      const meta = APP_META[app.id] || { category: PORTFOLIO_APP_IDS.includes(app.id) ? 'portfolio' : 'system', desc: 'Application intégrée à IbrahimOS.' };
      if (category !== 'all' && meta.category !== category) return false;
      const q = query.trim().toLocaleLowerCase();
      return !q || `${app.name} ${meta.desc}`.toLocaleLowerCase().includes(q);
    });
    return <div className="ubuntu-simple-app">
      <div className="ubuntu-simple-app__header">
        <PackageOpen size={40} />
        <div>
          <h2>App Center · Applications installées</h2>
          <p>Explorez les applications d’IbrahimOS, lancez-les ou épinglez-les au dock.</p>
        </div>
      </div>
      <div className="ubuntu-store-controls">
        <label className="ubuntu-simple-app__search">
          <Search size={16} />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une application…" aria-label="Rechercher une application" />
        </label>
        <div className="ubuntu-store-categories" role="group" aria-label="Catégories">
          {[['all', 'Toutes'], ['portfolio', 'Portfolio'], ['office', 'Bureautique'], ['system', 'Système'], ['lab', 'Atelier & Jeux']].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="ubuntu-store-grid">
        {apps.map((app) => {
          const meta = APP_META[app.id] || { desc: 'Application installée.' };
          const pinned = favorites.includes(app.id);
          return <div className="ubuntu-store-card" key={app.id}>
            <img src={app.icon} alt="" />
            <div>
              <strong>{app.name} {app.shortcut && <kbd>{app.shortcut}</kbd>}</strong>
              <small>{meta.desc}</small>
            </div>
            <div className="ubuntu-store-card__actions">
              <button type="button" aria-pressed={pinned} title={pinned ? 'Retirer des favoris du dock' : 'Épingler au dock'} onClick={() => togglePin(app.id)}>
                <Pin size={14} /> {pinned ? 'Au dock' : 'Épingler'}
              </button>
              <button type="button" className="is-primary" onClick={() => onOpen(app.id)}>Ouvrir</button>
            </div>
          </div>;
        })}
      </div>
    </div>;
  }
  return null;
}
