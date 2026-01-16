# 🔧 Guide de Dépannage - Sahel AgriConnect

## 📋 Table des Matières

- [Problèmes de Connexion Admin](#problèmes-de-connexion-admin)
- [Problèmes d'Accès Mobile](#problèmes-daccès-mobile)
- [Configuration Vercel](#configuration-vercel)
- [Configuration Render](#configuration-render)
- [Problèmes MongoDB](#problèmes-mongodb)

---

## 🔐 Problèmes de Connexion Admin

### Erreur: "Erreur de connexion au serveur"

**Causes possibles :**
1. Backend non démarré
2. Variables d'environnement non configurées
3. Incompatibilité backend/frontend

**Solutions :**
1. Vérifier que le backend est démarré : `cd backend && npm run dev`
2. Vérifier les variables d'environnement dans `.env`
3. Vérifier que l'admin existe : `node backend/scripts/initAdmin.js`

**Voir :** `DEBUG_LOGIN_ISSUE.md` pour plus de détails

---

## 📱 Problèmes d'Accès Mobile

### "Load failed" sur mobile

**Cause principale :** `VITE_API_BASE_URL` pointe vers `localhost` au lieu de l'URL Render.

**Solution :**
1. Configurer `VITE_API_BASE_URL` dans Vercel avec l'URL Render
2. Redéployer le frontend
3. Vider le cache du navigateur mobile

**Voir :** `CONFIGURER_VARIABLES_VERCEL_ETAPE_PAR_ETAPE.md` pour guide détaillé

### "Not found" sur mobile

**Causes possibles :**
1. URL incorrecte
2. Problème de routing React (SPA)
3. Build non déployé

**Solutions :**
1. Vérifier l'URL exacte : `https://sahel-agriconnect.vercel.app/admin/login`
2. Vérifier que `vercel.json` est correctement configuré
3. Vérifier que le build est "Ready" dans Vercel

**Voir :** `FIX_NOT_FOUND_MOBILE.md` pour plus de détails

---

## ⚙️ Configuration Vercel

### Variables d'Environnement Requises

- `VITE_API_BASE_URL` : URL du backend Render (ex: `https://backend.onrender.com`)
- `VITE_WS_BASE_URL` : URL du backend Render (même URL)

**⚠️ Important :**
- Pas de trailing slash `/` à la fin
- Les 3 environnements doivent être cochés (Production, Preview, Development)
- Redéployer après modification

**Voir :** `CONFIGURER_VARIABLES_VERCEL_ETAPE_PAR_ETAPE.md` pour guide étape par étape

---

## 🚀 Configuration Render

### Backend "Sleeping"

**Cause :** Plan gratuit Render endort les services après 15 min d'inactivité.

**Solution :**
- C'est normal ! Le premier appel prendra 30-60 secondes
- Les appels suivants seront rapides
- Pour éviter cela, utilisez un plan payant

### Variables d'Environnement Requises

- `MONGO_URI` : URI de connexion MongoDB Atlas
- `JWT_SECRET` : Clé secrète pour JWT
- `FRONTEND_URL` : URL du frontend Vercel
- `NODE_ENV` : `production`

---

## 🗄️ Problèmes MongoDB

### Erreur de connexion MongoDB

**Causes possibles :**
1. Network Access non configuré dans MongoDB Atlas
2. URI incorrecte
3. Credentials incorrects

**Solutions :**
1. Configurer Network Access dans MongoDB Atlas : "Allow Access from Anywhere" (0.0.0.0/0)
2. Vérifier l'URI dans Render : `mongodb+srv://username:password@cluster.mongodb.net/...`
3. Vérifier les credentials

---

## 📚 Guides Détaillés

- **Configuration Vercel :** `CONFIGURER_VARIABLES_VERCEL_ETAPE_PAR_ETAPE.md`
- **Problèmes Login :** `DEBUG_LOGIN_ISSUE.md`
- **Accès Mobile :** `FIX_MOBILE_ADMIN_ACCESS.md`
- **Not Found Mobile :** `FIX_NOT_FOUND_MOBILE.md`

---

*Dernière mise à jour : Décembre 2024*
