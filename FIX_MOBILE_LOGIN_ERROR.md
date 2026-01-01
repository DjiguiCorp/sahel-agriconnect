# 🔧 Fix: Erreur "Erreur de connexion au serveur" sur Mobile

## 🔍 Problème Identifié

L'erreur **"Erreur de connexion au serveur"** apparaît lors de la tentative de connexion admin sur mobile.

**Cause principale :** La variable d'environnement `VITE_API_BASE_URL` n'est pas définie dans Vercel, donc le frontend utilise `http://localhost:3001` par défaut, qui n'est pas accessible depuis mobile.

---

## ✅ Solution : Configurer les Variables d'Environnement dans Vercel

### Étape 1 : Récupérer l'URL du Backend Render

1. Allez sur **https://dashboard.render.com**
2. Cliquez sur votre service backend
3. Copiez l'URL affichée en haut (ex: `https://sahel-agriconnect-backend.onrender.com`)

---

### Étape 2 : Configurer les Variables dans Vercel

1. **Allez sur Vercel :** https://vercel.com/dashboard
2. **Sélectionnez votre projet** `sahel-agriconnect`
3. **Allez dans Settings** → **Environment Variables**
4. **Ajoutez/modifiez ces variables :**

   ```
   VITE_API_BASE_URL=https://votre-backend.onrender.com
   VITE_WS_BASE_URL=https://votre-backend.onrender.com
   ```

   **⚠️ Important :**
   - ✅ Remplacez `votre-backend.onrender.com` par votre URL Render réelle
   - ✅ URL complète avec `https://`
   - ✅ Pas de trailing slash `/` à la fin
   - ✅ Même URL pour les deux variables

5. **Sélectionnez les environnements :**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. **Cliquez sur "Save"**

---

### Étape 3 : Redéployer le Frontend

1. **Allez dans "Deployments"**
2. **Cliquez sur les 3 points (⋯)** du dernier déploiement
3. **Cliquez sur "Redeploy"**
4. **Attendez 2-5 minutes** pour le redéploiement

---

### Étape 4 : Vérifier le Backend Render

**Assurez-vous que le backend est "Live" :**

1. Allez sur **https://dashboard.render.com**
2. Vérifiez que votre service backend affiche **"Live"** (pas "Sleeping")
3. Si "Sleeping", le premier appel prendra 30-60 secondes (normal pour le plan gratuit)

---

### Étape 5 : Tester sur Mobile

1. **Videz le cache** du navigateur mobile :
   - Chrome : Settings → Privacy → Clear browsing data
   - Safari : Settings → Safari → Clear History and Website Data

2. **Ouvrez l'application** : `https://sahel-agriconnect.vercel.app/admin/login`

3. **Testez la connexion** avec :
   - Email : `admin@sahelagriconnect.org`
   - Mot de passe : `admin123`

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

1. Allez dans **Settings** → **Environment Variables**
2. Vérifiez que `VITE_API_BASE_URL` existe
3. Vérifiez que la valeur = URL Render (avec `https://`)

**Pour voir les variables dans le build :**
1. Allez dans **Deployments**
2. Cliquez sur un déploiement
3. Regardez les logs de build
4. Les variables `VITE_*` doivent être visibles

---

## 🐛 Dépannage

### Problème 1 : "Network Error" ou "Failed to fetch"

**Cause :** `VITE_API_BASE_URL` pointe vers `localhost` ou est manquante

**Solution :**
1. Vérifiez `VITE_API_BASE_URL` dans Vercel
2. Doit être = URL Render (avec `https://`)
3. Redéployez le frontend

---

### Problème 2 : "CORS Error"

**Cause :** `FRONTEND_URL` dans Render ne correspond pas à l'URL Vercel

**Solution :**
1. Allez dans Render → Environment
2. Vérifiez `FRONTEND_URL` = URL Vercel exacte (avec `https://`)
3. Redéployez le backend

---

### Problème 3 : Backend "Sleeping"

**Cause :** Render.com (plan gratuit) endort les services après 15 min d'inactivité

**Solution :**
- C'est normal ! Le premier appel prendra 30-60 secondes
- Les appels suivants seront rapides
- Pour éviter cela, utilisez un plan payant

---

### Problème 4 : Variables Non Prises en Compte

**Cause :** Le cache de Vercel n'a pas été vidé

**Solution :**
1. Allez dans **Deployments**
2. Cliquez sur les 3 points (⋯) du dernier déploiement
3. Cliquez sur **"Redeploy"**
4. Attendez le redéploiement complet

---

## 📋 Checklist de Vérification

- [ ] `VITE_API_BASE_URL` dans Vercel = URL Render (avec `https://`)
- [ ] `VITE_WS_BASE_URL` dans Vercel = URL Render (avec `https://`)
- [ ] `FRONTEND_URL` dans Render = URL Vercel exacte (avec `https://`)
- [ ] Pas de trailing slash `/` dans les URLs
- [ ] Pas d'espaces dans les variables
- [ ] Variables sélectionnées pour Production, Preview, Development
- [ ] Frontend redéployé après modification
- [ ] Backend redéployé après modification (si nécessaire)
- [ ] Cache du navigateur mobile vidé
- [ ] Testé sur mobile après redéploiement

---

## 🔍 Vérification dans la Console

**Pour voir l'URL utilisée dans le code :**

1. **Sur mobile**, ouvrez la console du navigateur (si possible)
2. **Ouvrez l'application**
3. **Regardez les logs** :
   - `🔧 Configuration API:` devrait afficher l'URL Render (pas localhost)
   - `🔐 Tentative de connexion à:` devrait afficher l'URL complète

**Si vous voyez `localhost:3001` :**
- Les variables d'environnement ne sont pas correctement configurées
- Redéployez le frontend

---

## 📝 Exemple de Configuration Correcte

### Vercel (Environment Variables)

```
VITE_API_BASE_URL=https://sahel-agriconnect-backend.onrender.com
VITE_WS_BASE_URL=https://sahel-agriconnect-backend.onrender.com
```

### Render (Environment Variables)

```
FRONTEND_URL=https://sahel-agriconnect.vercel.app
MONGO_URI=mongodb+srv://...
JWT_SECRET=votre-secret-jwt
NODE_ENV=production
PORT=10000
```

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

*Dernière mise à jour : Décembre 2024*

