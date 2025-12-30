# 🗄️ Configuration MongoDB Atlas pour Sahel AgriConnect

## 📋 Vue d'Ensemble

Vous avez déjà un cluster MongoDB Atlas: **"sahel-agriconnect-cluster"**  
Ce guide vous aidera à obtenir la chaîne de connexion et à configurer votre application.

---

## ✅ Étape 1: Obtenir la Chaîne de Connexion

### 1.1. Dans MongoDB Atlas

1. Allez sur votre dashboard MongoDB Atlas
2. Dans la section **"Clusters"**, trouvez **"sahel-agriconnect-cluster"**
3. Cliquez sur le bouton **"Connect"** (à côté du cluster)

### 1.2. Choisir la Méthode de Connexion

1. Une fenêtre s'ouvre avec plusieurs options
2. Cliquez sur **"Connect your application"** (ou "Drivers")
3. Sélectionnez:
   - **Driver:** Node.js
   - **Version:** 5.5 or later (ou la version la plus récente)

### 1.3. Copier la Chaîne de Connexion

1. Vous verrez une chaîne comme:
   ```
   mongodb+srv://<username>:<password>@sahel-agriconnect-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

2. **⚠️ IMPORTANT:** Vous devez:
   - Remplacer `<username>` par votre nom d'utilisateur MongoDB
   - Remplacer `<password>` par votre mot de passe MongoDB
   - **Ajouter le nom de la base de données** avant le `?`

3. **Format final:**
   ```
   mongodb+srv://username:password@sahel-agriconnect-cluster.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
   ```

**📝 Notez cette URI complète!**

---

## 🔐 Étape 2: Vérifier l'Accès Réseau

### 2.1. Network Access

1. Dans MongoDB Atlas, allez dans **"Security"** → **"Network Access"** (menu gauche)
2. Vérifiez que votre IP est autorisée ou que **"Allow Access from Anywhere"** (0.0.0.0/0) est activé
3. Si ce n'est pas le cas:
   - Cliquez **"Add IP Address"**
   - Cliquez **"Allow Access from Anywhere"** (pour le développement)
   - Cliquez **"Confirm"**

**⚠️ Pour la production, limitez aux IPs de Render.com!**

---

## 👤 Étape 3: Vérifier l'Utilisateur de Base de Données

### 3.1. Database Access

1. Allez dans **"Security"** → **"Database Access"** (menu gauche)
2. Vérifiez qu'un utilisateur existe avec les permissions nécessaires
3. Si vous n'avez pas d'utilisateur:
   - Cliquez **"Add New Database User"**
   - **Username:** Créez un nom (ex: `sahel-admin`)
   - **Password:** Créez un mot de passe fort (notez-le!)
   - **Database User Privileges:** "Atlas admin" ou "Read and write to any database"
   - Cliquez **"Add User"**

**📝 Notez le username et password!**

---

## ⚙️ Étape 4: Configurer le Backend Local

### 4.1. Mettre à Jour le Fichier .env

Dans votre dossier `backend`, ouvrez ou créez le fichier `.env`:

```env
PORT=3001
MONGO_URI=mongodb+srv://username:password@sahel-agriconnect-cluster.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
JWT_SECRET=votre-super-secret-jwt-key-change-this-in-production
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
```

**⚠️ Remplacez:**
- `username` par votre nom d'utilisateur MongoDB
- `password` par votre mot de passe MongoDB
- `xxxxx` par votre cluster ID réel

### 4.2. Tester la Connexion

```powershell
cd backend
node scripts/initAdmin.js
```

**Résultat attendu:**
```
✅ Connecté à MongoDB
✅ Admin créé avec succès
```

---

## 🚀 Étape 5: Configurer pour le Déploiement (Render.com)

### 5.1. Variables d'Environnement dans Render

Quand vous déploierez sur Render.com, ajoutez ces variables:

```
MONGO_URI=mongodb+srv://username:password@sahel-agriconnect-cluster.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
```

**⚠️ Utilisez la même URI que pour le développement local!**

---

## 📊 Étape 6: Vérifier les Données

### 6.1. Dans MongoDB Atlas

1. Allez dans **"Database"** → **"Browse Collections"**
2. Vous devriez voir votre base de données **"sahel-agriconnect"**
3. Les collections seront créées automatiquement quand vous utiliserez l'application:
   - `farmers` - Agriculteurs enregistrés
   - `processors` - Processeurs enregistrés
   - `cooperatives` - Coopératives
   - `certifications` - Certifications
   - `admins` - Administrateurs

---

## ✅ Checklist de Configuration

- [ ] Cluster MongoDB Atlas créé: **"sahel-agriconnect-cluster"** ✅
- [ ] Chaîne de connexion obtenue
- [ ] Username et password MongoDB notés
- [ ] Network Access configuré (0.0.0.0/0 ou IPs spécifiques)
- [ ] Database User créé avec permissions
- [ ] URI complète formatée avec nom de base de données
- [ ] Fichier `.env` dans `backend/` configuré
- [ ] Test de connexion réussi (`node scripts/initAdmin.js`)
- [ ] Variables d'environnement prêtes pour Render.com

---

## 🔗 Liens Utiles

- **MongoDB Atlas Dashboard:** https://cloud.mongodb.com
- **Votre Cluster:** https://cloud.mongodb.com (naviguez vers votre cluster)
- **Network Access:** https://cloud.mongodb.com/v2#/security/network/whitelist
- **Database Access:** https://cloud.mongodb.com/v2#/security/database/users

---

## 🆘 Dépannage

### Erreur: "MongoServerError: bad auth"

**Cause:** Username ou password incorrect dans l'URI

**Solution:**
1. Vérifiez l'username dans Database Access
2. Vérifiez le password (peut-être besoin de le réinitialiser)
3. Vérifiez que l'URI est correctement formatée

### Erreur: "MongoServerError: IP not whitelisted"

**Cause:** Votre IP n'est pas autorisée

**Solution:**
1. Allez dans Network Access
2. Ajoutez votre IP actuelle
3. Ou activez "Allow Access from Anywhere" (0.0.0.0/0)

### Erreur: "MongoServerError: connection timeout"

**Cause:** Problème réseau ou firewall

**Solution:**
1. Vérifiez votre connexion internet
2. Vérifiez Network Access dans MongoDB Atlas
3. Vérifiez que le firewall n'bloque pas MongoDB

---

## 📝 Format de l'URI Complète

**Format:**
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

**Exemple:**
```
mongodb+srv://sahel-admin:MonMotDePasse123@sahel-agriconnect-cluster.xxxxx.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority
```

**⚠️ Points importants:**
- `USERNAME` et `PASSWORD` doivent être encodés si ils contiennent des caractères spéciaux
- `DATABASE_NAME` doit être ajouté avant le `?`
- Le nom de la base de données sera créé automatiquement si il n'existe pas

---

## 🎯 Prochaines Étapes

Une fois MongoDB configuré:

1. **Tester localement:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Déployer le backend sur Render.com** (voir `DEPLOIEMENT_DEBUTANT.md`)

3. **Déployer le frontend sur Vercel** (voir `DEPLOIEMENT_VERCEL_COMPLET.md`)

4. **Configurer les variables d'environnement** dans Render et Vercel

---

**Votre MongoDB Atlas est prêt! 🚀**

