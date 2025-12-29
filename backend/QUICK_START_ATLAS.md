# 🚀 Configuration Rapide MongoDB Atlas

## Option 1: Script Interactif (Recommandé)

Exécutez simplement:
```powershell
cd backend
.\setup-mongodb-atlas.ps1
```

Le script vous guidera étape par étape.

## Option 2: Configuration Manuelle

### Étape 1: Obtenir votre chaîne de connexion MongoDB Atlas

1. **Connectez-vous** à https://cloud.mongodb.com
2. **Créez un cluster** (gratuit M0 Sandbox) si vous n'en avez pas
3. **Configurez l'accès réseau:**
   - Menu gauche → "Network Access"
   - "Add IP Address" → "Allow Access from Anywhere" (pour dev)
4. **Créez un utilisateur:**
   - Menu gauche → "Database Access"
   - "Add New Database User"
   - Username: `sahel-admin` (ou autre)
   - Password: (générez et **SAVEZ-LE**)
   - Permissions: "Read and write to any database"
5. **Obtenez la chaîne de connexion:**
   - Menu gauche → "Database"
   - Cliquez "Connect" sur votre cluster
   - Choisissez "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - **Copiez la chaîne**

### Étape 2: Modifier la chaîne de connexion

La chaîne ressemble à:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Remplacez:**
- `<username>` → votre username (ex: `sahel-admin`)
- `<password>` → votre password
- Ajoutez `/sahel-agriconnect` avant le `?`

**Résultat final:**
```
mongodb+srv://sahel-admin:VotreMotDePasse@cluster0.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
```

### Étape 3: Configurer le fichier .env

**Méthode A: Script PowerShell**
```powershell
cd backend
.\configure-env.ps1 -MongoUri "votre-chaine-de-connexion-complete"
```

**Méthode B: Édition manuelle**

Créez/modifiez le fichier `backend/.env`:
```env
PORT=3001
MONGO_URI=mongodb+srv://sahel-admin:VotreMotDePasse@cluster0.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
JWT_SECRET=votre-cle-secrete-aleatoire-64-caracteres
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
```

Pour générer un JWT_SECRET sécurisé, vous pouvez utiliser:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Étape 4: Créer l'admin et démarrer

```powershell
# Créer l'admin par défaut
node scripts/initAdmin.js

# Démarrer le serveur
npm run dev
```

## ✅ Vérification

Si tout fonctionne, vous devriez voir:
```
✅ Connecté à MongoDB
🚀 Serveur démarré sur http://localhost:3001
```

## 🆘 Problèmes courants

**Erreur: "Authentication failed"**
- Vérifiez username/password dans MONGO_URI
- Vérifiez que l'utilisateur a les bonnes permissions

**Erreur: "IP not whitelisted"**
- Allez dans "Network Access" → Ajoutez votre IP ou "Allow from anywhere"

**Erreur: "Connection timeout"**
- Vérifiez votre internet
- Vérifiez que le cluster n'est pas en pause

