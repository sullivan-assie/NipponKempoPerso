const backupManager = require('../utils/backupManager');
const path = require('path');
const fs = require('fs');

// @desc    Créer une sauvegarde de la base de données
// @route   POST /api/backups
// @access  Private (Admin uniquement)
exports.createBackup = async (request, reply) => {
  try {
    // La vérification d'admin est maintenant faite par le middleware
    const result = await backupManager.createBackup();
    
    if (!result.success) {
      return reply.code(500).send({
        error: 'Server Error',
        message: 'Erreur lors de la création de la sauvegarde',
        details: result.error
      });
    }
    
    return reply.code(201).send({
      message: 'Sauvegarde créée avec succès',
      backup: {
        filename: result.filename,
        size: result.sizeInMB + ' MB',
        createdAt: result.timestamp
      }
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      error: 'Server Error',
      message: error.message
    });
  }
};

// @desc    Lister toutes les sauvegardes
// @route   GET /api/backups
// @access  Private (Admin uniquement)
exports.listBackups = async (request, reply) => {
  try {
    // La vérification d'admin est maintenant faite par le middleware
    const backups = await backupManager.listBackups();
    
    return reply.send({
      count: backups.length,
      backups
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      error: 'Server Error',
      message: error.message
    });
  }
};

// @desc    Télécharger une sauvegarde
// @route   GET /api/backups/:filename/download
// @access  Private (Admin uniquement)
exports.downloadBackup = async (request, reply) => {
  try {
    // La vérification d'admin est maintenant faite par le middleware
    const { filename } = request.params;
    const backupDir = path.join(__dirname, '../backups');
    const filePath = path.join(backupDir, filename);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Sauvegarde non trouvée: ${filename}`
      });
    }
    
    // Lire le fichier
    const fileStream = fs.createReadStream(filePath);
    
    // Définir les en-têtes pour le téléchargement
    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Disposition', `attachment; filename=${filename}`);
    
    // Renvoyer le contenu du fichier
    return reply.send(fileStream);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      error: 'Server Error',
      message: error.message
    });
  }
};

// @desc    Restaurer une sauvegarde
// @route   POST /api/backups/:filename/restore
// @access  Private (Admin uniquement)
exports.restoreBackup = async (request, reply) => {
  try {
    // La vérification d'admin est maintenant faite par le middleware
    const { filename } = request.params;
    const result = await backupManager.restoreBackup(filename);
    
    if (!result.success) {
      return reply.code(500).send({
        error: 'Server Error',
        message: 'Erreur lors de la restauration de la sauvegarde',
        details: result.error
      });
    }
    
    return reply.send({
      message: 'Sauvegarde restaurée avec succès',
      backup: {
        filename: result.filename,
        restoredAt: result.timestamp
      }
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      error: 'Server Error',
      message: error.message
    });
  }
};

// @desc    Supprimer une sauvegarde
// @route   DELETE /api/backups/:filename
// @access  Private (Admin uniquement)
exports.deleteBackup = async (request, reply) => {
  try {
    // La vérification d'admin est maintenant faite par le middleware
    const { filename } = request.params;
    const result = await backupManager.deleteBackup(filename);
    
    if (!result.success) {
      return reply.code(500).send({
        error: 'Server Error',
        message: 'Erreur lors de la suppression de la sauvegarde',
        details: result.error
      });
    }
    
    return reply.send({
      message: 'Sauvegarde supprimée avec succès',
      filename: result.filename
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      error: 'Server Error',
      message: error.message
    });
  }
};