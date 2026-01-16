# 🔧 Correction Rapide - Connexion Admin

## ❌ Problème Actuel

L'erreur montre : `API URL: https://votre-backend.onrender.com` (placeholder)

Cela signifie que `VITE_API_BASE_URL` n'est pas correctement configuré dans Vercel.

---

## ✅ Solution Rapide (5 minutes)

### Étape 1 : Trouver votre URL Render

1. Allez sur **https://dashboard.render.com**
2. Connectez-vous
3. Cliquez sur votre **service backend** (ex: `sahel-agriconnect-backend`)
4. En haut de la page, vous verrez l'URL : `https://sahel-agriconnect-backend-xxxx.onrender.com`
5. **Copiez cette URL complète** (ex: `https://sahel-agriconnect-backend-abc123.onrender.com`)

### Étape 2 : Configurer dans Vercel

1. Allez sur **https://vercel.com/dashboard**
2. Cliquez sur votre projet **sahel-agriconnect**
3. Allez dans **Settings** → **Environment Variables**
4. Cherchez `VITE_API_BASE_URL` :
   - Si elle existe : **Éditez** et remplacez par votre vraie URL Render
   - Si elle n'existe pas : **Ajoutez** avec votre vraie URL Render
5. **IMPORTANT :** 
   - Value = votre URL Render (ex: `https://sahel-agriconnect-backend-abc123.onrender.com`)
   - **PAS** de `/` à la fin
   - **PAS** `https://votre-backend.onrender.com` (placeholder)
   - Cochez les 3 environnements : Production, Preview, Development
6. **Sauvegardez**

### Étape 3 : Redéployer

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Cliquez sur **Redeploy**
4. Attendez 1-2 minutes

### Étape 4 : Tester

1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Allez sur `https://sahel-agriconnect.vercel.app/admin/login`
3. Essayez de vous connecter
4. L'erreur devrait disparaître

---

## 🔍 Vérification

Après le redéploiement, dans la console du navigateur, vous devriez voir :
```
🔍 API Base URL in use: https://votre-vraie-url.onrender.com
```

**PAS** `https://votre-backend.onrender.com` (placeholder)

---

## ⚠️ Si ça ne fonctionne toujours pas

1. Vérifiez que l'URL Render est correcte (testez dans le navigateur : `https://votre-url.onrender.com/api/health`)
2. Vérifiez que la variable est bien dans les 3 environnements (Production, Preview, Development)
3. Faites un **hard refresh** (Ctrl+F5) ou utilisez le mode navigation privée
4. Vérifiez les logs Vercel pour voir si le build a bien pris en compte la variable

---

*Cette solution devrait résoudre le problème de connexion admin!* ✅
