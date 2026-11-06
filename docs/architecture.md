# Architecture d’IbrahimOS

## Principe

Le bureau orchestre les fenêtres ; les applications affichent leur contenu ; les données et services communs restent indépendants de cette orchestration. Une réorganisation de fichiers ne doit modifier ni le rendu ni les données conservées par les visiteurs.

```text
main → app → desktop → apps
               ↓        ↓
             shared ←───┘
               ↓
           data / config
```

`desktop` et `apps` peuvent également lire directement `data` et `config`. Les composants ne passent pas par des fichiers de réexport globaux : leurs imports montrent le module réellement utilisé.

## Responsabilités

| Zone | Rôle | Exemples |
| --- | --- | --- |
| `app` | Racine React et fournisseur d’apparence | `App.jsx` |
| `config` | Identités des applications, ordre et favoris | `apps.js` |
| `desktop` | Ouverture, focus, fermeture, espaces, session et retour du CV | `DesktopShell.jsx` |
| `desktop/windows` | Position, taille, maximisation, aperçu | `DesktopWindow.jsx`, `WindowOverview.jsx` |
| `desktop/launcher` | Bureau, dock et grille | `DesktopItems.jsx`, `DesktopDock.jsx` |
| `desktop/topbar` | Menus système et capture | `TopBar.jsx`, `ScreenshotEditor.jsx` |
| `desktop/introduction` | Accueil et transitions du guide | `DesktopIntroduction.jsx`, `introJourney.js` |
| `apps/<application>` | Interface et logique propre à l’application | `FileManager.jsx`, `CircuitApp.jsx` |
| `apps/portfolio/views` | Une vue par rubrique du portfolio | `ProfileView.jsx`, `SkillsView.jsx`, `ContactView.jsx` |
| `apps/portfolio/projects` | Rapports, galerie et navigation de projet | `ProjectReport.jsx`, `projectRoute.js` |
| `data` | Contenu éditorial, preuves et associations de médias | `projectCatalog.js`, `projectMedia.js` |
| `shared/filesystem` | Stockage virtuel, protections, métadonnées et transferts | `virtualFs.js`, `dragDrop.js` |
| `shared/appearance` | Thème et fond d’écran pour toutes les applications | `AppearanceContext.jsx` |
| `shared/components` | Dialogues employés par plusieurs applications | `ConfirmationDialog.jsx`, `FileNameDialog.jsx` |
| `shared/sessionState.js` | Fonctions pures de restauration de fenêtre et de lecture | `findReusableWindow`, `normalizeReadingState` |
| `styles` | Réinitialisation, variables et styles transversaux | `index.css`, `variables.css`, `applications.css` |

Les cinq rubriques du portfolio conservent leurs identifiants et fenêtres indépendants. `PortfolioApp.jsx` leur fournit une enveloppe commune et conserve leur navigation ; chacune de leurs vues possède désormais son propre fichier. Les rapports restent dans l’application Projets.

## Règles de dépendance

- Une application demande l’ouverture d’une autre application par les callbacks fournis par `DesktopShell`, sans importer le bureau.
- `shared` contient ce qui est réellement utilisé par plusieurs applications. Une fonction propre au terminal reste dans `apps/terminal`.
- `data` et `config` ne dépendent pas des composants React, du bureau ou des services partagés.
- ESLint refuse les imports du bureau depuis `apps`/`shared` et les imports d’interface depuis `data`/`config`.
- Les styles d’un composant restent à côté de celui-ci. Les styles transversaux hérités restent regroupés dans `styles/applications.css` : leur ordre de chargement est volontairement préservé.
- Les tests accompagnent leur logique (`circuitGame.test.js`, `virtualFs.test.js`, etc.). `npm test` découvre tous les tests sans liste de chemins à maintenir.

## État et ressources

`DesktopShell` conserve l’état de session des applications et la lecture du CV. `shared/filesystem` garde les migrations et la protection des fichiers d’origine. `shared/appearance` possède les préférences d’affichage et le stockage local des fonds importés. Les identifiants, clés de stockage et formats de ces données n’ont pas changé pendant la réorganisation.

Les captures sont classées par projet dans `assets/projects` : `parcvision`, `pfe-esto`, `citadel` et `learnxcompile`. Les originaux et variantes WebP existants sont conservés. Les imports de `data/projectMedia.js` sélectionnent les versions affichées. `public` conserve ses chemins pour ne pas casser les liens du CV et les icônes.

Le lecteur PDF reste chargé à la demande depuis `apps/documents/DocumentViewer.jsx`, avec son worker PDF.js.

## Où ajouter une fonctionnalité

1. Une nouvelle application : créer `apps/<nom>/`, déclarer son identité dans `config/apps.js`, puis la brancher dans `DesktopShell.jsx`.
2. Une rubrique du portfolio : modifier sa vue dans `apps/portfolio/views/`, ses données dans `data/` et les styles du portfolio.
3. Une commande du terminal : modifier `apps/terminal/terminalShell.js` et ses tests ; utiliser le système de fichiers partagé pour les mutations.
4. Un comportement commun aux fenêtres : intervenir dans `desktop/windows/` ou dans l’orchestration de `DesktopShell`, pas dans chaque application.
5. Un changement de thème : ajuster les variables communes et vérifier les deux thèmes, notamment avec `styles/palette.test.js`.

## Vérifier une modification

Lancer `npm run check`, puis contrôler dans le navigateur les applications concernées. Pour un changement transversal, parcourir au minimum l’accueil, les cinq rubriques, un rapport et sa galerie, le CV, les fichiers, le terminal, l’éditeur, les images et Circuit. Vérifier aussi une petite largeur et le retour à l’application d’origine.

Les captures locales de vérification temporaires vont dans `.artifacts/` (ignoré par Git). `artifacts/` contient les captures déjà conservées dans l’historique du projet.
