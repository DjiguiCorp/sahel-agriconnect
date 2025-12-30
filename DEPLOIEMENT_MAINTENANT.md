# 🚀 Déploiement Immédiat - Guide Étape par Étape

## 📋 Vue d'Ensemble

Ce guide vous mènera à travers le déploiement complet:
1. **Frontend** → Vercel (5 minutes)
2. **Backend** → Render.com (10 minutes)

**Temps total:** 15 minutes  
**Tout est déjà configuré!** ✅

---

## 🌐 PARTIE 1: Déployer le Frontend sur Vercel

### Étape 1.1: Créer un Compte Vercel

1. **Ouvrez votre navigateur**
2. **Allez sur:** https://vercel.com/signup
3. **Cliquez sur:** "Continue with GitHub"
4. **Autorisez Vercel** à accéder à votre GitHub
5. **✅ Compte créé!**

### Étape 1.2: Importer le Projet

1. Dans Vercel, vous verrez le **Dashboard**
2. **Cliquez sur:** "Add New Project" (bouton vert/bleu en haut)
3. Vous verrez la liste de vos repositories GitHub
4. **Trouvez:** "sahel-agriconnect" (ou "DjiguiCorp/sahel-agriconnect")
5. **Cliquez sur:** "Import" à côté du repository

### Étape 1.3: Configuration ⚠️ IMPORTANT!

Sur la page de configuration, configurez ces paramètres:

#### **Framework Preset:**
- Devrait être détecté automatiquement: **"Vite"**
- Si ce n'est pas le cas, sélectionnez "Vite" dans le menu

#### **Root Directory:** ⚠️ **TRÈS IMPORTANT!**
1. **Cliquez sur "Edit"** à côté de "Root Directory"
2. **Tapez:** `web-dashboard`
3. **Cliquez "Save"** ou appuyez sur Entrée

**⚠️ SANS CELA, VOUS AUREZ L'ERREUR "No package.json found"!**

#### **Build Command:**
- Devrait être: `npm run build`
- Si vide, tapez: `npm run build`

#### **Output Directory:**
- Devrait être: `dist`
- Si vide, tapez: `dist`

#### **Install Command:**
- Devrait être: `npm install`
- Si vide, tapez: `npm install`

### Étape 1.4: Déployer

1. **Vérifiez** que tous les champs sont corrects
2. **Cliquez sur:** "Deploy" (gros bouton en bas)
3. **Attendez** 2-5 minutes
4. **✅ Succès!** Vous verrez une URL comme: `https://sahel-agriconnect.vercel.app`

**📝 Notez cette URL!** Vous en aurez besoin pour le backend.

---

## ⚙️ PARTIE 2: Déployer le Backend sur Render.com

### Étape 2.1: Créer un Compte Render

1. **Allez sur:** https://dashboard.render.com/register
2. **Cliquez sur:** "Sign up with GitHub"
3. **Autorisez Render** à accéder à votre GitHub
4. **✅ Compte créé!**

### Étape 2.2: Créer un Web Service

1. Dans Render, **cliquez sur:** "New +" (en haut à droite)
2. **Cliquez sur:** "Web Service"
3. Si demandé, **connectez votre GitHub** (autorisez l'accès)
4. **Sélectionnez:** "sahel-agriconnect" (votre repository)

### Étape 2.3: Configuration du Backend

Remplissez ces informations:

#### **Basic Settings:**

- **Name:** `sahel-agriconnect-backend` (ou autre nom)
- **Region:** Choisissez la région la plus proche (ex: Frankfurt, Germany)
- **Branch:** `main` (ou `master`)
- **Root Directory:** ⚠️ **TRÈS IMPORTANT!** Tapez: `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

#### **Environment Variables:**

Cliquez sur **"Advanced"** et ajoutez ces variables (une par une):

```
NODE_ENV=production
```

```
PORT=10000
```

```
MONGO_URI=mongodb+srv://info_db_user:DjiguiAdmin1@sahel-agriconnect-clust.aujb8tp.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
```

```
JWT_SECRET=sahel-agriconnect-super-secret-jwt-key-2024-change-in-production
```

```
ADMIN_EMAIL=admin@sahelagriconnect.org
```

```
ADMIN_PASSWORD=admin123
```

```
FRONTEND_URL=https://sahel-agriconnect.vercel.app
```

**⚠️ Remplacez `https://sahel-agriconnect.vercel.app` par l'URL réelle de votre frontend Vercel!**

#### **Plan:**

- **Choisissez:** "Free" (gratuit)
- ⚠️ **Note:** Le plan gratuit s'endort après 15 min d'inactivité

### Étape 2.4: Déployer

1. **Cliquez sur:** "Create Web Service"
2. **Attendez** 5-10 minutes pour le premier déploiement
3. Render va:
   - Cloner votre repository
   - Installer les dépendances
   - Démarrer votre serveur
4. **✅ Succès!** Vous verrez une URL comme: `https://sahel-agriconnect-backend.onrender.com`

**📝 Notez cette URL!** Vous en aurez besoin pour mettre à jour Vercel.

---

## 🔄 PARTIE 3: Mettre à Jour les URLs

### Étape 3.1: Mettre à Jour Vercel avec l'URL du Backend

1. **Retournez dans Vercel**
2. Allez dans votre projet
3. **Cliquez sur:** "Settings" (en haut)
4. **Cliquez sur:** "Environment Variables" (menu gauche)
5. **Ajoutez ces variables:**

```
VITE_API_BASE_URL=https://sahel-agriconnect-backend.onrender.com
```

```
VITE_WS_BASE_URL=https://sahel-agriconnect-backend.onrender.com
```

**⚠️ Remplacez par l'URL réelle de votre backend Render!**

6. **Cliquez:** "Save"
7. **Allez dans:** "Deployments" (menu)
8. **Cliquez sur:** "..." du dernier déploiement
9. **Cliquez:** "Redeploy"

### Étape 3.2: Mettre à Jour Render avec l'URL du Frontend

1. **Retournez dans Render**
2. Allez dans votre service backend
3. **Cliquez sur:** "Environment" (menu)
4. **Trouvez:** `FRONTEND_URL`
5. **Mettez à jour** avec l'URL Vercel réelle:
   ```
   FRONTEND_URL=https://sahel-agriconnect.vercel.app
   ```
6. **Cliquez:** "Save Changes"
7. Render redéploiera automatiquement

---

## ✅ PARTIE 4: Vérifier que Tout Fonctionne

### Test 1: Backend

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

### Test 2: Frontend

Ouvrez dans votre navigateur:
```
https://sahel-agriconnect.vercel.app
```

Vous devriez voir votre application!

### Test 3: Connexion Frontend ↔ Backend

1. Allez sur: `https://sahel-agriconnect.vercel.app/admin/login`
2. Essayez de vous connecter:
   - Email: `admin@sahelagriconnect.org`
   - Mot de passe: `admin123`

**✅ Si ça fonctionne, tout est déployé!**

---

## 📝 Résumé des URLs

Après le déploiement, vous aurez:

- **Frontend:** `https://sahel-agriconnect.vercel.app`
- **Backend:** `https://sahel-agriconnect-backend.onrender.com`
- **Admin:** `https://sahel-agriconnect.vercel.app/admin/login`
- **MongoDB Atlas:** Déjà configuré ✅

---

## 🐛 Dépannage Rapide

### Erreur Vercel: "No package.json found"
→ Vérifiez que Root Directory = `web-dashboard`

### Erreur Render: "Build failed"
→ Vérifiez les logs dans Render pour l'erreur exacte

### Erreur: "Cannot connect to backend"
→ Vérifiez que `VITE_API_BASE_URL` dans Vercel correspond à l'URL Render

### Erreur: "CORS error"
→ Vérifiez que `FRONTEND_URL` dans Render correspond à l'URL Vercel

---

## 🎉 Félicitations!

Votre application **Sahel AgriConnect** est maintenant en ligne!

**Partagez les URLs avec vos utilisateurs!** 🚀

