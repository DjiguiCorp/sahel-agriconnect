# Sahel AgriConnect - Backend API

Backend Node.js/Express avec MongoDB pour la plateforme Sahel AgriConnect.

## 🚀 Technologies

- **Node.js** + **Express** - Framework web
- **MongoDB** + **Mongoose** - Base de données
- **Socket.io** - WebSockets pour synchronisation temps réel
- **JWT** - Authentification sécurisée
- **Joi** - Validation des données
- **bcryptjs** - Hashage des mots de passe

## 📋 Prérequis

- **Node.js** version 16 ou supérieure
- **MongoDB** (local ou MongoDB Atlas)
- **npm** ou **yarn**

## 🛠️ Installation

1. **Naviguer vers le dossier backend :**
   ```bash
   cd backend
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement :**
   ```bash
   cp .env.example .env
   ```
   
   Éditer `.env` et configurer :
   ```env
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/sahel-agriconnect
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ADMIN_EMAIL=admin@sahelagriconnect.org
   ADMIN_PASSWORD=admin123
   ```

4. **Démarrer MongoDB :**
   - **Local :** Assurez-vous que MongoDB est installé et démarré
   - **MongoDB Atlas :** Utilisez votre URI de connexion dans `.env`

5. **Créer l'admin par défaut :**
   ```bash
   node scripts/initAdmin.js
   ```

6. **Optionnel : Charger des données de test :**
   ```bash
   node scripts/seedData.js
   ```

## 🏃 Lancement

### Mode Développement (avec auto-reload)
```bash
npm run dev
```

### Mode Production
```bash
npm start
```

Le serveur démarre sur `http://localhost:3001`

## 📡 API Endpoints

### Authentification

- **POST** `/api/auth/login` - Connexion admin
  ```json
  {
    "email": "admin@sahelagriconnect.org",
    "password": "admin123"
  }
  ```

- **GET** `/api/auth/verify` - Vérifier le token (protégée)

### Agriculteurs

- **POST** `/api/farmers` - Enregistrer un agriculteur (public)
- **GET** `/api/farmers` - Liste des agriculteurs (protégée admin)
  - Query params : `region`, `statut`, `investissement`, `page`, `limit`, `search`
- **GET** `/api/farmers/:id` - Détails d'un agriculteur (protégée admin)
- **PUT** `/api/farmers/:id` - Mettre à jour un agriculteur (protégée admin)
- **DELETE** `/api/farmers/:id` - Supprimer un agriculteur (protégée admin)
- **GET** `/api/farmers/stats/summary` - Statistiques (protégée admin)

### Processeurs

- **POST** `/api/processors` - Inscrire un processeur (public)
- **GET** `/api/processors` - Liste des processeurs (protégée admin)
- **GET** `/api/processors/:id` - Détails d'un processeur (protégée admin)
- **GET** `/api/processors/region/:region` - Processeurs par région (public)

### Coopératives

- **GET** `/api/cooperatives` - Liste des coopératives (public)
  - Query param : `region`
- **GET** `/api/cooperatives/region/:region` - Coopératives par région (public)
- **POST** `/api/cooperatives` - Créer une coopérative (protégée admin)
- **PUT** `/api/cooperatives/:id` - Mettre à jour une coopérative (protégée admin)

### Certifications

- **POST** `/api/certifications` - Demande de certification (protégée admin)
- **GET** `/api/certifications` - Liste des certifications (protégée admin)
  - Query params : `niveau`, `statut`
- **GET** `/api/certifications/:id` - Détails d'une certification (protégée admin)
- **PUT** `/api/certifications/:id` - Mettre à jour une certification (protégée admin)
- **GET** `/api/certifications/stats/by-level` - Statistiques par niveau (protégée admin)

### Santé

- **GET** `/api/health` - Vérifier l'état de l'API

## 🔐 Authentification

Les routes protégées nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

Le token est valide pendant 24 heures.

## 🔌 WebSockets (Socket.io)

Le serveur émet les événements suivants :

- `farmer:created` - Nouvel agriculteur enregistré
- `farmer:updated` - Agriculteur mis à jour

**Connexion :**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('farmer:created', (data) => {
  console.log('Nouvel agriculteur:', data);
});

socket.on('farmer:updated', (data) => {
  console.log('Agriculteur mis à jour:', data);
});
```

## 📝 Exemples de Requêtes

### Enregistrer un agriculteur
```bash
curl -X POST http://localhost:3001/api/farmers \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Amadou Diallo",
    "telephone": "+223 XX XX XX XX",
    "latitude": "12.6392",
    "longitude": "-8.0029",
    "superficie": 12,
    "cultures": ["Riz", "Mil"],
    "region": "Sikasso, Mali",
    "typeExploitation": "Familiale",
    "objectifsProduction": ["Souveraineté alimentaire locale"],
    "accesElectricite": "Non",
    "accesStockage": "Non"
  }'
```

### Login admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sahelagriconnect.org",
    "password": "admin123"
  }'
```

### Récupérer les agriculteurs (avec token)
```bash
curl -X GET http://localhost:3001/api/farmers \
  -H "Authorization: Bearer <token>"
```

## 🗄️ Structure de la Base de Données

### Collections

- **farmers** - Agriculteurs enregistrés
- **processors** - Processeurs/centres de transformation
- **cooperatives** - Coopératives locales
- **certifications** - Demandes de certification
- **admins** - Administrateurs

## 🔧 Scripts Disponibles

- `npm start` - Démarrer le serveur
- `npm run dev` - Mode développement avec nodemon
- `node scripts/initAdmin.js` - Créer l'admin par défaut
- `node scripts/seedData.js` - Charger des données de test

## 🌐 CORS

Le serveur autorise les requêtes depuis :
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Autre port)

## ⚠️ Notes de Sécurité

1. **Changez le JWT_SECRET** en production
2. **Changez le mot de passe admin** par défaut
3. **Utilisez HTTPS** en production
4. **Limitez les requêtes** avec rate limiting
5. **Validez toutes les entrées** utilisateur

## 📦 Déploiement

### MongoDB Atlas

1. Créer un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Obtenir l'URI de connexion
3. Mettre à jour `MONGO_URI` dans `.env`

### Variables d'environnement en production

```env
NODE_ENV=production
PORT=3001
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/sahel-agriconnect
JWT_SECRET=<générer-une-clé-aléatoire-forte>
```

## 🐛 Dépannage

### Erreur de connexion MongoDB
- Vérifiez que MongoDB est démarré (local)
- Vérifiez l'URI dans `.env` (Atlas)
- Vérifiez les permissions réseau

### Erreur JWT
- Vérifiez que `JWT_SECRET` est défini dans `.env`
- Vérifiez que le token est valide et non expiré

### Port déjà utilisé
- Changez le `PORT` dans `.env`
- Ou arrêtez le processus utilisant le port

## 📞 Support

Pour toute question ou problème, consultez la documentation du projet.

