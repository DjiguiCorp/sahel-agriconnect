# ⚠️ Important : Variables d'Environnement Vite + Vercel

## 🔴 Problème Connu

**Vite remplace `import.meta.env.VITE_*` au moment du build** - Les valeurs sont hardcodées dans les fichiers JS bundle pendant `vite build`.

**Conséquence :** Changer les variables d'environnement dans Vercel après un déploiement **ne met PAS à jour** les builds existants.

---

## ✅ Solution : Forcer un Nouveau Build

### Méthode 1 : Changement de Code (Recommandé)

**Faire un petit changement dans le code qui utilise les variables d'environnement :**

1. **Modifier** le fichier qui utilise `VITE_API_BASE_URL` (ex: `web-dashboard/src/config/api.js`)
2. **Ajouter** un commentaire ou une ligne vide
3. **Commit et push** vers GitHub
4. **Vercel redéploiera automatiquement** avec les nouvelles variables

**Exemple :**
```javascript
// Force env refresh - Jan 2025
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
```

---

### Méthode 2 : Redéployer avec Cache Busting

1. **Vercel Dashboard** → Votre projet → **Settings** → **General**
2. **Build & Development Settings**
3. **Temporairement modifier** la commande de build :
   ```
   echo "Force rebuild $(date)" && npm run build
   ```
4. **Save**
5. **Deployments** → **Redeploy** le dernier déploiement
6. **Après le build**, remettre la commande originale

---

### Méthode 3 : Redéployer sans Cache

1. **Deployments** → Cliquez sur les **3 points (⋯)** du dernier déploiement
2. **Redeploy**
3. **Décochez** "Use existing Build Cache"
4. **Redeploy**

**Note :** Cette méthode ne garantit pas toujours un rebuild complet.

---

## 📋 Checklist Après Modification des Variables

- [ ] Variables modifiées dans Vercel → Settings → Environment Variables
- [ ] Petit changement de code fait (commentaire, etc.)
- [ ] Code commité et poussé vers GitHub
- [ ] Vercel a redéployé automatiquement
- [ ] Build "Ready" (pas "Error")
- [ ] Logs de build montrent la nouvelle valeur de `VITE_API_BASE_URL`
- [ ] Testé sur mobile après redéploiement

---

## 🧪 Vérifier que les Variables sont Prises en Compte

### Dans les Logs de Build Vercel

1. **Deployments** → Cliquez sur le dernier déploiement
2. **Build Logs**
3. **Cherchez** `VITE_API_BASE_URL`

**✅ Si vous voyez votre vraie URL Render :**
- Les variables sont correctement injectées
- Le build est à jour

**❌ Si vous voyez `localhost:3001` ou le placeholder :**
- Les variables ne sont pas prises en compte
- Répétez les étapes ci-dessus

---

### Dans l'Application (Debug Info)

**Sur mobile, dans le message d'erreur :**
- **Debug Info** → **API URL** doit afficher votre vraie URL Render
- **PAS** `localhost:3001`
- **PAS** `https://votre-backend.onrender.com` (placeholder)

---

## 🎯 Bonnes Pratiques

### 1. Toujours Faire un Changement de Code

**Après avoir modifié les variables d'environnement :**
- Ajoutez un commentaire dans `web-dashboard/src/config/api.js`
- Commit et push
- Laissez Vercel redéployer automatiquement

### 2. Vérifier les Logs de Build

**Toujours vérifier** que les nouvelles variables apparaissent dans les logs de build.

### 3. Tester Immédiatement

**Après redéploiement :**
- Videz le cache du navigateur mobile
- Testez la connexion
- Vérifiez "Debug Info" pour confirmer la nouvelle URL

---

## 🐛 Dépannage

### Problème : Variables Modifiées mais Pas Prises en Compte

**Cause :** Vercel a réutilisé le cache de build.

**Solution :**
1. Faites un changement de code (Méthode 1)
2. Ou forcez un rebuild sans cache (Méthode 2)

---

### Problème : Build Échoue Après Modification

**Cause :** La commande de build temporaire peut causer des erreurs.

**Solution :**
1. Remettez la commande originale dans Settings
2. Utilisez la Méthode 1 (changement de code) à la place

---

## 📚 Références

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite + Vercel Gotcha (Stack Overflow)](https://stackoverflow.com/questions/...)

---

*Document créé le : Janvier 2025*
*Basé sur l'expérience réelle avec Vite + Vercel*
