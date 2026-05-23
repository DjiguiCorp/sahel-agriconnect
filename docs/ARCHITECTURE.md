# 🏗️ Architecture Technique - Sahel AgriConnect

## Vue d'Ensemble

Sahel AgriConnect est une application full-stack moderne : **React** (web-dashboard), **Flutter** (flutter-app — iOS/Android, six rôles), et **Node.js** (backend), déployée sur Vercel (web), stores/app builds (mobile), et Render.com (API).

---

## Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌────────────────────────┐ ┌────────────────────────────┐ │
│  │ React (web-dashboard)   │ │ Flutter (flutter-app)      │ │
│  │ Vercel — web + admin    │ │ iOS/Android — 6 role flows │ │
│  │ i18n: FR, EN            │ │ i18n: FR, EN               │ │
│  └───────────┬────────────┘ └─────────────┬──────────────┘ │
└──────────────┼────────────────────────────┼────────────────┘
               │                            │
               └────────────┬───────────────┘
                            │
                        │
                        │ HTTPS/REST API
                        │ WebSocket (Socket.io)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                      SERVER                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Node.js Backend (Render.com)                        │  │
│  │  - Express.js Framework                               │  │
│  │  - Routes: /api/farmers, /api/cooperatives, etc.     │  │
│  │  - Middleware: Auth, CORS, Validation                │  │
│  │  - Controllers: Business Logic                       │  │
│  │  - WebSocket: Real-time Notifications                │  │
│  └───────────────────┬──────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ MongoDB Driver
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    DATABASE                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MongoDB Atlas (Cloud)                                │  │
│  │  - Collections: farmers, cooperatives, centers, etc.  │  │
│  │  - Indexes: Performance Optimization                  │  │
│  │  - Replication: High Availability                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Internationalisation (i18n)** — Production scope today is **Français (FR)** and **English (EN)** only (`web-dashboard/src/locales/en.json`, `fr.json`; language selectors on web and Flutter expose EN/FR). Additional languages (Bambara, Mooré, Fulfulde) are planned for Phase 2 (see `ROADMAP.md`).

---

## Stack Technologique (actuel)

### Web — `web-dashboard/`

| Technologie | Version | Usage |
|------------|---------|-------|
| React | 18+ | Framework UI |
| Vite | 5+ | Build Tool |
| Tailwind CSS | 3+ | Styling |
| React Router | 6+ | Routing |
| i18next | 23+ | Internationalization |
| Socket.io Client | 4+ | WebSocket |

### Mobile — `flutter-app/` (en production / beta)

| Technologie | Version | Usage |
|------------|---------|-------|
| Flutter | 3+ | UI native iOS & Android |
| Dart | 3+ | Langage application |
| go_router | 13+ | Navigation |
| Provider | 6+ | State management |
| dio | 5+ | Client HTTP REST |

Écrans en place pour les six rôles (agriculteur, coopérative, investisseur, gouvernement, ONG, transformation) ; même API backend que le web.

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| Node.js | 18+ | Runtime |
| Express.js | 4+ | Web Framework |
| MongoDB | 6+ | Database |
| Mongoose | 7+ | ODM |
| Socket.io | 4+ | WebSocket Server |
| JWT | 9+ | Authentication |
| bcrypt | 5+ | Password Hashing |

### Infrastructure

| Service | Usage |
|---------|-------|
| Vercel | Frontend Hosting + CDN |
| Render.com | Backend Hosting |
| MongoDB Atlas | Database Cloud |
| GitHub | Version Control |

---

## Structure des Dossiers

### Frontend (`web-dashboard/`)

```
web-dashboard/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── admin/          # Composants admin
│   │   ├── forms/          # Formulaires
│   │   └── ...
│   ├── pages/              # Pages de l'application
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Governance.jsx
│   │   └── ...
│   ├── context/            # Context API
│   │   ├── AuthContext.jsx
│   │   └── WebSocketContext.jsx
│   ├── config/             # Configuration
│   │   ├── api.js          # Endpoints API
│   │   └── ...
│   ├── locales/            # i18n — FR + EN (Phase 1)
│   │   ├── fr.json
│   │   └── en.json
│   ├── data/               # Données mockées
│   ├── App.jsx             # Composant racine
│   └── main.jsx            # Point d'entrée
├── public/                 # Assets statiques
├── package.json
└── vite.config.js
```

### Mobile (`flutter-app/`)

```
flutter-app/
├── lib/
│   ├── core/               # Router, thème, auth, i18n
│   ├── screens/            # Flux par rôle (farmer, coop, investor, …)
│   └── widgets/
├── pubspec.yaml
└── …
```

### Backend (`backend/`)

```
backend/
├── routes/                 # Routes API
│   ├── farmers.js
│   ├── cooperatives.js
│   ├── auth.js
│   └── ...
├── models/                 # Modèles MongoDB
│   ├── Farmer.js
│   ├── Cooperative.js
│   └── ...
├── controllers/            # Contrôleurs
│   ├── farmerController.js
│   └── ...
├── middleware/             # Middleware Express
│   ├── auth.js
│   ├── validation.js
│   └── ...
├── config/                 # Configuration
│   └── database.js
├── server.js               # Point d'entrée
└── package.json
```

---

## Flux de Données

### Enregistrement d'un Agriculteur

```
1. User remplit formulaire (Frontend)
   ↓
2. POST /api/farmers (Backend)
   ↓
3. Validation des données (Middleware)
   ↓
4. Création dans MongoDB (Controller)
   ↓
5. WebSocket notification (Real-time)
   ↓
6. Confirmation au client (Frontend)
```

### Authentification Admin

```
1. User entre credentials (Frontend)
   ↓
2. POST /api/auth/login (Backend)
   ↓
3. Vérification credentials (Controller)
   ↓
4. Génération JWT token (Backend)
   ↓
5. Stockage token (localStorage Frontend)
   ↓
6. Redirection dashboard admin (Frontend)
```

---

## Sécurité

### Authentification

- **JWT Tokens** : Tokens signés avec expiration
- **Password Hashing** : bcrypt avec salt rounds
- **CORS** : Configuration stricte pour production
- **Rate Limiting** : À implémenter (express-rate-limit)

### Protection des Données

- **HTTPS** : Toutes les communications chiffrées
- **Chiffrement DB** : MongoDB Atlas encryption at rest
- **Validation** : Validation côté client et serveur
- **Sanitization** : Nettoyage des inputs utilisateur

---

## Performance

### Frontend

- **Code Splitting** : Lazy loading des routes
- **Image Optimization** : Vercel Image Optimization
- **CDN** : Vercel Edge Network
- **Caching** : Browser caching + Service Workers (à implémenter)

### Backend

- **Database Indexing** : Indexes sur champs fréquemment query
- **Connection Pooling** : MongoDB connection pool
- **Caching** : Redis (à implémenter)
- **Compression** : gzip compression

---

## Déploiement

### Frontend (Vercel)

1. **Build** : `npm run build` → génère `dist/`
2. **Deploy** : Vercel déploie automatiquement depuis GitHub
3. **Environment Variables** : Configurées dans Vercel Dashboard
4. **Domain** : `sahel-agriconnect.vercel.app` (custom domain possible)

### Backend (Render.com)

1. **Build** : `npm install` → installe dépendances
2. **Start** : `npm start` → démarre serveur Express
3. **Environment Variables** : Configurées dans Render Dashboard
4. **Health Check** : `/api/health` endpoint

---

## Monitoring et Logs

### À Implémenter

- **Error Tracking** : Sentry
- **Analytics** : Google Analytics ou Plausible
- **Logs** : Winston ou Pino
- **Uptime Monitoring** : UptimeRobot ou Pingdom

---

## Évolutivité

### Scalabilité Horizontale

- **Frontend** : Vercel gère automatiquement le scaling
- **Backend** : Render.com permet scaling manuel
- **Database** : MongoDB Atlas auto-scaling

### Optimisations Futures

- **Microservices** : Séparation des services (auth, farmers, etc.)
- **Message Queue** : RabbitMQ ou Redis pour tâches asynchrones
- **CDN** : Cloudflare pour assets statiques
- **Load Balancing** : Nginx ou AWS ELB

---

## Diagramme de Séquence - Enregistrement Agriculteur

```
User          Frontend        Backend         MongoDB
 │                │               │               │
 │  Submit Form   │               │               │
 ├───────────────>│               │               │
 │                │  POST /api/   │               │
 │                │  farmers      │               │
 │                ├──────────────>│               │
 │                │               │  Validate     │
 │                │               │  Data         │
 │                │               ├───────────────>│
 │                │               │  Create       │
 │                │               │  Document     │
 │                │               │<──────────────┤
 │                │  Response     │               │
 │                │<──────────────┤               │
 │  Success       │               │               │
 │<───────────────┤               │               │
```

---

## Technologies Futures

### Phase 2 (2027)

- **Blockchain** : Traçabilité immuable (optionnel)
- **IA/ML** : Recommandations personnalisées
- **Offline-first PWA** : Web dashboard utilisable hors ligne (Service Workers, cache, file d’attente de sync)
- **SMS / USSD fallback** : Parcours légers pour agriculteurs à faible connectivité (alertes, statuts, rappels — sans dépendre du smartphone)

> **Note :** L’application **Flutter** (`flutter-app/`) fait partie du stack **actuel** (beta Q1 2026), pas de la Phase 2.

### Phase 3 (2028+)

- **Microservices** : Architecture distribuée
- **Event Sourcing** : Historique complet des événements
- **GraphQL** : API plus flexible
- **Real-time Analytics** : Dashboard temps réel

---

*Dernière mise à jour : Mai 2026*

