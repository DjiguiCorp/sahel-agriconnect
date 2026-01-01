# 📱 Fix: Accès Mobile - Sahel AgriConnect

## 🔍 Problème Identifié

L'application fonctionne sur ordinateur portable mais pas sur téléphone mobile.

## 🔧 Solutions Appliquées

### 1. Configuration CORS Améliorée

**Fichier modifié :** `backend/server.js`

**Changements :**
- ✅ CORS plus permissif pour les origines Vercel
- ✅ Support des variantes d'URL (avec/sans www, http/https)
- ✅ Permet les requêtes sans origin (mobile apps)
- ✅ Logs de debug pour identifier les problèmes

### 2. Vérification des Variables d'Environnement

**Dans Render.com, vérifiez que `FRONTEND_URL` est correctement configuré :**

```
FRONTEND_URL=https://sahel-agriconnect.vercel.app
```

**⚠️ Important :**
- Pas d'espace avant/après
- URL complète avec `https://`
- Pas de trailing slash `/` à la fin

### 3. Variables d'Environnement Vercel

**Dans Vercel, vérifiez ces variables :**

```
VITE_API_BASE_URL=https://votre-backend.onrender.com
VITE_WS_BASE_URL=https://votre-backend.onrender.com
```

**⚠️ Important :**
- Utilisez l'URL Render réelle (pas localhost)
- URL complète avec `https://`
- Pas de trailing slash

---

## 🧪 Tests à Effectuer

### Test 1: Vérifier CORS depuis Mobile

1. **Ouvrez** l'application sur votre téléphone
2. **Ouvrez** la console du navigateur (si possible) ou utilisez un outil de debug
3. **Essayez** de vous connecter ou d'utiliser une fonctionnalité
4. **Vérifiez** les erreurs dans la console

### Test 2: Vérifier l'URL Backend

Sur mobile, ouvrez dans le navigateur :
```
https://votre-backend.onrender.com/api/health
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running"
}
```

### Test 3: Vérifier les Variables d'Environnement

**Dans Vercel :**
1. Allez dans Settings → Environment Variables
2. Vérifiez que `VITE_API_BASE_URL` pointe vers Render
3. Vérifiez que `VITE_WS_BASE_URL` pointe vers Render

**Dans Render :**
1. Allez dans Environment
2. Vérifiez que `FRONTEND_URL` = URL Vercel exacte

---

## 🐛 Dépannage

### Problème: "CORS Error" sur Mobile

**Solution 1 :** Vérifier `FRONTEND_URL` dans Render
- Doit être exactement : `https://sahel-agriconnect.vercel.app`
- Redéployer le backend après modification

**Solution 2 :** Vérifier les logs Render
- Allez dans Logs
- Cherchez les messages CORS
- Vérifiez l'origine bloquée

**Solution 3 :** Vider le cache du navigateur mobile
- Chrome : Settings → Privacy → Clear browsing data
- Safari : Settings → Safari → Clear History and Website Data

### Problème: "Network Error" sur Mobile

**Solution :**
1. Vérifiez que `VITE_API_BASE_URL` dans Vercel = URL Render
2. Vérifiez que le backend Render est "Live" (pas "Sleeping")
3. Testez l'URL backend directement sur mobile

### Problème: Backend "Sleeping"

**Solution :**
- Render.com (plan gratuit) endort les services après 15 min d'inactivité
- La première requête prendra 30-60 secondes pour réveiller le service
- C'est normal ! Les requêtes suivantes seront rapides

---

## ✅ Checklist de Vérification

- [ ] `FRONTEND_URL` dans Render = URL Vercel exacte
- [ ] `VITE_API_BASE_URL` dans Vercel = URL Render
- [ ] `VITE_WS_BASE_URL` dans Vercel = URL Render
- [ ] Backend Render est "Live"
- [ ] Backend redéployé après modification CORS
- [ ] Frontend Vercel redéployé après modification variables
- [ ] Testé sur mobile (navigateur)
- [ ] Pas d'erreurs CORS dans la console mobile

---

## 🔄 Redéploiement Nécessaire

Après les modifications CORS :

1. **Backend (Render) :**
   - Les changements sont dans le code
   - Poussez sur GitHub : `git push origin main`
   - Render redéploiera automatiquement
   - OU : Manual Deploy → "Clear build cache & deploy"

2. **Frontend (Vercel) :**
   - Vérifiez les variables d'environnement
   - Si modifiées, redéployez manuellement

---

## 📝 Notes Importantes

1. **CORS Mobile :** Les navigateurs mobiles peuvent envoyer des headers différents
2. **HTTPS Requis :** Assurez-vous que toutes les URLs utilisent HTTPS
3. **Cache :** Videz le cache du navigateur mobile après modifications
4. **Service Sleeping :** Premier appel peut prendre 30-60 secondes

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

1. **Vérifiez les logs Render** pour voir les erreurs CORS exactes
2. **Testez l'API directement** sur mobile : `https://backend.onrender.com/api/health`
3. **Vérifiez la console** du navigateur mobile (si possible)
4. **Contactez le support** avec les logs d'erreur

---

*Dernière mise à jour : Décembre 2024*

