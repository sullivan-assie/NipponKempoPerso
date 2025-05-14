// frontend/kempo_cesi-dev/src/services/syncService.js
import { api } from 'boot/axios';
import { db } from 'src/database/db';
import { useQuasar } from 'quasar';
import { ref } from 'vue';

// État de la synchronisation
const isSyncing = ref(false);
const lastSyncDate = ref(localStorage.getItem('lastSyncDate') || null);
const syncError = ref(null);

/**
 * Service de synchronisation entre DexieJS (local) et MongoDB (serveur)
 */
export const useSyncService = () => {
  const $q = useQuasar();

  /**
   * Vérifie si la connexion au serveur est disponible
   * @returns {Promise<boolean>} - True si la connexion est disponible
   */
  const checkServerConnection = async () => {
    try {
      const response = await api.get('/ping');
      return response.status === 200;
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion au serveur:', error);
      return false;
    }
  };

  /**
   * Synchronise une table spécifique entre DexieJS et MongoDB
   * @param {string} tableName - Le nom de la table à synchroniser
   * @returns {Promise<Object>} - Résultat de la synchronisation
   */
  const syncTable = async (tableName) => {
    try {
      // Récupérer toutes les données de la table locale
      const localData = await db[tableName].toArray();
      
      // Vérifier s'il y a des données à synchroniser
      if (localData.length === 0) {
        return { status: 'success', message: `Aucune donnée à synchroniser pour ${tableName}`, created: 0, updated: 0 };
      }
      
      // Envoyer les données au serveur
      const response = await api.post(`/${tableName}/sync`, {
        data: localData,
        lastSyncDate: lastSyncDate.value
      });
      
      // Mettre à jour les données locales avec les données du serveur
      if (response.data && response.data.updatedItems) {
        await updateLocalData(tableName, response.data.updatedItems);
      }
      
      return {
        status: 'success',
        message: `Synchronisation réussie pour ${tableName}`,
        created: response.data?.result?.created || 0,
        updated: response.data?.result?.updated || 0
      };
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      return {
        status: 'error',
        message: `Erreur lors de la synchronisation de ${tableName}: ${error.message}`,
        error
      };
    }
  };

  /**
   * Met à jour les données locales avec les données du serveur
   * @param {string} tableName - Le nom de la table à mettre à jour
   * @param {Array} serverData - Les données du serveur
   */
  const updateLocalData = async (tableName, serverData) => {
    try {
      // Pour chaque élément des données du serveur
      for (const item of serverData) {
        // Convertir l'ID MongoDB en format compatible avec DexieJS
        const localItem = { ...item };
        
        // Si l'élément a un ID MongoDB (_id), l'utiliser comme ID local (id)
        if (localItem._id) {
          localItem.id = localItem._id;
          delete localItem._id;
        }
        
        // Vérifier si l'élément existe déjà en local
        const existingItem = await db[tableName].get(localItem.id);
        
        if (existingItem) {
          // Mettre à jour l'élément local
          await db[tableName].update(localItem.id, localItem);
        } else {
          // Créer un nouvel élément local
          await db[tableName].add(localItem);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des données locales pour ${tableName}:`, error);
      throw error;
    }
  };

  /**
   * Synchronise toutes les tables entre DexieJS et MongoDB
   * @param {boolean} showNotification - Afficher une notification après la synchronisation
   * @returns {Promise<Object>} - Résultat de la synchronisation
   */
  const syncAllTables = async (showNotification = true) => {
    try {
      // Vérifier la connexion au serveur
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        syncError.value = 'Connexion au serveur impossible';
        if (showNotification) {
          $q.notify({
            color: 'negative',
            message: 'Synchronisation impossible - Pas de connexion au serveur',
            icon: 'mdi-cloud-off-outline'
          });
        }
        return { status: 'error', message: 'Connexion au serveur impossible' };
      }
      
      isSyncing.value = true;
      syncError.value = null;
      
      // Synchroniser chaque table
      const results = {};
      
      // La liste des tables à synchroniser
      const tables = ['categories', 'competitors', 'teams', 'tournaments', 'poules'];
      
      for (const table of tables) {
        results[table] = await syncTable(table);
      }
      
      // Mettre à jour la date de dernière synchronisation
      lastSyncDate.value = new Date().toISOString();
      localStorage.setItem('lastSyncDate', lastSyncDate.value);
      
      if (showNotification) {
        $q.notify({
          color: 'positive',
          message: 'Synchronisation réussie',
          icon: 'mdi-check-circle'
        });
      }
      
      return { status: 'success', message: 'Synchronisation réussie', results };
    } catch (error) {
      syncError.value = error.message;
      
      if (showNotification) {
        $q.notify({
          color: 'negative',
          message: `Erreur lors de la synchronisation: ${error.message}`,
          icon: 'mdi-alert-circle'
        });
      }
      
      return { status: 'error', message: error.message, error };
    } finally {
      isSyncing.value = false;
    }
  };

  return {
    // États
    isSyncing,
    lastSyncDate,
    syncError,
    
    // Méthodes
    checkServerConnection,
    syncTable,
    syncAllTables
  };
};