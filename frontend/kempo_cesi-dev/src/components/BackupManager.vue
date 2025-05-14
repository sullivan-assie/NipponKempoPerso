<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="width: 700px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">Sauvegarde de la base de données</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <div class="q-mb-md">
          <q-btn 
            color="primary" 
            icon="backup" 
            label="Créer une nouvelle sauvegarde" 
            @click="createBackup" 
            :loading="creating"
          />
        </div>

        <q-table
          v-if="backups.length > 0"
          title="Sauvegardes disponibles"
          :rows="backups"
          :columns="columns"
          row-key="filename"
          :loading="loading"
          flat
          bordered
        >
          <template v-slot:body-cell-createdAt="props">
            <q-td :props="props">
              {{ formatDatetime(props.row.createdAt) }}
            </q-td>
          </template>
          
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="q-gutter-sm">
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="download"
                @click="downloadBackup(props.row)"
                title="Télécharger"
              />
              <q-btn
                flat
                round
                dense
                color="warning"
                icon="restore"
                @click="confirmRestore(props.row)"
                title="Restaurer"
              />
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click="confirmDelete(props.row)"
                title="Supprimer"
              />
            </q-td>
          </template>
        </q-table>

        <div v-else class="text-center q-pa-md">
          <q-icon name="backup" size="3em" color="grey-7" />
          <p class="text-subtitle1">Aucune sauvegarde disponible</p>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Dialogue de confirmation pour la restauration -->
  <q-dialog v-model="confirmRestoreDialog" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="warning" color="warning" text-color="white" />
        <span class="q-ml-sm">
          Êtes-vous sûr de vouloir restaurer la base de données à partir de cette sauvegarde ? 
          Cette opération est irréversible et remplacera toutes les données actuelles.
        </span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn flat label="Restaurer" color="warning" @click="restoreBackup" :loading="restoring" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialogue de confirmation pour la suppression -->
  <q-dialog v-model="confirmDeleteDialog" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="warning" color="negative" text-color="white" />
        <span class="q-ml-sm">
          Êtes-vous sûr de vouloir supprimer définitivement cette sauvegarde ?
        </span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn flat label="Supprimer" color="negative" @click="deleteBackup" :loading="deleting" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);
const $q = useQuasar();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const backups = ref([]);
const loading = ref(false);
const creating = ref(false);
const restoring = ref(false);
const deleting = ref(false);
const selectedBackup = ref(null);
const confirmRestoreDialog = ref(false);
const confirmDeleteDialog = ref(false);

const columns = [
  { name: 'filename', label: 'Nom du fichier', field: 'filename', align: 'left' },
  { name: 'size', label: 'Taille', field: 'size', align: 'center' },
  { name: 'createdAt', label: 'Créé le', field: 'createdAt', align: 'center', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
];

// Formater la date et l'heure
const formatDatetime = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Fermer le dialogue
const closeDialog = () => {
  dialogVisible.value = false;
};

// Récupérer la liste des sauvegardes
const fetchBackups = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/backups');
    backups.value = data.backups || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des sauvegardes:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de récupérer la liste des sauvegardes',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Créer une nouvelle sauvegarde
const createBackup = async () => {
  creating.value = true;
  try {
    const { data } = await api.post('/backups');
    $q.notify({
      color: 'positive',
      message: 'Sauvegarde créée avec succès',
      icon: 'backup'
    });
    await fetchBackups();
  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de créer la sauvegarde',
      icon: 'error'
    });
  } finally {
    creating.value = false;
  }
};

// Télécharger une sauvegarde
const downloadBackup = async (backup) => {
  try {
    // Récupérer le token JWT du localStorage avec le nom correct
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token d\'authentification non trouvé');
    }
    
    // Créer une URL pour le téléchargement avec le token en paramètre
    const downloadUrl = `${api.defaults.baseURL}/backups/${backup.filename}/download?token=${token}`;
    
    // Ouvrir l'URL dans une nouvelle fenêtre
    window.open(downloadUrl, '_blank');
  } catch (error) {
    console.error('Erreur lors du téléchargement de la sauvegarde:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de télécharger la sauvegarde: ' + (error.message || 'Erreur inconnue'),
      icon: 'error'
    });
  }
};

// Confirmer la restauration d'une sauvegarde
const confirmRestore = (backup) => {
  selectedBackup.value = backup;
  confirmRestoreDialog.value = true;
};

// Restaurer une sauvegarde
const restoreBackup = async () => {
  if (!selectedBackup.value) return;
  
  restoring.value = true;
  try {
    const { data } = await api.post(`/backups/${selectedBackup.value.filename}/restore`);
    confirmRestoreDialog.value = false;
    $q.notify({
      color: 'positive',
      message: 'Base de données restaurée avec succès',
      icon: 'restore'
    });
  } catch (error) {
    console.error('Erreur lors de la restauration de la sauvegarde:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de restaurer la base de données',
      icon: 'error'
    });
  } finally {
    restoring.value = false;
  }
};

// Confirmer la suppression d'une sauvegarde
const confirmDelete = (backup) => {
  selectedBackup.value = backup;
  confirmDeleteDialog.value = true;
};

// Supprimer une sauvegarde
const deleteBackup = async () => {
  if (!selectedBackup.value) return;
  
  deleting.value = true;
  try {
    const { data } = await api.delete(`/backups/${selectedBackup.value.filename}`);
    confirmDeleteDialog.value = false;
    $q.notify({
      color: 'positive',
      message: 'Sauvegarde supprimée avec succès',
      icon: 'delete'
    });
    await fetchBackups();
  } catch (error) {
    console.error('Erreur lors de la suppression de la sauvegarde:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de supprimer la sauvegarde',
      icon: 'error'
    });
  } finally {
    deleting.value = false;
  }
};

// Charger les sauvegardes lors de l'ouverture du dialogue
watch(() => dialogVisible.value, (newValue) => {
  if (newValue) {
    fetchBackups();
  }
});

onMounted(() => {
  if (dialogVisible.value) {
    fetchBackups();
  }
});
</script>