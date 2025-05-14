// Configuration de base pour les tests
const fastify = require('fastify')({ logger: false }); // Logger désactivé en test
const mongoose = require('mongoose');
const jwt = require('@fastify/jwt');
const cors = require('@fastify/cors');
const routes = require('../routes');

// Environnement de test MongoDB
const MONGO_TEST_URI = 'mongodb://nippon_app:nippon_password@mongodb:27017/nippon-kempo-test';

// Fonction pour configurer Fastify pour les tests
async function buildFastify() {
  // Enregistrer les plugins
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE']
  });

  // JWT pour l'authentification
  await fastify.register(jwt, {
    secret: 'test-secret-key',
    sign: {
      expiresIn: '1h'
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

  // Enregistrer toutes les routes
  await fastify.register(routes);

  return fastify;
}

// Fonction pour connecter à la base de données de test
async function connectToTestDatabase() {
  try {
    await mongoose.connect(MONGO_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à la base de données de test');
  } catch (error) {
    console.error('Erreur de connexion à la BD de test:', error);
    process.exit(1);
  }
}

// Fonction pour nettoyer la base de données entre les tests
async function clearDatabase() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

// Fonction pour fermer la connexion à la base de données
async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log('Connexion à la base de données fermée');
}

module.exports = {
  buildFastify,
  connectToTestDatabase,
  clearDatabase,
  closeDatabase
};