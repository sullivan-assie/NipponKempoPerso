// backend/routes/teams.js
const { authenticate } = require('../middleware/auth');
const Team = require('../models/Team'); // Assurez-vous que le modèle Team est correctement importé
async function teamRoutes(fastify, options) {
  const SyncManager = fastify.syncManager;

  // Récupérer toutes les équipes
  fastify.get('/', async (request, reply) => {
    try {
      let teams;
      
      // Si une date est fournie, récupérer seulement les équipes modifiées après cette date
      if (request.query.updatedAfter) {
        const date = new Date(request.query.updatedAfter);
        
        teams = await Team.find({
          updatedAt: { $gt: date }
        });
      } else {
        // Sinon, récupérer toutes les équipes
        teams = await Team.find();
      }
      
      return teams;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Récupérer une équipe par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const team = await Team.findById(request.params.id).populate('members');
      
      if (!team) {
        return reply.code(404).send({ error: 'Not Found', message: `Équipe non trouvée avec l'ID: ${request.params.id}` });
      }
      
      return team;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Créer une nouvelle équipe (nécessite authentification)
  fastify.post('/', { 
    preHandler: authenticate 
  }, async (request, reply) => {
    try {
      const team = new Team(request.body);
      await team.save();
      
      return reply.code(201).send(team);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Mettre à jour une équipe (nécessite authentification)
  fastify.put('/:id', { 
    preHandler: authenticate 
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      
      const team = await Team.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: Date.now() },
        { new: true }
      );
      
      if (!team) {
        return reply.code(404).send({ error: 'Not Found', message: `Équipe non trouvée avec l'ID: ${id}` });
      }
      
      return team;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Supprimer une équipe (nécessite authentification)
  fastify.delete('/:id', { 
    preHandler: authenticate 
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const team = await Team.findByIdAndDelete(id);
      
      if (!team) {
        return reply.code(404).send({ error: 'Not Found', message: `Équipe non trouvée avec l'ID: ${id}` });
      }
      
      return { success: true, message: 'Équipe supprimée avec succès' };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Route de synchronisation
  fastify.post('/sync', { 
    preHandler: authenticate 
  }, async (request, reply) => {
    try {
      // Récupérer les données à synchroniser depuis la requête
      const { data, lastSyncDate } = request.body;
      
      // Synchroniser les données reçues
      let syncResult = {};
      if (data && data.length > 0) {
        syncResult = await SyncManager.syncData(data, 'teams', Team);
      }
      
      // Récupérer les équipes mises à jour après la dernière synchronisation
      const updatedTeams = await SyncManager.getUpdatedItems(Team, lastSyncDate);
      
      return {
        result: syncResult,
        updatedItems: updatedTeams
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });
}

module.exports = teamRoutes;