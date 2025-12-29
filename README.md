# 🌾 Sahel AgriConnect

Plateforme de digitalisation agricole pour le Mali et le Burkina Faso - Projet PTASS (2026-2030)

## 📋 Description

Sahel AgriConnect est une plateforme complète qui digitalise et modernise l'agriculture dans la région du Sahel pour atteindre la souveraineté alimentaire et valoriser les productions locales.

## 🚀 Technologies

### Frontend
- **React** + **Vite** - Framework moderne et rapide
- **TailwindCSS** - Styling
- **i18next** - Support multi-langues (Français, Anglais)
- **React Router** - Navigation
- **Socket.io Client** - Temps réel

### Backend
- **Node.js** + **Express** - API REST
- **MongoDB** + **Mongoose** - Base de données
- **Socket.io** - WebSockets temps réel
- **JWT** - Authentification sécurisée
- **Joi** - Validation des données

## 📁 Structure du Projet

```
sahel-agriconnect-project/
├── backend/              # API Node.js/Express
│   ├── routes/          # Routes API
│   ├── models/          # Modèles MongoDB
│   ├── controllers/     # Contrôleurs
│   └── server.js        # Point d'entrée
├── web-dashboard/       # Frontend React/Vite
│   ├── src/
│   │   ├── components/  # Composants React
│   │   ├── pages/       # Pages
│   │   ├── context/     # Context API
│   │   └── locales/     # Traductions
│   └── vite.config.js
└── flutter-app/         # Application mobile Flutter (à venir)
```

## 🛠️ Installation Locale

### Prérequis
- Node.js 16+
- MongoDB (local ou Atlas)
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configurer les variables
npm run dev
```

### Frontend

```bash
cd web-dashboard
npm install
npm run dev
```

Voir `backend/README.md` et `web-dashboard/README.md` pour plus de détails.

## 🚀 Déploiement

### Déploiement Rapide (10 minutes)

Voir `DEPLOYMENT_QUICK_START.md` pour un guide étape par étape.

### Déploiement Complet

Voir `DEPLOYMENT_GUIDE.md` pour un guide détaillé avec optimisations.

**Services utilisés:**
- **Frontend:** Vercel (gratuit)
- **Backend:** Railway (gratuit avec limites)
- **Base de données:** MongoDB Atlas (gratuit tier M0)

## 📖 Documentation

- `DEPLOYMENT_GUIDE.md` - Guide complet de déploiement
- `DEPLOYMENT_QUICK_START.md` - Déploiement rapide
- `HOSTS_AND_PORTS.md` - Informations sur les ports
- `ADMIN_LINKS.md` - Liens et accès admin
- `QUICK_LINKS.md` - Tous les liens de l'application

## 🔑 Accès Admin

- **URL:** `/admin/login`
- **Email:** `admin@sahelagriconnect.org`
- **Mot de passe:** (configuré dans `.env`)

## 🌍 Langues Supportées

- **Français** (principal)
- **Anglais**

Détection automatique via géolocalisation.

## 📊 Fonctionnalités

- ✅ Enregistrement d'agriculteurs
- ✅ Enregistrement de processeurs
- ✅ Gestion des coopératives
- ✅ Diagnostic du sol
- ✅ Détection de maladies des plantes
- ✅ Dashboard admin complet
- ✅ WebSockets temps réel
- ✅ Support multi-langues
- ✅ Géolocalisation automatique

## 🤝 Contribution

Ce projet fait partie du Projet de Transformation Agricole du Sahel (PTASS) 2026-2030.

## 📄 Licence

ISC

## 📞 Support

Pour toute question, consultez la documentation dans les fichiers README de chaque module.

