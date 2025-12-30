# ⚡ Déploiement Vercel - Guide Rapide

## 🎯 En 5 Étapes (10 minutes)

### 1️⃣ Créer un Compte Vercel

1. Allez sur: **https://vercel.com/signup**
2. Cliquez **"Continue with GitHub"**
3. Autorisez Vercel

**✅ Compte créé!**

---

### 2️⃣ Importer le Projet

1. Dans Vercel, cliquez **"Add New Project"**
2. Trouvez **"sahel-agriconnect"** (ou "DjiguiCorp/sahel-agriconnect")
3. Cliquez **"Import"**

**✅ Projet importé!**

---

### 3️⃣ Configurer (⚠️ IMPORTANT!)

Sur la page de configuration:

1. **Framework Preset:** Vite (auto-détecté)
2. **Root Directory:** ⚠️ Cliquez "Edit" → Tapez: **`web-dashboard`**
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Install Command:** `npm install`

**⚠️ Le Root Directory est CRUCIAL!** Sans `web-dashboard`, ça échouera!

---

### 4️⃣ Déployer

1. Cliquez **"Deploy"**
2. Attendez 2-5 minutes
3. ✅ Succès!

---

### 5️⃣ Obtenir l'URL

Après le déploiement, vous verrez:
- **URL:** `https://sahel-agriconnect.vercel.app` (ou similaire)
- Cliquez dessus pour voir votre application!

**🎉 C'est fait!**

---

## 🐛 Erreur: "No package.json found"?

**Solution:**
1. Settings → General → Root Directory
2. Changez en: `web-dashboard`
3. Redeploy

---

## 📝 Checklist

- [ ] Compte Vercel créé
- [ ] Repository importé
- [ ] **Root Directory = `web-dashboard`** ⚠️
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`
- [ ] Déployé avec succès
- [ ] URL obtenue

---

**Guide complet:** Voir `DEPLOIEMENT_VERCEL_COMPLET.md` 📖

