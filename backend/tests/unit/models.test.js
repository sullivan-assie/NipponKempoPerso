// Tests unitaires simples pour les modèles
describe('Tests unitaires des modèles', () => {
  describe('Modèle Category', () => {
    it('doit exporter le modèle Category', () => {
      const Category = require('../../models/Category');
      expect(Category).toBeDefined();
      expect(typeof Category).toBe('function');
    });
  });

  describe('Modèle Club', () => {
    it('doit exporter le modèle Club', () => {
      const Club = require('../../models/Club');
      expect(Club).toBeDefined();
      expect(typeof Club).toBe('function');
    });
  });

  describe('Modèle Competitor', () => {
    it('doit exporter le modèle Competitor', () => {
      const Competitor = require('../../models/Competitor');
      expect(Competitor).toBeDefined();
      expect(typeof Competitor).toBe('function');
    });
  });

  describe('Modèle User', () => {
    it('doit exporter le modèle User', () => {
      const User = require('../../models/User');
      expect(User).toBeDefined();
      expect(typeof User).toBe('function');
    });
  });

  describe('Modèle Tournament', () => {
    it('doit exporter le modèle Tournament', () => {
      const Tournament = require('../../models/Tournament');
      expect(Tournament).toBeDefined();
      expect(typeof Tournament).toBe('function');
    });
  });

  describe('Modèle Team', () => {
    it('doit exporter le modèle Team', () => {
      const Team = require('../../models/Team');
      expect(Team).toBeDefined();
      expect(typeof Team).toBe('function');
    });
  });

  describe('Modèle Match', () => {
    it('doit exporter le modèle Match', () => {
      const Match = require('../../models/Match');
      expect(Match).toBeDefined();
      expect(typeof Match).toBe('function');
    });
  });

  describe('Modèle Poule', () => {
    it('doit exporter le modèle Poule', () => {
      const Poule = require('../../models/Poule');
      expect(Poule).toBeDefined();
      expect(typeof Poule).toBe('function');
    });
  });

  describe('Modèle Log', () => {
    it('doit exporter le modèle Log', () => {
      const Log = require('../../models/Log');
      expect(Log).toBeDefined();
      expect(typeof Log).toBe('function');
    });
  });
});