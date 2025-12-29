# 🚀 Guide de Déploiement Complet - Sahel AgriConnect

## 📋 Vue d'ensemble

Ce guide vous permettra de déployer **gratuitement** votre application pour supporter **1 million+ d'utilisateurs** en utilisant:

- **Frontend:** Vercel (gratuit, illimité)
- **Backend:** Railway ou Render (gratuit avec limites généreuses)
- **Base de données:** MongoDB Atlas (gratuit tier M0)
- **Versioning:** GitHub (gratuit)

---

## 🎯 Architecture de Déploiement

```
┌─────────────────┐
│   GitHub        │
│   (Code)        │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│Vercel │ │ Railway │
│Frontend│ │ Backend │
└───┬───┘ └──┬──────┘
    │        │
    │    ┌───▼────────┐
    │    │MongoDB Atlas│
    │    │  (Cloud)   │
    │    └────────────┘
    │
┌───▼──────────────┐
│   Utilisateurs    │
│  (1M+ supportés) │
└───────────────────┘
```

---

## 📦 Étape 1: Préparer le Code pour GitHub

### 1.1 Créer un fichier `.gitignore`

Créez `.gitignore` à la racine du projet:

```gitignore
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Backend
backend/uploads/
backend/logs/
```

### 1.2 Créer un README.md principal

Créez `README.md` à la racine:

```markdown
# Sahel AgriConnect

Plateforme de digitalisation agricole pour le Mali et le Burkina Faso.

## Structure du Projet

- `backend/` - API Node.js/Express
- `web-dashboard/` - Frontend React/Vite

## Déploiement

Voir `DEPLOYMENT_GUIDE.md` pour les instructions complètes.
```

### 1.3 Initialiser Git et pousser vers GitHub

```bash
# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Sahel AgriConnect"

# Créer un repository sur GitHub (via github.com)
# Puis connecter:
git remote add origin https://github.com/VOTRE-USERNAME/sahel-agriconnect.git
git branch -M main
git push -u origin main
```

---

## 🌐 Étape 2: Déployer le Backend sur Railway

### 2.1 Créer un compte Railway

1. Aller sur https://railway.app
2. Cliquer sur "Start a New Project"
3. Se connecter avec GitHub
4. Autoriser Railway à accéder à vos repositories

### 2.2 Créer un nouveau projet

1. Cliquer sur "New Project"
2. Sélectionner "Deploy from GitHub repo"
3. Choisir votre repository `sahel-agriconnect`
4. Railway détectera automatiquement le backend

### 2.3 Configurer le déploiement

1. **Root Directory:** `backend`
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`

### 2.4 Configurer les variables d'environnement

Dans Railway, allez dans "Variables" et ajoutez:

```env
NODE_ENV=production
PORT=3001
MONGO_URI=votre-mongodb-atlas-uri
JWT_SECRET=votre-super-secret-jwt-key-change-this
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=votre-mot-de-passe-securise
FRONTEND_URL=https://votre-app.vercel.app
```

**Important:** 
- Remplacez `MONGO_URI` par votre URI MongoDB Atlas
- Générez un `JWT_SECRET` fort (utilisez: `openssl rand -base64 32`)
- Changez le mot de passe admin

### 2.5 Obtenir l'URL du backend

Après le déploiement, Railway vous donnera une URL comme:
```
https://sahel-agriconnect-backend.railway.app
```

**Notez cette URL** - vous en aurez besoin pour le frontend!

---

## 🎨 Étape 3: Déployer le Frontend sur Vercel

### 3.1 Créer un compte Vercel

1. Aller sur https://vercel.com
2. Cliquer sur "Sign Up"
3. Se connecter avec GitHub
4. Autoriser Vercel à accéder à vos repositories

### 3.2 Créer un nouveau projet

1. Cliquer sur "Add New Project"
2. Importer votre repository GitHub
3. Configurer le projet:
   - **Framework Preset:** Vite
   - **Root Directory:** `web-dashboard`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 3.3 Configurer les variables d'environnement

Dans Vercel, allez dans "Settings" → "Environment Variables" et ajoutez:

```env
VITE_API_BASE_URL=https://votre-backend.railway.app
VITE_WS_BASE_URL=https://votre-backend.railway.app
```

**Important:** Remplacez par l'URL de votre backend Railway!

### 3.4 Déployer

1. Cliquer sur "Deploy"
2. Attendre que le build se termine
3. Vercel vous donnera une URL comme:
   ```
   https://sahel-agriconnect.vercel.app
   ```

---

## 🗄️ Étape 4: Configurer MongoDB Atlas

### 4.1 Créer un cluster (si pas déjà fait)

1. Aller sur https://www.mongodb.com/cloud/atlas
2. Créer un cluster gratuit (M0)
3. Choisir une région proche de vos utilisateurs

### 4.2 Configurer l'accès réseau

1. Aller dans "Network Access"
2. Cliquer sur "Add IP Address"
3. Pour Railway: Cliquer sur "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note:** En production, limitez aux IPs de Railway

### 4.3 Créer un utilisateur de base de données

1. Aller dans "Database Access"
2. Cliquer sur "Add New Database User"
3. Créer un utilisateur avec un mot de passe fort
4. Rôle: "Atlas admin" ou "Read and write to any database"

### 4.4 Obtenir l'URI de connexion

1. Cliquer sur "Connect" sur votre cluster
2. Choisir "Connect your application"
3. Copier l'URI (format: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Ajouter le nom de la base de données: `...mongodb.net/sahel-agriconnect?retryWrites=true&w=majority`

### 4.5 Mettre à jour Railway avec l'URI

Dans Railway, mettez à jour la variable `MONGO_URI` avec l'URI complète.

---

## ⚙️ Étape 5: Optimisations pour 1M+ Utilisateurs

### 5.1 Backend - Optimisations

Créez `backend/server.js` avec ces optimisations:

```javascript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});

app.use('/api/', limiter);

// Compression
import compression from 'compression';
app.use(compression());

// CORS optimisé
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://votre-app.vercel.app',
  credentials: true
}));
```

Installez les dépendances:
```bash
cd backend
npm install express-rate-limit compression
```

### 5.2 Frontend - Optimisations

Dans `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['i18next', 'react-i18next']
        }
      }
    }
  }
})
```

### 5.3 MongoDB Atlas - Index

Créez des index pour améliorer les performances:

```javascript
// Dans backend/models/Farmer.js
farmerSchema.index({ region: 1 });
farmerSchema.index({ createdAt: -1 });
farmerSchema.index({ status: 1 });
```

---

## 🔒 Étape 6: Sécurité

### 6.1 Variables d'environnement sensibles

**Ne jamais** commiter:
- `.env` files
- `JWT_SECRET`
- `MONGO_URI` avec mot de passe
- Mots de passe admin

### 6.2 HTTPS

Vercel et Railway fournissent automatiquement HTTPS - pas besoin de configuration supplémentaire!

### 6.3 CORS

Assurez-vous que CORS est configuré correctement dans le backend:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📊 Étape 7: Monitoring et Analytics

### 7.1 Vercel Analytics (Gratuit)

1. Dans Vercel, allez dans "Analytics"
2. Activez "Web Analytics" (gratuit)
3. Suivez les performances de votre frontend

### 7.2 Railway Logs

Railway fournit des logs en temps réel:
1. Allez dans votre projet Railway
2. Cliquez sur "Deployments"
3. Voir les logs en temps réel

### 7.3 MongoDB Atlas Monitoring

MongoDB Atlas fournit un monitoring gratuit:
1. Allez dans votre cluster
2. Voir les métriques (CPU, RAM, Storage)

---

## 🧪 Étape 8: Tester le Déploiement

### 8.1 Tester le Backend

```bash
curl https://votre-backend.railway.app/api/health
```

Devrait retourner:
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running"
}
```

### 8.2 Tester le Frontend

1. Ouvrir `https://votre-app.vercel.app`
2. Vérifier que la page se charge
3. Tester la connexion au backend

### 8.3 Tester l'authentification

1. Aller sur `https://votre-app.vercel.app/admin/login`
2. Se connecter avec les identifiants admin
3. Vérifier la redirection vers le dashboard

---

## 💰 Coûts (Gratuit Tier)

### Vercel (Frontend)
- **Gratuit:** Illimité
- **Limites:** 100GB bandwidth/mois (suffisant pour 1M+ utilisateurs avec CDN)
- **Upgrade:** Seulement si vous dépassez les limites

### Railway (Backend)
- **Gratuit:** $5 crédit/mois
- **Limites:** ~500 heures de runtime/mois
- **Upgrade:** $5/mois pour plus de ressources

### MongoDB Atlas
- **Gratuit:** M0 Cluster
- **Limites:** 512MB storage, partagé CPU/RAM
- **Upgrade:** $9/mois pour M10 (recommandé pour 1M+ utilisateurs)

### Total estimé: **$0-14/mois** pour supporter 1M+ utilisateurs!

---

## 🚨 Dépannage

### Backend ne démarre pas

1. Vérifier les logs Railway
2. Vérifier les variables d'environnement
3. Vérifier que MongoDB Atlas est accessible

### Frontend ne se connecte pas au backend

1. Vérifier `VITE_API_BASE_URL` dans Vercel
2. Vérifier CORS dans le backend
3. Vérifier que le backend est déployé

### Erreurs CORS

1. Vérifier que `FRONTEND_URL` dans Railway correspond à l'URL Vercel
2. Vérifier la configuration CORS dans `server.js`

### MongoDB connection failed

1. Vérifier l'URI dans Railway
2. Vérifier Network Access dans MongoDB Atlas
3. Vérifier les credentials

---

## ✅ Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Backend déployé sur Railway
- [ ] Frontend déployé sur Vercel
- [ ] MongoDB Atlas configuré
- [ ] Variables d'environnement configurées
- [ ] CORS configuré
- [ ] HTTPS activé (automatique)
- [ ] Tests de déploiement réussis
- [ ] Monitoring configuré
- [ ] Documentation mise à jour

---

## 📞 Support

Pour toute question:
1. Vérifier les logs dans Railway/Vercel
2. Vérifier MongoDB Atlas monitoring
3. Consulter la documentation de chaque service

---

## 🎉 Félicitations!

Votre application est maintenant déployée et prête à supporter 1 million+ d'utilisateurs!

**URLs importantes:**
- Frontend: `https://votre-app.vercel.app`
- Backend: `https://votre-backend.railway.app`
- Admin: `https://votre-app.vercel.app/admin/login`

