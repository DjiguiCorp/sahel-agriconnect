import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import farmerRoutes from './routes/farmers.js';
import processorRoutes from './routes/processors.js';
import cooperativeRoutes from './routes/cooperatives.js';
import certificationRoutes from './routes/certifications.js';
import authRoutes from './routes/auth.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuration CORS pour production et développement
// Permettre toutes les origines Vercel (avec et sans www, http et https)
const getVercelOrigins = () => {
  if (!process.env.FRONTEND_URL) return [];
  const baseUrl = process.env.FRONTEND_URL.replace(/\/$/, ''); // Enlever trailing slash
  const origins = [baseUrl];
  
  // Ajouter variantes (avec/sans www, http/https)
  if (baseUrl.includes('vercel.app')) {
    origins.push(baseUrl.replace('https://', 'http://'));
    origins.push(baseUrl.replace(/^https:\/\/([^.]+)/, 'https://www.$1'));
  }
  
  return origins;
};

const allowedOrigins = [
  ...getVercelOrigins(),
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

// Configuration Socket.io - Permissif pour mobile
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Permettre toutes les origines en développement
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      // En production, permettre Vercel et localhost
      if (!origin || origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      callback(null, true); // Permettre pour mobile
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Middleware CORS - Configuration permissive pour mobile
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow all Vercel subdomains and localhost
    if (
      origin.includes('vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true);
    }

    // Log and allow temporarily for mobile debugging
    console.log('CORS: Origin not explicitly allowed:', origin);
    return callback(null, true); // fallback for mobile
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 heures
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/processors', processorRoutes);
app.use('/api/cooperatives', cooperativeRoutes);
app.use('/api/certifications', certificationRoutes);

// Route de base - Message informatif
app.get('/', (req, res) => {
  res.json({
    message: 'Sahel AgriConnect API Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      farmers: '/api/farmers',
      processors: '/api/processors',
      cooperatives: '/api/cooperatives',
      certifications: '/api/certifications'
    },
    frontend: 'http://localhost:5173',
    documentation: 'Voir README.md pour plus d\'informations',
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sahel AgriConnect API is running',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `La route ${req.method} ${req.path} n'existe pas`,
    availableEndpoints: {
      root: 'GET /',
      health: 'GET /api/health',
      auth: 'POST /api/auth/login',
      farmers: 'GET /api/farmers, POST /api/farmers',
      processors: 'GET /api/processors, POST /api/processors',
      cooperatives: 'GET /api/cooperatives',
      certifications: 'GET /api/certifications, POST /api/certifications'
    },
    frontend: 'Accédez à http://localhost:5173 pour l\'interface utilisateur'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sahel-agriconnect');
    console.log('✅ MongoDB connecté avec succès');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

// Socket.io - Gestion des connexions
io.on('connection', (socket) => {
  console.log('🔌 Client WebSocket connecté:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client WebSocket déconnecté:', socket.id);
  });
});

// Exporter io pour utilisation dans les routes
app.set('io', io);

// Démarrer le serveur
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📡 WebSocket disponible sur ws://localhost:${PORT}`);
    console.log(`🌐 API disponible sur http://localhost:${PORT}/api`);
  });
};

startServer();

export { io };

