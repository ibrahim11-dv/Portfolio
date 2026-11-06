# Vérification de la réorganisation — 6 novembre 2026

## Portée

Séparation du bureau, des applications, des données, du code partagé et des styles. Extraction des cinq vues du portfolio, des composants de présentation communs et de l’application Aide/App Center. Classement des captures par projet et des fonds d’écran dans leur dossier dédié.

Les modifications de Circuit présentes avant ce travail sont conservées. Aucun changement des identifiants d’application, clés de stockage, URL publiques ou formats du système de fichiers virtuel.

## Contrôles automatiques

- Avant réorganisation : 97 tests réussis, compilation réussie.
- Après réorganisation : `npm run check` réussi (lint, 97 tests, compilation).
- 240 références relatives de modules, styles et ressources résolues.
- 62 médias source déplacés ou conservés : contenu binaire identique.
- 110 modules/styles comparés : seules les références de fichiers ont changé.
- Neuf composants extraits du fichier de vues : corps des fonctions identiques.
- Logique de `DesktopShell` et de `PortfolioApp` comparée : inchangée, hors extraction d’Aide/App Center et adaptation des imports.
- 78 ressources compilées hors JavaScript/HTML comparées : identiques, notamment les deux feuilles de style compilées, les images et le worker PDF.
- `git diff --check` sans erreur.

## Vérifications dans la version de production locale

- Arrivée sur l’accueil puis entrée dans le bureau.
- Présentation et ouverture de Projets depuis son action principale.
- Recherche « ParcVision », ouverture du rapport, capture chargée, agrandissement et fermeture au clavier.
- Ouverture du CV depuis le rapport, rendu du PDF, zoom de 150 % à 180 %, retour aux Projets puis retour à la liste avec la recherche conservée.
- Ouverture de Compétences, Parcours (y compris la liste des certificats) et Contact depuis la grille.
- Ouverture de Fichiers, Éditeur de texte, Visionneur d’images, Circuit, Apparence, Aide et App Center.
- Commande `pwd` dans le terminal : `/home/ibrahim`.
- Plusieurs fenêtres simultanées et fermeture des applications vérifiées.
- Contact à 390 px : pas de débordement horizontal de la page ni de son contenu ; actions e-mail et copie visibles.
- Aucune erreur console relevée pendant ce parcours.

Captures locales : `.artifacts/structure-desktop.jpg` et `.artifacts/structure-mobile.jpg`.

## Limites

Ce contrôle visuel couvre les parcours cités, pas chaque interaction de chaque application. Les fonctionnalités de fichiers, terminal, progression de Circuit, migrations et restauration de session sont aussi couvertes par les tests existants. L’avertissement Vite sur le poids du fichier JavaScript principal existait avant cette réorganisation et reste présent ; ce travail ne change pas la stratégie de chargement des applications.
