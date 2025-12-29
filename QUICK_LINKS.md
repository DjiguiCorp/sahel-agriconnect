# 🔗 Liens Rapides - Sahel AgriConnect

## 🌐 Application Web (Frontend)

### **Lien Principal**
```
http://localhost:5173
```
**C'est le lien principal pour accéder à l'application web**

---

## 📄 Pages de l'Application

### Page d'accueil
```
http://localhost:5173/
```

### À propos
```
http://localhost:5173/about
```

### Tableau de bord
```
http://localhost:5173/dashboard
```

### Contact / Inscription
```
http://localhost:5173/contact
```

### Diagnostic du sol
```
http://localhost:5173/diagnostic-sol
```

### Détection de maladies
```
http://localhost:5173/detection-maladies
```

### Think Tank
```
http://localhost:5173/think-tank
```

### Connexion Admin
```
http://localhost:5173/admin/login
```

### Dashboard Admin (protégé)
```
http://localhost:5173/admin/central
```

---

## 🔧 Backend API

### Base URL
```
http://localhost:3001/api
```

### Health Check
```
http://localhost:3001/api/health
```

### Endpoints API

#### Authentification
- **POST** `http://localhost:3001/api/auth/login`
- **GET** `http://localhost:3001/api/auth/verify`

#### Agriculteurs
- **GET** `http://localhost:3001/api/farmers`
- **POST** `http://localhost:3001/api/farmers`

#### Processeurs
- **GET** `http://localhost:3001/api/processors`
- **POST** `http://localhost:3001/api/processors`

#### Coopératives
- **GET** `http://localhost:3001/api/cooperatives`

#### Détection de maladies
- **POST** `http://localhost:3001/api/detect-plant-disease`

---

## 🔌 WebSocket

### Connexion WebSocket
```
ws://localhost:3001
```

---

## ⚙️ Paramètres Optionnels

### Afficher le sélecteur de langue
```
http://localhost:5173/?lang=settings
```

---

## 🚀 Commandes pour Démarrer

### Démarrer le Backend
```bash
cd backend
npm run dev
```
Le backend sera disponible sur `http://localhost:3001`

### Démarrer le Frontend
```bash
cd web-dashboard
npm run dev
```
Le frontend sera disponible sur `http://localhost:5173`

---

## 📝 Identifiants Admin (par défaut)

- **Email:** `admin@sahelagriconnect.org`
- **Mot de passe:** `admin123`

---

## ✅ Vérification Rapide

1. **Backend fonctionne?**
   - Ouvrir: `http://localhost:3001/api/health`
   - Devrait retourner: `{"status":"OK",...}`

2. **Frontend fonctionne?**
   - Ouvrir: `http://localhost:5173`
   - Devrait afficher la page d'accueil

3. **Les deux fonctionnent ensemble?**
   - Aller sur `http://localhost:5173/dashboard`
   - Les données devraient se charger depuis le backend

---

## 🔍 Dépannage Rapide

### Port 3001 déjà utilisé?
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Port 5173 déjà utilisé?
- Vite choisira automatiquement le prochain port (5174, 5175, etc.)
- Vérifiez la console pour voir le nouveau port

---

**💡 Astuce:** Ajoutez `http://localhost:5173` à vos favoris pour un accès rapide!

