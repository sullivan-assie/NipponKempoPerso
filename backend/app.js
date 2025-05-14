// backend/app.js
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const path = require('path');
const routes = require('./routes');
const SyncManager = require('./utils/syncManager');

// Plugin CORS essentiel
fastify.register(require('@fastify/cors'), { 
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE']
});

// JWT pour l'authentification
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'nippon-kempo-secret-key',
  sign: {
    expiresIn: '7d'  // Durée de validité du token
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

// Décorateur pour rendre mongoose disponible dans les routes
fastify.decorate('mongoose', mongoose);

// Décorateur pour rendre le SyncManager disponible dans les routes
fastify.decorate('syncManager', SyncManager);

// Connexion à MongoDB
const connectDB = async () => {
  try {
    // Options de connexion pour améliorer la robustesse
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
      socketTimeoutMS: 45000, // Connexion considérée inactive après 45 secondes
      connectTimeoutMS: 10000, // Timeout de connexion après 10 secondes
    };

    // Ajouter un délai avant la première tentative de connexion
    // pour donner le temps à MongoDB de démarrer complètement
    fastify.log.info('Attente avant connexion à MongoDB...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://nippon_app:nippon_password@mongodb:27017/nippon-kempo',
      mongoOptions
    );
    
    fastify.log.info('MongoDB connecté avec succès');
  } catch (err) {
    fastify.log.error('Erreur de connexion MongoDB:', err.message);
    // Attendre 5 secondes avant de quitter pour permettre de voir le message d'erreur
    await new Promise(resolve => setTimeout(resolve, 5000));
    process.exit(1);
  }
};

// Route de test pour vérifier que tout fonctionne
fastify.get('/', async (request, reply) => {
  return { status: 'ok', message: 'API Nippon Kempo fonctionne!' };
});

// Route pour tester la connexion à MongoDB
fastify.get('/api/ping-db', async (request, reply) => {
  try {
    // Vérifier si la connexion à MongoDB est active
    if (mongoose.connection.readyState === 1) {
      return { status: 'ok', message: 'Connexion à MongoDB active', timestamp: new Date() };
    } else {
      return { status: 'error', message: 'Connexion à MongoDB inactive', readyState: mongoose.connection.readyState };
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.code(500).send({ status: 'error', message: 'Erreur lors de la vérification de la connexion' });
  }
});

// Enregistrer toutes les routes
fastify.register(routes);

// Démarrer le serveur
const start = async () => {
  try {
    await connectDB();
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    fastify.log.info(`Serveur démarré sur ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();