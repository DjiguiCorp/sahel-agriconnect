# Guide de Configuration Étape par Étape

## 📋 Étape 1 : Installer MongoDB

### Option A : MongoDB Local (Recommandé pour développement)

1. **Télécharger MongoDB Community Server :**
   - Aller sur https://www.mongodb.com/try/download/community
   - Sélectionner Windows
   - Télécharger et installer

2. **Démarrer MongoDB :**
   ```powershell
   # MongoDB démarre généralement automatiquement après installation
   # Vérifier avec :
   mongod --version
   ```

3. **Si MongoDB ne démarre pas automatiquement :**
   ```powershell
   # Démarrer le service MongoDB
   net start MongoDB
   ```

### Option B : MongoDB Atlas (Cloud - Gratuit)

1. **Créer un compte :**
   - Aller sur https://www.mongodb.com/cloud/atlas/register
   - Créer un compte gratuit

2. **Créer un cluster :**
   - Cliquer sur "Build a Database"
   - Choisir "FREE" (M0)
   - Sélectionner une région (choisir la plus proche)
   - Créer le cluster

3. **Configurer l'accès :**
   - Cliquer sur "Connect"
   - "Add IP Address" → "Add My Current IP Address"
   - Créer un utilisateur (username/password)
   - Copier l'URI de connexion (ex: `mongodb+srv://username:password@cluster.mongodb.net/...`)

## 📋 Étape 2 : Configurer le fichier .env

1. **Créer le fichier .env dans le dossier backend :**
   ```powershell
   cd backend
   # Créer le fichier .env
   ```

2. **Contenu du fichier .env :**

   **Pour MongoDB Local :**
   ```env
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/sahel-agriconnect
   JWT_SECRET=sahel-agriconnect-super-secret-key-2024-change-in-production
   ADMIN_EMAIL=admin@sahelagriconnect.org
   ADMIN_PASSWORD=admin123
   ```

   **Pour MongoDB Atlas :**
   ```env
   PORT=3001
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
   JWT_SECRET=sahel-agriconnect-super-secret-key-2024-change-in-production
   ADMIN_EMAIL=admin@sahelagriconnect.org
   ADMIN_PASSWORD=admin123
   ```
   
   ⚠️ **Important :** Remplacez `username` et `password` par vos identifiants MongoDB Atlas

## 📋 Étape 3 : Installer les dépendances

```powershell
cd backend
npm install
```

Cela installera toutes les dépendances listées dans `package.json`.

## 📋 Étape 4 : Créer l'admin par défaut

```powershell
node scripts/initAdmin.js
```

Vous devriez voir :
```
✅ Connecté à MongoDB
✅ Admin créé avec succès:
   Email: admin@sahelagriconnect.org
   Mot de passe: admin123
```

## 📋 Étape 5 : Charger des données de test (Optionnel)

```powershell
node scripts/seedData.js
```

Cela créera des coopératives et processeurs de test.

## 📋 Étape 6 : Démarrer le serveur

### Mode Développement (avec auto-reload) :
```powershell
npm run dev
```

### Mode Production :
```powershell
npm start
```

Vous devriez voir :
```
✅ MongoDB connecté avec succès
🚀 Serveur démarré sur le port 3001
📡 WebSocket disponible sur ws://localhost:3001
🌐 API disponible sur http://localhost:3001/api
```

## 📋 Étape 7 : Tester l'API

### Test 1 : Vérifier que le serveur fonctionne

**Avec PowerShell (Invoke-WebRequest) :**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/health -Method GET
```

**Avec curl (si installé) :**
```bash
curl http://localhost:3001/api/health
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running",
  "timestamp": "2024-..."
}
```

### Test 2 : Login Admin

**Avec PowerShell :**
```powershell
$body = @{
    email = "admin@sahelagriconnect.org"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/auth/login -Method POST -Body $body -ContentType "application/json"
```

**Avec curl :**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@sahelagriconnect.org\",\"password\":\"admin123\"}"
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

**💡 Copiez le token pour les prochaines requêtes !**

### Test 3 : Enregistrer un agriculteur (Public)

**Avec PowerShell :**
```powershell
$farmerData = @{
    nom = "Amadou Diallo"
    telephone = "+223 76 12 34 56"
    latitude = "12.6392"
    longitude = "-8.0029"
    superficie = 12
    cultures = @("Riz", "Mil")
    region = "Sikasso, Mali"
    typeExploitation = "Familiale"
    objectifsProduction = @("Souveraineté alimentaire locale")
    accesElectricite = "Non"
    accesStockage = "Non"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/farmers -Method POST -Body $farmerData -ContentType "application/json"
```

### Test 4 : Récupérer les agriculteurs (Protégée - Nécessite token)

**Avec PowerShell :**
```powershell
$token = "VOTRE_TOKEN_ICI"
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-WebRequest -Uri http://localhost:3001/api/farmers -Method GET -Headers $headers
```

## 📋 Étape 8 : Utiliser Postman (Optionnel mais recommandé)

1. **Télécharger Postman :** https://www.postman.com/downloads/

2. **Créer une collection "Sahel AgriConnect"**

3. **Créer les requêtes :**
   - **GET** `http://localhost:3001/api/health`
   - **POST** `http://localhost:3001/api/auth/login`
     - Body (JSON) :
       ```json
       {
         "email": "admin@sahelagriconnect.org",
         "password": "admin123"
       }
       ```
   - **POST** `http://localhost:3001/api/farmers`
     - Body (JSON) : Voir exemple ci-dessus
   - **GET** `http://localhost:3001/api/farmers`
     - Headers : `Authorization: Bearer <token>`

## 📋 Étape 9 : Connecter le Frontend React

Voir le fichier `CONNECTION_GUIDE.md` pour les instructions détaillées.

**Résumé rapide :**
1. Mettre à jour `web-dashboard/src/context/WebSocketContext.jsx` :
   ```javascript
   const newSocket = io('http://localhost:3001', {
     // ... config
   });
   ```

2. Créer `web-dashboard/src/config/api.js` (voir CONNECTION_GUIDE.md)

3. Mettre à jour les composants pour utiliser l'API

## 🐛 Dépannage

### Erreur : "Cannot find module"
```powershell
# Réinstaller les dépendances
cd backend
rm -r node_modules
npm install
```

### Erreur : "MongoDB connection failed"
- Vérifier que MongoDB est démarré (local)
- Vérifier l'URI dans `.env` (Atlas)
- Vérifier les permissions réseau (Atlas)

### Erreur : "Port 3001 already in use"
```powershell
# Trouver le processus utilisant le port
netstat -ano | findstr :3001

# Tuer le processus (remplacer PID par le numéro trouvé)
taskkill /PID <PID> /F

# Ou changer le port dans .env
```

### Erreur : "JWT_SECRET is not defined"
- Vérifier que le fichier `.env` existe
- Vérifier que `JWT_SECRET` est défini dans `.env`
- Redémarrer le serveur après modification de `.env`

## ✅ Checklist de Vérification

- [ ] MongoDB installé et démarré (local ou Atlas)
- [ ] Fichier `.env` créé avec les bonnes valeurs
- [ ] `npm install` exécuté avec succès
- [ ] Admin créé avec `node scripts/initAdmin.js`
- [ ] Serveur démarre sans erreur (`npm run dev`)
- [ ] Test `/api/health` fonctionne
- [ ] Test `/api/auth/login` retourne un token
- [ ] Frontend peut se connecter au backend

## 🎉 Félicitations !

Votre backend est maintenant opérationnel ! Vous pouvez commencer à développer et tester votre application.

