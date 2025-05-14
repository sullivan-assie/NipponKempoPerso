<template>
  <q-dialog :modelValue="modelValue" @update:modelValue="updateModel" persistent>
    <q-card class="q-pa-md" style="width: 80vw; max-width: 1200px;">
      <q-card-section>
        <div class="text-h6">Import d'un CSV</div>
      </q-card-section>

      <div class="q-gutter-md">
        <q-btn @click="triggerFileInput" label="Choisir un fichier CSV" />
        <input ref="fileInput" type="file" accept=".csv" @change="handleFile" style="display: none;" />
      </div>

      <div v-if="uploadProgress > 0 && uploadProgress < 1" class="q-my-md">
        <q-linear-progress :value="uploadProgress" />
      </div>

      <q-table v-if="csvData.length" :rows="csvData" :columns="columns" row-key="id" class="q-my-md" />

      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn v-if="csvData.length" @click="saveToDexie" label="Valider l'import" color="green" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from "vue";
import { parseCSVFile } from "src/services/csvService";
import { db } from '../database/db';
import { useQuasar } from 'quasar';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  teamId: {
    type: Number,
    default: null
  }
});

const $q = useQuasar();

const emit = defineEmits(["update:modelValue", "importSuccess"]);

const fileInput = ref(null);
const csvData = ref([]);
const columns = ref([]);
const uploadProgress = ref(0);

const triggerFileInput = () => {
  fileInput.value.click();
};

const updateModel = (val) => {
  emit("update:modelValue", val);
};

const handleFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Vérifier la taille du fichier (ex : 2 Mo max)
  if (file.size > 2 * 1024 * 1024) {
    console.error("Le fichier est trop volumineux !");
    return;
  }

  uploadProgress.value = 0;

  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 0.9) {
      uploadProgress.value = Math.min(uploadProgress.value + 0.1, 0.9);
    } else {
      clearInterval(progressInterval);
    }
  }, 100);

  try {
    const data = await parseCSVFile(file);

    if (!data || data.length === 0) {
      console.error("Le fichier CSV est vide ou invalide.");
      uploadProgress.value = 0;
      return;
    }

    csvData.value = data;
    columns.value = Object.keys(data[0]).map((key) => ({
      name: key,
      label: key,
      field: key,
      align: "left",
    }));

    uploadProgress.value = 1;
    fileInput.value.value = ""; // Réinitialiser l'input
  } catch (error) {
    console.error("Erreur lors du parsing du fichier CSV :", error);
    uploadProgress.value = 0;
  }
};

const saveToDexie = async () => {
  try {
    // Nettoyer les données avant l'enregistrement
    const cleanData = csvData.value.map(item => {
      // Créer un nouvel objet propre
      const cleanItem = {};
      
      // Copier uniquement les propriétés sérialisables
      Object.keys(item).forEach(key => {
        const value = item[key];
        // Vérifier si la valeur est sérialisable
        if (
          value !== undefined && 
          typeof value !== 'function' && 
          typeof value !== 'symbol'
        ) {
          // Convertir les valeurs numériques si nécessaire
          if (!isNaN(value) && value !== '') {
            cleanItem[key] = Number(value);
          } else {
            cleanItem[key] = value;
          }
        }
      });
      
      // Assurer que l'objet a un teamId (si nécessaire)
      if (!cleanItem.teamId) {
        cleanItem.teamId = props.teamId; // Valeur par défaut ou dynamique selon votre logique
      }
      
      return cleanItem;
    });
    
    // Utiliser bulkAdd pour insérer plusieurs valeurs
    await db.competitors.bulkAdd(cleanData);
    
    emit("importSuccess", cleanData);

    $q.notify({
      type: 'positive',
      message: 'Compétiteurs importés avec succès !',
      position: 'bottom-right',
      timeout: 3000
    });

    updateModel(false); // Fermer la modal
  } catch (error) {
    console.error("Erreur lors de l'enregistrement dans Dexie :", error);
    console.error("Détails de l'erreur:", error.message);
    $q.notify({
        type: 'negative',
        message: 'Une erreur est survenue lors de l\'import !',
        position: 'bottom-right',
        timeout: 3000
      })
  }
};
</script>
