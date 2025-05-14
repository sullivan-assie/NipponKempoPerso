const Category = require('../models/Category');
const { authenticate } = require('../middleware/auth');

async function categoryRoutes(fastify, options) {
  // Récupérer toutes les catégories
  fastify.get('/', async (request, reply) => {
    try {
      let categories;
      
      // Si une date est fournie, récupérer seulement les catégories modifiées après cette date
      if (request.query.updatedAfter) {
        const date = new Date(request.query.updatedAfter);
        
        categories = await Category.find({
          updatedAt: { $gt: date }
        });
      } else {
        // Sinon, récupérer toutes les catégories
        categories = await Category.find();
      }
      
      return categories;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Récupérer une catégorie par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const category = await Category.findById(request.params.id);
      
      if (!category) {
        return reply.code(404).send({ error: 'Not Found', message: `Catégorie non trouvée avec l'ID: ${request.params.id}` });
      }
      
      return category;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Créer une nouvelle catégorie (nécessite authentification)
  fastify.post('/', { 
    preHandler: authenticate 
  }, async (request, reply) => {
    try {
      const category = new Category(request.body);
      await category.save();
      
      return reply.code(201).send(category);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Mettre à jour une catégorie (nécessite authentification)
  fastify.put('/:id', { 
    preHandler: authenticate 
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      
      const category = await Category.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: Date.now() },
        { new: true }
      );
      
      if (!category) {
        return reply.code(404).send({ error: 'Not Found', message: `Catégorie non trouvée avec l'ID: ${id}` });
      }
      
      return category;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });

  // Supprimer une catégorie (nécessite authentification)
  fastify.delete('/:id', { 
    preHandler: authenticate 
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const category = await Category.findByIdAndDelete(id);
      
      if (!category) {
        return reply.code(404).send({ error: 'Not Found', message: `Catégorie non trouvée avec l'ID: ${id}` });
      }
      
      return { success: true, message: 'Catégorie supprimée avec succès' };
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
        syncResult = await SyncManager.syncData(data, 'categories', Category);
      }
      
      // Récupérer les catégories mises à jour après la dernière synchronisation
      const updatedCategories = await SyncManager.getUpdatedItems(Category, lastSyncDate);
      
      return {
        result: syncResult,
        updatedItems: updatedCategories
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Server Error', message: error.message });
    }
  });
}

module.exports = categoryRoutes;