// backend/utils/syncManager.js
/**
 * Gestionnaire de synchronisation entre MongoDB et DexieJS
 * Permet la synchronisation des données entre la base de données locale (mode hors ligne)
 * et la base de données MongoDB lorsque la connexion est disponible.
 */

class SyncManager {
  /**
   * Synchronise les données reçues du client avec MongoDB
   * @param {Object} data - Les données à synchroniser
   * @param {String} modelName - Le nom du modèle (collection) à synchroniser
   * @param {Object} Model - Le modèle Mongoose associé
   * @returns {Object} - Résultat de la synchronisation
   */
  static async syncData(data, modelName, Model) {
    try {
      const result = {
        created: 0,
        updated: 0,
        errors: [],
        items: []
      };

      // S'assurer que data est bien un tableau
      const items = Array.isArray(data) ? data : [data];

      // Traiter chaque élément
      for (const item of items) {
        try {
          // Vérifier si l'élément existe déjà (par ID)
          const existingItem = item._id 
            ? await Model.findById(item._id)
            : await Model.findOne({ id: item.id }); // Peut utiliser l'id de DexieJS comme fallback

          if (existingItem) {
            // Mettre à jour l'élément existant
            // On évite d'écraser l'_id MongoDB
            const { _id, ...updateData } = item;
            
            // S'assurer que les dates sont mises à jour
            updateData.updatedAt = new Date();
            
            // Mise à jour de l'élément
            await Model.findByIdAndUpdate(existingItem._id, updateData, { new: true });
            
            result.updated++;
            result.items.push(existingItem._id);
          } else {
            // Créer un nouvel élément
            // S'assurer que les dates sont correctes
            item.createdAt = item.createdAt || new Date();
            item.updatedAt = new Date();
            
            // Création de l'élément
            const newItem = new Model(item);
            await newItem.save();
            
            result.created++;
            result.items.push(newItem._id);
          }
        } catch (itemError) {
          result.errors.push({
            item: item.id || item._id,
            error: itemError.message
          });
        }
      }

      return result;
    } catch (error) {
      return {
        created: 0,
        updated: 0,
        errors: [{ error: error.message }],
        items: []
      };
    }
  }

  /**
   * Récupère les éléments mis à jour après une date spécifique
   * @param {Model} Model - Le modèle Mongoose à interroger
   * @param {Date} lastSyncDate - Date de la dernière synchronisation
   * @returns {Array} - Les éléments mis à jour depuis la dernière synchronisation
   */
  static async getUpdatedItems(Model, lastSyncDate) {
    try {
      if (!lastSyncDate) {
        // Si pas de date fournie, retourner tous les éléments
        return await Model.find();
      }

      // Convertir la chaîne en date si nécessaire
      const syncDate = typeof lastSyncDate === 'string' 
        ? new Date(lastSyncDate) 
        : lastSyncDate;

      // Retourner les éléments mis à jour après la date fournie
      return await Model.find({
        updatedAt: { $gt: syncDate }
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des données mises à jour: ${error.message}`);
    }
  }
}

module.exports = SyncManager;