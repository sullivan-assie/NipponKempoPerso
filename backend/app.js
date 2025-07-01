// // backend/app.js
// require('dotenv').config();
// const fastify = require('fastify')({ logger: true });
// const mongoose = require('mongoose');
// const path = require('path');
// const routes = require('./routes');
// const SyncManager = require('./utils/syncManager');

// // Plugin CORS essentiel
// fastify.register(require('@fastify/cors'), { 
//   origin: '*',
//   methods: ['GET', 'PUT', 'POST', 'DELETE']
// });

// // JWT pour l'authentification
// fastify.register(require('@fastify/jwt'), {
//   secret: process.env.JWT_SECRET || 'nippon-kempo-secret-key',
//   sign: {
//     expiresIn: '7d'  // Durée de validité du token
//   }
// });

// // Décorateur pour vérifier le token JWT
// fastify.decorate('authenticate', async (request, reply) => {
//   try {
//     await request.jwtVerify();
//   } catch (err) {
//     reply.code(401).send({ error: 'Unauthorized', message: 'Authentication required' });
//   }
// });

// // Décorateur pour rendre mongoose disponible dans les routes
// fastify.decorate('mongoose', mongoose);

// // Décorateur pour rendre le SyncManager disponible dans les routes
// fastify.decorate('syncManager', SyncManager);

// // Connexion à MongoDB
// const connectDB = async () => {
//   try {
//     // Options de connexion pour améliorer la robustesse
//     const mongoOptions = {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
//       socketTimeoutMS: 45000, // Connexion considérée inactive après 45 secondes
//       connectTimeoutMS: 10000, // Timeout de connexion après 10 secondes
//     };

//     // Ajouter un délai avant la première tentative de connexion
//     // pour donner le temps à MongoDB de démarrer complètement
//     fastify.log.info('Attente avant connexion à MongoDB...');
//     await new Promise(resolve => setTimeout(resolve, 3000));
    
//     await mongoose.connect(
//       process.env.MONGO_URI || 'mongodb://nippon_app:nippon_password@mongodb:27017/nippon-kempo',
//       mongoOptions
//     );
    
//     fastify.log.info('MongoDB connecté avec succès');
//   } catch (err) {
//     fastify.log.error('Erreur de connexion MongoDB:', err.message);
//     // Attendre 5 secondes avant de quitter pour permettre de voir le message d'erreur
//     await new Promise(resolve => setTimeout(resolve, 5000));
//     process.exit(1);
//   }
// };

// // Route de test pour vérifier que tout fonctionne
// fastify.get('/', async (request, reply) => {
//   return { status: 'ok', message: 'API Nippon Kempo fonctionne!' };
// });

// // Route pour tester la connexion à MongoDB
// fastify.get('/api/ping-db', async (request, reply) => {
//   try {
//     // Vérifier si la connexion à MongoDB est active
//     if (mongoose.connection.readyState === 1) {
//       return { status: 'ok', message: 'Connexion à MongoDB active', timestamp: new Date() };
//     } else {
//       return { status: 'error', message: 'Connexion à MongoDB inactive', readyState: mongoose.connection.readyState };
//     }
//   } catch (err) {
//     fastify.log.error(err);
//     return reply.code(500).send({ status: 'error', message: 'Erreur lors de la vérification de la connexion' });
//   }
// });

// // Enregistrer toutes les routes
// fastify.register(routes);

// // Démarrer le serveur
// const start = async () => {
//   try {
//     await connectDB();
//     await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
//     fastify.log.info(`Serveur démarré sur ${fastify.server.address().port}`);
//   } catch (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }
// };

// start();

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

// Fonction pour obtenir l'URI MongoDB selon l'environnement
const getMongoUri = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production : utilise Atlas
    const atlasUri = process.env.MONGO_URI || 
      'mongodb+srv://Admin:Azerty01@cluster0.3ivtdbu.mongodb.net/nippon-kempo?retryWrites=true&w=majority&appName=Cluster0';
    fastify.log.info('🌍 Utilisation de MongoDB Atlas (Production)');
    return atlasUri;
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