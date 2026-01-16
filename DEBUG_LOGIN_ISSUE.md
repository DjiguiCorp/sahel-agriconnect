# 🔍 Guide de Diagnostic - Problème de Connexion Admin

## ❌ Problème

**"Erreur de connexion au serveur"** lors de la tentative de connexion avec :
- Email : `admin@sahelagriconnect.org`
- Password : `admin123`

---

## ✅ Solutions Appliquées

### 1. **Correction de l'incompatibilité Backend/Frontend**

**Problème identifié :**
- Le backend retourne `{ success: true, token, admin: {...} }`
- Le frontend cherchait `data.user` au lieu de `data.admin`

**Correction :** Le frontend accepte maintenant `data.admin` ou `data.user` pour compatibilité.

### 2. **Amélioration de la gestion des erreurs**

- Le backend peut retourner `error` ou `message`
- Le frontend gère maintenant les deux formats

### 3. **Amélioration de l'affichage des erreurs**

- Messages d'erreur plus détaillés en mode développement
- Instructions de debug affichées directement dans l'interface

---

## 🧪 Tests à Effectuer

### Test 1 : Vérifier que le Backend est Démarré

```bash
# Dans le dossier backend
cd backend
npm run dev
```

**Résultat attendu :**
```
Server running on port 3001
MongoDB connected successfully
```

---

### Test 2 : Vérifier l'Endpoint de Santé

**Dans le navigateur ou avec curl :**
```
http://localhost:3001/api/health
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running"
}
```

---

### Test 3 : Tester l'Endpoint de Login

**Option A : Utiliser le script de test**
```bash
cd backend
node test-login-api.js
```

**Option B : Utiliser curl**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sahelagriconnect.org","password":"admin123"}'
```

**Résultat attendu :**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "email": "admin@sahelagriconnect.org",
    "name": "Administrateur Central",
    "role": "admin"
  }
}
```

---

### Test 4 : Vérifier que l'Admin Existe dans la Base de Données

**Option A : Utiliser le script d'initialisation**
```bash
cd backend
node scripts/initAdmin.js
```

**Option B : Vérifier manuellement dans MongoDB**
- Connectez-vous à MongoDB Atlas
- Vérifiez la collection `admins`
- Un document avec `email: "admin@sahelagriconnect.org"` doit exister

---

### Test 5 : Vérifier les Variables d'Environnement

**Dans le backend, vérifiez `.env` :**
```env
PORT=3001
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

**Dans le frontend (Vercel), vérifiez :**
- `VITE_API_BASE_URL` = URL du backend Render (ex: `https://backend.onrender.com`)
- `VITE_WS_BASE_URL` = URL du backend Render (même URL)

---

## 🔧 Checklist de Diagnostic

### ✅ Backend

- [ ] Le backend est démarré (`npm run dev` dans `backend/`)
- [ ] MongoDB est connecté (vérifier les logs)
- [ ] Le port 3001 est accessible
- [ ] L'endpoint `/api/health` répond
- [ ] L'endpoint `/api/auth/login` existe
- [ ] L'admin par défaut existe dans la base de données
- [ ] Les variables d'environnement sont configurées (`.env`)

### ✅ Frontend

- [ ] Le frontend est démarré (`npm run dev` dans `web-dashboard/`)
- [ ] `VITE_API_BASE_URL` est défini (ou utilise `localhost:3001` en dev)
- [ ] La console du navigateur ne montre pas d'erreurs CORS
- [ ] La requête est envoyée à la bonne URL

### ✅ Production (Vercel/Render)

- [ ] `VITE_API_BASE_URL` est configuré dans Vercel
- [ ] `VITE_WS_BASE_URL` est configuré dans Vercel
- [ ] Le backend Render est "Live" (pas "Sleeping")
- [ ] Les variables d'environnement du backend sont configurées dans Render
- [ ] CORS est configuré pour autoriser les requêtes depuis Vercel

---

## 🐛 Problèmes Courants et Solutions

### Problème 1 : "Failed to fetch" ou "NetworkError"

**Causes possibles :**
1. Le backend n'est pas démarré
2. `VITE_API_BASE_URL` pointe vers `localhost` en production
3. Le backend Render est "Sleeping" (premier appel prend 30-60 secondes)

**Solutions :**
1. Démarrer le backend : `cd backend && npm run dev`
2. Configurer `VITE_API_BASE_URL` dans Vercel avec l'URL Render
3. Attendre 30-60 secondes pour le premier appel (plan gratuit Render)

---

### Problème 2 : "Email ou mot de passe incorrect"

**Causes possibles :**
1. L'admin n'existe pas dans la base de données
2. Le mot de passe est incorrect
3. L'email est mal formaté (espaces, majuscules)

**Solutions :**
1. Créer l'admin : `cd backend && node scripts/initAdmin.js`
2. Vérifier les credentials : `admin@sahelagriconnect.org` / `admin123`
3. Vérifier que l'email est en minuscules (le backend le convertit automatiquement)

---

### Problème 3 : "CORS error"

**Causes possibles :**
1. Le backend n'autorise pas l'origine du frontend
2. `FRONTEND_URL` n'est pas configuré dans le backend

**Solutions :**
1. Vérifier `FRONTEND_URL` dans `.env` du backend
2. Vérifier la configuration CORS dans `backend/server.js`
3. En développement, CORS devrait permettre `localhost:5173`

---

### Problème 4 : "Erreur serveur" (500)

**Causes possibles :**
1. MongoDB n'est pas connecté
2. `JWT_SECRET` n'est pas défini
3. Erreur dans le code du backend

**Solutions :**
1. Vérifier la connexion MongoDB dans les logs
2. Vérifier que `JWT_SECRET` est défini dans `.env`
3. Vérifier les logs du backend pour l'erreur exacte

---

## 📊 Logs à Vérifier

### Backend (Console)
```
✅ MongoDB connected successfully
✅ Server running on port 3001
🔐 POST /api/auth/login
```

### Frontend (Console du Navigateur - F12)
```
🔐 Tentative de connexion à: http://localhost:3001/api/auth/login
✅ Configuration API:
  - API_BASE_URL: http://localhost:3001
  - VITE_API_BASE_URL: http://localhost:3001
```

### Erreurs Possibles
```
❌ Erreur de connexion: Failed to fetch
📍 URL utilisée: http://localhost:3001/api/auth/login
📍 API_BASE_URL: NON DÉFINI (utilise localhost)
```

---

## 🚀 Commandes Rapides

### Démarrer le Backend
```bash
cd backend
npm run dev
```

### Démarrer le Frontend
```bash
cd web-dashboard
npm run dev
```

### Tester l'API de Login
```bash
cd backend
node test-login-api.js
```

### Créer l'Admin par Défaut
```bash
cd backend
node scripts/initAdmin.js
```

---

## 📝 Notes Importantes

1. **En développement :** Le frontend utilise `http://localhost:3001` par défaut si `VITE_API_BASE_URL` n'est pas défini.

2. **En production :** `VITE_API_BASE_URL` **DOIT** être configuré dans Vercel avec l'URL du backend Render.

3. **Backend Render (plan gratuit) :** Le premier appel après inactivité prend 30-60 secondes (service "Sleeping").

4. **CORS :** Le backend est configuré pour être permissif en développement et autoriser Vercel en production.

---

## 🆘 Si Rien Ne Fonctionne

1. **Vérifier les logs complets :**
   - Backend : Console où `npm run dev` est lancé
   - Frontend : Console du navigateur (F12 → Console)

2. **Tester l'API directement :**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@sahelagriconnect.org","password":"admin123"}'
   ```

3. **Vérifier la base de données :**
   - Connectez-vous à MongoDB Atlas
   - Vérifiez que la collection `admins` contient un document avec l'email `admin@sahelagriconnect.org`

4. **Redémarrer tout :**
   - Arrêter le backend (Ctrl+C)
   - Arrêter le frontend (Ctrl+C)
   - Redémarrer le backend
   - Redémarrer le frontend
   - Vider le cache du navigateur (Ctrl+Shift+Delete)

---

*Guide créé le : Décembre 2024*
*Dernière mise à jour : Après correction de l'incompatibilité backend/frontend*
