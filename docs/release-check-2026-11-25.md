# Vérification avant partage — 25 novembre 2026

## Résultat

Lint, 159 tests et compilation de production réussis. Aucun blocage rencontré dans le parcours recruteur testé sur la compilation locale. Aucun message d’erreur de console observé durant ces parcours.

## Contrôles réalisés

- Accueil : accès direct aux projets, sans obligation de terminer le guide.
- Ouverture des neuf rapports, retour aux collections et étapes manuelles des trois rapports secondaires.
- ParcVision : galerie, image suivante, fermeture avec Échap ; lecture automatique jusqu’à la fin ; lien direct `?project=parcvision`.
- Recherche conservée après rapport → CV → retour ; filtre Application mobile donnant un résultat et recherche sans résultat.
- CV local : rendu du document actualisé, recherche Spring (six résultats), zoom et retour aux Projets.
- Contact : liens Gmail, GitHub et LinkedIn présents avec les bonnes destinations ; copie de l’adresse confirmée. Aucun message envoyé.
- Horloge : favoris au clavier, recherche sans accents, état vide, fermeture/réouverture et conservation des favoris.
- Ouverture de Présentation, Compétences, Parcours, Fichiers, Terminal et Éditeur. Ceci est un contrôle d’ouverture, pas une validation exhaustive de chaque application.
- Contact et rapport ParcVision : largeur de document contrôlée à 1280, 900, 390 et 319 px, sans débordement horizontal global. Les chapitres utilisent leur propre défilement horizontal sur mobile.
- Contrôles visuels en sombre (Contact, Horloge) et clair (Présentation, ParcVision).
- Sur Vercel : le lecteur charge le CV existant, y compris sur mobile. Son contenu est plus ancien que le PDF local.

## Ajustement pour LinkedIn

Ajout des métadonnées Open Graph, de la carte de partage et de l’adresse canonique dans index.html. Réutilisation de public/brand/og-image.png (1200 × 630), sans nouvelle image ni dépendance.

## Limites et étape de publication

- La version en ligne n’a pas été redéployée pendant cette vérification. Elle ne contient pas encore le nouveau CV ni les métadonnées ajoutées ici. Vérifier le déploiement après envoi de l’ensemble des changements voulus.
- L’aperçu effectivement généré par LinkedIn n’a pas été contrôlé ; les nouvelles métadonnées doivent d’abord être déployées.
- La réception des téléchargements sur disque, le refus du presse-papiers, le mouvement réduit activé dans le navigateur et tous les scénarios de fenêtres/espaces de travail n’ont pas été revérifiés dans cette passe.
- L’avertissement de taille du paquet JavaScript principal demeure (environ 665 kB avant compression). La compilation réussit ; le découpage supplémentaire est une amélioration de performance ultérieure.
- Les modifications de contenu déjà présentes (CV, données, captures et accueil) sont conservées sans réécriture.

Capture de contrôle locale : `.artifacts/release-project-mobile.jpg` (fichier ignoré par Git).
