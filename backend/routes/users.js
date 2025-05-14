const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

async function userRoutes(fastify, options) {
  // Récupérer la liste des utilisateurs (admin uniquement)
  fastify.get('/', { preHandler: [authenticate, isAdmin] }, userController.getAllUsers);
  
  // Récupérer le profil de l'utilisateur connecté
  fastify.get('/me', { preHandler: authenticate }, userController.getProfile);
  
  // Modifier le profil de l'utilisateur connecté
  fastify.put('/me', { preHandler: authenticate }, userController.updateProfile);
}

module.exports = userRoutes;
