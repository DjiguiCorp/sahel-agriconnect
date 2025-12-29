# 🚀 Guide de Déploiement pour Débutants - Sahel AgriConnect

## 📋 Vue d'Ensemble

Ce guide vous aidera à déployer votre projet **Sahel AgriConnect** en deux parties:
1. **Frontend (React)** → Vercel (gratuit)
2. **Backend (Node.js)** → Render.com (gratuit)

**Temps estimé:** 30-45 minutes  
**Niveau:** Débutant  
**Système:** Windows

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir:

- [ ] Un compte **GitHub** (gratuit) - [Créer un compte](https://github.com/signup)
- [ ] Un compte **Vercel** (gratuit) - [Créer un compte](https://vercel.com/signup)
- [ ] Un compte **Render.com** (gratuit) - [Créer un compte](https://dashboard.render.com/register)
- [ ] Un compte **MongoDB Atlas** (gratuit) - [Créer un compte](https://www.mongodb.com/cloud/atlas/register)
- [ ] **Git** installé sur Windows - [Télécharger Git](https://git-scm.com/download/win)
- [ ] Votre code sur **GitHub** (voir étape 1)

---

## 📦 Étape 1: Préparer le Code sur GitHub

### 1.1. Vérifier que Git est installé

Ouvrez **PowerShell** ou **Invite de commandes** et tapez:

```powershell
git --version
```

**Résultat attendu:** `git version 2.x.x` (ou similaire)

Si Git n'est pas installé, téléchargez-le depuis: https://git-scm.com/download/win

### 1.2. Initialiser Git dans votre projet

```powershell
# Aller dans le dossier de votre projet
cd "C:\Users\isabe\OneDrive\Desktop\sahel-agriconnect-project"

# Initialiser Git (si pas déjà fait)
git init

# Vérifier l'état
git status
```

### 1.3. Créer un repository sur GitHub

1. Allez sur https://github.com
2. Cliquez sur le bouton **"+"** en haut à droite
3. Cliquez sur **"New repository"**
4. Remplissez:
   - **Repository name:** `sahel-agriconnect` (ou autre nom)
   - **Description:** `Plateforme de digitalisation agricole - PTASS`
   - **Visibilité:** Public ou Private (votre choix)
   - **NE PAS** cocher "Add a README file" (vous avez déjà un projet)
5. Cliquez sur **"Create repository"**

### 1.4. Pousser votre code sur GitHub

Dans PowerShell, exécutez ces commandes:

```powershell
# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Sahel AgriConnect"

# Remplacer VOTRE-USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/VOTRE-USERNAME/sahel-agriconnect.git

# Renommer la branche principale
git branch -M main

# Pousser vers GitHub
git push -u origin main
```

**Note:** GitHub vous demandera votre nom d'utilisateur et mot de passe (ou token).

**Si vous avez une erreur d'authentification:**
- Créez un **Personal Access Token** sur GitHub:
  1. Allez dans Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Cliquez "Generate new token"
  3. Cochez "repo"
  4. Copiez le token et utilisez-le comme mot de passe

---

## 🌐 Étape 2: Configurer MongoDB Atlas

### 2.1. Créer un cluster MongoDB Atlas

1. Allez sur https://www.mongodb.com/cloud/atlas
2. Créez un compte (gratuit)
3. Cliquez sur **"Build a Database"**
4. Choisissez **"FREE" (M0)** - Gratuit
5. Choisissez une région (ex: Europe - Paris)
6. Cliquez **"Create"**

### 2.2. Configurer l'accès réseau

1. Dans MongoDB Atlas, allez dans **"Network Access"** (menu gauche)
2. Cliquez **"Add IP Address"**
3. Cliquez **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Cliquez **"Confirm"**

**⚠️ Important:** Pour la production, limitez aux IPs de Render.com, mais pour commencer, "Anywhere" fonctionne.

### 2.3. Créer un utilisateur de base de données

1. Allez dans **"Database Access"** (menu gauche)
2. Cliquez **"Add New Database User"**
3. Remplissez:
   - **Username:** `sahel-admin` (ou autre)
   - **Password:** Créez un mot de passe fort (notez-le!)
   - **Database User Privileges:** "Atlas admin"
4. Cliquez **"Add User"**

### 2.4. Obtenir l'URI de connexion

1. Allez dans **"Database"** (menu gauche)
2. Cliquez sur **"Connect"** sur votre cluster
3. Choisissez **"Connect your application"**
4. Copiez l'URI (format: `mongodb+srv://username:password@cluster.mongodb.net/`)
5. **Remplacez** `<password>` par votre mot de passe
6. **Ajoutez** le nom de la base de données à la fin: `...mongodb.net/sahel-agriconnect?retryWrites=true&w=majority`

**Exemple d'URI complète:**
```
mongodb+srv://sahel-admin:VotreMotDePasse123@cluster0.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
```

**📝 Notez cette URI - vous en aurez besoin pour Render.com!**

---

## 🎨 Étape 3: Déployer le Frontend sur Vercel

### 3.1. Créer un compte Vercel

1. Allez sur https://vercel.com/signup
2. Cliquez **"Continue with GitHub"** (recommandé)
3. Autorisez Vercel à accéder à votre GitHub

### 3.2. Importer votre projet

1. Dans Vercel, cliquez sur **"Add New Project"** (ou "New Project")
2. Vous verrez la liste de vos repositories GitHub
3. Trouvez **"sahel-agriconnect"** et cliquez **"Import"**

### 3.3. Configurer le projet Frontend

**IMPORTANT:** Configurez ces paramètres:

1. **Framework Preset:** `Vite` (ou laissez Vercel détecter automatiquement)
2. **Root Directory:** `web-dashboard` ⚠️ **TRÈS IMPORTANT!**
   - Cliquez sur "Edit" à côté de "Root Directory"
   - Tapez: `web-dashboard`
   - Cliquez "Save"
3. **Build Command:** `npm run build` (devrait être automatique)
4. **Output Directory:** `dist` (devrait être automatique)
5. **Install Command:** `npm install` (devrait être automatique)

### 3.4. Configurer les variables d'environnement

**ATTENDEZ** que le backend soit déployé (étape 4) avant de configurer ces variables!

1. Dans la page de configuration, allez dans **"Environment Variables"**
2. Ajoutez ces variables (vous les remplirez après le déploiement du backend):

```
VITE_API_BASE_URL=https://votre-backend.onrender.com
VITE_WS_BASE_URL=https://votre-backend.onrender.com
```

**⚠️ Note:** Remplacez `votre-backend.onrender.com` par l'URL réelle de votre backend Render (vous l'obtiendrez à l'étape 4).

### 3.5. Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes que le build se termine
3. Vercel vous donnera une URL comme: `https://sahel-agriconnect.vercel.app`

**✅ Votre frontend est maintenant en ligne!**

**📝 Notez cette URL - vous en aurez besoin pour le backend!**

---

## ⚙️ Étape 4: Déployer le Backend sur Render.com

### 4.1. Créer un compte Render.com

1. Allez sur https://dashboard.render.com/register
2. Cliquez **"Sign up with GitHub"**
3. Autorisez Render à accéder à votre GitHub

### 4.2. Créer un nouveau service Web

1. Dans Render, cliquez sur **"New +"** (en haut à droite)
2. Cliquez sur **"Web Service"**
3. Connectez votre repository GitHub si ce n'est pas déjà fait
4. Sélectionnez **"sahel-agriconnect"**

### 4.3. Configurer le service Backend

Remplissez ces informations:

**Basic Settings:**
- **Name:** `sahel-agriconnect-backend` (ou autre nom)
- **Region:** Choisissez la région la plus proche (ex: Frankfurt, Germany)
- **Branch:** `main` (ou `master`)
- **Root Directory:** `backend` ⚠️ **TRÈS IMPORTANT!**
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Environment:**
- **Node Version:** `18` ou `20` (laissez par défaut si disponible)

### 4.4. Configurer les variables d'environnement

Cliquez sur **"Advanced"** et ajoutez ces variables:

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://sahel-admin:VotreMotDePasse@cluster0.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
JWT_SECRET=votre-super-secret-jwt-key-change-this-in-production-123456
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
FRONTEND_URL=https://votre-app.vercel.app
```

**⚠️ Important:**
- Remplacez `MONGO_URI` par votre URI MongoDB Atlas complète
- Remplacez `JWT_SECRET` par une clé secrète forte (générez-en une avec: `openssl rand -base64 32` ou utilisez un générateur en ligne)
- Remplacez `FRONTEND_URL` par l'URL Vercel de votre frontend

**Pour générer un JWT_SECRET:**
- Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`
- Ou utilisez: https://generate-secret.vercel.app/32

### 4.5. Choisir le plan gratuit

1. Dans **"Plan"**, choisissez **"Free"**
2. ⚠️ **Note:** Le plan gratuit a des limitations:
   - Le service s'endort après 15 minutes d'inactivité
   - Premier démarrage peut prendre 30-60 secondes
   - Pour la production, considérez le plan payant ($7/mois)

### 4.6. Déployer

1. Cliquez sur **"Create Web Service"**
2. Render va:
   - Cloner votre repository
   - Installer les dépendances
   - Démarrer votre serveur
3. Attendez 5-10 minutes pour le premier déploiement
4. Vous verrez les logs en temps réel

**✅ Votre backend est maintenant en ligne!**

**📝 Notez l'URL:** `https://sahel-agriconnect-backend.onrender.com` (ou similaire)

---

## 🔄 Étape 5: Mettre à Jour les URLs

### 5.1. Mettre à jour Vercel avec l'URL du backend

1. Retournez dans Vercel
2. Allez dans votre projet
3. Cliquez sur **"Settings"** → **"Environment Variables"**
4. Mettez à jour:
   ```
   VITE_API_BASE_URL=https://sahel-agriconnect-backend.onrender.com
   VITE_WS_BASE_URL=https://sahel-agriconnect-backend.onrender.com
   ```
5. Cliquez **"Save"**
6. Allez dans **"Deployments"**
7. Cliquez sur les **"..."** du dernier déploiement
8. Cliquez **"Redeploy"**

### 5.2. Mettre à jour Render avec l'URL du frontend

1. Retournez dans Render
2. Allez dans votre service backend
3. Cliquez sur **"Environment"**
4. Mettez à jour:
   ```
   FRONTEND_URL=https://sahel-agriconnect.vercel.app
   ```
5. Cliquez **"Save Changes"**
6. Render redéploiera automatiquement

---

## ✅ Étape 6: Vérifier que Tout Fonctionne

### 6.1. Tester le Backend

Ouvrez dans votre navigateur:
```
https://sahel-agriconnect-backend.onrender.com/api/health
```

**Résultat attendu:**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running"
}
```

### 6.2. Tester le Frontend

Ouvrez dans votre navigateur:
```
https://sahel-agriconnect.vercel.app
```

Vous devriez voir votre application!

### 6.3. Tester la connexion Frontend ↔ Backend

1. Allez sur: `https://sahel-agriconnect.vercel.app/admin/login`
2. Essayez de vous connecter avec:
   - Email: `admin@sahelagriconnect.org`
   - Mot de passe: `admin123`

**Si ça ne fonctionne pas:**
- Vérifiez les logs dans Render
- Vérifiez que MongoDB Atlas est accessible
- Vérifiez les variables d'environnement

---

## 🐛 Dépannage

### Problème: Le backend ne démarre pas

**Vérifiez:**
1. Les logs dans Render (onglet "Logs")
2. Que `MONGO_URI` est correct
3. Que MongoDB Atlas autorise l'accès depuis n'importe où (0.0.0.0/0)
4. Que `PORT=10000` (Render utilise le port 10000)

### Problème: Erreur CORS

**Solution:**
1. Vérifiez que `FRONTEND_URL` dans Render correspond à l'URL Vercel
2. Vérifiez le fichier `backend/server.js` - CORS doit autoriser votre URL Vercel

### Problème: Le frontend ne se connecte pas au backend

**Solution:**
1. Vérifiez que `VITE_API_BASE_URL` dans Vercel correspond à l'URL Render
2. Redéployez le frontend après avoir mis à jour les variables
3. Vérifiez la console du navigateur (F12) pour les erreurs

### Problème: Le backend s'endort (plan gratuit Render)

**Solution:**
- C'est normal avec le plan gratuit
- Le premier démarrage prend 30-60 secondes
- Pour éviter cela, considérez le plan payant ($7/mois)

---

## 📝 Checklist Finale

- [ ] Code poussé sur GitHub
- [ ] MongoDB Atlas configuré avec URI
- [ ] Frontend déployé sur Vercel
- [ ] Backend déployé sur Render
- [ ] Variables d'environnement configurées
- [ ] URLs mises à jour (Frontend ↔ Backend)
- [ ] Backend accessible (`/api/health`)
- [ ] Frontend accessible
- [ ] Connexion Frontend ↔ Backend fonctionne
- [ ] Admin login fonctionne

---

## 🎉 Félicitations!

Votre application **Sahel AgriConnect** est maintenant en ligne!

**URLs:**
- Frontend: `https://sahel-agriconnect.vercel.app`
- Backend: `https://sahel-agriconnect-backend.onrender.com`
- Admin: `https://sahel-agriconnect.vercel.app/admin/login`

**Prochaines étapes:**
- Tester toutes les fonctionnalités
- Partager les URLs avec vos utilisateurs
- Surveiller les logs pour les erreurs
- Considérer le plan payant Render pour éviter les temps d'endormissement

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs dans Render et Vercel
2. Vérifiez la console du navigateur (F12)
3. Consultez la documentation:
   - Vercel: https://vercel.com/docs
   - Render: https://render.com/docs
   - MongoDB Atlas: https://docs.atlas.mongodb.com

**Bon déploiement! 🚀**

