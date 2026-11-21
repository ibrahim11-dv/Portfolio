# Outils du bureau

## Dossiers favoris dans Fichiers

L’étoile de la barre d’outils ajoute ou retire le dossier courant. Le menu contextuel d’un dossier et le menu de Fichiers proposent également cette action. Le panneau **Favoris** ouvre les dossiers en un clic ; sa croix retire uniquement le raccourci, jamais le dossier. Sur mobile, ce panneau reste accessible avec le bouton du panneau latéral et se referme après navigation.

Jusqu’à vingt chemins de dossiers virtuels sont conservés dans le navigateur et synchronisés entre les fenêtres de Fichiers. Aucun fichier de l’ordinateur n’est consulté. Si le stockage est refusé ou saturé, les changements restent disponibles pendant la session et le message d’action le précise. Les favoris ne modifient pas la protection des documents du portfolio.

Un dossier supprimé, déplacé ou renommé laisse un favori marqué **Indisponible**, qui peut être retiré. Une restauration au même emplacement le rend utilisable de nouveau. Les favoris suivent les chemins, pas l’identité des dossiers : après un déplacement ou un renommage, ajoutez le nouvel emplacement.

Validation : ajout par étoile et menu contextuel, ouverture au clavier, suppression du raccourci, rechargement, synchronisation de deux fenêtres, mise à la corbeille puis restauration d’un dossier de test. Vérification clair/sombre et mobile à 319 px ; contrôle des débordements à 390, 900 et 1280 px et dans une fenêtre étroite. Tests unitaires des données invalides, doublons, limites et échecs de stockage. La synchronisation entre onglets distincts n’a pas fait l’objet d’un test manuel.

## Alarmes de session

Dans **Horloge → Alarmes**, programmez jusqu’à dix rappels avec un nom et une heure locale. Chaque alarme vise la prochaine occurrence de cette heure (aujourd’hui ou demain), sans répétition quotidienne automatique. Elle peut être désactivée, réactivée ou supprimée. Lorsqu’elle arrive à échéance, elle propose **Arrêter** ou **Reporter de 5 min**.

Le calendrier conserve la notification visuelle ; aucune autorisation de notification système ni son n’est requis. Le mode Ne pas déranger masque la bannière mais conserve l’historique. Le minuteur et plusieurs alarmes arrivant simultanément produisent un message groupé. Chaque occurrence n’est annoncée qu’une fois.

La fermeture de la fenêtre Horloge ne supprime pas les alarmes. Elles restent en mémoire de session tant que la page est ouverte, mais un rechargement les efface. Un navigateur suspendu ne peut pas afficher de rappel à l’heure exacte : les échéances sont vérifiées à son réveil. Aucun accès aux alarmes de l’ordinateur, aucune synchronisation externe.

Validation de cette extension : tests unitaires des échéances locales, limites, désactivation, report, suppression et déclenchement simultané avec le minuteur ; contrôle dans le navigateur du rappel fenêtre fermée, de l’historique en mode Ne pas déranger, de l’arrêt et du retour du focus. Contrôle des thèmes clair/sombre et des largeurs 319, 390, 900 et 1280 px sans débordement horizontal. Le report a été vérifié dans l’interface et son second déclenchement par test unitaire, sans attendre cinq minutes dans le navigateur. Les changements d’heure d’été/hiver et la suspension réelle de l’appareil n’ont pas été testés manuellement.

## Lancement rapide

La loupe de la barre supérieure, Alt+F2 et l’application Aide ouvrent le même dialogue. La recherche accepte plusieurs mots, sans distinction de casse ou d’accents. Les fenêtres déjà ouvertes apparaissent avant le catalogue des applications, avec leur bureau et leur état. Entrée ouvre le premier résultat ; les flèches permettent de choisir une autre entrée. Échap ferme le dialogue et rend le focus au contrôle précédent.

Les résultats de fenêtres restaurent leur instance existante, y compris depuis un autre bureau. Les résultats d’applications utilisent le routage habituel : aucune exécution de commandes système, aucun nouveau stockage.

### Fichiers, documents récents et actions

Les filtres Tout, Applications, Fenêtres, Fichiers, Récents et Actions limitent la recherche. Les fichiers et dossiers sont recherchés par nom et chemin dans le système virtuel uniquement, sans indexer leur contenu ni accéder au disque de l’ordinateur. Les dossiers implicites sont inclus ; les résultats s’ouvrent dans Fichiers, l’éditeur, le lecteur PDF ou le lecteur d’images existants.

Récents conserve au plus vingt chemins de documents ouverts via le bureau pendant la session, sans doublons et sans stockage persistant. Les chemins supprimés ou renommés sont masqués. Effacer la liste ne supprime aucun fichier. Le CV ouvert directement est également mémorisé ; la liste n’est pas un historique de chaque changement d’onglet interne à une application.

Actions propose Afficher le bureau, puis Restaurer les fenêtres, ainsi que Vue des bureaux, l’inspection du stockage virtuel, les raccourcis clavier et le verrouillage de session. Une expression arithmétique saisie dans la recherche (par exemple `15 * 24` ou `= 120 / 4`) est évaluée immédiatement et permet d’ouvrir la Calculatrice avec le résultat. La même logique d’affichage du bureau est utilisée par Super+D : seules les fenêtres visibles du bureau courant (ou épinglées sur tous les bureaux) sont réduites. La restauration exclut les fenêtres déjà réduites avant l’action, fermées ou déplacées ailleurs entre-temps.

## Gestionnaire de fenêtres, stockage et raccourcis

Accessible dans la grille, le lanceur, Aide et via Ctrl+Alt+M. Il affiche uniquement les fenêtres et données virtuelles d’IbrahimOS, sans prétendre mesurer le processeur ou la mémoire de l’ordinateur. Il comporte trois vues :
- **Fenêtres** : rechercher, filtrer par bureau, afficher, restaurer, réduire, épingler sur tous les bureaux, déplacer vers un autre bureau et fermer une fenêtre (ou fermer toutes les fenêtres réduites).
- **Stockage** : inspecter la répartition du système de fichiers virtuel (documents protégés du portfolio, créations personnelles, corbeille), consulter les fichiers les plus volumineux, exporter ses créations au format JSON ou importer une sauvegarde JSON sans jamais écraser les fichiers protégés.
- **Raccourcis** : parcourir et déclencher les raccourcis clavier d’IbrahimOS.

La barre supérieure affiche également le nom et l’icône de la fenêtre active avec un menu permettant de l’agrandir, de l’ancrer à gauche ou à droite, de la masquer, de l’épingler sur tous les bureaux ou de la fermer. Les fenêtres peuvent aussi être ancrées dans les quatre coins de l’espace de travail.

La fermeture passe par l’événement habituel `portfolio:window-close`, qui conserve la confirmation des documents non enregistrés. La réduction conserve également son animation habituelle. La liste se met à jour depuis l’état du bureau. Le dock par défaut reste inchangé.

Les raccourcis peuvent être interceptés par le système hôte : tous disposent donc d’un accès visible à la souris ou au toucher. Les nouveaux panneaux n’ajoutent pas d’animations et suivent le thème existant. Le gestionnaire s’adapte à la largeur de sa fenêtre, même sur grand écran.

## Images : diaporama et vignettes

Le lecteur propose un diaporama manuel à démarrer, avec une durée de 3, 5 ou 10 secondes et une répétition facultative. La lecture est suspendue lorsque la fenêtre est inactive, lorsque la page est masquée ou pendant la consultation des menus et propriétés. La navigation manuelle, le zoom et la rotation arrêtent la lecture. Le téléchargement récupère l’image originale.

Le bouton **Vignettes** affiche les images du dossier dans une bande horizontale repliable, également utilisable au clavier. L’image courante possède une bordure et un état accessible. Sélectionner une vignette ouvre cette image et arrête le diaporama. Les miniatures conservent leurs proportions et sont chargées à la demande ; la bande est masquée par défaut pour préserver la place de lecture sur mobile.

Validation des vignettes : sélection par Entrée, mise à jour de l’image courante et arrêt du diaporama après sélection manuelle vérifiés dans le navigateur. À 319 × 720 px en thème sombre, les commandes restent visibles et la page ne déborde pas horizontalement. Aucune erreur de console observée pendant ce parcours. Les autres tailles et le thème clair n’ont pas été revérifiés pour cette extension. Lint, 143 tests et compilation réussis.
