// backend/routes/backups.js
const backupController = require('../controllers/backupController');
const { authenticate, isAdmin } = require('../middleware/auth');

async function backupRoutes(fastify, options) {
  // Middleware pour vérifier que l'utilisateur est admin
  const adminOnly = [authenticate, isAdmin];

  // Créer une sauvegarde
  fastify.post('/', { preHandler: adminOnly }, backupController.createBackup);
  
  // Lister toutes les sauvegardes
  fastify.get('/', { preHandler: adminOnly }, backupController.listBackups);
  
  // Télécharger une sauvegarde
  fastify.get('/:filename/download', { preHandler: adminOnly }, backupController.downloadBackup);
  
  // Restaurer une sauvegarde
  fastify.post('/:filename/restore', { preHandler: adminOnly }, backupController.restoreBackup);
  
  // Supprimer une sauvegarde
  fastify.delete('/:filename', { preHandler: adminOnly }, backupController.deleteBackup);
}

module.exports = backupRoutes;