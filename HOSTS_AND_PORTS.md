# Sahel AgriConnect - Hosts & Ports Information

## 🌐 Services & Ports

### Backend (Node.js/Express)
- **Port:** `3001`
- **API Base URL:** `http://localhost:3001/api`
- **WebSocket URL:** `ws://localhost:3001`
- **Health Check:** `http://localhost:3001/api/health`

**Endpoints principaux:**
- `POST /api/auth/login` - Connexion admin
- `GET /api/auth/verify` - Vérifier le token
- `POST /api/farmers` - Enregistrer un agriculteur
- `GET /api/farmers` - Liste des agriculteurs
- `POST /api/processors` - Enregistrer un processeur
- `GET /api/processors` - Liste des processeurs
- `GET /api/cooperatives` - Liste des coopératives
- `POST /api/detect-plant-disease` - Détection de maladies

### Frontend (React/Vite)
- **Port:** `5173`
- **Web App URL:** `http://localhost:5173`
- **Dev Server:** Vite (hot reload activé)

### MongoDB
- **Type:** MongoDB Atlas (Cloud)
- **Configuration:** Dans `backend/.env` (variable `MONGO_URI`)
- **Format:** `mongodb+srv://username:password@cluster.mongodb.net/sahel-agriconnect`

## 🔧 Configuration CORS

Le backend autorise les requêtes depuis:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Port alternatif)

## 🚀 Commandes de Démarrage

### Backend
```bash
cd backend
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### Frontend
```bash
cd web-dashboard
npm run dev
```

L'application démarre sur `http://localhost:5173`

## 📝 Variables d'Environnement

### Backend (`backend/.env`)
```env
PORT=3001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sahel-agriconnect
JWT_SECRET=your-secret-key-here
ADMIN_EMAIL=admin@sahelagriconnect.org
ADMIN_PASSWORD=admin123
```

### Frontend (`web-dashboard/.env`)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_BASE_URL=http://localhost:3001
```

## 🐛 Dépannage

### Port déjà utilisé
Si le port 3001 est déjà utilisé:
```bash
# Windows PowerShell
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Ou changer le port dans backend/.env
PORT=3002
```

Si le port 5173 est déjà utilisé:
- Vite choisira automatiquement le prochain port disponible (5174, 5175, etc.)

### Vérifier que les services fonctionnent

**Backend:**
```bash
curl http://localhost:3001/api/health
# Ou dans PowerShell:
Invoke-WebRequest -Uri http://localhost:3001/api/health
```

**Frontend:**
Ouvrir `http://localhost:5173` dans le navigateur

## 📊 Architecture

```
┌─────────────────┐
│   Frontend      │
│  React + Vite   │
│  Port: 5173     │
│  http://        │
│  localhost:5173 │
└────────┬────────┘
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│    Backend      │
│  Node.js/      │
│  Express       │
│  Port: 3001    │
│  http://       │
│  localhost:3001│
└────────┬────────┘
         │
┌────────▼────────┐
│   MongoDB      │
│   Atlas Cloud  │
│   (Remote)     │
└────────────────┘
```

## ✅ Checklist de Vérification

- [ ] Backend démarré sur `http://localhost:3001`
- [ ] Frontend démarré sur `http://localhost:5173`
- [ ] MongoDB Atlas connecté (vérifier dans les logs backend)
- [ ] Health check backend répond: `http://localhost:3001/api/health`
- [ ] Frontend peut se connecter au backend (pas d'erreurs CORS)
- [ ] WebSocket fonctionne (vérifier dans la console navigateur)

