# 🚨 URGENT : Configuration Vercel pour Mobile

## ❌ Problème Actuel

**"Load failed when attempting to log in using my phone"**

**Cause :** La variable `VITE_API_BASE_URL` n'est **PAS configurée** dans Vercel, donc le frontend utilise `http://localhost:3001` par défaut, qui n'est **PAS accessible depuis mobile**.

---

## ✅ SOLUTION IMMÉDIATE

### Étape 1 : Récupérer l'URL du Backend Render

1. **Allez sur :** https://dashboard.render.com
2. **Cliquez** sur votre service backend (ex: `sahel-agriconnect-backend`)
3. **Copiez l'URL** affichée en haut (ex: `https://sahel-agriconnect-backend.onrender.com`)

---

### Étape 2 : Configurer dans Vercel (CRITIQUE)

1. **Allez sur :** https://vercel.com/dashboard
2. **Sélectionnez** votre projet `sahel-agriconnect`
3. **Cliquez sur "Settings"** (en haut à droite)
4. **Cliquez sur "Environment Variables"** (dans le menu de gauche)
5. **Ajoutez/modifiez ces variables :**

   **Variable 1 :**
   - **Key :** `VITE_API_BASE_URL`
   - **Value :** `https://votre-backend.onrender.com` (remplacez par votre URL Render réelle)
   - **Environments :** ✅ Production, ✅ Preview, ✅ Development
   - **Cliquez sur "Save"**

   **Variable 2 :**
   - **Key :** `VITE_WS_BASE_URL`
   - **Value :** `https://votre-backend.onrender.com` (même URL que ci-dessus)
   - **Environments :** ✅ Production, ✅ Preview, ✅ Development
   - **Cliquez sur "Save"**

   **⚠️ IMPORTANT :**
   - ✅ URL complète avec `https://`
   - ✅ Pas de trailing slash `/` à la fin
   - ✅ Même URL pour les deux variables
   - ✅ Cochez les 3 environnements (Production, Preview, Development)

---

### Étape 3 : Redéployer le Frontend

1. **Allez dans "Deployments"** (menu de gauche)
2. **Cliquez sur les 3 points (⋯)** du dernier déploiement
3. **Cliquez sur "Redeploy"**
4. **Sélectionnez "Use existing Build Cache"** (ou laissez par défaut)
5. **Cliquez sur "Redeploy"**
6. **Attendez 2-5 minutes** pour le redéploiement

---

### Étape 4 : Vérifier le Backend Render

**Assurez-vous que le backend est "Live" :**

1. **Allez sur :** https://dashboard.render.com
2. **Vérifiez** que votre service backend affiche **"Live"** (pas "Sleeping")
3. **Si "Sleeping" :** Le premier appel prendra 30-60 secondes (normal pour le plan gratuit)

---

### Étape 5 : Tester sur Mobile

1. **Videz le cache** du navigateur mobile :
   - **Chrome :** Settings → Privacy → Clear browsing data
   - **Safari :** Settings → Safari → Clear History and Website Data

2. **Ouvrez l'application :** `https://sahel-agriconnect.vercel.app/admin/login`

3. **Testez la connexion** avec :
   - **Email :** `admin@sahelagriconnect.org`
   - **Mot de passe :** `admin123`

---

## 🧪 Test de Vérification

### Test 1 : Vérifier que le Backend est Accessible

**Sur mobile, ouvrez dans le navigateur :**
```
https://votre-backend.onrender.com/api/health
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running"
}
```

**Si erreur :**
- Backend peut être "Sleeping" (attendez 30-60 secondes)
- Vérifiez que l'URL est correcte

---

### Test 2 : Vérifier les Variables dans Vercel

1. **Allez dans Settings → Environment Variables**
2. **Vérifiez** que `VITE_API_BASE_URL` existe
3. **Vérifiez** que la valeur = URL Render (avec `https://`)
4. **Vérifiez** que les 3 environnements sont cochés

**Pour voir les variables dans le build :**
1. **Allez dans Deployments**
2. **Cliquez** sur un déploiement
3. **Regardez** les logs de build
4. Les variables `VITE_*` doivent être visibles

---

## 🐛 Dépannage

### Problème 1 : "Load failed" ou "Network Error"

**Cause :** `VITE_API_BASE_URL` pointe vers `localhost` ou est manquante

**Solution :**
1. Vérifiez `VITE_API_BASE_URL` dans Vercel
2. Doit être = URL Render (avec `https://`)
3. Redéployez le frontend

---

### Problème 2 : Backend "Sleeping"

**Cause :** Render.com (plan gratuit) endort les services après 15 min d'inactivité

**Solution :**
- C'est normal ! Le premier appel prendra 30-60 secondes
- Les appels suivants seront rapides
- Pour éviter cela, utilisez un plan payant

---

### Problème 3 : Variables Non Prises en Compte

**Cause :** Le cache de Vercel n'a pas été vidé

**Solution :**
1. Allez dans **Deployments**
2. Cliquez sur les 3 points (⋯) du dernier déploiement
3. Cliquez sur **"Redeploy"**
4. **Décochez** "Use existing Build Cache" (si disponible)
5. Attendez le redéploiement complet

---

## 📋 Checklist de Vérification

- [ ] `VITE_API_BASE_URL` dans Vercel = URL Render (avec `https://`)
- [ ] `VITE_WS_BASE_URL` dans Vercel = URL Render (avec `https://`)
- [ ] Variables sélectionnées pour **Production, Preview, Development**
- [ ] Pas de trailing slash `/` dans les URLs
- [ ] Pas d'espaces dans les variables
- [ ] Frontend redéployé après modification
- [ ] Backend Render est "Live"
- [ ] Cache du navigateur mobile vidé
- [ ] Testé sur mobile après redéploiement

---

## 📝 Exemple de Configuration Correcte

### Vercel (Environment Variables)

```
VITE_API_BASE_URL=https://sahel-agriconnect-backend.onrender.com
VITE_WS_BASE_URL=https://sahel-agriconnect-backend.onrender.com
```

**⚠️ Remplacez `sahel-agriconnect-backend.onrender.com` par votre URL Render réelle !**

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

1. **Vérifiez les logs Render** pour voir les erreurs exactes
2. **Testez l'API directement** sur mobile : `https://backend.onrender.com/api/health`
3. **Vérifiez la console** du navigateur mobile (si possible)
4. **Contactez le support** avec :
   - Les logs d'erreur
   - L'URL du backend
   - L'URL du frontend
   - Les variables d'environnement configurées (sans les secrets)

---

*Guide créé le : Décembre 2024*
*URGENT : À faire immédiatement pour résoudre le problème mobile*

