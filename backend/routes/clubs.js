const clubController = require('../controllers/clubController');
const auth = require('../middleware/auth');

async function routes(fastify, options) {
  // Ajouter authentification globale pour toutes les routes
  fastify.addHook('preHandler', auth.authenticate);

  // Route pour créer un club (admin uniquement)
  fastify.post('/', {
    preHandler: auth.isAdmin
  }, clubController.createClub);

  // Route pour obtenir tous les clubs
  fastify.get('/', clubController.getClubs);

  // Route pour obtenir un club spécifique
  fastify.get('/:id', clubController.getClubById);

  // Route pour mettre à jour un club (admin uniquement)
  fastify.put('/:id', {
    preHandler: auth.isAdmin
  }, clubController.updateClub);

  // Route pour supprimer un club (admin uniquement)
  fastify.delete('/:id', {
    preHandler: auth.isAdmin
  }, clubController.deleteClub);

  // Route pour ajouter un utilisateur à un club (admin uniquement)
  fastify.post('/:id/users', {
    preHandler: auth.isAdmin
  }, clubController.addUserToClub);

  // Route pour retirer un utilisateur d'un club (admin uniquement)
  fastify.delete('/:id/users', {
    preHandler: auth.isAdmin
  }, clubController.removeUserFromClub);
}

module.exports = routes;