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
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5173', 'http://localhost:3000'];

// Configuration Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

