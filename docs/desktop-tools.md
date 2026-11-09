# Outils du bureau

## Lancement rapide

La loupe de la barre supérieure, Alt+F2 et l’application Aide ouvrent le même dialogue. La recherche accepte plusieurs mots, sans distinction de casse ou d’accents. Les fenêtres déjà ouvertes apparaissent avant le catalogue des applications, avec leur bureau et leur état. Entrée ouvre le premier résultat ; les flèches permettent de choisir une autre entrée. Échap ferme le dialogue et rend le focus au contrôle précédent.

Les résultats de fenêtres restaurent leur instance existante, y compris depuis un autre bureau. Les résultats d’applications utilisent le routage habituel : aucune exécution de commandes système, aucun nouveau stockage.

## Gestionnaire de fenêtres

Accessible dans la grille, le lanceur, Aide et via Ctrl+Alt+M. Il affiche uniquement les fenêtres virtuelles d’IbrahimOS, sans prétendre mesurer le processeur ou la mémoire de l’ordinateur. Il permet de rechercher, afficher, restaurer, réduire, déplacer vers un autre bureau et fermer une fenêtre.

La fermeture passe par l’événement habituel `portfolio:window-close`, qui conserve la confirmation des documents non enregistrés. La réduction conserve également son animation habituelle. La liste se met à jour depuis l’état du bureau. Le dock par défaut reste inchangé.

Les raccourcis peuvent être interceptés par le système hôte : tous disposent donc d’un accès visible à la souris ou au toucher. Les nouveaux panneaux n’ajoutent pas d’animations et suivent le thème existant. Le gestionnaire s’adapte à la largeur de sa fenêtre, même sur grand écran.
