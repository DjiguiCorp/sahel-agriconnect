# 🔧 Guide de Dépannage

## Problèmes Courants et Solutions

### 1. MongoDB - Erreur de Connexion

**Erreur :** `MongoServerError: connect ECONNREFUSED`

**Solutions :**

#### Pour MongoDB Local :
```powershell
# Vérifier si MongoDB est installé
mongod --version

# Vérifier si le service est démarré
Get-Service MongoDB

# Démarrer le service
Start-Service MongoDB

# Si le service n'existe pas, installer MongoDB
# Télécharger depuis : https://www.mongodb.com/try/download/community
```

#### Pour MongoDB Atlas :
1. Vérifier que votre IP est autorisée dans "Network Access"
2. Vérifier l'URI dans `.env` (remplacer username et password)
3. Vérifier que le cluster est actif

**Test de connexion :**
```powershell
# Tester la connexion MongoDB directement
mongosh "mongodb://localhost:27017/sahel-agriconnect"
```

---

### 2. Port 3001 Déjà Utilisé

**Erreur :** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution :**
```powershell
# Trouver le processus utilisant le port
netstat -ano | findstr :3001

# Tuer le processus (remplacer <PID> par le numéro trouvé)
taskkill /PID <PID> /F

# Ou changer le port dans .env
# PORT=3002
```

---

### 3. Module Non Trouvé

**Erreur :** `Cannot find module 'express'` ou similaire

**Solution :**
```powershell
cd backend
# Supprimer node_modules et réinstaller
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

### 4. Erreur JWT_SECRET

**Erreur :** `JWT_SECRET is not defined`

**Solution :**
1. Vérifier que le fichier `.env` existe dans le dossier `backend`
2. Vérifier que `JWT_SECRET` est défini dans `.env`
3. Redémarrer le serveur après modification de `.env`

```powershell
# Vérifier le contenu de .env
Get-Content .env
```

---

### 5. Erreur lors de la Création de l'Admin

**Erreur :** `Admin already exists` ou erreur de connexion

**Solution :**
```powershell
# Si l'admin existe déjà, c'est normal
# Vous pouvez vous connecter avec :
# Email: admin@sahelagriconnect.org
# Password: admin123

# Pour réinitialiser, supprimer l'admin dans MongoDB :
mongosh "mongodb://localhost:27017/sahel-agriconnect"
use sahel-agriconnect
db.admins.deleteOne({ email: "admin@sahelagriconnect.org" })
exit

# Puis recréer :
node scripts/initAdmin.js
```

---

### 6. Erreur de Validation des Données

**Erreur :** `ValidationError` ou `Données invalides`

**Solution :**
- Vérifier que tous les champs requis sont présents
- Vérifier les types de données (ex: `superficie` doit être un nombre)
- Vérifier les valeurs enum (ex: `typeExploitation` doit être "Familiale" ou "Commerciale/Indépendante")

**Exemple de requête valide :**
```json
{
  "nom": "Amadou Diallo",
  "telephone": "+223 76 12 34 56",
  "latitude": "12.6392",
  "longitude": "-8.0029",
  "superficie": 12,
  "cultures": ["Riz", "Mil"],
  "region": "Sikasso, Mali",
  "typeExploitation": "Familiale",
  "objectifsProduction": ["Souveraineté alimentaire locale"],
  "accesElectricite": "Non",
  "accesStockage": "Non"
}
```

---

### 7. WebSocket Ne Fonctionne Pas

**Problème :** Le frontend ne reçoit pas les événements WebSocket

**Solution :**
1. Vérifier que le serveur backend est démarré
2. Vérifier l'URL dans le frontend : `http://localhost:3001`
3. Vérifier les CORS dans `server.js`
4. Vérifier la console du navigateur pour les erreurs

**Test WebSocket :**
```javascript
// Dans la console du navigateur
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connecté !'));
socket.on('farmer:created', (data) => console.log('Nouvel agriculteur:', data));
```

---

### 8. Erreur "Cannot read property 'get' of undefined"

**Erreur :** Dans les routes, `req.app.get('io')` retourne undefined

**Solution :**
Vérifier que dans `server.js`, vous avez bien :
```javascript
app.set('io', io);
```

---

### 9. Erreur lors de l'Installation de Nodemon

**Erreur :** `nodemon: command not found`

**Solution :**
```powershell
# Installer nodemon globalement (optionnel)
npm install -g nodemon

# Ou utiliser directement node
npm start  # au lieu de npm run dev
```

---

### 10. Erreur de Permissions (Windows)

**Erreur :** Accès refusé lors de l'écriture de fichiers

**Solution :**
```powershell
# Exécuter PowerShell en tant qu'administrateur
# Clic droit sur PowerShell → "Exécuter en tant qu'administrateur"
```

---

## Commandes de Diagnostic

### Vérifier l'état complet :
```powershell
cd backend

# 1. Vérifier les fichiers
Write-Host "Fichiers:" -ForegroundColor Cyan
Test-Path .env
Test-Path node_modules
Test-Path server.js

# 2. Vérifier MongoDB
Write-Host "`nMongoDB:" -ForegroundColor Cyan
mongod --version

# 3. Tester la connexion
Write-Host "`nTest API:" -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri http://localhost:3001/api/health -TimeoutSec 2
    Write-Host "[OK] API accessible" -ForegroundColor Green
} catch {
    Write-Host "[INFO] API non accessible (serveur non démarré?)" -ForegroundColor Yellow
}
```

### Logs détaillés :
```powershell
# Démarrer avec logs détaillés
$env:DEBUG="*"
npm run dev
```

---

## Obtenir de l'Aide

Si le problème persiste :

1. **Vérifier les logs du serveur** - Les erreurs sont affichées dans la console
2. **Vérifier la console du navigateur** - Pour les erreurs frontend
3. **Vérifier MongoDB** - Vérifier que MongoDB fonctionne correctement
4. **Vérifier les versions** :
   ```powershell
   node --version  # Doit être >= 16
   npm --version
   ```

---

## Checklist de Vérification Rapide

- [ ] Node.js installé (version 16+)
- [ ] MongoDB installé et démarré (ou Atlas configuré)
- [ ] Fichier `.env` existe et contient les bonnes valeurs
- [ ] `npm install` exécuté avec succès
- [ ] `node scripts/initAdmin.js` exécuté avec succès
- [ ] Port 3001 disponible
- [ ] Aucune erreur dans la console lors du démarrage

---

## Commandes de Réinitialisation Complète

Si tout échoue, réinitialiser complètement :

```powershell
cd backend

# 1. Supprimer node_modules
Remove-Item -Recurse -Force node_modules

# 2. Supprimer package-lock.json
Remove-Item package-lock.json

# 3. Réinstaller
npm install

# 4. Vérifier .env
if (-not (Test-Path .env)) {
    # Créer .env
    @"
PORT=3001
MONGO_URI=mongodb://localhost:27017/sahel-agriconnect
JWT_SECRET=sahel-agriconnect-super-secret-key-2024
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
"@ | Out-File -FilePath .env -Encoding utf8
}

# 5. Recréer l'admin
node scripts/initAdmin.js

# 6. Démarrer
npm run dev
```

