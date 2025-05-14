const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration des chemins et options
const BACKUP_DIR = path.join(__dirname, '../backups');
const DB_URI = process.env.MONGODB_URI || 'mongodb://nippon_app:nippon_password@mongodb:27017/nippon-kempo';
const DB_NAME = process.env.DB_NAME || 'nippon-kempo';

// S'assurer que le répertoire de sauvegarde existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Crée une sauvegarde complète de la base de données
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
exports.createBackup = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.archive`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    console.log(`Démarrage de la sauvegarde: ${backupFilename}`);

    // Extraction des paramètres de connexion depuis l'URI MongoDB
    const uriRegex = /mongodb:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const matches = DB_URI.match(uriRegex);

    let command;
    
    if (matches) {
      const [, username, password, host, port, dbName] = matches;
      // Utilisation de la base de données spécifiée comme authenticationDatabase
      command = `mongodump --host=${host} --port=${port} --username=${username} --password=${password} --authenticationDatabase=${dbName} --db=${dbName} --archive=${backupPath} --gzip`;
    } else {
      // Fallback si l'URI ne correspond pas au format attendu
      command = `mongodump --uri="${DB_URI}" --archive=${backupPath} --gzip`;
    }

    const { stdout, stderr } = await execPromise(command);

    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`Sauvegarde terminée: ${backupFilename} (${fileSizeInMB} MB)`);
    
    return {
      success: true,
      filename: backupFilename,
      path: backupPath,
      sizeInMB: fileSizeInMB,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Restaure une sauvegarde à partir d'un fichier
 * @param {string} backupFilename - Nom du fichier de sauvegarde à restaurer
 * @returns {Promise<Object>} Résultat de la restauration
 */
exports.restoreBackup = async (backupFilename) => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Fichier de sauvegarde non trouvé: ${backupFilename}`);
    }
    
    console.log(`Démarrage de la restauration depuis: ${backupFilename}`);
    
    const uriRegex = /mongodb:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/;
    const matches = DB_URI.match(uriRegex);

    let command;
    
    if (matches) {
      const [, username, password, host, port, dbName] = matches;
      command = `mongorestore --host=${host} --port=${port} --username=${username} --password=${password} --authenticationDatabase=admin --nsInclude=${dbName}.* --archive=${backupPath} --gzip --drop`;
    } else {
      command = `mongorestore --uri="${DB_URI}" --archive=${backupPath} --gzip --drop`;
    }
    
    const { stdout, stderr } = await execPromise(command);
    
    console.log(`Restauration terminée depuis: ${backupFilename}`);
    
    return {
      success: true,
      filename: backupFilename,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur lors de la restauration:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Liste toutes les sauvegardes disponibles
 * @returns {Promise<Array>} Liste des sauvegardes
 */
exports.listBackups = async () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(file => file.startsWith('backup-') && file.endsWith('.archive'));
    
    const backups = files.map(file => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      // Utiliser les statistiques du fichier pour obtenir la date de création
      const creationTime = stats.birthtime || stats.mtime;
      
      return {
        filename: file,
        size: fileSizeInMB + ' MB',
        createdAt: creationTime.toISOString(),
        path: path.join(BACKUP_DIR, file)
      };
    });
    
    // Trier par date de création (du plus récent au plus ancien)
    return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Erreur lors de la récupération des sauvegardes:', error);
    return [];
  }
};

/**
 * Supprime une sauvegarde
 * @param {string} backupFilename - Nom du fichier de sauvegarde à supprimer
 * @returns {Promise<Object>} Résultat de la suppression
 */
exports.deleteBackup = async (backupFilename) => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Fichier de sauvegarde non trouvé: ${backupFilename}`);
    }
    
    fs.unlinkSync(backupPath);
    
    return {
      success: true,
      filename: backupFilename,
      message: `Sauvegarde ${backupFilename} supprimée avec succès`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur lors de la suppression de la sauvegarde:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};