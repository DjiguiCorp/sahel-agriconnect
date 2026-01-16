# 🚨 FORCE ENV REFRESH - Étapes Définitives

## ❌ Problème Persistant

L'API URL affiche toujours `https://votre-backend.onrender.com` (placeholder) au lieu de la vraie URL Render, même après redéploiement.

**Cause :** Vite remplace `import.meta.env.VITE_*` au build time. Les variables doivent être injectées lors du build.

---

## ✅ Étapes Définitives (À Faire dans l'Ordre)

### ÉTAPE 1 : Vérifier les Variables dans Vercel

1. **Allez sur :** https://vercel.com/dashboard
2. **Cliquez** sur votre projet `sahel-agriconnect`
3. **Settings** → **Environment Variables**
4. **Vérifiez** `VITE_API_BASE_URL` :
   - **Value** doit être votre vraie URL Render (ex: `https://sahel-agriconnect-backend-abc123.onrender.com`)
   - **PAS** `https://votre-backend.onrender.com` (placeholder)
   - **PAS** `localhost:3001`
   - Pas de `/` à la fin
   - Les 3 environnements cochés (Production, Preview, Development)

**Si incorrect :**
- Éditez la variable
- Remplacez par votre vraie URL Render
- Save

---

### ÉTAPE 2 : Changement de Code Effectué ✅

**Fichiers modifiés :**
- `web-dashboard/src/pages/AdminLogin.jsx` - Ajout de console.log
- `web-dashboard/src/config/api.js` - Ajout de console.log
- `web-dashboard/vite.config.js` - Ajout de define override

**Ces changements forcent Vite à reconstruire avec les variables fraîches.**

---

### ÉTAPE 3 : Vérifier le Nouveau Déploiement

1. **Allez dans "Deployments"** dans Vercel
2. **Attendez** que le nouveau déploiement soit "Ready" (1-2 minutes)
3. **Cliquez** sur le nouveau déploiement
4. **Build Logs** → Cherchez les console.log :
   ```
   🔧 Config API - VITE_API_BASE_URL: https://votre-vraie-url.onrender.com
   ```

**✅ Si vous voyez votre vraie URL :**
- Les variables sont injectées correctement
- Continuez à l'Étape 4

**❌ Si vous voyez toujours `localhost` ou le placeholder :**
- Les variables ne sont pas configurées correctement dans Vercel
- Répétez l'Étape 1

---

### ÉTAPE 4 : Tester sur Mobile (Mode Navigation Privée)

**⚠️ IMPORTANT :** Utilisez le mode navigation privée/incognito pour éviter le cache.

**Chrome Android :**
1. Ouvrez Chrome
2. Menu (3 points) → **New Incognito Tab**
3. Allez à : `https://sahel-agriconnect.vercel.app/admin/login`

**Safari iOS :**
1. Ouvrez Safari
2. Appuyez sur l'icône onglets → **Private**
3. Allez à : `https://sahel-agriconnect.vercel.app/admin/login`

**Vérifiez :**
- Le message d'erreur ne devrait plus apparaître
- "Debug Info" → "API URL" doit afficher votre vraie URL Render
- Le formulaire de connexion doit fonctionner

---

### ÉTAPE 5 : Tester la Connexion

1. **Email :** `admin@sahelagriconnect.org`
2. **Mot de passe :** `admin123`
3. **Cliquez** sur "Se connecter"

**Si ça fonctionne :** ✅ Problème résolu !

**Si erreur persiste :**
- Vérifiez les logs Render pour voir les erreurs backend
- Vérifiez que le backend est "Live" (pas "Sleeping")

---

## 🐛 Si le Problème Persiste

### Vérification 1 : Variables dans Vercel

**Dans Vercel → Settings → Environment Variables :**

- [ ] `VITE_API_BASE_URL` existe
- [ ] Value = votre vraie URL Render (pas placeholder)
- [ ] Pas de `/` à la fin
- [ ] Les 3 environnements cochés

---

### Vérification 2 : Logs de Build

**Dans Vercel → Deployments → Build Logs :**

Cherchez :
```
🔧 Config API - VITE_API_BASE_URL: ...
```

**Si vous voyez `NOT SET` ou `localhost` :**
- Les variables ne sont pas injectées
- Vérifiez l'Étape 1

---

### Vérification 3 : Code Source

**Vérifiez que le code utilise `import.meta.env` :**

```javascript
// ✅ CORRECT
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// ❌ INCORRECT
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
```

**Tous les fichiers doivent utiliser `import.meta.env` (pas `process.env`).**

---

### Vérification 4 : Override Temporaire dans vite.config.js

**Si les variables ne sont toujours pas prises en compte :**

Le fichier `vite.config.js` contient maintenant un override temporaire :

```javascript
define: {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
    process.env.VITE_API_BASE_URL || 'http://localhost:3001'
  ),
}
```

**⚠️ IMPORTANT :** Cet override utilise `process.env.VITE_API_BASE_URL` qui doit être défini dans Vercel.

**Pour forcer une valeur spécifique temporairement :**
```javascript
define: {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://votre-vraie-url.onrender.com'),
}
```

**⚠️ Retirez cet override après avoir confirmé que les variables fonctionnent !**

---

## 📋 Checklist Finale

- [ ] Variables configurées dans Vercel avec vraie URL Render
- [ ] Code modifié et poussé vers GitHub
- [ ] Nouveau déploiement "Ready" dans Vercel
- [ ] Logs de build montrent la vraie URL
- [ ] Testé en mode navigation privée sur mobile
- [ ] Cache du navigateur vidé
- [ ] Connexion admin fonctionne

---

## 🆘 Si Rien Ne Fonctionne

1. **Vérifiez les logs Render :**
   - Dashboard → Service → Logs
   - Cherchez les erreurs de connexion

2. **Testez l'API directement :**
   - Sur mobile : `https://votre-backend.onrender.com/api/health`
   - Doit retourner `{"status":"OK"}`

3. **Contactez le support avec :**
   - L'URL Render du backend
   - L'URL Vercel du frontend
   - Les logs de build Vercel
   - Les logs Render

---

*Guide créé le : 16 Janvier 2026*
*Basé sur l'expérience réelle avec Vite + Vercel + Mobile*
