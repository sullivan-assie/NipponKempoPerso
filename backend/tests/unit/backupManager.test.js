const path = require('path');
const fs = require('fs');
const backupManager = require('../../utils/backupManager');
const { exec } = require('child_process');

// Mock pour child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock pour fs.statSync
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    statSync: jest.fn(),
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
    unlinkSync: jest.fn(),
  };
});

describe('Tests unitaires du gestionnaire de sauvegardes', () => {
  
  const mockBackupPath = path.join(__dirname, '../../backups/backup-test.archive');
  
  beforeEach(() => {
    // Réinitialisation des mocks avant chaque test
    jest.clearAllMocks();
    
    // Mock par défaut pour existsSync
    fs.existsSync.mockReturnValue(true);
    
    // Mock par défaut pour statSync
    fs.statSync.mockReturnValue({
      size: 1024 * 1024, // 1 MB
      birthtime: new Date(),
      mtime: new Date()
    });
    
    // Mock pour exec
    exec.mockImplementation((command, callback) => {
      if (callback) {
        callback(null, { stdout: 'Success', stderr: '' });
      }
      return {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() }
      };
    });
  });
  
  describe('listBackups', () => {
    it('doit lister les fichiers de sauvegarde avec les bonnes métadonnées', async () => {
      // Configuration du mock pour readdirSync
      fs.readdirSync.mockReturnValue(['backup-2023-01-01.archive', 'backup-2023-01-02.archive', 'not-a-backup.txt']);
      
      const result = await backupManager.listBackups();
      
      expect(fs.readdirSync).toHaveBeenCalled();
      expect(result).toHaveLength(2); // Doit filtrer les fichiers qui ne sont pas des sauvegardes
      expect(result[0]).toHaveProperty('filename');
      expect(result[0]).toHaveProperty('size');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('path');
    });
    
    it('doit retourner un tableau vide en cas d\'erreur', async () => {
      // Simuler une erreur
      fs.readdirSync.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = await backupManager.listBackups();
      
      expect(result).toEqual([]);
    });
  });
  
  describe('deleteBackup', () => {
    it('doit supprimer un fichier de sauvegarde existant', async () => {
      const filename = 'backup-to-delete.archive';
      
      const result = await backupManager.deleteBackup(filename);
      
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(fs.existsSync).toHaveBeenCalled();
      expect(result.success).toBeTruthy();
      expect(result.filename).toBe(filename);
    });
    
    it('doit retourner une erreur si le fichier n\'existe pas', async () => {
      // Simuler un fichier qui n'existe pas
      fs.existsSync.mockReturnValue(false);
      
      const filename = 'non-existent-backup.archive';
      
      await expect(backupManager.deleteBackup(filename)).rejects.toThrow();
    });
  });
  
  describe('createBackup', () => {
    it('doit créer une sauvegarde avec succès', async () => {
      // Mock pour util.promisify(exec)
      const util = require('util');
      util.promisify = jest.fn().mockReturnValue(() => Promise.resolve({ stdout: '', stderr: '' }));
      
      const result = await backupManager.createBackup();
      
      expect(result.success).toBeTruthy();
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('sizeInMB');
    });
  });
});