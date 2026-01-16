# 🚨 URGENT : Configurer VITE_API_BASE_URL dans Vercel (Étape par Étape)

## ❌ Problème Actuel

**"Load failed"** - L'API URL affiche `https://votre-backend.onrender.com` (placeholder) au lieu de votre vraie URL Render.

**Cause :** `VITE_API_BASE_URL` n'est **PAS configuré** ou est configuré avec une valeur incorrecte dans Vercel.

---

## ✅ SOLUTION DÉTAILLÉE ÉTAPE PAR ÉTAPE

### ÉTAPE 1 : Trouver l'URL Réelle de Votre Backend Render

1. **Ouvrez un nouvel onglet** dans votre navigateur
2. **Allez sur :** https://dashboard.render.com
3. **Connectez-vous** si nécessaire
4. **Cliquez** sur votre service backend (ex: `sahel-agriconnect-backend` ou un nom similaire)
5. **Regardez en haut de la page** - vous verrez une URL comme :
   ```
   https://sahel-agriconnect-backend-xxxx.onrender.com
   ```
   ou
   ```
   https://sahel-agriconnect-backend.onrender.com
   ```

6. **COPIEZ cette URL complète** (avec `https://`)

**⚠️ IMPORTANT :** Notez cette URL quelque part, vous en aurez besoin !

**Exemple d'URL Render :**
```
https://sahel-agriconnect-backend-abc123.onrender.com
```

---

### ÉTAPE 2 : Vérifier que le Backend est Accessible

**Avant de continuer, testez que le backend fonctionne :**

1. **Ouvrez un nouvel onglet**
2. **Collez l'URL Render** que vous venez de copier
3. **Ajoutez `/api/health` à la fin :**
   ```
   https://votre-backend.onrender.com/api/health
   ```
   (Remplacez par votre vraie URL)

4. **Appuyez sur Entrée**

**Résultat attendu :**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running"
}
```

**Si vous voyez ce message :** ✅ Le backend fonctionne, continuez à l'étape 3.

**Si vous voyez une erreur :**
- Le backend peut être "Sleeping" (attendez 30-60 secondes et réessayez)
- Vérifiez que l'URL est correcte
- Vérifiez que le backend est "Live" dans Render (pas "Sleeping")

---

### ÉTAPE 3 : Aller dans Vercel

1. **Ouvrez un nouvel onglet**
2. **Allez sur :** https://vercel.com/dashboard
3. **Connectez-vous** si nécessaire
4. **Cliquez** sur votre projet `sahel-agriconnect` (ou le nom de votre projet)

---

### ÉTAPE 4 : Accéder aux Variables d'Environnement

1. **Dans le menu de gauche**, cliquez sur **"Settings"**
2. **Dans le sous-menu**, cliquez sur **"Environment Variables"**

Vous devriez voir une page avec :
- Un tableau listant les variables existantes
- Un bouton **"Add New"** ou **"Add"** en haut

---

### ÉTAPE 5 : Ajouter/Modifier VITE_API_BASE_URL

#### Option A : Si la Variable N'Existe Pas

1. **Cliquez sur "Add New"** ou **"Add"**
2. **Dans "Key"**, tapez exactement : `VITE_API_BASE_URL`
   - ⚠️ **ATTENTION :** Respectez la casse (majuscules/minuscules)
   - ⚠️ **ATTENTION :** Pas d'espace avant ou après
3. **Dans "Value"**, collez l'URL Render que vous avez copiée à l'Étape 1
   - Exemple : `https://sahel-agriconnect-backend-abc123.onrender.com`
   - ⚠️ **IMPORTANT :** 
     - Commence par `https://`
     - **PAS de `/` à la fin** (pas `https://...onrender.com/`)
     - Pas d'espaces
4. **Cochez les 3 environnements :**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Cliquez sur "Save"**

#### Option B : Si la Variable Existe Déjà

1. **Trouvez** `VITE_API_BASE_URL` dans la liste
2. **Cliquez sur les 3 points (⋯)** à droite de la ligne
3. **Cliquez sur "Edit"** ou **"Modifier"**
4. **Vérifiez/Modifiez la "Value"** :
   - Doit être = votre URL Render (ex: `https://sahel-agriconnect-backend-abc123.onrender.com`)
   - ⚠️ **IMPORTANT :** 
     - Commence par `https://`
     - **PAS de `/` à la fin**
     - Pas d'espaces
5. **Vérifiez** que les 3 environnements sont cochés :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. **Cliquez sur "Save"**

---

### ÉTAPE 6 : Ajouter/Modifier VITE_WS_BASE_URL

**Répétez l'Étape 5 pour `VITE_WS_BASE_URL` :**

1. **Cliquez sur "Add New"** ou **"Add"**
2. **Key :** `VITE_WS_BASE_URL`
3. **Value :** **MÊME URL** que `VITE_API_BASE_URL`
   - Exemple : `https://sahel-agriconnect-backend-abc123.onrender.com`
   - ⚠️ **MÊME URL** pour les deux variables !
4. **Cochez les 3 environnements :**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Cliquez sur "Save"**

---

### ÉTAPE 7 : Vérifier les Variables

**Vous devriez maintenant avoir :**

| Key | Value | Environments |
|-----|-------|-------------|
| `VITE_API_BASE_URL` | `https://votre-backend.onrender.com` | ✅ Production, ✅ Preview, ✅ Development |
| `VITE_WS_BASE_URL` | `https://votre-backend.onrender.com` | ✅ Production, ✅ Preview, ✅ Development |

**⚠️ Vérifications importantes :**
- ✅ Les deux variables existent
- ✅ Les valeurs sont identiques (même URL)
- ✅ Les valeurs commencent par `https://`
- ✅ Les valeurs **NE se terminent PAS** par `/`
- ✅ Les 3 environnements sont cochés pour chaque variable

---

### ÉTAPE 8 : Redéployer le Frontend (CRITIQUE !)

**⚠️ ATTENTION :** Les variables ne sont prises en compte que lors du build. Vous **DEVEZ** redéployer !

1. **Dans le menu de gauche**, cliquez sur **"Deployments"**
2. **Trouvez** le dernier déploiement (en haut de la liste)
3. **Cliquez sur les 3 points (⋯)** à droite du déploiement
4. **Cliquez sur "Redeploy"**
5. **Dans la popup**, vous pouvez :
   - Laisser "Use existing Build Cache" coché (plus rapide)
   - Ou le décocher pour forcer un rebuild complet
6. **Cliquez sur "Redeploy"**
7. **Attendez 2-5 minutes** que le redéploiement se termine

**Vous verrez :**
- "Building..." → "Ready" (quand c'est terminé)

---

### ÉTAPE 9 : Vérifier que les Variables sont Prises en Compte

1. **Allez dans "Deployments"**
2. **Cliquez** sur le dernier déploiement (celui que vous venez de redéployer)
3. **Cliquez sur "Build Logs"** ou **"View Build Logs"**
4. **Cherchez** dans les logs les lignes contenant `VITE_API_BASE_URL`

**Vous devriez voir :**
```
VITE_API_BASE_URL=https://votre-backend.onrender.com
```

**Si vous voyez `localhost:3001` :**
- Les variables ne sont pas correctement configurées
- Répétez les Étape 5-6

---

### ÉTAPE 10 : Vider le Cache du Navigateur Mobile

**Sur votre téléphone :**

**Chrome Android :**
1. Ouvrez Chrome
2. Menu (3 points en haut à droite) → **Settings**
3. **Privacy** → **Clear browsing data**
4. Cochez **"Cached images and files"**
5. Cliquez sur **"Clear data"**

**Safari iOS :**
1. **Settings** → **Safari**
2. **Clear History and Website Data**
3. Confirmez

**Alternative :**
- Utilisez le mode navigation privée/incognito
- Ou utilisez un autre navigateur

---

### ÉTAPE 11 : Tester sur Mobile

1. **Sur votre téléphone**, ouvrez le navigateur
2. **Allez à :** `https://sahel-agriconnect.vercel.app/admin/login`
   (Remplacez par votre URL Vercel réelle)
3. **Ouvrez la console** (si possible) :
   - **Chrome Android :** chrome://inspect → Devices
   - **Safari iOS :** Connecter à Mac et utiliser Safari DevTools
4. **Regardez** le message d'erreur (s'il y en a encore)

**Si l'erreur persiste :**
- Vérifiez dans la console que l'URL affichée est maintenant votre vraie URL Render (pas `votre-backend.onrender.com`)
- Si c'est toujours le placeholder, les variables ne sont pas prises en compte → Vérifiez l'Étape 9

---

## 🐛 Dépannage

### Problème 1 : "Je ne trouve pas mon service backend dans Render"

**Solution :**
1. Vérifiez que vous êtes connecté au bon compte Render
2. Vérifiez dans l'onglet "Services" de Render
3. Si vous ne trouvez pas, le backend n'est peut-être pas déployé → Déployez-le d'abord

---

### Problème 2 : "La variable existe mais l'URL est toujours 'votre-backend.onrender.com'"

**Cause :** La variable contient le placeholder au lieu de la vraie URL.

**Solution :**
1. Éditez la variable dans Vercel
2. Remplacez `https://votre-backend.onrender.com` par votre vraie URL Render
3. Redéployez (Étape 8)

---

### Problème 3 : "J'ai configuré les variables mais ça ne fonctionne toujours pas"

**Vérifications :**
1. ✅ Les variables sont bien configurées (Étape 7)
2. ✅ Vous avez redéployé (Étape 8)
3. ✅ Le build est "Ready" (pas "Error")
4. ✅ Vous avez vidé le cache mobile (Étape 10)
5. ✅ L'URL Render est accessible (Étape 2)

**Si tout est correct mais ça ne fonctionne toujours pas :**
- Attendez 5-10 minutes (propagation)
- Essayez un autre navigateur mobile
- Vérifiez les logs de build dans Vercel

---

## 📋 Checklist Finale

- [ ] URL Render copiée (Étape 1)
- [ ] Backend accessible (Étape 2)
- [ ] `VITE_API_BASE_URL` configuré avec la vraie URL Render (Étape 5)
- [ ] `VITE_WS_BASE_URL` configuré avec la même URL (Étape 6)
- [ ] Les 3 environnements cochés pour chaque variable (Étape 7)
- [ ] Pas de `/` à la fin des URLs (Étape 7)
- [ ] Frontend redéployé (Étape 8)
- [ ] Variables visibles dans les logs de build (Étape 9)
- [ ] Cache mobile vidé (Étape 10)
- [ ] Testé sur mobile (Étape 11)

---

## 🆘 Si Rien Ne Fonctionne

1. **Vérifiez les logs Vercel :**
   - Deployments → Dernier déploiement → Build Logs
   - Cherchez les erreurs

2. **Testez l'API directement :**
   - Sur mobile, ouvrez : `https://votre-backend.onrender.com/api/health`
   - Doit retourner `{"status":"OK"}`

3. **Contactez le support avec :**
   - L'URL Render du backend
   - L'URL Vercel du frontend
   - Les logs d'erreur (si disponibles)

---

*Guide créé le : Décembre 2024*
*URGENT : Suivez chaque étape dans l'ordre !*
