# ✅ Vérification du Déploiement - Guide Complet

## 🎯 Objectif

Vérifier que votre backend Render.com fonctionne correctement et peut se connecter à MongoDB Atlas.

---

## 📋 PARTIE 1: Vérifier les Logs Render

### Étape 1.1: Accéder aux Logs

1. **Allez sur:** https://dashboard.render.com
2. **Cliquez sur** votre service backend (`sahel-agriconnect-backend`)
3. **Cliquez sur:** "Logs" (dans le menu de gauche)

### Étape 1.2: Vérifier les Messages de Succès

**✅ Vous devriez voir ces messages:**

```
✅ MongoDB connecté avec succès
🚀 Serveur démarré sur le port 10000
📡 WebSocket disponible sur ws://...
🌐 API disponible sur http://.../api
```

**❌ Si vous voyez encore:**
```
❌ Erreur de connexion MongoDB: Could not connect...
```

→ Le problème n'est pas résolu. Vérifiez Network Access dans MongoDB Atlas.

---

## 🌐 PARTIE 2: Tester l'API Backend

### Étape 2.1: Tester l'Endpoint de Santé

1. **Ouvrez votre navigateur**
2. **Allez sur:** `https://votre-backend.onrender.com/api/health`
   (Remplacez `votre-backend` par le nom réel de votre service)

**✅ Réponse attendue:**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running"
}
```

**❌ Si vous voyez:**
- `ERR_CONNECTION_REFUSED` → Le service n'est pas démarré
- `404 Not Found` → L'endpoint n'existe pas
- `500 Internal Server Error` → Erreur serveur (vérifiez les logs)

### Étape 2.2: Tester l'Endpoint d'Authentification

1. **Allez sur:** `https://votre-backend.onrender.com/api/auth/login`
2. **Méthode:** POST (utilisez Postman ou curl)

**Avec curl (dans PowerShell):**
```powershell
curl -X POST https://votre-backend.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@sahelagriconnect.org","password":"admin123"}'
```

**✅ Réponse attendue:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "admin@sahelagriconnect.org",
    "role": "admin"
  }
}
```

---

## 🔗 PARTIE 3: Vérifier la Connexion Frontend ↔ Backend

### Étape 3.1: Vérifier les Variables d'Environnement Vercel

1. **Allez sur:** https://vercel.com
2. **Sélectionnez** votre projet frontend
3. **Cliquez sur:** "Settings" → "Environment Variables"
4. **Vérifiez** que ces variables existent:

```
VITE_API_BASE_URL=https://votre-backend.onrender.com
VITE_WS_BASE_URL=https://votre-backend.onrender.com
```

**⚠️ Remplacez `votre-backend` par l'URL réelle de Render!**

### Étape 3.2: Redéployer le Frontend (si nécessaire)

1. Si vous avez ajouté/modifié les variables d'environnement:
   - **Allez dans:** "Deployments"
   - **Cliquez sur:** "..." du dernier déploiement
   - **Cliquez:** "Redeploy"

### Étape 3.3: Tester la Connexion depuis le Frontend

1. **Allez sur:** `https://votre-frontend.vercel.app`
2. **Ouvrez la Console du Navigateur:**
   - Appuyez sur `F12` (ou `Ctrl+Shift+I`)
   - Allez dans l'onglet "Console"
3. **Essayez de vous connecter:**
   - Allez sur `/admin/login`
   - Email: `admin@sahelagriconnect.org`
   - Mot de passe: `admin123`
   - Cliquez "Se connecter"

**✅ Si ça fonctionne:**
- Vous êtes redirigé vers le dashboard admin
- Pas d'erreurs dans la console
- Les données se chargent

**❌ Si vous voyez des erreurs:**
- `CORS error` → Vérifiez `FRONTEND_URL` dans Render
- `Network error` → Vérifiez `VITE_API_BASE_URL` dans Vercel
- `401 Unauthorized` → Vérifiez les identifiants admin

---

## 🧪 PARTIE 4: Tests Avancés

### Test 4.1: Vérifier MongoDB Connection (via API)

**Endpoint:** `GET /api/health`

**Réponse complète devrait inclure:**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running",
  "database": "connected",
  "timestamp": "2024-..."
}
```

### Test 4.2: Vérifier les Routes API

Testez ces endpoints (remplacez `votre-backend` par votre URL):

1. **Health Check:**
   ```
   https://votre-backend.onrender.com/api/health
   ```

2. **Login:**
   ```
   POST https://votre-backend.onrender.com/api/auth/login
   Body: {"email":"admin@sahelagriconnect.org","password":"admin123"}
   ```

3. **Get Farmers (nécessite token):**
   ```
   GET https://votre-backend.onrender.com/api/farmers
   Headers: Authorization: Bearer YOUR_TOKEN
   ```

### Test 4.3: Vérifier WebSocket

1. **Ouvrez la console du navigateur** sur votre frontend
2. **Vérifiez** qu'il n'y a pas d'erreurs WebSocket
3. **Les notifications en temps réel** devraient fonctionner

---

## 📊 Checklist de Vérification Complète

### Backend (Render.com)
- [ ] Logs montrent "MongoDB connecté avec succès"
- [ ] `/api/health` retourne `{"status": "OK"}`
- [ ] `/api/auth/login` fonctionne avec les identifiants admin
- [ ] Pas d'erreurs dans les logs Render
- [ ] Service est "Live" (pas "Sleeping")

### Frontend (Vercel)
- [ ] Variables d'environnement configurées (`VITE_API_BASE_URL`, `VITE_WS_BASE_URL`)
- [ ] Site se charge sans erreurs
- [ ] Connexion admin fonctionne
- [ ] Pas d'erreurs CORS dans la console
- [ ] Les données se chargent depuis l'API

### MongoDB Atlas
- [ ] Network Access autorise `0.0.0.0/0` (ou IPs spécifiques)
- [ ] Utilisateur `info_db_user` existe
- [ ] Base de données `sahel-agriconnect` existe
- [ ] Connexion testée et fonctionnelle

---

## 🛠️ Commandes PowerShell pour Tests Rapides

### Test 1: Health Check
```powershell
curl https://votre-backend.onrender.com/api/health
```

### Test 2: Login
```powershell
$body = @{
    email = "admin@sahelagriconnect.org"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://votre-backend.onrender.com/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Test 3: Vérifier les Variables d'Environnement
```powershell
# Dans le dossier backend
cd backend
Get-Content .env
```

---

## 🐛 Dépannage Rapide

### Problème: "Service is Sleeping"
**Solution:** Render.com (plan gratuit) endort les services après 15 min d'inactivité.
- **Première requête** prendra 30-60 secondes pour réveiller le service
- **C'est normal!** Les requêtes suivantes seront rapides

### Problème: "CORS Error"
**Solution:**
1. Vérifiez `FRONTEND_URL` dans Render = URL Vercel exacte
2. Redéployez le backend après modification
3. Vérifiez qu'il n'y a pas d'espace dans l'URL

### Problème: "Network Error"
**Solution:**
1. Vérifiez `VITE_API_BASE_URL` dans Vercel = URL Render exacte
2. Redéployez le frontend après modification
3. Vérifiez que l'URL commence par `https://`

### Problème: "MongoDB Connection Error"
**Solution:**
1. Vérifiez Network Access dans MongoDB Atlas
2. Vérifiez l'URI dans Render (pas d'espaces, format correct)
3. Vérifiez username/password dans Database Access

---

## ✅ Résultat Final Attendu

Quand tout fonctionne:

1. **Backend Render:**
   - ✅ Status: "Live"
   - ✅ Logs: "MongoDB connecté"
   - ✅ `/api/health` répond

2. **Frontend Vercel:**
   - ✅ Site accessible
   - ✅ Connexion admin fonctionne
   - ✅ Données chargées depuis l'API

3. **MongoDB Atlas:**
   - ✅ Connexions autorisées
   - ✅ Base de données accessible

**🎉 Votre application est déployée et fonctionnelle!**

---

## 📝 URLs à Noter

Après vérification, notez ces URLs:

- **Frontend:** `https://________________.vercel.app`
- **Backend:** `https://________________.onrender.com`
- **Admin Login:** `https://________________.vercel.app/admin/login`
- **API Health:** `https://________________.onrender.com/api/health`

---

## 🆘 Besoin d'Aide?

Si quelque chose ne fonctionne pas:
1. **Vérifiez les logs** Render et Vercel
2. **Vérifiez la console** du navigateur (F12)
3. **Vérifiez** les variables d'environnement
4. **Consultez** `RENDER_MONGODB_FIX.md` pour MongoDB

