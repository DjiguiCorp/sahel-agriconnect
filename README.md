# 🌾 Sahel AgriConnect

**Digitalisation Souveraine de l'Agriculture pour l'Afrique de l'Ouest et au-delà**

[![Deployment](https://img.shields.io/badge/Deployment-Vercel-000000?style=flat&logo=vercel)](https://sahel-agriconnect.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://render.com)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/cloud/atlas)

---

## 📋 Table des Matières

- [Mission et Vision](#mission-et-vision)
- [Utilisateurs Cibles](#utilisateurs-cibles)
- [Fonctionnalités](#fonctionnalités)
- [Architecture Technique](#architecture-technique)
- [Gouvernance et Données](#gouvernance-et-données)
- [Installation](#installation)
- [Déploiement](#déploiement)
- [Roadmap](#roadmap)
- [Contribution](#contribution)
- [Contact](#contact)

---

## 🎯 Mission et Vision

### Mission

**Sahel AgriConnect** est une plateforme de digitalisation souveraine de l'agriculture conçue pour transformer l'écosystème agricole en Afrique de l'Ouest et au-delà. Notre mission est triple :

1. **Souveraineté Alimentaire** : Assurer l'autonomie alimentaire des populations pour l'Afrique de l'Ouest et au-delà grâce à une agriculture moderne, durable et résiliente.

2. **Valorisation Économique** : Maximiser la valeur des productions agricoles locales en connectant les agriculteurs aux marchés locaux, régionaux et internationaux, tout en préservant la richesse générationnelle.

3. **Richesse Générationnelle** : Créer un patrimoine durable pour les générations futures en développant des chaînes de valeur agricoles durables et en préservant les savoirs locaux.

### Vision

D'ici 2030, **Sahel AgriConnect** vise à devenir la plateforme de référence pour la transformation agricole en Afrique de l'Ouest et au-delà, connectant plus d'un million d'agriculteurs, des milliers de coopératives et des centaines de centres de transformation aux marchés locaux et internationaux, tout en préservant la souveraineté des données et l'autonomie décisionnelle.

---

## 👥 Utilisateurs Cibles

### 1. Agriculteurs
- **Petits exploitants** : Production familiale et de subsistance
- **Agriculteurs commerciaux** : Production à grande échelle orientée marché
- **Besoins** : Accès aux intrants, formation, financement, connexion aux marchés

### 2. Coopératives
- **Coopératives agricoles** : Regroupement d'agriculteurs pour mutualiser les ressources
- **Besoins** : Gestion des membres, accès aux équipements partagés, financement, certification

### 3. Centres de Transformation
- **Centres de transformation locaux** : Transformation des produits agricoles
- **Processeurs** : Entrepreneurs (notamment femmes) transformant les produits
- **Besoins** : Certification (Local, Régional, FDA/USDA), connexion aux producteurs, accès aux marchés

### 4. Diaspora
- **Restaurants et retailers USA** : Importateurs de produits d'Afrique de l'Ouest et au-delà
- **Investisseurs diaspora** : Investissement dans les centres de transformation
- **Besoins** : Connexion aux producteurs locaux, certification qualité, traçabilité

### 5. Administrations
- **Ministères de l'Agriculture** : Suivi des politiques agricoles
- **Organisations régionales (AES)** : Coordination transfrontalière
- **Besoins** : Données agrégées, statistiques, suivi des programmes

---

## 🚀 Fonctionnalités

### Fonctionnalités Actuelles

#### 1. Enregistrement des Agriculteurs
- Formulaire complet d'enregistrement avec géolocalisation GPS
- Détection automatique des terres via satellite
- Analyse de maladies des plantes (intégration Roboflow/PlantVillage)
- Gestion des cultures, superficies, types d'exploitation
- Connexion aux coopératives

#### 2. Gestion des Coopératives
- Liste complète des coopératives (Afrique de l'Ouest et au-delà)
- Demandes de financement (sans prêt, via diaspora et ressources locales)
- Types de financement : Équipement, Partenariat diaspora, Expansion transformation
- Suivi des outils et équipements disponibles

#### 3. Partenariat Diaspora
- Inscription des entreprises diaspora (restaurants, retailers USA)
- Matching automatique avec les centres de transformation locaux
- Option d'investissement (actionnariat) dans les centres
- Connexion produits : Karité, Sésame, Cajou, Mangue, etc.

#### 4. Centres de Transformation Premium
- Liste des centres avec statuts de certification
- Certification : Local / Régional / International (FDA/USDA)
- Demande de certification FDA/USDA avec suivi inspection
- Représentation aux USA pour les centres certifiés

#### 5. Dashboard Administratif
- Vue temps réel des agriculteurs enregistrés
- Gestion des coopératives et partenariats diaspora
- Suivi des demandes de financement et certification
- Statistiques et rapports

#### 6. Outils Agricoles
- Diagnostic du sol
- Détection de maladies des plantes
- Think Tank Solutions (recommandations par problème)
- Planification saisonnière

### Roadmap 2026-2030

#### Phase 1 (2026) - Consolidation
- ✅ Enregistrement agriculteurs
- ✅ Gestion coopératives
- ✅ Partenariat diaspora
- 🔄 Intégration complète backend
- 🔄 Application mobile Flutter

#### Phase 2 (2027) - Expansion
- 📅 Distribution d'intrants (tracteurs, semences, fertilisants)
- 📅 Accès aux marchés (matching producteurs-acheteurs)
- 📅 Traçabilité complète (blockchain optionnel)
- 📅 Certification automatisée

#### Phase 3 (2028-2030) - Transformation
- 📅 IA pour recommandations personnalisées
- 📅 Financement décentralisé (micro-crédit via plateforme)
- 📅 Export international automatisé
- 📅 Interopérabilité avec autres systèmes agricoles

---

## 🏗️ Architecture Technique

### Stack Technologique

#### Frontend
- **Framework** : React 18+ avec Vite
- **Styling** : Tailwind CSS
- **Routing** : React Router v6
- **État** : Context API + Hooks
- **Internationalisation** : i18next (FR, EN, Bambara, Mooré, Fulfulde)
- **Déploiement** : Vercel

#### Backend
- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Base de données** : MongoDB Atlas
- **Authentification** : JWT
- **WebSocket** : Socket.io (notifications temps réel)
- **Déploiement** : Render.com

#### Infrastructure
- **CDN** : Vercel Edge Network
- **Base de données** : MongoDB Atlas (cloud)
- **Stockage** : À définir (S3, Cloudinary pour images)
- **Monitoring** : À implémenter (Sentry, LogRocket)

### Architecture des Données

```
┌─────────────────┐
│   Frontend      │
│   (React/Vite)  │
│   Vercel        │
└────────┬────────┘
         │ HTTPS/REST API
         │ WebSocket
┌────────▼────────┐
│   Backend       │
│   (Node/Express)│
│   Render.com    │
└────────┬────────┘
         │
┌────────▼────────┐
│   MongoDB Atlas  │
│   (Cloud)        │
└─────────────────┘
```

### Structure du Projet

```
sahel-agriconnect-project/
├── web-dashboard/          # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   ├── context/       # Context API (Auth, WebSocket)
│   │   ├── config/        # Configuration (API, i18n)
│   │   ├── locales/       # Traductions
│   │   └── data/          # Données mockées
│   ├── public/            # Assets statiques
│   └── package.json
├── backend/               # Backend Node.js
│   ├── routes/            # Routes API
│   ├── models/            # Modèles MongoDB
│   ├── middleware/        # Middleware Express
│   ├── controllers/       # Contrôleurs
│   └── server.js          # Point d'entrée
├── docs/                  # Documentation technique
└── README.md              # Ce fichier
```

---

## 🔒 Gouvernance et Données

### Souveraineté des Données

**Principe Fondamental** : Les données agricoles collectées appartiennent aux agriculteurs, coopératives et organisations locales. **Sahel AgriConnect** agit comme un facilitateur, pas comme un propriétaire.

#### Propriété Locale
- Les données sont hébergées dans des infrastructures contrôlées par les partenaires locaux (AES, ministères)
- Aucune vente de données à des tiers sans consentement explicite
- Les agriculteurs peuvent exporter leurs données à tout moment

#### Confidentialité
- Chiffrement des données sensibles (coordonnées GPS, informations financières)
- Accès basé sur les rôles (agriculteur, coopérative, admin)
- Conformité avec les standards de protection des données (RGPD-like)

#### Interopérabilité
- APIs ouvertes pour intégration avec d'autres systèmes agricoles
- Standards ouverts (JSON, REST)
- Export des données en formats standards (CSV, JSON, GeoJSON)

### Stratégie API Future

**Phase 1 (2026)** : APIs internes pour le frontend
**Phase 2 (2027)** : APIs publiques documentées pour partenaires
**Phase 3 (2028+)** : Marketplace d'APIs pour écosystème

### Engagement Souverain

- **Pas de dépendance externe** : Infrastructure déployable localement
- **Code open-source** : Disponible pour audit et contribution
- **Formation locale** : Transfert de compétences aux équipes locales
- **Gouvernance participative** : Comité de pilotage incluant agriculteurs, coopératives, administrations

---

## 🛠️ Installation

### Prérequis

- Node.js 18+ et npm
- Git
- Compte MongoDB Atlas (pour production)
- Compte Vercel (pour déploiement frontend)
- Compte Render.com (pour déploiement backend)

### Installation Locale

#### 1. Cloner le Repository

```bash
git clone https://github.com/DjiguiCorp/sahel-agriconnect.git
cd sahel-agriconnect
```

#### 2. Installer les Dépendances Frontend

```bash
cd web-dashboard
npm install
```

#### 3. Installer les Dépendances Backend

```bash
cd ../backend
npm install
```

#### 4. Configuration

**Frontend** : Créer `web-dashboard/.env`
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_BASE_URL=http://localhost:3001
```

**Backend** : Créer `backend/.env`
```env
PORT=3001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sahel-agriconnect
JWT_SECRET=your-secret-key
ADMIN_EMAIL=support@woneapp.com
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:5173
```

#### 5. Démarrer en Développement

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd web-dashboard
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

---

## 🚀 Déploiement

### Frontend (Vercel)

1. Connecter le repository GitHub à Vercel
2. Configurer :
   - **Root Directory** : `web-dashboard`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
3. Ajouter les variables d'environnement :
   - `VITE_API_BASE_URL` : URL du backend Render
   - `VITE_WS_BASE_URL` : URL WebSocket du backend

### Backend (Render.com)

1. Créer un nouveau Web Service
2. Connecter le repository GitHub
3. Configurer :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
4. Ajouter les variables d'environnement (voir `DEPLOIEMENT_DEBUTANT.md`)

### Documentation Complète

Voir :
- `DEPLOIEMENT_DEBUTANT.md` : Guide complet pour débutants
- `DEPLOIEMENT_MAINTENANT.md` : Guide rapide
- `RENDER_MONGODB_FIX.md` : Dépannage MongoDB

---

## 📅 Roadmap

### 2026 - Phase de Consolidation
- ✅ MVP avec enregistrement agriculteurs
- ✅ Gestion coopératives
- ✅ Partenariat diaspora
- 🔄 Application mobile Flutter
- 🔄 Intégration complète backend

### 2027 - Phase d'Expansion
- 📅 Distribution d'intrants
- 📅 Accès aux marchés
- 📅 Traçabilité complète
- 📅 Certification automatisée

### 2028-2030 - Phase de Transformation
- 📅 IA et recommandations personnalisées
- 📅 Financement décentralisé
- 📅 Export international automatisé
- 📅 Interopérabilité écosystème

---

## 🤝 Contribution

### Comment Contribuer

1. **Fork** le repository
2. Créer une **branche** pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une **Pull Request**

### Standards de Code

- **Frontend** : ESLint + Prettier
- **Backend** : ESLint + Prettier
- **Commits** : Messages en français, format conventionnel
- **Tests** : À implémenter (Jest, React Testing Library)

### Code de Conduite

Nous nous engageons à maintenir un environnement respectueux et inclusif. Voir `CODE_OF_CONDUCT.md` (à créer).

---

## 📞 Contact

### Équipe Projet

- **Organisation** : Djigui Corporation
- **Email** : support@woneapp.com
- **Site Web** : https://sahel-agriconnect.vercel.app

### Partenaires

- **AES** : Alliance des États du Sahel
- **Universités US** : Partenaires académiques
- **Diaspora** : Restaurants et retailers USA

### Support

- **Documentation** : Voir le dossier `docs/`
- **Issues** : https://github.com/DjiguiCorp/sahel-agriconnect/issues
- **Email Support** : support@woneapp.com

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE) (à définir selon la gouvernance).

---

## 🙏 Remerciements

- **Agriculteurs d'Afrique de l'Ouest et au-delà** : Pour leur confiance et leur participation
- **Coopératives** : Pour leur engagement dans la transformation agricole
- **Partenaires** : AES, Diaspora, Universités US
- **Communauté Open Source** : Pour les outils et frameworks utilisés

---

**🌾 Construisons ensemble l'avenir de l'agriculture en Afrique de l'Ouest et au-delà ! 🌾**

---

*Dernière mise à jour : Décembre 2024*
