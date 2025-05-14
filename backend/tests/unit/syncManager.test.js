const SyncManager = require('../../utils/syncManager');
const mongoose = require('mongoose');

// Créer un modèle de test Mongoose pour nos tests
const TestSchema = new mongoose.Schema({
  name: String,
  description: String,
  status: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Mock du modèle Mongoose
const mockModel = {
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
  prototype: {
    save: jest.fn()
  }
};

// Mock du constructeur pour que nous puissions instancier de nouveaux objets
function MockModel(data) {
  this._id = data._id || new mongoose.Types.ObjectId();
  Object.assign(this, data);
  this.save = mockModel.prototype.save;
  return this;
}

MockModel.findById = mockModel.findById;
MockModel.findOne = mockModel.findOne;
MockModel.findByIdAndUpdate = mockModel.findByIdAndUpdate;
MockModel.find = mockModel.find;

describe('Tests unitaires du SyncManager', () => {
  beforeEach(() => {
    // Réinitialiser tous les mocks avant chaque test
    jest.clearAllMocks();
  });

  describe('syncData', () => {
    it('doit créer un nouvel élément si celui-ci n\'existe pas', async () => {
      // Configuration des mocks
      const mockItemData = {
        name: 'Test Item',
        description: 'Description de test',
        status: true
      };

      // Configurer le mock pour retourner null (l'item n'existe pas)
      mockModel.findById.mockResolvedValue(null);
      mockModel.findOne.mockResolvedValue(null);
      
      // Configurer le mock de save pour simuler une sauvegarde réussie
      mockModel.prototype.save.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        ...mockItemData
      });

      // Exécuter la méthode syncData
      const result = await SyncManager.syncData(mockItemData, 'test', MockModel);

      // Vérifier les résultats
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.items).toHaveLength(1);
      
      // Vérifier que save a été appelé
      expect(mockModel.prototype.save).toHaveBeenCalled();
    });

    it('doit mettre à jour un élément existant', async () => {
      // Créer un ID pour notre objet existant
      const existingId = new mongoose.Types.ObjectId();
      
      // Configuration des mocks
      const mockItemData = {
        _id: existingId,
        name: 'Test Item Updated',
        description: 'Description mise à jour',
        status: false
      };

      // Configurer le mock pour retourner un élément existant
      mockModel.findById.mockResolvedValue({ 
        _id: existingId,
        name: 'Original Name',
        description: 'Original Description',
        save: mockModel.prototype.save
      });
      
      // Configurer le mock de findByIdAndUpdate
      mockModel.findByIdAndUpdate.mockResolvedValue({
        _id: existingId,
        ...mockItemData
      });

      // Exécuter la méthode syncData
      const result = await SyncManager.syncData(mockItemData, 'test', MockModel);

      // Vérifier les résultats
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.items).toHaveLength(1);
      
      // Vérifier que findByIdAndUpdate a été appelé avec les bons paramètres
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        existingId,
        expect.objectContaining({
          name: mockItemData.name,
          description: mockItemData.description,
          status: mockItemData.status,
          updatedAt: expect.any(Date)
        }),
        { new: true }
      );
    });

    it('doit gérer les erreurs lors de la synchronisation', async () => {
      // Configurer le mock pour simuler une erreur
      mockModel.findById.mockRejectedValue(new Error('Test error'));
      
      const mockItemData = {
        name: 'Test Error Item',
        description: 'Description erreur'
      };

      // Exécuter la méthode syncData
      const result = await SyncManager.syncData(mockItemData, 'test', MockModel);

      // Vérifier les résultats
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.items).toHaveLength(0);
    });

    it('doit traiter correctement un tableau d\'éléments', async () => {
      // Configuration des mocks pour plusieurs éléments
      const mockItems = [
        { name: 'Item 1', status: true },
        { name: 'Item 2', status: false }
      ];

      // Simuler que tous les éléments sont nouveaux
      mockModel.findById.mockResolvedValue(null);
      mockModel.findOne.mockResolvedValue(null);
      mockModel.prototype.save.mockImplementation(function() {
        return Promise.resolve(this);
      });

      // Exécuter la méthode syncData avec un tableau
      const result = await SyncManager.syncData(mockItems, 'test', MockModel);

      // Vérifier les résultats
      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.items).toHaveLength(2);
      
      // Vérifier que save a été appelé deux fois
      expect(mockModel.prototype.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUpdatedItems', () => {
    it('doit retourner tous les éléments si aucune date n\'est fournie', async () => {
      const mockItems = [
        { _id: new mongoose.Types.ObjectId(), name: 'Item 1' },
        { _id: new mongoose.Types.ObjectId(), name: 'Item 2' }
      ];
      
      // Configurer le mock pour retourner tous les éléments
      mockModel.find.mockResolvedValue(mockItems);

      // Exécuter la méthode getUpdatedItems sans date
      const result = await SyncManager.getUpdatedItems(MockModel, null);

      // Vérifier les résultats
      expect(result).toEqual(mockItems);
      expect(mockModel.find).toHaveBeenCalledWith();
    });

    it('doit filtrer les éléments mis à jour après la date fournie', async () => {
      const mockItems = [
        { _id: new mongoose.Types.ObjectId(), name: 'Updated Item' }
      ];
      
      const testDate = new Date('2025-01-01');
      
      // Configurer le mock pour retourner les éléments filtrés
      mockModel.find.mockResolvedValue(mockItems);

      // Exécuter la méthode getUpdatedItems avec une date
      const result = await SyncManager.getUpdatedItems(MockModel, testDate);

      // Vérifier les résultats
      expect(result).toEqual(mockItems);
      expect(mockModel.find).toHaveBeenCalledWith({
        updatedAt: { $gt: testDate }
      });
    });

    it('doit convertir une chaîne de date en objet Date', async () => {
      const mockItems = [
        { _id: new mongoose.Types.ObjectId(), name: 'Updated Item' }
      ];
      
      const testDateString = '2025-01-01T00:00:00.000Z';
      const testDate = new Date(testDateString);
      
      // Configurer le mock pour retourner les éléments filtrés
      mockModel.find.mockResolvedValue(mockItems);

      // Exécuter la méthode getUpdatedItems avec une chaîne de date
      const result = await SyncManager.getUpdatedItems(MockModel, testDateString);

      // Vérifier les résultats
      expect(result).toEqual(mockItems);
      expect(mockModel.find).toHaveBeenCalledWith({
        updatedAt: { $gt: expect.any(Date) }
      });
    });

    it('doit gérer les erreurs lors de la récupération des éléments', async () => {
      // Configurer le mock pour simuler une erreur
      const errorMessage = 'Erreur de test pour getUpdatedItems';
      mockModel.find.mockRejectedValue(new Error(errorMessage));

      // Exécuter la méthode getUpdatedItems et vérifier qu'elle lance une erreur
      await expect(SyncManager.getUpdatedItems(MockModel, new Date()))
        .rejects
        .toThrow(`Erreur lors de la récupération des données mises à jour: ${errorMessage}`);
    });
  });
});