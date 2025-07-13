// Tests unitaires simples pour les routes
describe('Tests unitaires des routes', () => {
  describe('Routes d\'authentification', () => {
    it('doit exporter une fonction pour les routes auth', () => {
      const authRoutes = require('../../routes/auth');
      expect(authRoutes).toBeDefined();
      expect(typeof authRoutes).toBe('function');
    });
  });

  describe('Routes des utilisateurs', () => {
    it('doit exporter une fonction pour les routes users', () => {
      const userRoutes = require('../../routes/users');
      expect(userRoutes).toBeDefined();
      expect(typeof userRoutes).toBe('function');
    });
  });

  describe('Routes des clubs', () => {
    it('doit exporter une fonction pour les routes clubs', () => {
      const clubRoutes = require('../../routes/clubs');
      expect(clubRoutes).toBeDefined();
      expect(typeof clubRoutes).toBe('function');
    });
  });

  describe('Routes des tournois', () => {
    it('doit exporter une fonction pour les routes tournaments', () => {
      const tournamentRoutes = require('../../routes/tournaments');
      expect(tournamentRoutes).toBeDefined();
      expect(typeof tournamentRoutes).toBe('function');
    });
  });

  describe('Routes des compétiteurs', () => {
    it('doit exporter une fonction pour les routes competitors', () => {
      const competitorRoutes = require('../../routes/competitors');
      expect(competitorRoutes).toBeDefined();
      expect(typeof competitorRoutes).toBe('function');
    });
  });

  describe('Routes des équipes', () => {
    it('doit exporter une fonction pour les routes teams', () => {
      const teamRoutes = require('../../routes/teams');
      expect(teamRoutes).toBeDefined();
      expect(typeof teamRoutes).toBe('function');
    });
  });

  describe('Routes des poules', () => {
    it('doit exporter une fonction pour les routes poules', () => {
      const pouleRoutes = require('../../routes/poules');
      expect(pouleRoutes).toBeDefined();
      expect(typeof pouleRoutes).toBe('function');
    });
  });

  describe('Routes des catégories', () => {
    it('doit exporter une fonction pour les routes categories', () => {
      const categoryRoutes = require('../../routes/categories');
      expect(categoryRoutes).toBeDefined();
      expect(typeof categoryRoutes).toBe('function');
    });
  });

  describe('Routes des sauvegardes', () => {
    it('doit exporter une fonction pour les routes backups', () => {
      const backupRoutes = require('../../routes/backups');
      expect(backupRoutes).toBeDefined();
      expect(typeof backupRoutes).toBe('function');
    });
  });

  describe('Routes principales', () => {
    it('doit exporter une fonction pour les routes index', () => {
      const indexRoutes = require('../../routes/index');
      expect(indexRoutes).toBeDefined();
      expect(typeof indexRoutes).toBe('function');
    });
  });
});