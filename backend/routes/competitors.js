// backend/routes/competitors.js
const competitorController = require('../controllers/competitorController');
const { authenticate } = require('../middleware/auth');
const auth = require('../middleware/auth');

async function competitorRoutes(fastify, options) {
  // Récupérer tous les compétiteurs
  fastify.get('/', competitorController.getCompetitors);

  // Récupérer les informations du compétiteur d'un utilisateur
  fastify.get('/user/:userId', competitorController.getUserCompetitorData);

  // Récupérer un compétiteur par ID
  fastify.get('/:id', competitorController.getCompetitor);

  // Créer un nouveau compétiteur (nécessite authentification)
  fastify.post('/', { 
    preHandler: authenticate 
  }, competitorController.createCompetitor);

  // Mettre à jour un compétiteur (nécessite authentification)
  fastify.put('/:id', { 
    preHandler: authenticate 
  }, competitorController.updateCompetitor);

  // Supprimer un compétiteur (nécessite authentification)
  fastify.delete('/:id', { 
    preHandler: authenticate 
  }, competitorController.deleteCompetitor);

  // Route de synchronisation
  fastify.post('/sync', { 
    preHandler: authenticate 
  }, competitorController.syncCompetitors);

  // Ajouter un compétiteur à un tournoi
  fastify.post(
    '/:id/tournaments/:tournamentId',
    { preHandler: auth.verifyToken },
    competitorController.addCompetitorToTournament
  );

  // Supprimer un compétiteur d'un tournoi
  fastify.delete(
    '/:id/tournaments/:tournamentId',
    { preHandler: auth.verifyToken },
    competitorController.removeCompetitorFromTournament
  );

  // Mettre à jour les résultats d'un compétiteur dans un tournoi
  fastify.put(
    '/:id/tournaments/:tournamentId/results',
    { preHandler: auth.verifyToken },
    competitorController.updateCompetitorResults
  );

  // Obtenir tous les compétiteurs d'un tournoi par catégorie
  fastify.get(
    '/tournaments/:tournamentId/categories/:categoryId',
    competitorController.getCompetitorsByTournamentAndCategory
  );

  // Obtenir le classement des compétiteurs dans un tournoi par catégorie
  fastify.get(
    '/tournaments/:tournamentId/categories/:categoryId/ranking',
    competitorController.getTournamentRanking
  );
}

module.exports = competitorRoutes;