import fleetDashboard from '../assets/parcVision_Dashboard.png';
import fleetMap from '../assets/parcVision_map.png';
import fleetArchive from '../assets/parcVision_archivage.png';
import fleetSearch from '../assets/parcVisionbarRechercheOCR.png';
import fleetHome from '../assets/parcVision1.png';
import campusAdmin from '../assets/PFE_admin.png';
import campusTeacher from '../assets/PFE_teacher.png';
import campusStudent from '../assets/PFE_student.png';
import campusDepartment from '../assets/PFE_chef.png';

// Original screenshots supplied by Ibrahim. Captured values are not outcome metrics.
export const PROJECT_MEDIA = {
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
