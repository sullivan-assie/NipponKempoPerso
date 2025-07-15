require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const path = require('path');
const routes = require('./routes');
const SyncManager = require('./utils/syncManager');
const bcrypt = require('bcryptjs');

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

// Fonction pour créer un administrateur par défaut
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    
    // Vérifier si un admin existe déjà
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      fastify.log.info('✅ Compte administrateur déjà existant');
      return;
    }
    
    fastify.log.info('🔧 Création du compte administrateur par défaut...');
    
    // Créer le mot de passe haché
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Créer l'administrateur
    const admin = new User({
      firstName: "Admin",
      lastName: "Kempo",
      name: "Admin Kempo",
      email: "admin@kempo.fr",
      password: hashedPassword,
      role: "admin",
      status: true,
      RGPDConsent: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await admin.save();
    fastify.log.info('✅ Compte administrateur créé avec succès');
    fastify.log.info('📧 Email: admin@kempo.fr');
    fastify.log.info('🔑 Mot de passe: admin123');
    fastify.log.info('⚠️  N\'oubliez pas de changer le mot de passe en production !');
    
  } catch (error) {
    fastify.log.error('❌ Erreur lors de la création de l\'administrateur:', error.message);
  }
};

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
    
    // Appeler la fonction pour créer un administrateur par défaut
    await createDefaultAdmin();
    
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