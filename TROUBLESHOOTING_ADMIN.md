# 🔧 Dépannage - Page Admin

## ❌ Erreur: "Erreur de connexion au serveur"

### Cause
Le backend n'est pas démarré ou n'est pas accessible.

### Solution

#### 1. Vérifier que le backend est démarré

```powershell
# Vérifier si le port 3001 est actif
netstat -ano | findstr :3001
```

Si rien n'apparaît, le backend n'est pas démarré.

#### 2. Démarrer le backend

```powershell
cd backend
npm run dev
```

Vous devriez voir:
```
🚀 Serveur démarré sur le port 3001
📡 WebSocket disponible sur ws://localhost:3001
🌐 API disponible sur http://localhost:3001/api
```

#### 3. Vérifier que MongoDB est connecté

Le backend doit afficher:
```
✅ MongoDB connecté avec succès
```

Si vous voyez une erreur MongoDB:
- Vérifiez que MongoDB Atlas est accessible
- Vérifiez l'URI dans `backend/.env`
- Vérifiez Network Access dans MongoDB Atlas

#### 4. Tester l'API directement

Ouvrez dans votre navigateur:
```
http://localhost:3001/api/health
```

Devrait retourner:
```json
{
  "status": "OK",
  "message": "Sahel AgriConnect API is running"
}
```

#### 5. Vérifier la console du navigateur

1. Ouvrez la page admin login
2. Appuyez sur F12 (DevTools)
3. Allez dans l'onglet "Console"
4. Regardez les erreurs

Erreurs courantes:
- `Failed to fetch` → Backend non démarré
- `CORS error` → Problème de configuration CORS
- `Network error` → Backend inaccessible

#### 6. Vérifier les variables d'environnement

Dans `web-dashboard/src/config/api.js`, vérifiez que:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
```

Si vous avez un fichier `.env` dans `web-dashboard`, vérifiez:
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_BASE_URL=http://localhost:3001
```

---

## ✅ Checklist de Vérification

- [ ] Backend démarré (`npm run dev` dans `backend/`)
- [ ] Port 3001 actif (vérifier avec `netstat`)
- [ ] MongoDB connecté (vérifier les logs backend)
- [ ] API accessible (`http://localhost:3001/api/health`)
- [ ] Frontend démarré (`npm run dev` dans `web-dashboard/`)
- [ ] Port 5173 actif
- [ ] Aucune erreur dans la console du navigateur
- [ ] Variables d'environnement correctes

---

## 🚀 Démarrage Rapide

Pour démarrer les deux serveurs rapidement:

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd web-dashboard
npm run dev
```

Puis ouvrez: `http://localhost:5173/admin/login`

---

## 🔑 Identifiants Admin

- **Email:** `admin@sahelagriconnect.org`
- **Mot de passe:** `admin123`

**Important:** Si vous n'avez pas encore créé l'admin:

```powershell
cd backend
node scripts/initAdmin.js
```

---

## 🐛 Autres Problèmes

### Erreur: "Email ou mot de passe incorrect"

1. Vérifiez que l'admin existe:
   ```powershell
   cd backend
   node scripts/initAdmin.js
   ```

2. Vérifiez les identifiants dans `backend/.env`:
   ```env
   ADMIN_EMAIL=admin@sahelagriconnect.org
   ADMIN_PASSWORD=admin123
   ```

### Erreur: "Cannot connect to MongoDB"

1. Vérifiez l'URI dans `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sahel-agriconnect
   ```

2. Vérifiez Network Access dans MongoDB Atlas:
   - Aller dans "Network Access"
   - Ajouter votre IP ou "Allow Access from Anywhere" (0.0.0.0/0)

### Le backend démarre mais s'arrête immédiatement

1. Vérifiez les logs d'erreur
2. Vérifiez que toutes les dépendances sont installées:
   ```powershell
   cd backend
   npm install
   ```

3. Vérifiez que MongoDB est accessible

---

## 📞 Support

Si le problème persiste:
1. Vérifiez les logs du backend
2. Vérifiez la console du navigateur (F12)
3. Vérifiez que tous les services sont démarrés
4. Consultez `HOSTS_AND_PORTS.md` pour les URLs

