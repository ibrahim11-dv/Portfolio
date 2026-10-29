import fleetDashboard from '../assets/parcVision_Dashboard.webp';
import fleetMap from '../assets/parcVision_map.webp';
import fleetArchive from '../assets/parcVision_archivage.webp';
import fleetSearch from '../assets/parcVisionbarRechercheOCR.webp';
import fleetHome from '../assets/parcVision1.webp';
import fleetDrivers from '../assets/projects/parcvision-conducteurs.webp';
import fleetVehicles from '../assets/projects/parcvision-vehicules.webp';
import fleetExpenses from '../assets/projects/parcvision-depenses.webp';
import fleetMission from '../assets/projects/parcvision-preparation-mission.webp';
import campusAdmin from '../assets/PFE_admin.webp';
import campusTeacher from '../assets/PFE_teacher.webp';
import campusStudent from '../assets/PFE_student.webp';
import campusDepartment from '../assets/PFE_chef.webp';
import citadelHome from '../assets/projects/citadel-accueil.webp';
import citadelLocal from '../assets/projects/citadel-partie-locale.webp';
import learnHome from '../assets/projects/learnxcompile-accueil.webp';
import learnChapters from '../assets/projects/learnxcompile-parcours-java.webp';
import learnCode from '../assets/projects/learnxcompile-exemple-java.webp';
import learnQuiz from '../assets/projects/learnxcompile-quiz-java.webp';
import learnLesson from '../assets/projects/learnxcompile-lecon-types-de-donnees.webp';
import learnExercise from '../assets/projects/learnxcompile-exercice-java.webp';
import learnProgress from '../assets/projects/learnxcompile-profil-progression.webp';
import citadelStockfish from '../assets/projects/citadel-stockfish.webp';
import citadelPuzzles from '../assets/projects/citadel-tactique-sacrifice.webp';
import citadelInvitation from '../assets/projects/citadel-invitation-en-ligne.webp';
import citadelRematch from '../assets/projects/citadel-revanche-en-ligne.webp';
import citadelAppearance from '../assets/projects/citadel-personnalisation.webp';

// Original screenshots supplied by Ibrahim. Captured values are not outcome metrics.
export const PROJECT_MEDIA = {
  citadel: [
    { src: citadelHome, title: 'Accueil de The Citadel', caption: 'Présentation du jeu et accès aux modes local, contre le moteur et aux exercices.', credit: 'Captures réalisées dans une session locale de démonstration.' },
    { src: citadelLocal, title: 'Partie locale et historique', caption: 'Deux joueurs sur le même échiquier, sans compte : position après e4, e5, Cf3 et Cc6, avec la feuille des coups.', credit: 'Captures réalisées dans une session locale de démonstration.' },
    { src: citadelStockfish, title: 'Partie contre Stockfish', caption: 'Le moteur répond à e4 par e6. La feuille des coups, les indices et le retour en arrière accompagnent la partie.', credit: 'Capture réalisée dans une session locale de démonstration.' },
    { src: citadelInvitation, title: 'En ligne : inviter un adversaire', caption: 'Salon en ligne : lien d’invitation à partager et saisie du code pour rejoindre une partie privée.', credit: 'Capture de test existante du projet · version antérieure de l’interface.' },
    { src: citadelRematch, title: 'En ligne : résultat et revanche', caption: 'Fin de partie synchronisée avec le serveur : résultat, horloges, exports PGN/FEN et demande de revanche.', credit: 'Capture de test existante du projet · version antérieure de l’interface.' },
    { src: citadelPuzzles, title: 'Tactique : le sacrifice de Légal', caption: 'Légal’s finish : une combinaison fondée sur le sacrifice de dame pour lancer l’attaque des pièces mineures. La position, l’analyse et les commandes d’aide restent visibles.', credit: 'Capture réalisée dans une session locale de démonstration.' },
    { src: citadelAppearance, title: 'Personnalisation de l’échiquier', caption: 'Aperçu de l’échiquier et choix des palettes, du style et de la teinte des pièces.', credit: 'Capture réalisée dans une session locale de démonstration.' },
  ],
  learnxcompile: [
    { src: learnHome, title: 'Accueil et langages', caption: 'Accès aux cours Java, Python et C++, recherche et reprise de la dernière leçon.', orientation: 'portrait' },
    { src: learnChapters, title: 'Parcours Java', caption: 'Liste des leçons avec leurs états : terminé, en cours ou verrouillé.', orientation: 'portrait' },
    { src: learnLesson, title: 'Leçon sur les types de données', caption: 'Première étape : explication des types primitifs et de référence, points clés et complément pédagogique.', orientation: 'portrait' },
    { src: learnCode, title: 'Exemple de code', caption: 'La leçon sur les types de données présente un exemple Java et sa sortie attendue.', orientation: 'portrait' },
    { src: learnQuiz, title: 'Question à choix multiples', caption: 'Étape de vérification des connaissances sur les types de données Java, avant validation de la réponse.', orientation: 'portrait' },
    { src: learnExercise, title: 'Exercice de programmation', caption: 'Consigne, code de départ et sortie attendue pour mettre en pratique les types de données Java.', orientation: 'portrait' },
    { src: learnProgress, title: 'Profil et progression', caption: 'Profil du compte de démonstration et progression par langage. Les pourcentages correspondent uniquement à la session capturée.', orientation: 'portrait' },
  ],
  parcvision: [
    { src: fleetDashboard, title: 'Tableau de bord', caption: 'Vue opérationnelle de la flotte, des missions et des interventions. Les chiffres sont ceux de la capture.' },
    { src: fleetDrivers, title: 'Gestion des conducteurs', caption: 'Liste des conducteurs, disponibilités, recherche et filtre par statut.', credit: 'Capture fournie par Ibrahim · données de démonstration.' },
    { src: fleetVehicles, title: 'Gestion des véhicules', caption: 'Inventaire de la flotte avec immatriculation, modèle, type et état de disponibilité.', credit: 'Capture fournie par Ibrahim · données de démonstration.' },
    { src: fleetMission, title: 'Préparation d’une mission', caption: 'Formulaire associant conducteur, véhicule, trajet, horaires et caractéristiques du colis.', credit: 'Capture fournie par Ibrahim · aperçu du formulaire.' },
    { src: fleetMap, title: 'Carte des missions', caption: 'Carte Leaflet et liste des missions. Le suivi GPS du projet est une simulation.' },
    { src: fleetExpenses, title: 'Suivi des dépenses', caption: 'Consultation des dépenses par date, source, mode de paiement et statut, avec recherche et pagination.', credit: 'Capture fournie par Ibrahim · montants de démonstration.' },
    { src: fleetArchive, title: 'Archives documentaires', caption: 'Arborescence des dossiers et consultation des pièces de la flotte.' },
    { src: fleetSearch, title: 'Recherche dans le contenu', caption: 'Résultats de recherche avec extraits et termes surlignés dans les documents.' },
    { src: fleetHome, title: 'Page d’accueil', caption: 'Écran de présentation et accès à la connexion de ParcVision.' },
  ],
  'pfe-esto': [
    { src: campusAdmin, title: 'Administration', caption: 'Liste des étudiants et accès aux filières, modules, notes et réclamations.' },
    { src: campusTeacher, title: 'Espace enseignant', caption: 'Détail d’un module, répartition des notes et liste des étudiants inscrits.' },
    { src: campusStudent, title: 'Espace étudiant', caption: 'Consultation des résultats, des rattrapages et des réclamations.' },
    { src: campusDepartment, title: 'Chef de département', caption: 'Vue des modules du département, avec filière, semestre, enseignant et statut.' },
  ],
};
