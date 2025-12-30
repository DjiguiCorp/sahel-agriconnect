# 🚀 Guide Complet: Déployer Sahel AgriConnect sur Vercel

## 📋 Vue d'Ensemble

Ce guide vous aidera à déployer votre **frontend React** (web-dashboard) sur **Vercel** (gratuit).

**Temps estimé:** 10-15 minutes  
**Niveau:** Débutant  
**Système:** Windows

---

## ✅ Prérequis

- [x] ✅ Code déjà sur GitHub: https://github.com/DjiguiCorp/sahel-agriconnect
- [ ] Compte Vercel (gratuit) - nous allons le créer
- [ ] Navigateur web

---

## 📦 Étape 1: Vérifier les Fichiers de Configuration

### 1.1. Vérifier que `vercel.json` existe

Le fichier `web-dashboard/vercel.json` devrait déjà exister avec ce contenu:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

✅ **Ce fichier est déjà créé!**

### 1.2. Vérifier que `.vercelignore` existe

Le fichier `web-dashboard/.vercelignore` devrait exister pour ignorer les fichiers inutiles.

✅ **Ce fichier est déjà créé!**

---

## 🌐 Étape 2: Créer un Compte Vercel

### 2.1. Aller sur Vercel

1. Ouvrez votre navigateur
2. Allez sur: **https://vercel.com/signup**
3. Cliquez sur **"Continue with GitHub"** (recommandé)
   - Cela utilise votre compte GitHub existant
   - Plus rapide et plus sûr

### 2.2. Autoriser Vercel

1. GitHub vous demandera d'autoriser Vercel
2. Cliquez sur **"Authorize Vercel"**
3. Vercel va maintenant accéder à vos repositories GitHub

**✅ Votre compte Vercel est créé!**

---

## 📥 Étape 3: Importer votre Projet GitHub

### 3.1. Ajouter un Nouveau Projet

1. Dans Vercel, vous serez sur le **Dashboard**
2. Cliquez sur le bouton **"Add New Project"** (ou "New Project")
   - C'est un gros bouton vert/bleu en haut à droite

### 3.2. Sélectionner votre Repository

1. Vous verrez la liste de vos repositories GitHub
2. Trouvez **"sahel-agriconnect"** (ou "DjiguiCorp/sahel-agriconnect")
3. Cliquez sur **"Import"** à côté du repository

**✅ Votre repository est importé!**

---

## ⚙️ Étape 4: Configurer le Projet

### 4.1. Configuration du Projet

Sur la page de configuration, vous verrez plusieurs champs:

#### **Framework Preset:**
- Vercel devrait détecter automatiquement **"Vite"**
- Si ce n'est pas le cas, sélectionnez **"Vite"** dans le menu déroulant

#### **Root Directory:** ⚠️ **TRÈS IMPORTANT!**
1. Cliquez sur **"Edit"** à côté de "Root Directory"
2. Tapez: **`web-dashboard`**
3. Cliquez **"Save"** ou appuyez sur Entrée

**⚠️ C'est CRUCIAL!** Sans cela, Vercel cherchera `package.json` à la racine et échouera.

#### **Build Command:**
- Devrait être: **`npm run build`**
- Si vide, tapez: `npm run build`

#### **Output Directory:**
- Devrait être: **`dist`**
- Si vide, tapez: `dist`

#### **Install Command:**
- Devrait être: **`npm install`**
- Si vide, tapez: `npm install`

### 4.2. Variables d'Environnement (Optionnel pour l'instant)

**Pour l'instant, vous pouvez ignorer cette section.**

Nous configurerons les variables d'environnement après le déploiement du backend.

---

## 🚀 Étape 5: Déployer!

### 5.1. Lancer le Déploiement

1. Vérifiez que tous les champs sont corrects:
   - ✅ Framework: Vite
   - ✅ Root Directory: **web-dashboard** ⚠️
   - ✅ Build Command: npm run build
   - ✅ Output Directory: dist
   - ✅ Install Command: npm install

2. Cliquez sur le gros bouton **"Deploy"** en bas

### 5.2. Attendre le Build

1. Vercel va maintenant:
   - Cloner votre repository
   - Installer les dépendances (`npm install`)
   - Builder votre application (`npm run build`)
   - Déployer sur leur CDN

2. Vous verrez les logs en temps réel
3. **Temps d'attente:** 2-5 minutes pour le premier déploiement

### 5.3. Succès!

Quand c'est terminé, vous verrez:
- ✅ **"Deployment successful"**
- Une URL comme: `https://sahel-agriconnect.vercel.app`

**🎉 Votre application est en ligne!**

---

## 🔗 Étape 6: Obtenir l'URL Publique

### 6.1. URL de Déploiement

Après le déploiement réussi, vous verrez:

1. **URL principale:** `https://sahel-agriconnect.vercel.app`
   - C'est l'URL de votre application
   - Partagez-la avec vos utilisateurs!

2. **URLs de déploiement:**
   - Chaque déploiement a sa propre URL
   - Format: `https://sahel-agriconnect-xxxxx.vercel.app`

### 6.2. Accéder à votre Application

1. Cliquez sur l'URL ou copiez-la
2. Ouvrez-la dans votre navigateur
3. Vous devriez voir votre application Sahel AgriConnect!

**✅ Votre frontend est maintenant en ligne!**

---

## 🐛 Dépannage des Erreurs Courantes

### ❌ Erreur: "No package.json found"

**Cause:** Root Directory n'est pas configuré sur `web-dashboard`

**Solution:**
1. Allez dans **Settings** → **General**
2. Trouvez **"Root Directory"**
3. Cliquez **"Edit"**
4. Tapez: `web-dashboard`
5. Cliquez **"Save"**
6. Allez dans **Deployments**
7. Cliquez sur **"..."** du dernier déploiement
8. Cliquez **"Redeploy"**

### ❌ Erreur: "Build failed"

**Causes possibles:**
1. Erreurs dans le code
2. Dépendances manquantes
3. Configuration incorrecte

**Solution:**
1. Allez dans **Deployments**
2. Cliquez sur le déploiement qui a échoué
3. Regardez les **logs** pour voir l'erreur exacte
4. Corrigez l'erreur dans votre code
5. Poussez les changements sur GitHub
6. Vercel redéploiera automatiquement

### ❌ Erreur: "Module not found"

**Cause:** Dépendance manquante dans `package.json`

**Solution:**
1. Vérifiez que toutes les dépendances sont dans `web-dashboard/package.json`
2. Si manquante, ajoutez-la localement:
   ```powershell
   cd web-dashboard
   npm install nom-du-package
   ```
3. Commitez et poussez:
   ```powershell
   git add web-dashboard/package.json
   git commit -m "Add missing dependency"
   git push origin main
   ```
4. Vercel redéploiera automatiquement

### ❌ Erreur: "Build command failed"

**Solution:**
1. Testez le build localement:
   ```powershell
   cd web-dashboard
   npm run build
   ```
2. Si ça échoue localement, corrigez les erreurs
3. Si ça fonctionne localement, vérifiez les logs Vercel pour l'erreur exacte

### ❌ Erreur: "Root Directory not found"

**Solution:**
1. Vérifiez que le dossier `web-dashboard` existe dans votre repository GitHub
2. Vérifiez l'orthographe: `web-dashboard` (avec tiret, pas underscore)
3. Vérifiez dans Settings → General → Root Directory

---

## ✅ Checklist de Vérification

- [ ] Compte Vercel créé
- [ ] Repository GitHub importé
- [ ] Root Directory configuré sur `web-dashboard`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`
- [ ] Déploiement réussi
- [ ] URL publique obtenue
- [ ] Application accessible dans le navigateur

---

## 🔄 Déploiements Automatiques

### Fonctionnement

Une fois configuré, Vercel déploie automatiquement:
- ✅ À chaque `git push` sur la branche `main`
- ✅ À chaque Pull Request (création d'une preview)
- ✅ Instantané (2-3 minutes)

### Tester un Nouveau Déploiement

1. Faites un petit changement dans votre code
2. Commitez et poussez:
   ```powershell
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Vercel détectera automatiquement le changement
4. Un nouveau déploiement commencera automatiquement
5. Vous verrez la notification dans Vercel

---

## 📝 Commandes Terminal (Résumé)

Si vous devez faire des changements et les pousser:

```powershell
# Aller dans votre projet
cd "C:\Users\isabe\OneDrive\Desktop\sahel-agriconnect-project"

# Ajouter les changements
git add .

# Créer un commit
git commit -m "Description des changements"

# Pousser vers GitHub
git push origin main

# Vercel déploiera automatiquement!
```

---

## 🎯 Prochaines Étapes

Une fois le frontend déployé sur Vercel:

1. **Déployer le backend sur Render.com** (voir `DEPLOIEMENT_DEBUTANT.md` - Étape 4)
2. **Configurer MongoDB Atlas** (voir `DEPLOIEMENT_DEBUTANT.md` - Étape 2)
3. **Mettre à jour les variables d'environnement** dans Vercel:
   - `VITE_API_BASE_URL=https://votre-backend.onrender.com`
   - `VITE_WS_BASE_URL=https://votre-backend.onrender.com`
4. **Redéployer** le frontend pour que les changements prennent effet

---

## 📞 Support

### Liens Utiles

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentation Vercel:** https://vercel.com/docs
- **Votre Repository:** https://github.com/DjiguiCorp/sahel-agriconnect

### En Cas de Problème

1. Vérifiez les **logs** dans Vercel (onglet "Deployments" → Cliquez sur le déploiement)
2. Vérifiez que **Root Directory** est bien `web-dashboard`
3. Testez le build localement: `cd web-dashboard && npm run build`
4. Consultez la documentation Vercel

---

## ✅ Résumé Rapide

1. ✅ Créer compte Vercel: https://vercel.com/signup
2. ✅ Importer repository: "Add New Project" → Sélectionner "sahel-agriconnect"
3. ✅ **Root Directory:** `web-dashboard` ⚠️ **TRÈS IMPORTANT!**
4. ✅ Build Command: `npm run build`
5. ✅ Output Directory: `dist`
6. ✅ Cliquer "Deploy"
7. ✅ Attendre 2-5 minutes
8. ✅ Obtenir l'URL publique
9. ✅ Tester dans le navigateur

**🎉 Votre frontend est maintenant en ligne sur Vercel!**

---

**Bon déploiement! 🚀**

