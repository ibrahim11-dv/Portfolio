import fleetDashboard from '../assets/projects/parcvision/parcVision_Dashboard.webp';
import fleetMap from '../assets/projects/parcvision/parcVision_map.webp';
import fleetArchive from '../assets/projects/parcvision/parcVision_archivage.webp';
import fleetSearch from '../assets/projects/parcvision/parcVisionbarRechercheOCR.webp';
import fleetHome from '../assets/projects/parcvision/parcVision1.webp';
import fleetDrivers from '../assets/projects/parcvision/parcvision-conducteurs.webp';
import fleetVehicles from '../assets/projects/parcvision/parcvision-vehicules.webp';
import fleetExpenses from '../assets/projects/parcvision/parcvision-depenses.webp';
import fleetMission from '../assets/projects/parcvision/parcvision-preparation-mission.webp';
import campusAdmin from '../assets/projects/pfe-esto/PFE_admin.webp';
import campusTeacher from '../assets/projects/pfe-esto/PFE_teacher.webp';
import campusStudent from '../assets/projects/pfe-esto/PFE_student.webp';
import campusDepartment from '../assets/projects/pfe-esto/PFE_chef.webp';
import citadelHome from '../assets/projects/citadel/citadel-accueil.webp';
import citadelLocal from '../assets/projects/citadel/citadel-partie-locale.webp';
import learnHome from '../assets/projects/learnxcompile/learnxcompile-accueil.webp';
import learnChapters from '../assets/projects/learnxcompile/learnxcompile-parcours-java.webp';
import learnCode from '../assets/projects/learnxcompile/learnxcompile-exemple-java.webp';
import learnQuiz from '../assets/projects/learnxcompile/learnxcompile-quiz-java.webp';
import learnLesson from '../assets/projects/learnxcompile/learnxcompile-lecon-types-de-donnees.webp';
import learnExercise from '../assets/projects/learnxcompile/learnxcompile-exercice-java.webp';
import learnProgress from '../assets/projects/learnxcompile/learnxcompile-profil-progression.webp';
import citadelStockfish from '../assets/projects/citadel/citadel-stockfish.webp';
import citadelPuzzles from '../assets/projects/citadel/citadel-tactique-sacrifice.webp';
import citadelInvitation from '../assets/projects/citadel/citadel-invitation-en-ligne.webp';
import citadelRematch from '../assets/projects/citadel/citadel-revanche-en-ligne.webp';
import citadelAppearance from '../assets/projects/citadel/citadel-personnalisation.webp';
import ytHome from '../assets/projects/youtube-downloader/youtube-downloader-accueil.png';
import ytInspector from '../assets/projects/youtube-downloader/youtube-downloader-inspecteur.jpg';
import ytProgress from '../assets/projects/youtube-downloader/youtube-downloader-telechargement.png';
import ytFile from '../assets/projects/youtube-downloader/youtube-downloader-fichier.png';
import internDashboard from '../assets/projects/intern-management/intern-dashboard.jpg';
import internStagiaires from '../assets/projects/intern-management/intern-stagiaires.jpg';
import internDossier from '../assets/projects/intern-management/intern-dossier.jpg';
import internCandidatures from '../assets/projects/intern-management/intern-candidatures.jpg';
import internEncadrants from '../assets/projects/intern-management/intern-encadrants.jpg';
import internOffres from '../assets/projects/intern-management/intern-offres.jpg';
import internDivisions from '../assets/projects/intern-management/intern-divisions.jpg';
import internJournal from '../assets/projects/intern-management/intern-journal.jpg';
import internFormulaire from '../assets/projects/intern-management/intern-formulaire.png';
import internConnexion from '../assets/projects/intern-management/intern-connexion.jpg';
import internPortail from '../assets/projects/intern-management/intern-portail.jpg';

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
  'youtube-downloader': [
    { src: ytHome, title: 'Interface principale et formats', caption: 'Saisie de l’URL source, matrice des formats vidéo et audio (MP4, MP3, M4A, FLAC, WAV) et options de traitement.' },
    { src: ytInspector, title: 'Inspection de la vidéo et découpe', caption: 'Aperçu des métadonnées, découpe sur la ligne de temps, extraction de sous-titres et tailles estimées par format.' },
    { src: ytProgress, title: 'File de téléchargement en direct', caption: 'Suivi de la progression du flux en temps réel avec pourcentage, débit et temps restant estimé.' },
    { src: ytFile, title: 'Fichier téléchargé', caption: 'Vidéo enregistrée au format MP4 et prête à être ouverte depuis le navigateur.' },
  ],
  'intern-management': [
    { src: internDashboard, title: 'Tableau de bord', caption: 'Vue globale de la plateforme Wilaya Stages : stagiaires actifs, encadrants, candidatures à traiter, graphiques par service et type de stage, et fil d’activités.' },
    { src: internStagiaires, title: 'Gestion des stagiaires', caption: 'Annuaire filtrable par nom, CIN, statut, service et type de stage, avec suivi des périodes, notes et export CSV.' },
    { src: internDossier, title: 'Dossier du stagiaire et attestations', caption: 'Fiche complète : affectation, assiduité et pointage, évaluation sur cinq critères et génération de l’attestation de fin de stage (avec QR code) et de la convention tripartite.' },
    { src: internCandidatures, title: 'Gestion des candidatures', caption: 'Suivi des dossiers soumis en ligne par statut (en attente, en examen, acceptées, refusées), consultation du CV et de la lettre de motivation.' },
    { src: internEncadrants, title: 'Gestion des encadrants', caption: 'Répertoire des tuteurs et cadres administratifs par division, avec coordonnées, nombre de stagiaires assignés et export CSV.' },
    { src: internOffres, title: 'Offres et sujets de stage', caption: 'Catalogue des sujets proposés par les divisions de la Wilaya, avec type de stage, période recommandée et disponibilité.' },
    { src: internDivisions, title: 'Divisions et services de la Wilaya', caption: 'Vue des départements d’accueil avec responsable de service, nombre d’encadrants, stagiaires affectés et taux d’occupation.' },
    { src: internJournal, title: 'Journal d’audit et activités', caption: 'Historique chronologique des opérations administratives : connexions, candidatures, évaluations validées et attestations émises.' },
    { src: internFormulaire, title: 'Formulaire de dépôt de candidature', caption: 'Constitution du dossier en ligne : identité, établissement, choix du stage et dépôt des pièces justificatives (CV, lettre, CIN, photo).' },
    { src: internConnexion, title: 'Connexion multi-rôles', caption: 'Authentification dédiée aux quatre espaces de la plateforme : administrateur, encadrant, stagiaire et candidat.' },
    { src: internPortail, title: 'Portail public Wilaya Stages', caption: 'Page d’accueil publique de la Wilaya de la Région de l’Oriental : dépôt de candidature, suivi de dossier par CIN et accès personnel ou encadrant.' },
  ],
};
