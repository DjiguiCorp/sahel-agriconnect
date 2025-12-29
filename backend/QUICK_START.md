# 🚀 Démarrage Rapide

## Installation Automatique (Recommandé)

```powershell
cd backend
.\setup.ps1
```

## Installation Manuelle

### 1. Créer le fichier .env

Le fichier `.env` a été créé automatiquement. Si besoin, vérifiez son contenu :

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/sahel-agriconnect
JWT_SECRET=sahel-agriconnect-super-secret-key-2024-change-in-production
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
```

**Pour MongoDB Atlas**, remplacez `MONGO_URI` par votre URI Atlas :
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
```

### 2. Installer les dépendances

```powershell
npm install
```

✅ **Déjà fait !**

### 3. Démarrer MongoDB

**Option A : MongoDB Local**
- Vérifier que MongoDB est installé et démarré
- Le service devrait démarrer automatiquement

**Option B : MongoDB Atlas**
- Utiliser votre URI de connexion dans `.env`
- Pas besoin d'installer MongoDB localement

### 4. Créer l'admin par défaut

```powershell
node scripts/initAdmin.js
```

**Résultat attendu :**
```
✅ Connecté à MongoDB
✅ Admin créé avec succès:
   Email: admin@sahelagriconnect.org
   Mot de passe: admin123
```

### 5. (Optionnel) Charger des données de test

```powershell
node scripts/seedData.js
```

### 6. Démarrer le serveur

```powershell
npm run dev
```

**Résultat attendu :**
```
✅ MongoDB connecté avec succès
🚀 Serveur démarré sur le port 3001
📡 WebSocket disponible sur ws://localhost:3001
🌐 API disponible sur http://localhost:3001/api
```

### 7. Tester l'API

**Test 1 : Santé de l'API**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/health
```

**Test 2 : Login Admin**
```powershell
$body = @{
    email = "admin@sahelagriconnect.org"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:3001/api/auth/login -Method POST -Body $body -ContentType "application/json"
$response.Content
```

**Copiez le token retourné pour les requêtes protégées !**

## 📚 Documentation Complète

- **SETUP_GUIDE.md** - Guide détaillé étape par étape
- **README.md** - Documentation complète de l'API
- **CONNECTION_GUIDE.md** - Guide pour connecter le frontend

## 🐛 Problèmes Courants

### MongoDB ne démarre pas
```powershell
# Vérifier le service
Get-Service MongoDB

# Démarrer le service
Start-Service MongoDB
```

### Port 3001 déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr :3001

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F
```

### Erreur de connexion MongoDB
- Vérifier que MongoDB est démarré (local)
- Vérifier l'URI dans `.env` (Atlas)
- Vérifier les permissions réseau (Atlas)

## ✅ Checklist

- [x] Fichier .env créé
- [x] Dépendances installées (npm install)
- [ ] MongoDB démarré (local ou Atlas configuré)
- [ ] Admin créé (node scripts/initAdmin.js)
- [ ] Serveur démarré (npm run dev)
- [ ] API testée (http://localhost:3001/api/health)

