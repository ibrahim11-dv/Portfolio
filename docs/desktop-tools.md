# Outils du bureau

## Lancement rapide

La loupe de la barre supérieure, Alt+F2 et l’application Aide ouvrent le même dialogue. La recherche accepte plusieurs mots, sans distinction de casse ou d’accents. Les fenêtres déjà ouvertes apparaissent avant le catalogue des applications, avec leur bureau et leur état. Entrée ouvre le premier résultat ; les flèches permettent de choisir une autre entrée. Échap ferme le dialogue et rend le focus au contrôle précédent.

Les résultats de fenêtres restaurent leur instance existante, y compris depuis un autre bureau. Les résultats d’applications utilisent le routage habituel : aucune exécution de commandes système, aucun nouveau stockage.

### Fichiers, documents récents et actions

Les filtres Tout, Applications, Fenêtres, Fichiers, Récents et Actions limitent la recherche. Les fichiers et dossiers sont recherchés par nom et chemin dans le système virtuel uniquement, sans indexer leur contenu ni accéder au disque de l’ordinateur. Les dossiers implicites sont inclus ; les résultats s’ouvrent dans Fichiers, l’éditeur, le lecteur PDF ou le lecteur d’images existants.

Récents conserve au plus vingt chemins de documents ouverts via le bureau pendant la session, sans doublons et sans stockage persistant. Les chemins supprimés ou renommés sont masqués. Effacer la liste ne supprime aucun fichier. Le CV ouvert directement est également mémorisé ; la liste n’est pas un historique de chaque changement d’onglet interne à une application.

Actions propose Afficher le bureau, puis Restaurer les fenêtres, ainsi que Vue des bureaux. La même logique est utilisée par Super+D : seules les fenêtres visibles du bureau courant sont réduites. La restauration exclut les fenêtres déjà réduites avant l’action, fermées ou déplacées ailleurs entre-temps.

## Gestionnaire de fenêtres

Accessible dans la grille, le lanceur, Aide et via Ctrl+Alt+M. Il affiche uniquement les fenêtres virtuelles d’IbrahimOS, sans prétendre mesurer le processeur ou la mémoire de l’ordinateur. Il permet de rechercher, afficher, restaurer, réduire, déplacer vers un autre bureau et fermer une fenêtre.

La fermeture passe par l’événement habituel `portfolio:window-close`, qui conserve la confirmation des documents non enregistrés. La réduction conserve également son animation habituelle. La liste se met à jour depuis l’état du bureau. Le dock par défaut reste inchangé.

Les raccourcis peuvent être interceptés par le système hôte : tous disposent donc d’un accès visible à la souris ou au toucher. Les nouveaux panneaux n’ajoutent pas d’animations et suivent le thème existant. Le gestionnaire s’adapte à la largeur de sa fenêtre, même sur grand écran.
