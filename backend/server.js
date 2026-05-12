import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
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
import investorsRouter from './routes/investors.js';
import opportunitiesRouter from './routes/opportunities.js';
import licensingRouter from './routes/licensing.js';
import equipmentFundRouter from './routes/equipmentFund.js';
import farmerNeedsRouter from './routes/farmerNeeds.js';
import produceListingsRouter from './routes/produceListings.js';
import serviceBookingsRouter from './routes/serviceBookings.js';
import licensesRouter from './routes/licenses.js';
import thinktankRouter from './routes/thinktank.js';
import soilRouter from './routes/soil.js';
import expertsRouter from './routes/experts.js';
import diasporaRouter from './routes/diaspora.js';
import Admin from './models/Admin.js';
import marketplaceRouter from './routes/marketplace.js';
import waitlistRouter from './routes/waitlist.js';
import investmentsRouter from './routes/investments.js';
import escrowRouter from './routes/escrow.js';
import scoresRouter from './routes/afriyieldScores.js';
import governmentRouter from './routes/government.js';
import coopInvitationsRouter from './routes/cooperativeInvitations.js';
import supplychainRouter from './routes/supplychain.js';
import notificationsRouter, { processQueue } from './routes/notifications.js';
import verificationRouter from './routes/verification.js';
import investorNotificationsRouter from './routes/investorNotifications.js';
import deletionRequestsRouter from './routes/deletionRequests.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const httpServer = createServer(app);
export { app };

// Configuration CORS - Permet toutes les origines Vercel
const ALLOWED_ORIGINS = [
  'https://sahelagriconnect.com',
  'https://www.sahelagriconnect.com',
  'https://sahel-agriconnect.vercel.app', // keep during transition
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed =
        ALLOWED_ORIGINS.some((o) => origin === o || origin.startsWith(o)) || /\.vercel\.app$/i.test(origin);
      if (allowed) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

// Handle preflight requests explicitly (safety net)
app.options('*', cors());

// Configuration Socket.io - Permissif pour mobile
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Permettre toutes les origines en développement
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      // En production, permettre Vercel et localhost
      if (!origin) return callback(null, true);
      const allowed = ALLOWED_ORIGINS.some((o) => origin === o || origin.startsWith(o));
      if (allowed || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(mongoSanitize());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/government/login', loginLimiter);
app.use('/api/investors/login', loginLimiter);
app.use('/api/cooperatives/login', loginLimiter);

// API Documentation — available at /api/docs
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Sahel AgriConnect API',
    customCss: '.swagger-ui .topbar { background-color: #1a3c2e; }',
    swaggerOptions: { persistAuthorization: true },
  })
);

// Raw OpenAPI JSON for mobile app integration
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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
app.use('/api/investors', investorsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/licensing', licensingRouter);
app.use('/api/equipment-fund', equipmentFundRouter);
app.use('/api/farmer-needs', farmerNeedsRouter);
app.use('/api/produce', produceListingsRouter);
app.use('/api/service-bookings', serviceBookingsRouter);
app.use('/api/licenses', licensesRouter);
app.use('/api/thinktank', thinktankRouter);
app.use('/api/soil', soilRouter);
app.use('/api/experts', expertsRouter);
app.use('/api/diaspora', diasporaRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/escrow', escrowRouter);
app.use('/api/afriyield-scores', scoresRouter);
app.use('/api/government', governmentRouter);
app.use('/api/coop-invitations', coopInvitationsRouter);
app.use('/api/supplychain', supplychainRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/verify', verificationRouter);
app.use('/api/investor-notifications', investorNotificationsRouter);
app.use('/api/deletion-requests', deletionRequestsRouter);

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
    docs: `${process.env.FRONTEND_URL || ''}/api/docs`,
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

async function ensureAdminAccount() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.log('⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in environment');
      return;
    }

    // Check if admin with this email already exists
    const existing = await Admin.findOne({ email: adminEmail.toLowerCase() });
    
    if (existing) {
      console.log('✅ Admin account exists:', adminEmail);
      return;
    }

    // Check if any admin exists with old email — update it
    const anyAdmin = await Admin.findOne({ role: { $in: ['super-admin', 'admin'] } });
    
    if (anyAdmin) {
      // Update existing admin to use new email and password
      anyAdmin.email = adminEmail.toLowerCase();
      anyAdmin.password = adminPassword;
      anyAdmin.role = 'super-admin';
      await anyAdmin.save();
      console.log('✅ Admin account updated to:', adminEmail);
      return;
    }

    // No admin exists — create one
    await Admin.create({
      name: 'Super Admin',
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'super-admin'
    });
    console.log('✅ Admin account created:', adminEmail);

  } catch (error) {
    console.error('❌ Error ensuring admin account:', error.message);
  }
}

// Connexion MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sahel-agriconnect');
    console.log('✅ MongoDB connecté avec succès');
    await ensureAdminAccount();
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

const QUEUE_INTERVAL = 5 * 60 * 1000;
async function startQueueProcessor() {
  console.log('📬 Notification queue processor started');
  try {
    const startup = await processQueue(50);
    console.log(`📬 Startup queue flush: ${startup.sent} sent, ${startup.failed} failed, ${startup.skipped} skipped`);
  } catch (e) {
    console.error('📬 Queue startup error:', e.message);
  }
  setInterval(async () => {
    try {
      await processQueue(30);
    } catch (e) {
      console.error('📬 Queue interval error:', e.message);
    }
  }, QUEUE_INTERVAL);
}

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
  if (process.env.NODE_ENV !== 'test') {
    setTimeout(() => {
      startQueueProcessor().catch((e) => console.error('📬 Queue processor failed to start:', e.message));
    }, 3000);
    httpServer.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📡 WebSocket disponible sur ws://localhost:${PORT}`);
      console.log(`🌐 API disponible sur http://localhost:${PORT}/api`);
    });
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { io };

