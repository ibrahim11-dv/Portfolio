# Échecs

Application `chess`, accessible depuis le bureau et la grille, sans changer les favoris du dock. Ouverture directe du plateau ; une seule fenêtre, avec reprise de la partie pendant la session même après fermeture. Le rechargement de la page commence une nouvelle session.

Les blancs sont contrôlés par le visiteur. Le robot noir choisit uniformément un coup légal, après une courte pause de 450 ms. C’est volontairement un adversaire débutant, sans Stockfish ni service externe. Les règles sont gérées par [chess.js](https://jhlywa.github.io/chess.js/). La partie est conservée comme historique de coups pour préserver notamment les répétitions de position.

Le plateau affiche les destinations possibles, le dernier coup et le roi en échec. Roque, prise en passant, quatre choix de promotion, mat et nulles sont pris en compte. « Annuler un tour » retire le coup du visiteur et la réponse éventuelle du robot. Une nouvelle partie demande confirmation. Flèches pour parcourir les cases, Entrée/Espace pour sélectionner et jouer, Échap pour désélectionner.

## Organisation

- `src/apps/chess/ChessApp.jsx` : interaction et temporisation du robot, annulée à la fermeture ou au changement de partie.
- `src/apps/chess/chessGame.js` : restauration, sélection du coup, annulation et statut.
- `src/apps/chess/ChessPiece.jsx` : six silhouettes SVG dessinées pour cette application.
- `src/apps/chess/ChessApp.css` : plateau adaptatif et interface reprenant le thème global.
- `src/apps/chess/chessGame.test.js` : six tests ciblés.

Le code du jeu est chargé à la demande pour éviter de l’ajouter au chargement initial du bureau.

## Vérification du 8 novembre 2026

`npm run check` : lint, 103 tests et compilation réussis. L’avertissement existant sur la taille du fichier JavaScript principal demeure.

Dans le navigateur : lancement depuis le bureau et la grille, fenêtre unique, coup e4 et réponse du robot, annulation du tour, déplacement au clavier, fermeture/réouverture conservant la partie, annulation puis confirmation d’une nouvelle partie. Thèmes clair/sombre et largeur 319 px contrôlés ; pas de débordement horizontal ni d’erreur console observée. Les règles spéciales et fins de partie ont été vérifiées par les tests automatisés, pas par une partie manuelle complète.

Captures locales : `.artifacts/chess-desktop.jpg` et `.artifacts/chess-mobile.jpg`.
