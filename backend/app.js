require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const path = require('path');
const routes = require('./routes');
const SyncManager = require('./utils/syncManager');

// Importation des middlewares de sécurité OWASP
const { registerSecurityMiddlewares } = require('./middleware/security');
const { SecurityLogger, createSecurityLoggingMiddleware } = require('./middleware/securityLogger');

// Initialisation du logger de sécurité
const securityLogger = new SecurityLogger(fastify.log);

// Plugin CORS sécurisé selon l'environnement
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://nippon-kempo.onrender.com'])
  : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:9500'];

fastify.register(require('@fastify/cors'), { 
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Enregistrement des middlewares de sécurité (A05 - Security Misconfiguration)
fastify.register(async function (fastify) {
  await registerSecurityMiddlewares(fastify);
});

// JWT pour l'authentification
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'nippon-kempo-secret-key',
  sign: {
    expiresIn: '7d'  // Durée de validité du token
  }
});

// Middleware de logging de sécurité (A09 - Security Logging)
fastify.addHook('onRequest', async (request, reply) => {
  // Attacher le logger de sécurité à chaque requête
  request.securityLogger = securityLogger;
  
  // Nettoyer les tentatives anciennes périodiquement
  if (Math.random() < 0.01) { // 1% de chance à chaque requête
    securityLogger.cleanupOldAttempts();
  }
});

// Middleware pour logger automatiquement les événements de sécurité
fastify.addHook('onSend', async (request, reply, payload) => {
  const secLogger = request.securityLogger;
  
  if (reply.statusCode === 401) {
    secLogger.logUnauthorizedAccess(
      request.ip,
      request.headers['user-agent'],
      request.url,
      request.method
    );
  }
  
  if (reply.statusCode === 403) {
    secLogger.logPrivilegeEscalation(
      request.user?.id,
      request.user?.email,
      request.ip,
      `${request.method} ${request.url}`,
      request.headers['user-agent']
    );
  }

  if (reply.statusCode === 429) {
    secLogger.logRateLimitExceeded(
      request.ip,
      request.headers['user-agent'],
      request.url,
      'Rate limit exceeded'
    );
  }
});

// Décorateur pour vérifier le token JWT
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required' });
  }
});

// Décorateurs pour rendre les services disponibles dans les routes
fastify.decorate('mongoose', mongoose);
fastify.decorate('syncManager', SyncManager);
fastify.decorate('securityLogger', securityLogger);

// Fonction pour obtenir l'URI MongoDB selon l'environnement
const getMongoUri = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production : utilise Atlas (URI depuis les variables d'environnement)
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI est requis en production');
    }
    fastify.log.info('🌍 Utilisation de MongoDB Atlas (Production)');
    return process.env.MONGO_URI;
  } else {
    // Local : utilise Docker
    const localUri = process.env.MONGO_URI || 
      'mongodb://nippon_app:nippon_password@mongodb:27017/nippon-kempo';
    fastify.log.info('🐳 Utilisation de MongoDB Docker (Local)');
    return localUri;
  }
};

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const mongoUri = getMongoUri();
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Options de connexion adaptées selon l'environnement
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: isProduction ? 15000 : 5000, // Plus de temps pour Atlas
      socketTimeoutMS: 45000,
      connectTimeoutMS: isProduction ? 15000 : 10000, // Plus de temps pour Atlas
    };

    fastify.log.info(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
    fastify.log.info(`📍 URI MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    // En local, attendre que MongoDB Docker soit prêt
    if (!isProduction) {
      fastify.log.info('⏳ Attente avant connexion à MongoDB Docker...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    await mongoose.connect(mongoUri, mongoOptions);
    
    fastify.log.info('✅ MongoDB connecté avec succès');
    
    // Afficher les infos de connexion
    const connection = mongoose.connection;
    fastify.log.info(`📊 Base de données: ${connection.name}`);
    fastify.log.info(`🏠 Host: ${connection.host}`);
    
  } catch (err) {
    fastify.log.error('❌ Erreur de connexion MongoDB:', err.message);
    
    // En production, retry plus rapidement
    if (process.env.NODE_ENV === 'production') {
      fastify.log.info('🔄 Nouvelle tentative dans 5 secondes...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(); // Retry une fois
    }
    
    // En local, attendre avant de quitter
    await new Promise(resolve => setTimeout(resolve, 5000));
    process.exit(1);
  }
};

// Route de test pour vérifier que tout fonctionne
fastify.get('/', async (request, reply) => {
  return { 
    status: 'ok', 
    message: 'API Nippon Kempo fonctionne!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  };
});

// Route pour tester la connexion à MongoDB
fastify.get('/api/ping-db', async (request, reply) => {
  try {
    // Vérifier si la connexion à MongoDB est active
    if (mongoose.connection.readyState === 1) {
      const dbInfo = {
        status: 'ok', 
        message: 'Connexion à MongoDB active',
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date()
      };
      return dbInfo;
    } else {
      return { 
        status: 'error', 
        message: 'Connexion à MongoDB inactive', 
        readyState: mongoose.connection.readyState,
        environment: process.env.NODE_ENV || 'development'
      };
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.code(500).send({ 
      status: 'error', 
      message: 'Erreur lors de la vérification de la connexion',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Route pour les statistiques de sécurité (Admin seulement)
fastify.get('/api/security/stats', {
  preHandler: [fastify.authenticate, async (request, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    }
  }]
}, async (request, reply) => {
  try {
    const stats = securityLogger.getSecurityStats();
    
    // Logger l'accès aux données sensibles
    securityLogger.logDataAccess(
      request.user.id,
      request.user.email,
      'security_stats',
      'read',
      request.ip
    );
    
    return {
      ...stats,
      timestamp: new Date().toISOString(),
      requestedBy: request.user.email
    };
  } catch (error) {
    fastify.log.error('Error fetching security stats:', error);
    return reply.code(500).send({ error: 'Server Error', message: 'Unable to fetch security statistics' });
  }
});

// Enregistrer toutes les routes
fastify.register(routes);

// Démarrer le serveur
const start = async () => {
  try {
    await connectDB();
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    fastify.log.info(`🚀 Serveur démarré sur le port ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();