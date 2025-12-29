# 🚀 Déploiement Rapide - Guide Étape par Étape

## ⚡ Déploiement en 10 Minutes

### Étape 1: GitHub (2 minutes)

```bash
# 1. Créer un repository sur github.com
# 2. Dans votre terminal:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE-USERNAME/sahel-agriconnect.git
git branch -M main
git push -u origin main
```

### Étape 2: MongoDB Atlas (2 minutes)

1. Aller sur https://www.mongodb.com/cloud/atlas/register
2. Créer un cluster gratuit (M0)
3. Network Access → "Allow Access from Anywhere" (0.0.0.0/0)
4. Database Access → Créer un utilisateur
5. Connect → Copier l'URI
6. Format: `mongodb+srv://username:password@cluster.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority`

### Étape 3: Railway - Backend (3 minutes)

1. Aller sur https://railway.app
2. "Start a New Project" → "Deploy from GitHub repo"
3. Sélectionner votre repo
4. Settings → Root Directory: `backend`
5. Variables → Ajouter:
   ```
   NODE_ENV=production
   PORT=3001
   MONGO_URI=votre-uri-mongodb-atlas
   JWT_SECRET=generez-une-cle-forte
   ADMIN_EMAIL=admin@sahelagriconnect.org
   ADMIN_PASSWORD=votre-mot-de-passe
   FRONTEND_URL=https://votre-app.vercel.app
   ```
6. Déployer → Noter l'URL (ex: `https://xxx.railway.app`)

### Étape 4: Vercel - Frontend (3 minutes)

1. Aller sur https://vercel.com
2. "Add New Project" → Importer votre repo GitHub
3. Settings:
   - Framework: Vite
   - Root Directory: `web-dashboard`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables:
   ```
   VITE_API_BASE_URL=https://votre-backend.railway.app
   VITE_WS_BASE_URL=https://votre-backend.railway.app
   ```
5. Déployer → Noter l'URL (ex: `https://xxx.vercel.app`)

### Étape 5: Mettre à jour Railway (1 minute)

1. Retourner dans Railway
2. Variables → Mettre à jour:
   ```
   FRONTEND_URL=https://votre-app.vercel.app
   ```
3. Redéployer

### ✅ C'est fait!

Votre application est maintenant en ligne:
- Frontend: `https://votre-app.vercel.app`
- Backend: `https://votre-backend.railway.app`
- Admin: `https://votre-app.vercel.app/admin/login`

---

## 🔑 Générer un JWT_SECRET fort

```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Ou utiliser un générateur en ligne:
# https://generate-secret.vercel.app/32
```

---

## 📝 Checklist Rapide

- [ ] Code sur GitHub
- [ ] MongoDB Atlas configuré
- [ ] Backend déployé sur Railway
- [ ] Frontend déployé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] URLs mises à jour
- [ ] Test de connexion réussi

---

## 🆘 Problèmes Courants

**Backend ne démarre pas?**
→ Vérifier les logs Railway et les variables d'environnement

**Frontend ne se connecte pas?**
→ Vérifier `VITE_API_BASE_URL` dans Vercel

**Erreur CORS?**
→ Vérifier `FRONTEND_URL` dans Railway

**MongoDB connection failed?**
→ Vérifier Network Access dans MongoDB Atlas (0.0.0.0/0)

