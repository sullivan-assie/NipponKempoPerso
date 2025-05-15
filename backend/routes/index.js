// backend/routes/index.js
const authRoutes = require('./auth');
const userRoutes = require('./users');
const tournamentRoutes = require('./tournaments');
const competitorRoutes = require('./competitors');
const categoryRoutes = require('./categories');
const teamRoutes = require('./teams');
const pouleRoutes = require('./poules');
const backupRoutes = require('./backups');
const clubRoutes = require('./clubs');

async function routes(fastify, options) {
  // Préfixe API pour toutes les routes
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(userRoutes, { prefix: '/api/users' });
  fastify.register(tournamentRoutes, { prefix: '/api/tournaments' });
  fastify.register(competitorRoutes, { prefix: '/api/competitors' });
  fastify.register(categoryRoutes, { prefix: '/api/categories' });
  fastify.register(teamRoutes, { prefix: '/api/teams' });
  fastify.register(pouleRoutes, { prefix: '/api/poules' });
  fastify.register(backupRoutes, { prefix: '/api/backups' });
  fastify.register(clubRoutes, { prefix: '/api/clubs' });
  
  // La route racine est déjà définie dans app.js, nous la supprimons ici
  // pour éviter l'erreur de duplication
}

module.exports = routes;
