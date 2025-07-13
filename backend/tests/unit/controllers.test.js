// Tests unitaires simples pour les contrôleurs
describe('Tests unitaires des contrôleurs', () => {
  describe('Auth Controller', () => {
    it('doit exporter le contrôleur d\'authentification', () => {
      const authController = require('../../controllers/authController');
      expect(authController).toBeDefined();
      expect(typeof authController).toBe('object');
      expect(typeof authController.login).toBe('function');
      expect(typeof authController.register).toBe('function');
      expect(typeof authController.getMe).toBe('function');
      expect(typeof authController.logout).toBe('function');
      expect(typeof authController.forgotPassword).toBe('function');
      expect(typeof authController.resetPassword).toBe('function');
    });
  });

  describe('User Controller', () => {
    it('doit exporter le contrôleur des utilisateurs', () => {
      const userController = require('../../controllers/userController');
      expect(userController).toBeDefined();
      expect(typeof userController).toBe('object');
    });
  });

  describe('Club Controller', () => {
    it('doit exporter le contrôleur des clubs', () => {
      const clubController = require('../../controllers/clubController');
      expect(clubController).toBeDefined();
      expect(typeof clubController).toBe('object');
    });
  });

  describe('Tournament Controller', () => {
    it('doit exporter le contrôleur des tournois', () => {
      const tournamentController = require('../../controllers/tournamentController');
      expect(tournamentController).toBeDefined();
      expect(typeof tournamentController).toBe('object');
    });
  });

  describe('Competitor Controller', () => {
    it('doit exporter le contrôleur des compétiteurs', () => {
      const competitorController = require('../../controllers/competitorController');
      expect(competitorController).toBeDefined();
      expect(typeof competitorController).toBe('object');
    });
  });

  describe('Match Controller', () => {
    it('doit exporter le contrôleur des matchs', () => {
      const matchController = require('../../controllers/matchController');
      expect(matchController).toBeDefined();
      expect(typeof matchController).toBe('object');
    });
  });

  describe('Poule Controller', () => {
    it('doit exporter le contrôleur des poules', () => {
      const pouleController = require('../../controllers/pouleController');
      expect(pouleController).toBeDefined();
      expect(typeof pouleController).toBe('object');
    });
  });

  describe('Backup Controller', () => {
    it('doit exporter le contrôleur des sauvegardes', () => {
      const backupController = require('../../controllers/backupController');
      expect(backupController).toBeDefined();
      expect(typeof backupController).toBe('object');
    });
  });
});