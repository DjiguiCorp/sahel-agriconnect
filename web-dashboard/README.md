# Sahel AgriConnect - Plateforme Web

Plateforme de digitalisation souveraine de l'agriculture au Mali et au Burkina Faso - Projet PTASS.

## 🚀 Technologies Utilisées

- **React.js** 18.2.0 - Bibliothèque JavaScript pour l'interface utilisateur
- **Vite** 5.0.8 - Outil de build rapide et moderne
- **Tailwind CSS** 3.3.6 - Framework CSS utilitaire pour le design responsive
- **React Router** 6.20.0 - Routage côté client pour la navigation

## 📋 Prérequis

- **Node.js** version 16 ou supérieure
- **npm** ou **yarn** pour la gestion des dépendances

## 🛠️ Installation

1. **Naviguer vers le dossier du projet :**
   ```bash
   cd web-dashboard
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```
   ou avec yarn :
   ```bash
   yarn install
   ```

## 🏃 Lancement du Projet

### Mode Développement

Lancer le serveur de développement :
```bash
npm run dev
```

Le site sera accessible à l'adresse : `http://localhost:5173`

### Build de Production

Créer une version optimisée pour la production :
```bash
npm run build
```

Les fichiers compilés seront générés dans le dossier `dist/`.

### Prévisualisation du Build

Prévisualiser la version de production :
```bash
npm run preview
```

## 📁 Structure du Projet

```
web-dashboard/
├── public/                 # Fichiers statiques
├── src/
│   ├── components/         # Composants réutilisables
│   │   ├── Header.jsx     # En-tête avec navigation
│   │   ├── Footer.jsx     # Pied de page
│   │   ├── Hero.jsx       # Section héro de la page d'accueil
│   │   ├── Modal.jsx      # Composant modal réutilisable
│   │   └── FarmerRegistrationForm.jsx  # Formulaire d'enregistrement d'agriculteur
│   ├── pages/             # Pages principales
│   │   ├── Home.jsx       # Page d'accueil (landing page)
│   │   ├── About.jsx      # Page À propos
│   │   ├── Dashboard.jsx  # Tableau de bord
│   │   ├── Contact.jsx    # Page Contact/Inscription
│   │   ├── SoilDiagnostic.jsx  # Page Diagnostic du Sol
│   │   ├── PlantDiseaseDetection.jsx  # Page Détection de Maladies
│   │   └── ThinkTank.jsx  # Page Think Tank Solutions
│   ├── App.jsx            # Composant principal avec routing
│   ├── main.jsx           # Point d'entrée de l'application
│   └── index.css          # Styles globaux avec Tailwind
├── index.html             # Fichier HTML principal
├── package.json           # Dépendances et scripts
├── vite.config.js         # Configuration Vite
├── tailwind.config.js     # Configuration Tailwind CSS
└── postcss.config.js      # Configuration PostCSS
```

## 🎨 Pages du Site

### 1. Page d'Accueil (`/`)
- Section héro avec présentation du projet
- Présentation du Projet PTASS
- Objectifs (Souveraineté alimentaire, Valorisation, Période 2026-2030)
- Céréales prioritaires (Mil, Sorgho, Maïs, Riz)
- Cultures de rente (Coton, Arachide, Sésame, etc.)
- Trois niveaux de qualité (Standard, Premium, Excellence)
- Infrastructure (Irrigation et Transport)
- Potentiel de croissance
- Appel à l'action

### 2. Page À Propos (`/about`)
- Présentation détaillée du Projet PTASS
- Objectifs du projet
- Feuille de route 2026-2030
- Partenaires (AES, Djigui, Universités US)
- Déclaration des besoins

### 3. Page Dashboard (`/dashboard`)
- Bouton "Enregistrer un agriculteur" qui ouvre un formulaire en modal
- Statistiques (nombre d'agriculteurs, superficie totale)
- Liste des agriculteurs enregistrés avec :
  - Nom
  - Cultures
  - Superficie
  - Région
  - Statut (Actif/En attente)
- **Formulaire d'enregistrement d'agriculteur** (modal) :
  - Nom complet
  - Téléphone
  - Localisation GPS (latitude, longitude)
  - **Détection de terres via satellite** : Analyse automatique des cultures sur le terrain
  - Superficie du terrain (ha) - peut être auto-remplie depuis la détection satellite
  - Cultures cultivées (sélection multiple)
  - **Analyse de maladie des plantes** : Bouton "Analyser une feuille" avec upload photo et détection via API Roboflow
  - Objectifs de production (souveraineté locale, export régional, export international)
  - **3 niveaux de qualité** : Local (⭐), Régional (⭐⭐), International (⭐⭐⭐)
  - Validation des champs requis
  - Messages de succès/erreur
  - Solutions recommandées avec Think Tank (fertilisants organiques, irrigation, rotation)

### 4. Page Diagnostic Sol (`/diagnostic-sol`)
- Formulaire d'analyse du sol :
  - Type de sol (argileux, sableux, limoneux, etc.)
  - pH estimé
  - Symptômes observés (sélection multiple)
- Simulation IA (mockée) :
  - Diagnostic des problèmes identifiés
  - Solutions recommandées
  - Recommandations générales
- Affichage des résultats avec codes couleur

### 5. Page Détection de Maladies des Plantes (`/detection-maladies`)
- Upload d'image pour analyse :
  - Support des formats JPG, PNG, WEBP
  - Taille maximale : 5MB
  - Preview de l'image avant analyse
- Détection par IA (Roboflow) :
  - Intégration avec l'API backend `/api/detect-plant-disease`
  - Utilise le modèle PlantVillage Dataset
  - Affichage de la confiance de détection
- Résultats détaillés :
  - Nom de la maladie détectée
  - Description de la maladie
  - Solutions recommandées personnalisées
  - Niveau de confiance de la détection
- Mode simulation : fonctionne en mode mock si l'API backend n'est pas disponible

### 5.1. Analyse de Maladie Intégrée dans le Formulaire
- **Bouton "Analyser une feuille"** dans le formulaire d'enregistrement d'agriculteur
- Upload de photo directement depuis le formulaire
- Détection via API Roboflow (PlantVillage)
- Affichage des résultats avec :
  - Maladie détectée + score de confiance
  - Recommandations spécifiques (ex. : "Tache foliaire → utilisez compost de fèces de bétail")
  - Solutions Think Tank : fertilisants organiques, irrigation, rotation
- Intégration dans les solutions recommandées après soumission

### 5.2. Détection de Terres via Satellite
- **Détection automatique** après saisie des coordonnées GPS
- Analyse satellite mockée pour détecter les cultures sur le terrain
- Affichage des résultats :
  - Cultures détectées (ex. : "2 ha de riz détectés")
  - Superficie par culture avec niveau de confiance
  - Superficie totale détectée
- Auto-remplissage de la superficie si détectée

### 6. Page Think Tank Solutions (`/think-tank`)
- Portail de solutions par problème :
  - Gestion de l'irrigation
  - Gestion des ravageurs et maladies
  - Amélioration des sols dégradés
  - Amélioration des semences
  - Fertilisation optimale
- Pour chaque solution :
  - Description du problème
  - Problèmes courants
  - Étapes de mise en œuvre détaillées
  - Intrants recommandés
  - Ressources complémentaires (PDF, vidéos)

### 7. Page Contact (`/contact`)
- Formulaire d'inscription avec :
  - Nom complet
  - Email
  - Rôle (Agriculteur, Coopérative, Investisseur, etc.)
  - Message optionnel
- Informations de contact
- Zones d'intervention (Mali et Burkina Faso)

### 8. Section Administrative "Central" (`/admin/central`)
**⚠️ Accès réservé aux administrateurs uniquement**

- **Authentification** : Page de login admin (`/admin/login`)
  - Email : `admin@sahelagriconnect.org`
  - Mot de passe : `admin123` (démo)
  - Routes protégées avec authentification

- **Dashboard Admin** avec 6 onglets :
  1. **Gestion des Coopératives** :
     - Liste des coopératives (nom, localisation, responsable, membres)
     - Statut et outils disponibles
     - Checklist des outils (tracteurs, séchoirs, stockage, irrigation solaire, transformation)
     - Mise à jour des outils
  
  2. **Planification Saisonnière** :
     - Liste des agriculteurs par saison (pluies / hors saison)
     - Cultures prévues, besoins en intrants, fertilisants, pesticides
     - Rapport automatique "Santé des Sols et Nutriments"
     - Recommandations : compost de fèces, rotation, engrais organique
  
  3. **Gestion des Intrants et Fertilisants** :
     - Stock central (engrais, pesticides, semences, fertilisants)
     - Distribution aux coopératives et agriculteurs
     - Recommandations basées sur : type de sol, culture, élevage
     - Gestion des fèces de bétail (compost ou biogaz)
  
  4. **Certification et 3 Branches** :
     - 3 niveaux : Local (⭐), Régional CEDEAO (⭐⭐), International UE/USDA (⭐⭐⭐)
     - Liste des produits à certifier avec suivi statut
     - Calendrier des inspections (mensuelles, trimestrielles, saisonnières)
     - Suivi de conformité
  
  5. **Partenariats et Usines** :
     - Liste des partenaires (AES, Djigui, Universités US)
     - MoU signés, équipements disponibles
     - Transfert de technologie
     - Usines de transformation (localisation, capacité, produits)
  
  6. **Rapports Coopératives** :
     - Rapports mensuels et trimestriels
     - Dashboard des défis agriculteurs (production, vente, pertes, irrigation, stockage, énergie)
     - Visualisation avec graphiques et alertes
     - Formulaire pour nouvelles soumissions

## 🎨 Design

- **Couleurs principales :**
  - Vert (`#2d5016`, `#4a7c2a`) - Nature, agriculture
  - Orange (`#e67e22`, `#f39c12`) - Énergie, Afrique
  - Bleu (`#3498db`, `#2980b9`) - Confiance, technologie

- **Responsive :** Design mobile-first, adapté pour tablette et desktop
- **Navigation :** Menu simple en haut avec liens vers toutes les pages

## 🚀 Déploiement

### Vercel

1. Installer Vercel CLI :
   ```bash
   npm i -g vercel
   ```

2. Déployer :
   ```bash
   vercel
   ```

   Ou connecter votre dépôt GitHub à Vercel pour un déploiement automatique.

### Netlify

1. Installer Netlify CLI :
   ```bash
   npm i -g netlify-cli
   ```

2. Build et déployer :
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

   Ou connecter votre dépôt GitHub à Netlify.

### Configuration pour le déploiement

Assurez-vous que le fichier `vite.config.js` est correctement configuré. Pour un déploiement sur un sous-dossier, vous pouvez ajouter :

```js
export default defineConfig({
  plugins: [react()],
  base: '/votre-sous-dossier/'
})
```

## 🔐 Authentification Admin

La section "Central" est protégée par authentification. Pour y accéder :

1. Naviguer vers `/admin/login`
2. Utiliser les identifiants de démonstration :
   - **Email** : `admin@sahelagriconnect.org`
   - **Mot de passe** : `admin123`
3. Une fois connecté, accéder à `/admin/central`

**Note** : L'authentification est actuellement mockée. Pour la production, remplacer par Firebase Auth ou un backend sécurisé.

### 8.1. Connexion Temps Réel (WebSocket)
- **Synchronisation en temps réel** entre agriculteurs et admin
- Utilise Socket.io pour la communication bidirectionnelle
- Mode simulation activé si serveur WebSocket non disponible
- Notifications instantanées lors de l'enregistrement d'agriculteurs
- Mise à jour automatique du dashboard admin

### 8.2. Onglet Agriculteurs (Temps Réel)
- Liste des agriculteurs enregistrés avec mise à jour en temps réel
- Filtres : Tous, Investissement, Irrigation, Stockage, Énergie
- Affichage des défis par agriculteur
- Objectifs de production (Local, Régional, International)
- Notifications des nouveaux enregistrements

### 8.3. Les 3 Branches de Certification Détaillées
- **Branche Locale (⭐)** :
  - Marché national (Mali, Burkina Faso)
  - Sécurité alimentaire locale, normes basiques
  - Inspection mensuelle
  - Transport local, stockage communautaire
  
- **Branche Régionale (⭐⭐) - CEDEAO** :
  - Marché Afrique de l'Ouest (CEDEAO/ECOWAS)
  - Qualité intermédiaire certifiée, emballage conforme
  - Inspection trimestrielle, certification CEDEAO
  - Transport régional, ports (Dakar, Abidjan)
  - Business development : accords commerciaux, foires régionales
  
- **Branche Internationale (⭐⭐⭐) - UE/USDA** :
  - Marché Europe, USA, marchés internationaux
  - Certification bio (UE/USDA), Fair Trade, traçabilité complète
  - Inspection saisonnière, audits UE/USDA
  - Transport maritime/aérien, ports internationaux
  - Business development : salons internationaux, réseaux commerce équitable

### 8.4. Décisions Producteur
- Champ "Souhaitez-vous investir dans une coopérative/processeur ?" dans le formulaire
- Admin voit les agriculteurs intéressés par investissement
- Mise en relation avec processeurs locaux selon capacité

### 8.5. Logistique et Solutions
- **Suggestions de connexion** : Connexions automatiques entre agriculteurs et processeurs
- **Installations de stockage** : Liste des entrepôts (sec/froid) avec capacité et localisation
- **Chaînes logistiques** : Routes de transport (origine, destination, distance, fréquence)
- Cartographie des chaînes d'approvisionnement
- Suggestions : "Agriculteur X à Sikasso → connectez à processeur Y (capacité 10 tonnes/mois) pour karité"

## 📝 Notes

- Le tableau de bord affiche actuellement des données mockées pour la démonstration.
- Le bouton "Télécharger l'app" affiche une alerte (à remplacer par le lien réel de l'application mobile).
- Le formulaire de contact simule l'envoi (à connecter avec un backend dans la version finale).
- Le formulaire d'enregistrement d'agriculteur enregistre les données localement (à connecter avec un backend).
- Le diagnostic du sol utilise une simulation IA mockée (à remplacer par un vrai service IA dans la version finale).
- La détection de maladies utilise l'API Roboflow via le backend. En mode développement, une simulation mockée est utilisée si l'API n'est pas disponible.
- Les ressources du Think Tank (PDF, vidéos) sont des liens placeholder (à remplacer par les vraies ressources).
- Les données des coopératives et processeurs sont mockées dans `src/data/cooperativesData.js` (à connecter avec une base de données dans la version finale).

## 🤝 Partenariats Locaux Sans Prêt

Le projet Sahel AgriConnect privilégie les partenariats locaux sans prêt :

- **Coopératives locales** : Accompagnement direct sans prêt, utilisation des ressources locales
- **Centres de transformation** : Connexion avec entrepreneures féminines et processeurs locaux
- **Formation gratuite** : Accès à la formation via coopératives
- **Équipement partagé** : Utilisation d'équipements partagés via coopératives
- **Inspection saisonnière** : Certification selon 3 niveaux de qualité (local, régional, international)

### Fonctionnalités Ajoutées

1. **Localisation des coopératives** : Sélection de région/zone avec affichage automatique des coopératives locales disponibles
2. **Connexion aux centres de transformation** : Case à cocher pour connexion avec entrepreneures féminines et processeurs locaux
3. **Inscription des processeurs** : Formulaire dédié pour l'enregistrement des centres de transformation avec calcul automatique de partenariats possibles
4. **Proposition de partenariats** : Calcul automatique du nombre d'agriculteurs pouvant être partenaires selon la capacité du processeur
5. **Inspection saisonnière** : Messages sur la certification selon les objectifs de production (3 niveaux : local, régional, international)

## 🔌 Configuration API Backend

Pour utiliser la détection de maladies des plantes, vous devez configurer le backend avec l'endpoint suivant :

```javascript
app.post('/api/detect-plant-disease', async (req, res) => {
  const { imageBase64 } = req.body;
  try {
    const response = await axios.post(
      'https://detect.roboflow.com/plantvillage-dataset/1',
      imageBase64,
      {
        params: { api_key: process.env.ROBOFLOW_API_KEY },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Variables d'environnement requises :**
- `ROBOFLOW_API_KEY` : Votre clé API Roboflow

**Note :** En mode développement, si l'API backend n'est pas disponible, la page utilisera automatiquement une simulation mockée pour permettre les tests.

## 🤝 Contribution

Pour contribuer au projet :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet fait partie du Projet PTASS (Projet de Transformation Agricole du Sahel).

## 📧 Contact

Pour toute question, contactez : contact@sahelagriconnect.org

---

**Développé avec ❤️ pour la transformation de l'agriculture au Sahel**

