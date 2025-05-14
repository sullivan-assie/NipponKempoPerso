<template>
  <div class="sync-status q-pa-sm">
    <q-card flat bordered class="q-pa-md">
      <q-card-section class="q-pt-none">
        <div class="row items-center q-mb-md">
          <div class="col">
            <div class="text-h6">Synchronisation des données</div>
            <div class="text-caption" v-if="lastSyncDate">
              Dernière synchronisation : {{ formatDate(lastSyncDate) }}
            </div>
            <div class="text-caption" v-else>
              Aucune synchronisation effectuée
            </div>
          </div>
          <div>
            <q-btn
              :loading="isSyncing"
              :color="syncError ? 'negative' : 'primary'"
              :icon="syncError ? 'mdi-sync-alert' : 'mdi-sync'"
              rounded
              @click="syncAllTables"
            >
              <span v-if="!isSyncing">Synchroniser</span>
              <template v-slot:loading>
                <q-spinner-dots />
                Synchronisation...
              </template>
            </q-btn>
          </div>
        </div>

        <q-banner v-if="syncError" class="bg-negative text-white">
          <template v-slot:avatar>
            <q-icon name="mdi-alert" />
          </template>
          {{ syncError }}
        </q-banner>

        <div v-if="syncResults" class="q-mt-md">
          <q-banner dense class="bg-positive text-white" v-if="syncResults.status === 'success'">
            <template v-slot:avatar>
              <q-icon name="mdi-check-circle" />
            </template>
            {{ syncResults.message }}
          </q-banner>

          <q-list dense bordered separator class="q-mt-sm">
            <q-item v-for="(result, table) in syncResults.results" :key="table">
              <q-item-section avatar>
                <q-icon :name="result.status === 'success' ? 'mdi-check' : 'mdi-alert'" 
                       :color="result.status === 'success' ? 'positive' : 'negative'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ table }}</q-item-label>
                <q-item-label caption>{{ result.message }}</q-item-label>
              </q-item-section>
              <q-item-section side v-if="result.status === 'success'">
                <q-chip dense color="green" text-color="white" size="sm">
                  +{{ result.created }} créés
                </q-chip>
                <q-chip dense color="blue" text-color="white" size="sm">
                  {{ result.updated }} mis à jour
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useSyncService } from 'src/services/syncService';
import { date } from 'quasar';

export default {
  name: 'SyncStatus',
  
  setup() {
    const { isSyncing, lastSyncDate, syncError, syncAllTables } = useSyncService();
    const syncResults = ref(null);
    
    // Formater la date pour l'affichage
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const dt = new Date(dateString);
      return date.formatDate(dt, 'DD/MM/YYYY HH:mm:ss');
    };
    
    // Fonction de synchronisation avec mise à jour des résultats
    const syncData = async () => {
      syncResults.value = await syncAllTables();
    };
    
    // Vérifier si nous avons besoin de synchroniser au démarrage
    onMounted(() => {
      // Si la dernière synchronisation est trop ancienne (plus d'une heure),
      // proposer une synchronisation automatique
      if (lastSyncDate.value) {
        const lastSync = new Date(lastSyncDate.value);
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        
        if (lastSync < oneHourAgo) {
          // Option pour synchroniser automatiquement plus tard
          // syncData();
        }
      }
    });
    
    return {
      isSyncing,
      lastSyncDate,
      syncError,
      syncResults,
      syncAllTables: syncData,
      formatDate
    };
  }
};
</script>

<style lang="scss" scoped>
.sync-status {
  margin-bottom: 1rem;
  
  .q-banner {
    border-radius: 4px;
  }
}
</style>