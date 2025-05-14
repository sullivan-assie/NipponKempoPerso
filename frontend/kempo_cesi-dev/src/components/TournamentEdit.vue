<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Modifier le tournoi</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <!-- Nom du tournoi -->
          <q-input
            v-model="form.name"
            label="Nom du tournoi *"
            hint="Nom complet du tournoi"
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Veuillez saisir un nom']"
          />

          <!-- Description -->
          <q-input
            v-model="form.description"
            type="textarea"
            label="Description"
            hint="Description du tournoi"
            autogrow
          />

          <!-- Image du tournoi -->
          <q-input
            v-model="form.imageUrl"
            label="URL de l'image"
            hint="Lien vers l'image du tournoi (optionnel)"
          />

          <!-- Date de début -->
          <q-input
            v-model="form.startDate"
            label="Date de début *"
            mask="##/##/####"
            hint="JJ/MM/AAAA"
            :rules="[
              val => validateDate(val) || 'Date invalide, format requis: JJ/MM/AAAA'
            ]"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="form.startDate" :locale="fr" mask="DD/MM/YYYY" today-btn>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Fermer" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- Date de fin -->
          <q-input
            v-model="form.endDate"
            label="Date de fin *"
            mask="##/##/####"
            hint="JJ/MM/AAAA"
            :rules="[
              val => validateDate(val) || 'Date invalide, format requis: JJ/MM/AAAA'
            ]"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="form.endDate" :locale="fr" mask="DD/MM/YYYY" today-btn>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Fermer" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- Lieu du tournoi -->
          <q-input
            v-model="form.location"
            label="Lieu du tournoi *"
            hint="Adresse ou nom du lieu"
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Veuillez saisir un lieu']"
          />

          <!-- Statut du tournoi -->
          <q-select
            v-model="form.status"
            :options="statusOptions"
            label="Statut du tournoi *"
            hint="État actuel du tournoi"
            lazy-rules
            :rules="[val => !!val || 'Veuillez sélectionner un statut']"
          />

          <!-- Type de match -->
          <q-select
            v-model="form.matchType"
            :options="matchTypeOptions"
            label="Type de match *"
            hint="Type de compétition"
            lazy-rules
            :rules="[val => !!val || 'Veuillez sélectionner un type de match']"
          />

          <div class="q-mt-md">
            <q-btn label="Annuler" color="negative" flat class="q-mr-sm" @click="closeDialog" />
            <q-btn label="Enregistrer" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { date } from 'quasar';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import fr from 'quasar/lang/fr';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  tournament: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'tournament-updated']);
const $q = useQuasar();

// Définition du formulaire avec les données du tournoi
const form = ref({
  name: '',
  description: '',
  imageUrl: '',
  startDate: '',
  endDate: '',
  location: '',
  status: '',
  matchType: '',
});

const statusOptions = [
  'À venir',
  'En cours',
  'Terminé',
  'Annulé',
  'Reporté'
];

const matchTypeOptions = [
  'Élimination directe',
  'Poules',
  'Mixte'
];

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Initialiser le formulaire avec les données du tournoi
const initForm = () => {
  if (props.tournament) {
    form.value = {
      name: props.tournament.name || '',
      description: props.tournament.description || '',
      imageUrl: props.tournament.imageUrl || '',
      startDate: props.tournament.startDate ? formatDateForInput(props.tournament.startDate) : '',
      endDate: props.tournament.endDate ? formatDateForInput(props.tournament.endDate) : '',
      location: props.tournament.location || '',
      status: props.tournament.status || 'À venir',
      matchType: props.tournament.matchType || 'Élimination directe',
    };
  }
};

// Formater la date pour l'affichage dans le formulaire
const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  return date.formatDate(new Date(dateStr), 'DD/MM/YYYY');
};

// Fonction de validation de date au format JJ/MM/AAAA
const validateDate = (dateStr) => {
  if (!dateStr) return false;
  
  if (dateStr.length === 10 && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 2000 || year > 2100) return false;
    
    return true;
  }
  
  return false;
};

// Fermer la boîte de dialogue
const closeDialog = () => {
  dialogVisible.value = false;
};

// Soumission du formulaire
const onSubmit = async () => {
  $q.loading.show();
  try {
    // Vérification des champs requis
    if (!form.value.name || !form.value.name.trim()) {
      throw new Error('Le nom du tournoi est obligatoire');
    }
    if (!form.value.startDate || !form.value.endDate) {
      throw new Error('Les dates de début et de fin sont obligatoires');
    }
    if (!form.value.location || !form.value.location.trim()) {
      throw new Error('Le lieu du tournoi est obligatoire');
    }
    
    // Préparation des données
    const tournamentData = { ...form.value };

    // Traitement des dates
    if (tournamentData.startDate) {
      const [day, month, year] = tournamentData.startDate.split('/');
      tournamentData.startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    if (tournamentData.endDate) {
      const [day, month, year] = tournamentData.endDate.split('/');
      tournamentData.endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Envoi des données au serveur
    await api.put(`/tournaments/${props.tournament._id}`, tournamentData);
    
    $q.notify({
      color: 'positive',
      message: 'Tournoi modifié avec succès',
      icon: 'check'
    });
    
    emit('tournament-updated', tournamentData);
    closeDialog();
  } catch (error) {
    console.error('Erreur lors de la modification du tournoi:', error);
    
    let errorMessage = 'Erreur lors de la modification du tournoi';
    
    if (error.response && error.response.data) {
      const responseData = error.response.data;
      errorMessage = responseData.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'warning',
      timeout: 3000
    });
  } finally {
    $q.loading.hide();
  }
};

// Initialiser le formulaire au chargement du composant et à chaque ouverture
onMounted(() => {
  initForm();
});

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initForm();
  }
});

// Réinitialiser le formulaire si le tournoi change
watch(() => props.tournament, (newTournament) => {
  if (newTournament) {
    initForm();
  }
});
</script>