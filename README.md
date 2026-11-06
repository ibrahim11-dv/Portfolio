# IbrahimOS

Le portfolio d’Ibrahim Chehlafi sous la forme d’un bureau inspiré d’Ubuntu/GNOME, développé avec React 19 et Vite.

Présentation, projets, compétences, parcours et contact s’ouvrent dans leurs propres fenêtres. Le bureau comprend aussi un lecteur de CV/PDF, un gestionnaire de fichiers virtuel, un terminal, un éditeur de texte, un lecteur d’images et le jeu Circuit.

## Démarrer

Utiliser Node.js 22.12+ ou une version LTS plus récente (vérifié avec Node.js 24).

```sh
npm ci
npm run dev
```

Vite affiche l’adresse locale à ouvrir. Les données du portfolio et les médias sont inclus dans le dépôt ; aucun serveur applicatif ni identifiant n’est nécessaire.

## Commandes

| Commande | Usage |
| --- | --- |
| `npm run dev` | Développement avec rechargement automatique |
| `npm run lint` | Qualité du code et règles de séparation des modules |
| `npm test` | Tous les tests Node, découverts automatiquement |
| `npm run build` | Compilation de production dans `dist/` |
| `npm run preview` | Prévisualisation locale de la compilation |
| `npm run check` | Lint, tests puis compilation |

Les tests `*.test.js` restent à côté du module qu’ils vérifient. Par exemple, `node --test src/apps/circuit/circuitGame.test.js` lance uniquement les tests de Circuit.

## Organisation

```text
src/
  main.jsx           Point d’entrée React
  app/               Racine de l’application et fournisseurs globaux
  config/            Catalogue des applications et favoris du dock
  desktop/           Bureau et orchestration
    introduction/    Accueil et guide
    launcher/        Icônes du bureau, dock et grille
    topbar/          Menus système, calendrier et capture d’écran
    windows/         Fenêtres, aperçu et espaces de travail
  apps/              Une zone par application
    appearance/      Réglages d’apparence
    circuit/         Jeu, règles et tests
    documents/       Lecteur PDF/CV
    editor/          Éditeur de texte
    files/           Gestionnaire de fichiers
    images/          Lecteur d’images
    portfolio/
      components/    Éléments réutilisés dans les rubriques
      projects/      Rapports, galerie, aperçus et liens directs
      views/         Profil, Projets, Compétences, Parcours, Contact
    system/          Aide et catalogue des applications installées
    terminal/        Interface et interpréteur de commandes
  data/              Profil, projets, médias et compétences
  shared/            Apparence globale, dialogues et fichiers virtuels
  styles/            Styles globaux et variables de thème
  assets/
    certifs/         Certificats
    projects/        Captures classées par projet
    wallpapers/      Fonds d’écran
public/              Ressources aux URL stables : CV, icônes, identité
docs/                Architecture, sources et vérifications
scripts/             Outils manuels de préparation des médias
```

Pour savoir où intervenir et quelles dépendances préserver, consulter [le guide d’architecture](docs/architecture.md).

## Modifier le contenu

- Identité, coordonnées, formation, expérience et CV : `src/data/portfolioData.js`.
- Projets et rapports : `src/data/projectCatalog.js` et `src/data/projectPresentation.js`.
- Captures et légendes : `src/data/projectMedia.js`, avec les images dans `src/assets/projects/<projet>/`.
- Compétences démontrées : `src/data/skillCapabilities.js`.
- Certificats : `src/assets/certifs/` et `src/apps/portfolio/components/Certificates.jsx`.
- Palette, contrastes et durées communes : `src/styles/variables.css`.

Les URL publiques, identifiants d’applications et clés de stockage font partie du comportement existant. Les changer nécessite une migration explicite. Les fichiers virtuels ne correspondent pas aux fichiers du système d’exploitation du visiteur.

## Documentation et médias

- [Architecture et conventions](docs/architecture.md)
- [Sources des rapports](docs/portfolio-reports.md)
- [Références Ubuntu/GNOME](docs/ubuntu-fidelity.md)
- [Crédits des ressources](docs/third-party-assets.md)

Les scripts de préparation d’images utilisent `sharp` dans l’environnement de préparation des médias ; ils ne sont pas nécessaires au développement ou à la compilation du site. Les images optimisées sont déjà incluses. Le script d’optimisation existant remplace ses originaux : ne le lancer que sur une copie prévue à cet effet.
