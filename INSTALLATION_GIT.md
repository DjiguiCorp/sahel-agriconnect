# 📥 Installation de Git pour Windows

## 🚀 Installation Rapide

### Option 1: Téléchargement Direct (Recommandé)

1. **Téléchargez Git:**
   - Allez sur: https://git-scm.com/download/win
   - Le téléchargement commencera automatiquement

2. **Installez Git:**
   - Double-cliquez sur le fichier téléchargé
   - Cliquez "Next" sur toutes les étapes
   - **Gardez les options par défaut** (elles sont bonnes)
   - Cliquez "Install"
   - Attendez la fin de l'installation
   - Cliquez "Finish"

3. **Redémarrez PowerShell:**
   - Fermez votre PowerShell actuel
   - Ouvrez un nouveau PowerShell
   - Vérifiez: `git --version`

### Option 2: Via Winget (Si Disponible)

```powershell
winget install --id Git.Git -e --source winget
```

---

## ✅ Vérification

Après l'installation, ouvrez un **nouveau PowerShell** et tapez:

```powershell
git --version
```

**Résultat attendu:** `git version 2.x.x` (ou similaire)

---

## 🔐 Créer un Personal Access Token GitHub

**GitHub n'accepte plus les mots de passe!** Vous devez créer un token.

### Étapes:

1. **Allez sur:** https://github.com/settings/tokens
2. **Cliquez sur:** "Generate new token" → "Generate new token (classic)"
3. **Remplissez:**
   - **Note:** `Sahel AgriConnect Deployment`
   - **Expiration:** Choisissez (90 jours, 1 an, ou "No expiration")
   - **Scopes:** Cochez **"repo"** (accès complet aux repositories)
4. **Cliquez:** "Generate token" (en bas)
5. **⚠️ IMPORTANT:** Copiez le token immédiatement!
   - Il commence par `ghp_`
   - Vous ne le verrez qu'une seule fois!
   - Notez-le dans un endroit sûr

---

## 🚀 Après l'Installation

Une fois Git installé et votre token créé, exécutez ces commandes:

```powershell
# Aller dans votre projet
cd "C:\Users\isabe\OneDrive\Desktop\sahel-agriconnect-project"

# Vérifier Git
git --version

# Initialiser Git
git init

# Ajouter les fichiers
git add .

# Créer le commit
git commit -m "Initial commit - Sahel AgriConnect"

# Configurer GitHub
git remote add origin https://github.com/DjiguiCorp/sahel-agriconnect.git
git branch -M main

# Pousser vers GitHub
# Quand demandé:
# Username: DjiguiCorp
# Password: VOTRE_TOKEN (pas votre mot de passe!)
git push -u origin main
```

---

## 🆘 Problèmes

### Git n'est toujours pas reconnu après installation

1. Fermez complètement PowerShell
2. Rouvrez PowerShell
3. Vérifiez: `git --version`

### Erreur: "fatal: could not read Username"

→ Utilisez votre **Personal Access Token** comme mot de passe, pas votre mot de passe GitHub!

### Erreur: "remote origin already exists"

```powershell
git remote set-url origin https://github.com/DjiguiCorp/sahel-agriconnect.git
```

---

## 📝 Prochaines Étapes

Après avoir poussé votre code sur GitHub:

1. **MongoDB Atlas** (voir `DEPLOIEMENT_DEBUTANT.md` - Étape 2)
2. **Vercel** pour le frontend (Étape 3)
3. **Render.com** pour le backend (Étape 4)

**Tout est expliqué dans `DEPLOIEMENT_DEBUTANT.md`!** 📖

