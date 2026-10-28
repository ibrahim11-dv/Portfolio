import fleetDashboard from '../assets/parcVision_Dashboard.png';
import fleetMap from '../assets/parcVision_map.png';
import fleetArchive from '../assets/parcVision_archivage.png';
import fleetSearch from '../assets/parcVisionbarRechercheOCR.png';
import fleetHome from '../assets/parcVision1.png';
import campusAdmin from '../assets/PFE_admin.png';
import campusTeacher from '../assets/PFE_teacher.png';
import campusStudent from '../assets/PFE_student.png';
import campusDepartment from '../assets/PFE_chef.png';
import citadelHome from '../assets/projects/citadel-accueil.jpg';
import citadelLocal from '../assets/projects/citadel-partie-locale.jpg';
import learnHome from '../assets/projects/learnxcompile-accueil.png';
import learnChapters from '../assets/projects/learnxcompile-parcours-java.png';
import learnCode from '../assets/projects/learnxcompile-exemple-java.png';
import learnQuiz from '../assets/projects/learnxcompile-quiz-java.png';
import learnLesson from '../assets/projects/learnxcompile-lecon-types-de-donnees.png';
import learnExercise from '../assets/projects/learnxcompile-exercice-java.png';
import learnProgress from '../assets/projects/learnxcompile-profil-progression.png';
import citadelStockfish from '../assets/projects/citadel-stockfish.jpg';
import citadelPuzzles from '../assets/projects/citadel-tactique-sacrifice.jpg';
import citadelInvitation from '../assets/projects/citadel-invitation-en-ligne.png';
import citadelRematch from '../assets/projects/citadel-revanche-en-ligne.png';
import citadelAppearance from '../assets/projects/citadel-personnalisation.jpg';

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
    { src: fleetMap, title: 'Carte des missions', caption: 'Carte Leaflet et liste des missions. Le suivi GPS du projet est une simulation.' },
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
