# 🔍 Troubleshooting "Not Found" Error

## ❌ Problème

Erreur "Not Found" affichée sur la page admin ou ailleurs.

---

## 🎯 Causes Possibles

### 1. Route Frontend Non Trouvée

**Symptôme** : La page affiche "Not Found" ou erreur 404

**Solutions** :
- ✅ Routes catch-all ajoutées dans `App.jsx`
- ✅ Vercel.json configuré avec rewrites pour SPA

**Vérifications** :
1. Vérifiez l'URL que vous utilisez :
   - ✅ `/admin/login` - Route correcte
   - ✅ `/admin/central` - Route correcte (nécessite authentification)
   - ❌ `/admin` - Redirige vers `/admin/login`

2. Ouvrez la console (F12) et cherchez :
   - Erreurs de routing React
   - Erreurs de chargement de composants

### 2. Route Backend Non Trouvée

**Symptôme** : L'API retourne `{"error": "Route not found"}`

**Solutions** :
- ✅ Route `/api/auth/login` existe et fonctionne
- ✅ Route `/api/health` existe pour les tests

**Test** :
1. Testez directement : `https://votre-url-render.onrender.com/api/health`
2. Doit retourner : `{"status":"OK","message":"Sahel AgriConnect API is running"}`

### 3. CORS Blocage

**Symptôme** : Erreur CORS dans la console, requête bloquée

**Solutions** :
- ✅ CORS simplifié et configuré
- ✅ `allowedOrigins` inclut Vercel

**Vérifications** :
1. Vérifiez que `FRONTEND_URL` est configuré dans Render :
   - Render → Votre service → Environment
   - `FRONTEND_URL` = `https://sahel-agriconnect.vercel.app`

2. Testez CORS :
   - Console (F12) → Network tab
   - Cherchez les requêtes OPTIONS (preflight)
   - Doivent retourner 200 ou 204

### 4. Variable d'Environnement Non Injectée

**Symptôme** : `VITE_API_BASE_URL` = `NOT_INJECTED` ou placeholder

**Solutions** :
1. **Configurez dans Vercel** :
   - Vercel → Settings → Environment Variables
   - `VITE_API_BASE_URL` = Votre URL Render (ex: `https://sahel-agriconnect-backend-xxxx.onrender.com`)
   - Cochez : Production, Preview, Development

2. **Redéployez** :
   - Deployments → Redeploy

3. **Vérifiez la console** :
   - Doit afficher votre vraie URL Render (pas `NOT_INJECTED`)

---

## ✅ Solutions Appliquées

### Frontend (Routes)
- ✅ Route catch-all ajoutée : `/admin/*` redirige vers `/admin/login`
- ✅ Route catch-all publique : `*` redirige vers `/`
- ✅ Vercel.json configuré avec rewrites pour SPA

### Backend (404 Handler)
- ✅ Handler 404 amélioré avec logs
- ✅ Messages d'erreur plus informatifs
- ✅ Liste des endpoints disponibles dans la réponse

---

## 🔍 Diagnostic Rapide

### Test 1 : Backend Health
```
https://votre-url-render.onrender.com/api/health
```
**Résultat attendu** : `{"status":"OK"}`

### Test 2 : Frontend Routing
```
https://sahel-agriconnect.vercel.app/admin/login
```
**Résultat attendu** : Page de login admin

### Test 3 : Console Navigateur
Ouvrez F12 → Console :
- Cherchez : `🔍 AdminLogin - Current API Base URL:`
- **Doit afficher** : Votre vraie URL Render (pas `NOT_INJECTED`)

---

## 📋 Checklist

- [ ] Backend accessible : `/api/health` retourne OK
- [ ] `VITE_API_BASE_URL` configuré dans Vercel avec vraie URL
- [ ] `FRONTEND_URL` configuré dans Render avec URL Vercel
- [ ] Backend redéployé sur Render
- [ ] Frontend redéployé sur Vercel
- [ ] Console navigateur affiche vraie URL (pas NOT_INJECTED)
- [ ] Routes accessibles : `/admin/login`, `/admin/central`

---

*Suivez ces étapes pour résoudre l'erreur "Not Found".* ✅
