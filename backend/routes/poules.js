// backend/routes/poules.js
const pouleController = require('../controllers/pouleController');
const { authenticate, isAdmin } = require('../middleware/auth');

async function pouleRoutes(fastify, options) {
  // Middleware pour vérifier que l'utilisateur est admin
  const adminOnly = [authenticate, isAdmin];

  // Récupérer toutes les poules
  fastify.get('/', { preHandler: authenticate }, pouleController.getAllPoules);
  
  // Récupérer les poules d'un tournoi
  fastify.get('/tournament/:tournamentId', { preHandler: authenticate }, pouleController.getPoulesByTournament);
  
  // Récupérer une poule par son ID
  fastify.get('/:id', { preHandler: authenticate }, pouleController.getPouleById);
  
  // Créer une nouvelle poule
  fastify.post('/', { preHandler: adminOnly }, pouleController.createPoule);
  
  // Mettre à jour une poule
  fastify.put('/:id', { preHandler: adminOnly }, pouleController.updatePoule);
  
  // Supprimer une poule
  fastify.delete('/:id', { preHandler: adminOnly }, pouleController.deletePoule);
}

module.exports = pouleRoutes;