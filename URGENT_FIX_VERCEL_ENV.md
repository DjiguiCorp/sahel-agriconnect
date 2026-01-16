# 🚨 URGENT : Correction Définitive - Configuration Vercel

## ❌ Problème Actuel

L'erreur montre toujours : `API URL: https://votre-backend.onrender.com` (placeholder)

**Cela signifie que `VITE_API_BASE_URL` n'est PAS configuré dans Vercel OU est configuré avec la valeur placeholder.**

---

## ✅ Solution Définitive - Étapes CRITIQUES

### ÉTAPE 1 : Trouver votre VRAIE URL Render

1. Allez sur **https://dashboard.render.com**
2. Connectez-vous à votre compte
3. Cliquez sur votre service backend (ex: "sahel-agriconnect" ou similaire)
4. **En haut de la page**, vous verrez l'URL de votre service
   - Format : `https://sahel-agriconnect-backend-xxxx.onrender.com`
   - OU : `https://sahel-agriconnect-xxxx.onrender.com`
   - **COPIEZ CETTE URL COMPLÈTE**

### ÉTAPE 2 : Vérifier/Créer `VITE_API_BASE_URL` dans Vercel

1. Allez sur **https://vercel.com/dashboard**
2. Sélectionnez votre projet **sahel-agriconnect**
3. Allez dans **Settings** → **Environment Variables**
4. **Cherchez** `VITE_API_BASE_URL` dans la liste

#### Si `VITE_API_BASE_URL` EXISTE :

1. **Cliquez sur les 3 points** (⋯) à droite de la variable
2. Cliquez sur **"Edit"**
3. **Vérifiez la valeur** :
   - ❌ **PAS** `https://votre-backend.onrender.com` (placeholder)
   - ❌ **PAS** `http://localhost:3001`
   - ✅ **DOIT ÊTRE** votre vraie URL Render (ex: `https://sahel-agriconnect-backend-xxxx.onrender.com`)
4. Si la valeur est incorrecte :
   - **Remplacez** par votre vraie URL Render
   - **Vérifiez** que les environnements sont cochés : ✅ Production, ✅ Preview, ✅ Development
   - Cliquez sur **"Save"**

#### Si `VITE_API_BASE_URL` N'EXISTE PAS :

1. Cliquez sur **"+ Add"** ou **"Add Environment Variable"**
2. **Key :** `VITE_API_BASE_URL` (exactement, avec majuscules)
3. **Value :** Votre vraie URL Render (ex: `https://sahel-agriconnect-backend-xxxx.onrender.com`)
   - **IMPORTANT :** Sans trailing slash (`/`)
   - **IMPORTANT :** Commence par `https://`
4. **Environments :** Cochez ✅ Production, ✅ Preview, ✅ Development
5. Cliquez sur **"Save"**

### ÉTAPE 3 : Redéployer dans Vercel

**CRITIQUE :** Après avoir modifié les variables d'environnement, vous DEVEZ redéployer.

1. Allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points** (⋯) à droite
4. Cliquez sur **"Redeploy"**
5. **OU** faites un nouveau commit et push (cela déclenchera un nouveau déploiement)

### ÉTAPE 4 : Vérifier le Déploiement

1. Attendez que le déploiement soit terminé (1-2 minutes)
2. Allez sur **https://sahel-agriconnect.vercel.app/admin/login**
3. **Ouvrez la console du navigateur** (F12 → Console)
4. **Cherchez** les logs commençant par `🔧 Config API`
5. **Vérifiez** que `VITE_API_BASE_URL` affiche votre vraie URL Render (pas le placeholder)

---

## 🔍 Vérification

### Dans la Console du Navigateur :

Vous devriez voir :
```
🔧 Config API - VITE_API_BASE_URL: https://sahel-agriconnect-backend-xxxx.onrender.com
```

**PAS :**
```
🔧 Config API - VITE_API_BASE_URL: https://votre-backend.onrender.com
🔧 Config API - VITE_API_BASE_URL: NOT SET - using fallback
```

### Test de Connexion :

1. Essayez de vous connecter avec :
   - Email : `admin@sahelagriconnect.org`
   - Password : `admin123`
2. Si ça fonctionne → ✅ Problème résolu
3. Si ça ne fonctionne pas → Vérifiez les logs de la console pour plus de détails

---

## ⚠️ Problèmes Courants

### Problème 1 : "La variable existe mais l'URL est toujours le placeholder"

**Cause :** La variable est configurée avec la valeur placeholder.

**Solution :**
1. Éditez `VITE_API_BASE_URL` dans Vercel
2. Remplacez `https://votre-backend.onrender.com` par votre vraie URL Render
3. Redéployez

### Problème 2 : "La variable n'existe pas"

**Cause :** `VITE_API_BASE_URL` n'a jamais été créée dans Vercel.

**Solution :**
1. Créez la variable avec votre vraie URL Render
2. Redéployez

### Problème 3 : "Le déploiement ne prend pas en compte la nouvelle variable"

**Cause :** Vercel utilise parfois le cache des builds précédents.

**Solution :**
1. Allez dans **Settings** → **Build & Development Settings**
2. Ajoutez un commentaire dans votre code (ex: `// Force rebuild - Jan 16`)
3. Commit et push
4. Cela forcera un nouveau build avec les nouvelles variables

---

## 📋 Checklist

- [ ] J'ai trouvé ma vraie URL Render sur dashboard.render.com
- [ ] J'ai vérifié/créé `VITE_API_BASE_URL` dans Vercel
- [ ] La valeur est ma vraie URL Render (pas le placeholder)
- [ ] Les environnements sont cochés (Production, Preview, Development)
- [ ] J'ai redéployé dans Vercel
- [ ] J'ai vérifié la console du navigateur - l'URL est correcte
- [ ] La connexion admin fonctionne

---

*Suivez ces étapes EXACTEMENT dans l'ordre pour résoudre le problème définitivement.* ✅
