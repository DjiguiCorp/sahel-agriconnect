# 🔐 Configuration GitHub avec Personal Access Token

## ⚠️ Important: GitHub N'Accepte Plus les Mots de Passe

GitHub a désactivé l'authentification par mot de passe. Vous devez utiliser un **Personal Access Token**.

## 📋 Étapes pour Créer un Token

### 1. Créer un Personal Access Token

1. Allez sur: https://github.com/settings/tokens
2. Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**
3. Remplissez:
   - **Note:** `Sahel AgriConnect Deployment`
   - **Expiration:** Choisissez une durée (90 jours, 1 an, ou "No expiration")
   - **Scopes:** Cochez **"repo"** (accès complet aux repositories)
4. Cliquez **"Generate token"** en bas
5. **⚠️ IMPORTANT:** Copiez le token immédiatement (ex: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Vous ne le verrez qu'une seule fois!
   - Notez-le dans un endroit sûr

### 2. Utiliser le Token

Quand Git vous demande:
- **Username:** `DjiguiCorp`
- **Password:** Collez votre **Personal Access Token** (pas votre mot de passe!)

---

## 🚀 Commandes à Exécuter

Une fois que vous avez votre token, exécutez ces commandes dans PowerShell:

```powershell
# Aller dans votre dossier projet
cd "C:\Users\isabe\OneDrive\Desktop\sahel-agriconnect-project"

# Vérifier que Git est installé
git --version

# Si Git n'est pas installé, téléchargez-le:
# https://git-scm.com/download/win

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer le commit
git commit -m "Initial commit - Sahel AgriConnect - Complete project"

# Configurer le remote GitHub
git remote add origin https://github.com/DjiguiCorp/sahel-agriconnect.git

# Ou si le remote existe déjà:
git remote set-url origin https://github.com/DjiguiCorp/sahel-agriconnect.git

# Renommer la branche
git branch -M main

# Gérer le README GitHub (si présent)
git fetch origin
git pull origin main --allow-unrelated-histories

# Si conflit dans README.md, résolvez-le, puis:
git add README.md
git commit -m "Merge README from GitHub"

# Pousser vers GitHub
# Quand demandé:
# Username: DjiguiCorp
# Password: VOTRE_PERSONAL_ACCESS_TOKEN (pas votre mot de passe!)
git push -u origin main
```

---

## 🔒 Sécurité

**⚠️ Ne partagez JAMAIS votre Personal Access Token!**

- Ne le commitez pas dans votre code
- Ne le partagez pas publiquement
- Si vous l'exposez accidentellement, révoquez-le immédiatement et créez-en un nouveau

---

## 🆘 Si Git N'est Pas Installé

1. Téléchargez Git: https://git-scm.com/download/win
2. Installez-le avec les options par défaut
3. Redémarrez PowerShell
4. Vérifiez: `git --version`

---

## ✅ Vérification

Après le push, vérifiez:
- https://github.com/DjiguiCorp/sahel-agriconnect
- Tous vos fichiers devraient être présents

