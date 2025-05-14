const { buildFastify, connectToTestDatabase, clearDatabase, closeDatabase } = require('../setup');
const supertest = require('supertest');
const fs = require('fs');
const path = require('path');
const User = require('../../models/User');
const mongoose = require('mongoose');

describe('Tests API des sauvegardes', () => {
  let app;
  let fastify;
  let adminToken;
  let userToken;
  let testBackupFile;

  // Avant tous les tests
  beforeAll(async () => {
    // Connexion à la base de données de test
    await connectToTestDatabase();
    // Construction de l'app Fastify pour les tests
    fastify = await buildFastify();
    await fastify.ready();
    app = supertest(fastify.server);

    // Création du répertoire de sauvegarde pour les tests si nécessaire
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Création d'un fichier de sauvegarde factice pour les tests
    testBackupFile = `backup-test-${Date.now()}.archive`;
    const testBackupPath = path.join(backupDir, testBackupFile);
    fs.writeFileSync(testBackupPath, 'Test backup content');
  });

  // Avant chaque test
  beforeEach(async () => {
    // Création d'un utilisateur admin pour les tests
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: '$2a$10$XJrSPDIdl3.3aOGmOvTPk.Qba63MC5CJqnPtc3/n6quCkFYjN9DVD', // "adminpassword"
      role: 'admin',
      status: true,
      RGPDConsent: true
    });
    await adminUser.save();

    // Création d'un utilisateur standard pour les tests
    const regularUser = new User({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@test.com',
      password: '$2a$10$XJrSPDIdl3.3aOGmOvTPk.Qba63MC5CJqnPtc3/n6quCkFYjN9DVD', // même mot de passe
      role: 'user',
      status: true,
      RGPDConsent: true
    });
    await regularUser.save();

    // Génération des tokens
    adminToken = fastify.jwt.sign({ 
      id: adminUser._id,
      email: adminUser.email,
      role: 'admin'
    });

    userToken = fastify.jwt.sign({ 
      id: regularUser._id,
      email: regularUser.email,
      role: 'user'
    });
  });

  // Après chaque test
  afterEach(async () => {
    // Nettoyage de la base de données
    await clearDatabase();
  });

  // Après tous les tests
  afterAll(async () => {
    // Suppression du fichier de sauvegarde de test
    const testBackupPath = path.join(__dirname, '../../backups', testBackupFile);
    if (fs.existsSync(testBackupPath)) {
      fs.unlinkSync(testBackupPath);
    }

    // Fermeture de la connexion à la base de données
    await closeDatabase();
    // Fermeture de l'application Fastify
    await fastify.close();
  });

  // Test d'accès à la liste des sauvegardes
  describe('GET /api/backups', () => {
    it('doit autoriser l\'accès à un administrateur', async () => {
      const response = await app
        .get('/api/backups')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('backups');
      expect(Array.isArray(response.body.backups)).toBeTruthy();
    });

    it('doit refuser l\'accès à un utilisateur non-admin', async () => {
      await app
        .get('/api/backups')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('doit refuser l\'accès sans authentification', async () => {
      await app
        .get('/api/backups')
        .expect(401);
    });
  });

  // Test de téléchargement d'une sauvegarde
  describe('GET /api/backups/:filename/download', () => {
    it('doit permettre à un administrateur de télécharger une sauvegarde', async () => {
      const response = await app
        .get(`/api/backups/${testBackupFile}/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toBe('Test backup content');
    });

    it('doit refuser le téléchargement à un utilisateur non-admin', async () => {
      await app
        .get(`/api/backups/${testBackupFile}/download`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  // Test de création de sauvegarde
  describe('POST /api/backups', () => {
    it('doit autoriser un administrateur à créer une sauvegarde', async () => {
      // Note: ce test peut être difficile à réaliser complètement car il dépend de mongodump
      // Nous testons ici uniquement l'accès à la route
      const response = await app
        .post('/api/backups')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('succès');
    }, 30000); // Timeout plus long pour cette opération

    it('doit refuser la création de sauvegarde à un utilisateur non-admin', async () => {
      await app
        .post('/api/backups')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  // Test de suppression de sauvegarde
  describe('DELETE /api/backups/:filename', () => {
    it('doit autoriser un administrateur à supprimer une sauvegarde', async () => {
      // Création d'un fichier temporaire pour le test de suppression
      const tempBackupFile = `backup-temp-${Date.now()}.archive`;
      const tempBackupPath = path.join(__dirname, '../../backups', tempBackupFile);
      fs.writeFileSync(tempBackupPath, 'Temporary backup content');

      const response = await app
        .delete(`/api/backups/${tempBackupFile}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('succès');
      expect(fs.existsSync(tempBackupPath)).toBeFalsy();
    });

    it('doit refuser la suppression à un utilisateur non-admin', async () => {
      await app
        .delete(`/api/backups/${testBackupFile}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});