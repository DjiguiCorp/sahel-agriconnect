# Guide de Configuration MongoDB Atlas

## 📋 Étapes pour obtenir votre chaîne de connexion MongoDB Atlas

### Étape 1: Se connecter à MongoDB Atlas
1. Allez sur https://cloud.mongodb.com
2. Connectez-vous avec votre compte MongoDB

### Étape 2: Créer ou sélectionner un cluster
1. Si vous n'avez pas encore de cluster, créez-en un (gratuit: M0 Sandbox)
2. Attendez que le cluster soit créé (2-3 minutes)

### Étape 3: Configurer l'accès réseau
1. Dans le menu de gauche, cliquez sur **"Network Access"**
2. Cliquez sur **"Add IP Address"**
3. Cliquez sur **"Allow Access from Anywhere"** (pour le développement)
   - Ou ajoutez votre IP actuelle pour plus de sécurité
4. Cliquez sur **"Confirm"**

### Étape 4: Créer un utilisateur de base de données
1. Dans le menu de gauche, cliquez sur **"Database Access"**
2. Cliquez sur **"Add New Database User"**
3. Choisissez **"Password"** comme méthode d'authentification
4. Entrez un **username** (ex: `sahel-admin`)
5. Entrez un **password** (générez-en un sécurisé et **SAVEZ-LE**)
6. Sélectionnez **"Read and write to any database"**
7. Cliquez sur **"Add User"**

### Étape 5: Obtenir la chaîne de connexion
1. Retournez à **"Database"** dans le menu de gauche
2. Cliquez sur **"Connect"** sur votre cluster
3. Choisissez **"Connect your application"**
4. Sélectionnez:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. **Copiez la chaîne de connexion** qui ressemble à:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Étape 6: Modifier la chaîne de connexion
**IMPORTANT**: Vous devez remplacer:
- `<username>` par votre nom d'utilisateur (ex: `sahel-admin`)
- `<password>` par votre mot de passe
- Ajouter le nom de la base de données avant le `?`

**Exemple final:**
```
mongodb+srv://sahel-admin:MonMotDePasse123@cluster0.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
```

Notez que `sahel-agriconnect` est ajouté avant le `?` - c'est le nom de votre base de données.

## 🚀 Utiliser le script de configuration

Une fois que vous avez votre chaîne de connexion complète, exécutez:

```powershell
cd backend
.\setup-mongodb-atlas.ps1
```

Le script va:
1. Vous demander de coller votre chaîne de connexion
2. Générer automatiquement un JWT_SECRET sécurisé
3. Créer/mettre à jour le fichier `.env` avec toutes les configurations

## ✅ Vérification

Après avoir exécuté le script, votre fichier `.env` devrait contenir:

```env
PORT=3001
MONGO_URI=mongodb+srv://votre-username:votre-password@cluster0.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
JWT_SECRET=<une-clé-aléatoire-de-64-caractères>
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
```

## 🔒 Sécurité

⚠️ **IMPORTANT**: 
- Ne partagez JAMAIS votre fichier `.env`
- Ne commitez JAMAIS le fichier `.env` sur Git (il est déjà dans `.gitignore`)
- Changez le mot de passe admin en production
- Utilisez des mots de passe forts pour MongoDB Atlas

## 🆘 Problèmes courants

### Erreur: "Authentication failed"
- Vérifiez que votre username et password dans MONGO_URI sont corrects
- Vérifiez que l'utilisateur a les permissions "Read and write"

### Erreur: "IP not whitelisted"
- Allez dans "Network Access" et ajoutez votre IP ou "Allow Access from Anywhere"

### Erreur: "Connection timeout"
- Vérifiez votre connexion internet
- Vérifiez que le cluster est actif (pas en pause)

