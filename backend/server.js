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
import centerRoutes from './routes/centers.js';
import perkRoutes from './routes/perks.js';
import trainingRoutes from './routes/trainings.js';
import irrigationRoutes from './routes/irrigation.js';
import logisticsRoutes from './routes/logistics.js';
import optimizeRoutes from './routes/optimize.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuration CORS - Permet toutes les origines Vercel
const getVercelOrigins = () => {
  if (!process.env.FRONTEND_URL) return [];
  const baseUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
  return [baseUrl];
};

const allowedOrigins = [
  ...getVercelOrigins(),
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

// Configuration CORS avec fonction dynamique pour permettre toutes origines Vercel
app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (mobile, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Permettre toutes les origines Vercel (y compris sous-domaines)
    if (origin.includes('vercel.app')) return callback(null, true);
    
    // Permettre localhost en développement
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    
    // Vérifier la liste des origines autorisées
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    
    // Permettre par défaut (pour compatibilité mobile)
    callback(null, true);
  },
  credentials: true,
}));

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/processors', processorRoutes);
app.use('/api/cooperatives', cooperativeRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/perks', perkRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/irrigation', irrigationRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/optimize', optimizeRoutes);

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
      certifications: '/api/certifications',
      centers: '/api/centers',
      perks: '/api/perks',
      trainings: '/api/trainings',
      irrigation: '/api/irrigation',
      logistics: '/api/logistics',
      optimize: '/api/optimize'
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

// Gestion des erreurs 404 - DOIT être après toutes les routes
app.use((req, res) => {
  // Ne pas logger les requêtes OPTIONS (preflight CORS)
  if (req.method !== 'OPTIONS') {
    console.log(`❌ Route not found: ${req.method} ${req.path}`);
  }
  
  res.status(404).json({ 
    error: 'Route not found',
    message: `La route ${req.method} ${req.path} n'existe pas`,
    path: req.path,
    method: req.method,
    availableEndpoints: {
      root: 'GET /',
      health: 'GET /api/health',
      auth: 'POST /api/auth/login',
      farmers: 'GET /api/farmers, POST /api/farmers',
      processors: 'GET /api/processors, POST /api/processors',
      cooperatives: 'GET /api/cooperatives',
      certifications: 'GET /api/certifications, POST /api/certifications',
      centers: 'GET /api/centers, POST /api/centers',
      perks: 'GET /api/perks, POST /api/perks/request',
      trainings: 'GET /api/trainings, POST /api/trainings/schedule',
      irrigation: 'GET /api/irrigation, POST /api/irrigation/assess',
      logistics: 'GET /api/logistics, POST /api/logistics/schedule',
      optimize: 'POST /api/optimize/production'
    },
    frontend: process.env.FRONTEND_URL || 'Accédez à http://localhost:5173 pour l\'interface utilisateur',
    timestamp: new Date().toISOString()
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

