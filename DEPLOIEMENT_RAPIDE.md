# ⚡ Déploiement Rapide - Résumé Exécutif

## 🎯 En 5 Étapes

### 1️⃣ GitHub (5 min)
```powershell
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/VOTRE-USERNAME/sahel-agriconnect.git
git push -u origin main
```

### 2️⃣ MongoDB Atlas (5 min)
1. Créer un cluster gratuit (M0)
2. Network Access → Allow from Anywhere (0.0.0.0/0)
3. Database Access → Créer un utilisateur
4. Connect → Copier l'URI
5. Format: `mongodb+srv://user:pass@cluster.mongodb.net/sahel-agriconnect?retryWrites=true&w=majority`

### 3️⃣ Vercel - Frontend (5 min)
1. https://vercel.com → New Project
2. Importer depuis GitHub
3. **Root Directory:** `web-dashboard` ⚠️
4. Déployer
5. Noter l'URL: `https://xxx.vercel.app`

### 4️⃣ Render - Backend (10 min)
1. https://render.com → New Web Service
2. Importer depuis GitHub
3. **Root Directory:** `backend` ⚠️
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. **Plan:** Free
7. Variables d'environnement:
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=votre-uri-mongodb-atlas
   JWT_SECRET=generez-une-cle-forte
   ADMIN_EMAIL=admin@sahelagriconnect.org
   ADMIN_PASSWORD=admin123
   FRONTEND_URL=https://xxx.vercel.app
   ```
8. Déployer
9. Noter l'URL: `https://xxx.onrender.com`

### 5️⃣ Mettre à Jour les URLs (5 min)
1. **Vercel:** Ajouter variables:
   ```
   VITE_API_BASE_URL=https://xxx.onrender.com
   VITE_WS_BASE_URL=https://xxx.onrender.com
   ```
2. Redéployer le frontend
3. **Render:** Mettre à jour:
   ```
   FRONTEND_URL=https://xxx.vercel.app
   ```
4. Render redéploiera automatiquement

---

## ✅ Vérification

1. Backend: `https://xxx.onrender.com/api/health` → `{"status":"OK"}`
2. Frontend: `https://xxx.vercel.app` → Application visible
3. Admin: `https://xxx.vercel.app/admin/login` → Connexion fonctionne

---

## 📝 Fichiers Créés

- ✅ `web-dashboard/vercel.json` - Configuration Vercel
- ✅ `web-dashboard/.vercelignore` - Fichiers à ignorer
- ✅ `render.yaml` - Configuration Render (optionnel)
- ✅ `DEPLOIEMENT_DEBUTANT.md` - Guide complet détaillé

---

## 🆘 Problèmes Courants

**Backend ne démarre pas?**
→ Vérifier `MONGO_URI` et logs Render

**CORS error?**
→ Vérifier `FRONTEND_URL` dans Render

**Frontend ne se connecte pas?**
→ Vérifier `VITE_API_BASE_URL` dans Vercel et redéployer

---

**Pour le guide complet détaillé, voir `DEPLOIEMENT_DEBUTANT.md`** 📖

