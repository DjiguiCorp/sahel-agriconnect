# 🤖 Déploiement Automatique sur GitHub

## 🚀 Script Automatique

J'ai créé un script PowerShell qui fait **TOUT le travail pour vous**!

### 📋 Utilisation

#### Étape 1: Ouvrir PowerShell

1. Appuyez sur `Windows + X`
2. Cliquez sur **"Windows PowerShell"** ou **"Terminal"**
3. Naviguez vers votre projet:
   ```powershell
   cd "C:\Users\isabe\OneDrive\Desktop\sahel-agriconnect-project"
   ```

#### Étape 2: Exécuter le Script

```powershell
.\deploy-to-github.ps1 -GitHubUsername VOTRE-USERNAME
```

**Remplacez `VOTRE-USERNAME` par votre nom d'utilisateur GitHub!**

**Exemple:**
```powershell
.\deploy-to-github.ps1 -GitHubUsername isabe
```

#### Étape 3: Le Script Fait Tout!

Le script va automatiquement:
- ✅ Vérifier que Git est installé
- ✅ Initialiser Git (si nécessaire)
- ✅ Ajouter tous vos fichiers
- ✅ Créer le commit
- ✅ Configurer le remote GitHub
- ✅ Gérer le conflit README (si présent)
- ✅ Résoudre automatiquement les conflits
- ✅ Pousser vers GitHub

#### Étape 4: Authentification

Quand le script vous demande vos identifiants:
- **Username:** Votre nom d'utilisateur GitHub
- **Password:** Votre **Personal Access Token** (pas votre mot de passe!)

**Pour créer un Personal Access Token:**
1. Allez sur https://github.com/settings/tokens
2. Cliquez **"Generate new token"** → **"Generate new token (classic)"**
3. Donnez un nom: `Sahel AgriConnect Deployment`
4. Cochez **"repo"** (accès complet aux repositories)
5. Cliquez **"Generate token"**
6. **Copiez le token** (vous ne le verrez qu'une fois!)
7. Utilisez ce token comme mot de passe

---

## 🎯 Alternative: Commandes Manuelles

Si vous préférez faire manuellement ou si le script ne fonctionne pas:

### Option 1: Si le Repository Existe Déjà sur GitHub

```powershell
cd "C:\Users\isabe\OneDrive\Desktop\sahel-agriconnect-project"

git add .
git commit -m "Initial commit - Sahel AgriConnect"

git remote add origin https://github.com/VOTRE-USERNAME/sahel-agriconnect.git
git branch -M main

git fetch origin
git pull origin main --allow-unrelated-histories

# Si conflit dans README.md, résolvez-le, puis:
git add README.md
git commit -m "Merge README"
git push -u origin main
```

### Option 2: Si le Repository N'Existe Pas Encore

1. **Créez-le d'abord sur GitHub:**
   - Allez sur https://github.com/new
   - Nom: `sahel-agriconnect`
   - **NE COCHEZ PAS** "Add a README file" cette fois!
   - Cliquez "Create repository"

2. **Puis exécutez:**
   ```powershell
   cd "C:\Users\isabe\OneDrive\Desktop\sahel-agriconnect-project"
   
   git add .
   git commit -m "Initial commit - Sahel AgriConnect"
   
   git remote add origin https://github.com/VOTRE-USERNAME/sahel-agriconnect.git
   git branch -M main
   
   git push -u origin main
   ```

---

## 🔐 Authentification GitHub

### Méthode 1: Personal Access Token (Recommandé)

1. https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Cochez "repo"
4. Copiez le token
5. Utilisez-le comme mot de passe

### Méthode 2: GitHub CLI (Alternative)

```powershell
# Installer GitHub CLI
winget install GitHub.cli

# Se connecter
gh auth login

# Puis le push fonctionnera automatiquement
```

---

## ✅ Vérification

Après le déploiement, vérifiez:

1. Allez sur: `https://github.com/VOTRE-USERNAME/sahel-agriconnect`
2. Vérifiez que tous vos fichiers sont présents
3. Vérifiez que le README.md est correct

---

## 🆘 Dépannage

### Erreur: "Permission denied"

→ Créez un Personal Access Token et utilisez-le comme mot de passe

### Erreur: "Repository not found"

→ Vérifiez que le repository existe sur GitHub
→ Vérifiez que le nom d'utilisateur est correct

### Erreur: "fatal: refusing to merge unrelated histories"

→ Le script gère cela automatiquement avec `--allow-unrelated-histories`

### Erreur: "remote origin already exists"

→ Le script détecte cela et vous demande si vous voulez le mettre à jour

---

## 🚀 Après GitHub

Une fois votre code sur GitHub, continuez avec:

1. **MongoDB Atlas** (voir `DEPLOIEMENT_DEBUTANT.md` - Étape 2)
2. **Vercel** pour le frontend (Étape 3)
3. **Render.com** pour le backend (Étape 4)

**Tout est expliqué dans `DEPLOIEMENT_DEBUTANT.md`!** 📖

