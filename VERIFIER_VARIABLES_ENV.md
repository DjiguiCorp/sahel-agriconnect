# ✅ Vérification des Variables d'Environnement

## 🔍 Problème : Accès Mobile

Si l'application fonctionne sur ordinateur mais pas sur mobile, vérifiez ces variables d'environnement.

---

## 📋 Checklist Variables d'Environnement

### 1. **Vercel (Frontend)**

**URL :** https://vercel.com/dashboard

**Variables à vérifier :**

1. Allez dans votre projet → **Settings** → **Environment Variables**

2. Vérifiez ces variables :

   ```
   VITE_API_BASE_URL=https://votre-backend.onrender.com
   VITE_WS_BASE_URL=https://votre-backend.onrender.com
   ```

   **⚠️ Important :**
   - ✅ URL complète avec `https://`
   - ✅ Pas de trailing slash `/` à la fin
   - ✅ Remplacez `votre-backend.onrender.com` par votre URL Render réelle
   - ✅ Même URL pour les deux variables (API et WebSocket)

3. **Environnements :**
   - Cochez **Production**, **Preview**, et **Development**

4. **Redéployez** après modification :
   - Allez dans **Deployments**
   - Cliquez sur les 3 points (⋯) du dernier déploiement
   - Cliquez sur **Redeploy**

---

### 2. **Render.com (Backend)**

**URL :** https://dashboard.render.com

**Variables à vérifier :**

1. Allez dans votre service backend → **Environment**

2. Vérifiez ces variables :

   ```
   FRONTEND_URL=https://sahel-agriconnect.vercel.app
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=votre-secret-jwt
   NODE_ENV=production
   PORT=10000
   ```

   **⚠️ Important pour `FRONTEND_URL` :**
   - ✅ URL exacte de votre frontend Vercel
   - ✅ URL complète avec `https://`
   - ✅ Pas de trailing slash `/` à la fin
   - ✅ Pas d'espace avant/après

3. **Exemple correct :**
   ```
   FRONTEND_URL=https://sahel-agriconnect.vercel.app
   ```

4. **Exemple incorrect :**
   ```
   FRONTEND_URL=https://sahel-agriconnect.vercel.app/  ❌ (trailing slash)
   FRONTEND_URL=sahel-agriconnect.vercel.app  ❌ (pas de https://)
   FRONTEND_URL = https://sahel-agriconnect.vercel.app  ❌ (espaces)
   ```

5. **Redéployez** après modification :
   - Allez dans **Manual Deploy**
   - Cliquez sur **Clear build cache & deploy**

---

## 🧪 Test de Vérification

### Test 1 : Vérifier Backend Accessible

**Sur mobile, ouvrez dans le navigateur :**
```
https://votre-backend.onrender.com/api/health
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running",
  "timestamp": "2024-12-XX..."
}
```

**Si erreur :**
- Backend peut être "Sleeping" (attendez 30-60 secondes)
- Vérifiez que le service est "Live" dans Render

---

### Test 2 : Vérifier CORS

**Sur mobile, ouvrez la console du navigateur (si possible) :**

1. Ouvrez l'application
2. Essayez de vous connecter ou d'utiliser une fonctionnalité
3. Vérifiez les erreurs dans la console

**Erreur CORS typique :**
```
Access to fetch at 'https://backend.onrender.com/api/...' from origin 'https://sahel-agriconnect.vercel.app' has been blocked by CORS policy
```

**Solution :**
- Vérifiez `FRONTEND_URL` dans Render
- Redéployez le backend

---

### Test 3 : Vérifier Variables Frontend

**Dans Vercel, vérifiez que les variables sont bien définies :**

1. Allez dans **Settings** → **Environment Variables**
2. Vérifiez que `VITE_API_BASE_URL` existe
3. Vérifiez que la valeur = URL Render (avec `https://`)

**Pour voir les variables dans le build :**
1. Allez dans **Deployments**
2. Cliquez sur un déploiement
3. Regardez les logs de build
4. Les variables `VITE_*` doivent être visibles

---

## 🔄 Redéploiement Nécessaire

### Après Modification des Variables

**Vercel :**
1. Modifiez les variables dans Settings
2. Allez dans Deployments
3. Cliquez sur les 3 points (⋯) du dernier déploiement
4. Cliquez sur **Redeploy**

**Render :**
1. Modifiez les variables dans Environment
2. Allez dans Manual Deploy
3. Cliquez sur **Clear build cache & deploy**

**⚠️ Important :**
- Les changements de variables nécessitent un redéploiement
- Le cache peut prendre quelques minutes à se vider

---

## 📝 URLs à Récupérer

### URL Backend Render

1. Allez sur https://dashboard.render.com
2. Cliquez sur votre service backend
3. L'URL est affichée en haut : `https://votre-service.onrender.com`
4. Copiez cette URL exacte

### URL Frontend Vercel

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur votre projet
3. L'URL est affichée : `https://sahel-agriconnect.vercel.app`
4. Copiez cette URL exacte

---

## 🐛 Problèmes Courants

### Problème 1 : "Network Error" sur Mobile

**Cause :** `VITE_API_BASE_URL` pointe vers `localhost` ou est manquante

**Solution :**
1. Vérifiez `VITE_API_BASE_URL` dans Vercel
2. Doit être = URL Render (avec `https://`)
3. Redéployez le frontend

---

### Problème 2 : "CORS Error" sur Mobile

**Cause :** `FRONTEND_URL` dans Render ne correspond pas à l'URL Vercel

**Solution :**
1. Vérifiez `FRONTEND_URL` dans Render
2. Doit être exactement = URL Vercel (avec `https://`)
3. Redéployez le backend

---

### Problème 3 : Backend "Sleeping"

**Cause :** Render.com (plan gratuit) endort les services après 15 min d'inactivité

**Solution :**
- C'est normal ! Le premier appel prendra 30-60 secondes
- Les appels suivants seront rapides
- Pour éviter cela, utilisez un plan payant ou un service de "keep-alive"

---

## ✅ Checklist Finale

- [ ] `VITE_API_BASE_URL` dans Vercel = URL Render (avec `https://`)
- [ ] `VITE_WS_BASE_URL` dans Vercel = URL Render (avec `https://`)
- [ ] `FRONTEND_URL` dans Render = URL Vercel exacte (avec `https://`)
- [ ] Pas de trailing slash `/` dans les URLs
- [ ] Pas d'espaces dans les variables
- [ ] Backend redéployé après modification
- [ ] Frontend redéployé après modification
- [ ] Testé sur mobile après redéploiement

---

*Dernière mise à jour : Décembre 2024*

