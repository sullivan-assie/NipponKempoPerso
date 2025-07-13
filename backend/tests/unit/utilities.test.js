// Tests unitaires simples pour les utilitaires
const path = require('path');

describe('Tests unitaires des utilitaires', () => {
  describe('Path utilities', () => {
    it('doit pouvoir créer des chemins avec path.join', () => {
      const result = path.join('/backend', 'utils', 'test.js');
      expect(result).toContain('backend');
      expect(result).toContain('utils');
      expect(result).toContain('test.js');
    });

    it('doit pouvoir résoudre des chemins avec path.resolve', () => {
      const result = path.resolve('.');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Date utilities', () => {
    it('doit créer une nouvelle date', () => {
      const now = new Date();
      expect(now).toBeInstanceOf(Date);
      expect(now.getTime()).toBeGreaterThan(0);
    });

    it('doit formater une date en ISO string', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      expect(date.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('JSON utilities', () => {
    it('doit sérialiser et désérialiser un objet', () => {
      const obj = { name: 'test', value: 123 };
      const json = JSON.stringify(obj);
      const parsed = JSON.parse(json);
      
      expect(parsed).toEqual(obj);
      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(123);
    });
  });

  describe('String utilities', () => {
    it('doit manipuler les chaînes de caractères', () => {
      const str = 'Hello World';
      expect(str.toLowerCase()).toBe('hello world');
      expect(str.toUpperCase()).toBe('HELLO WORLD');
      expect(str.includes('World')).toBe(true);
    });
  });

  describe('Array utilities', () => {
    it('doit manipuler les tableaux', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.length).toBe(5);
      expect(arr.includes(3)).toBe(true);
      expect(arr.find(x => x > 3)).toBe(4);
      expect(arr.filter(x => x > 3)).toEqual([4, 5]);
    });
  });

  describe('Error handling', () => {
    it('doit créer et gérer les erreurs', () => {
      const error = new Error('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      
      try {
        throw error;
      } catch (e) {
        expect(e.message).toBe('Test error');
      }
    });
  });

  describe('Promise utilities', () => {
    it('doit gérer les promesses résolues', async () => {
      const promise = Promise.resolve('success');
      const result = await promise;
      expect(result).toBe('success');
    });

    it('doit gérer les promesses rejetées', async () => {
      const promise = Promise.reject(new Error('failed'));
      
      try {
        await promise;
        fail('Promise should have been rejected');
      } catch (error) {
        expect(error.message).toBe('failed');
      }
    });
  });
});