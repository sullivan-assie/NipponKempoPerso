// backend/routes/tournaments.js
const tournamentController = require('../controllers/tournamentController');
const pouleController = require('../controllers/pouleController');
const { authenticate, isAdmin, authenticateOptional } = require('../middleware/auth');

async function tournamentRoutes(fastify, options) {
  // Récupérer tous les tournois
  fastify.get('/', tournamentController.getTournaments);
  
  // Récupérer les tournois publics (accessible sans authentification)
  fastify.get('/public', tournamentController.getPublicTournaments);

  // Récupérer les tournois auxquels l'utilisateur est inscrit
  fastify.get('/me/participating', {
    preHandler: authenticate
  }, tournamentController.getUserParticipatingTournaments);

  // Récupérer un tournoi par ID (authentification optionnelle pour déterminer si admin)
  fastify.get('/:id', { 
    preHandler: authenticateOptional 
  }, tournamentController.getTournament);

  // Créer un nouveau tournoi (nécessite authentification)
  fastify.post('/', { 
    preHandler: authenticate 
  }, tournamentController.createTournament);

  // Mettre à jour un tournoi (nécessite authentification)
  fastify.put('/:id', { 
    preHandler: authenticate 
  }, tournamentController.updateTournament);

  // Supprimer un tournoi (nécessite authentification)
  fastify.delete('/:id', { 
    preHandler: authenticate 
  }, tournamentController.deleteTournament);

  // Ajouter des compétiteurs à un tournoi
  fastify.post('/:id/competitors', {
    preHandler: authenticate
  }, tournamentController.addCompetitors);

  // Route de synchronisation
  fastify.post('/sync', { 
    preHandler: authenticate 
  }, tournamentController.syncTournaments);
  
  // Nouvelles routes pour l'inscription aux tournois
  
  // Inscrire un utilisateur à un tournoi (nécessite authentification)
  fastify.post('/:id/register', {
    preHandler: authenticate
  }, tournamentController.registerForTournament);
  
  // Annuler l'inscription d'un utilisateur (nécessite authentification)
  fastify.delete('/:id/register', {
    preHandler: authenticate
  }, tournamentController.cancelRegistration);
  
  // Récupérer les participants d'un tournoi (réservé aux admins)
  fastify.get('/:id/participants', {
    preHandler: authenticate
  }, tournamentController.getTournamentParticipants);

  // Convertir des utilisateurs en compétiteurs et les ajouter au tournoi (Admin seulement)
  fastify.post('/:id/convert-users', { preHandler: [authenticate, isAdmin] }, tournamentController.convertUsersToCompetitors);
  
  // Routes pour la gestion des poules
  
  // Récupérer les compétiteurs organisés par catégorie (Admin seulement)
  fastify.get('/:id/competitors-by-category', { 
    preHandler: [authenticate, isAdmin] 
  }, pouleController.getCompetitorsByCategory);
  
  // Générer des poules aléatoires pour un tournoi et une catégorie spécifique (Admin seulement)
  fastify.post('/:id/generate-poules', { 
    preHandler: [authenticate, isAdmin] 
  }, pouleController.generateRandomPoules);
  
  // Routes pour la gestion des catégories
  
  // Ajouter des catégories à un tournoi
  fastify.post('/:id/categories', {
    preHandler: [authenticate, isAdmin]
  }, tournamentController.addCategoriesToTournament);
  
  // Supprimer une catégorie d'un tournoi
  fastify.delete('/:id/categories/:categoryId', {
    preHandler: [authenticate, isAdmin]
  }, tournamentController.removeCategoryFromTournament);
}

module.exports = tournamentRoutes;