<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Créer un tournoi</div>
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

          <!-- Date du tournoi -->
          <q-input
            v-model="form.date"
            label="Date du tournoi *"
            mask="##/##/####"
            hint="JJ/MM/AAAA"
            :rules="[
              val => validateDate(val) || 'Date invalide, format requis: JJ/MM/AAAA'
            ]"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="form.date" :locale="fr" mask="DD/MM/YYYY" today-btn>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Fermer" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          
          <!-- Heure du tournoi (nouveau champ) -->
          <q-input
            v-model="form.time"
            label="Heure du tournoi"
            mask="##:##"
            hint="HH:MM (format 24h)"
            :rules="[
              val => !val || validateTime(val) || 'Heure invalide, format requis: HH:MM'
            ]"
          >
            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="form.time" format24h mask="HH:mm">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Fermer" color="primary" flat />
                    </div>
                  </q-time>
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

          <!-- Organisateur du tournoi -->
          <q-input
            v-model="form.organizer"
            label="Organisateur *"
            hint="Nom de l'organisateur ou de l'organisation"
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Veuillez saisir un organisateur']"
          />

          <!-- Type de match -->
          <q-select
            v-model="form.matchType"
            :options="matchTypeOptions"
            label="Type de match *"
            hint="Type de compétition"
            lazy-rules
            :rules="[val => (val && val.length > 0) || 'Veuillez sélectionner un type de match']"
            emit-value
            map-options
          />

          <!-- Catégories -->
          <q-select
            v-model="form.categories"
            :options="categoriesOptions"
            label="Catégories"
            hint="Sélectionnez une ou plusieurs catégories"
            multiple
            use-chips
          />

          <div class="q-mt-md">
            <q-btn label="Annuler" color="negative" flat class="q-mr-sm" @click="closeDialog" />
            <q-btn label="Créer" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { db } from '../database/db';
import { date } from 'quasar';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios'; // Ajout de l'import de l'API axios
import fr from 'quasar/lang/fr';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'tournament-created']);
const $q = useQuasar();

// Définition de la variable form
const form = ref({
  name: '',
  date: date.formatDate(new Date(), 'DD/MM/YYYY'),
  time: '',
  location: '',
  organizer: '',
  matchType: '',
  categories: [],
  competitors: []
});

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Fonction de validation de date au format JJ/MM/AAAA
const validateDate = (dateStr) => {
  if (!dateStr) return false;
  
  // Si la date a été sélectionnée depuis le calendrier, elle est valide
  if (dateStr.length === 10 && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    // Vérification basique des valeurs
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 2000 || year > 2100) return false; // Plage d'années raisonnable
    
    return true;
  }
  
  return false;
};

// Fonction de validation de l'heure au format HH:MM
const validateTime = (timeStr) => {
  if (!timeStr) return false;

  const parts = timeStr.split(':');
  if (parts.length !== 2) return false;

  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);

  if (isNaN(hours) || isNaN(minutes)) return false;
  if (hours < 0 || hours > 23) return false;
  if (minutes < 0 || minutes > 59) return false;

  return true;
};

// Options pour le type de match
const matchTypeOptions = [
  { label: 'Élimination directe', value: 'Élimination directe' },
  { label: 'Poules', value: 'Poules' },
  { label: 'Mixte', value: 'Mixte' }
  
];

// Pour stocker les options de catégories
const categoriesOptions = ref([]);

// Charger les catégories depuis la base de données
const loadCategories = async () => {
  try {
    const dbCategories = await db.categories.toArray();
    categoriesOptions.value = dbCategories.map(category => ({
      label: category.name,
      value: category._id // Utiliser l'ID MongoDB au lieu du nom
    }));
  } catch (error) {
    console.error("Erreur lors du chargement des catégories:", error);
  }
};

// Réinitialiser le formulaire
const resetForm = () => {
  form.value = {
    name: '',
    date: date.formatDate(new Date(), 'DD/MM/YYYY'),
    time: '',
    location: '',
    organizer: '',
    matchType: '',
    categories: [],
    competitors: []
  };
};

// Fermer la boîte de dialogue
const closeDialog = () => {
  resetForm();
  dialogVisible.value = false;
};

// Soumission du formulaire
const onSubmit = async () => {
  $q.loading.show();
  try {
    // Vérification manuelle des champs requis
    if (!form.value.name || !form.value.name.trim()) {
      throw new Error('Le nom du tournoi est obligatoire');
    }
    if (!form.value.date) {
      throw new Error('La date du tournoi est obligatoire');
    }
    
    // Préparation des données
    const plainFormData = { 
      ...form.value,
      competitors: Array.isArray(form.value.competitors) ? [...form.value.competitors] : []
    };

    // Traitement de la date et l'heure pour garantir un format valide
    if (plainFormData.date) {
      try {
        const dateParts = String(plainFormData.date).split('/');
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          let dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          // Ajouter l'heure si présente
          if (plainFormData.time && validateTime(plainFormData.time)) {
            const timeParts = plainFormData.time.split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            
            dateObj.setHours(hours);
            dateObj.setMinutes(minutes);
          }
          
          // Vérifier si la date est valide
          if (isNaN(dateObj.getTime())) {
            throw new Error('Format de date invalide');
          }
          
          // Définir la date principale
          plainFormData.date = dateObj;
          
          // Définir également startDate pour la compatibilité avec l'affichage
          plainFormData.startDate = dateObj;
        } else {
          throw new Error('Format de date incorrect, attendu: JJ/MM/AAAA');
        }
      } catch (dateErr) {
        console.error('Erreur de traitement de date:', dateErr);
        throw new Error(`Erreur lors du traitement de la date: ${dateErr.message}`);
      }
    }

    // Supprimer la propriété time car elle est maintenant intégrée dans la date
    delete plainFormData.time;

    // Traitement des catégories pour s'assurer que seuls les IDs sont envoyés
    if (plainFormData.categories && Array.isArray(plainFormData.categories)) {
      plainFormData.categories = plainFormData.categories.map(category => {
        // Si c'est un objet avec une propriété 'value', on retourne la valeur
        if (category && typeof category === 'object' && category.value) {
          console.log('Catégorie (object) traitée =', category.value);
          return category.value;
        } 
        // Si c'est déjà une chaîne, on la retourne directement
        else if (typeof category === 'string') {
          console.log('Catégorie (string) traitée =', category);
          return category;
        }
        // Autre cas, on log et on retourne undefined pour pouvoir filtrer
        else {
          console.warn('Format de catégorie non reconnu:', category);
          return undefined;
        }
      }).filter(Boolean); // Éliminer les valeurs undefined
    }
    
    // Vérification du type de match si présent
    const validMatchTypes = ['individual', 'team', 'mixed', 'Élimination directe', 'Poules', 'Mixte'];
    if (plainFormData.matchType && !validMatchTypes.includes(plainFormData.matchType)) {
      throw new Error(`Type de match invalide. Types valides: ${validMatchTypes.join(', ')}`);
    }

    console.log('Données préparées pour envoi:', plainFormData);
    
    // Envoi des données au serveur
    const { data } = await api.post('tournaments', plainFormData);
    console.log('Tournoi créé avec succès:', data);
    
    // Affichage d'une notification de succès
    $q.notify({
      color: 'positive',
      message: 'Tournoi créé avec succès',
      icon: 'check'
    });
    
    emit('tournament-created', { ...plainFormData, id: data._id });
    closeDialog();
  } catch (error) {
    // Afficher un message détaillé de l'erreur
    console.error('Erreur lors de la création du tournoi:', error);
    
    // Déterminer le message d'erreur à afficher
    let errorMessage = 'Erreur lors de la création du tournoi';
    
    // Si l'erreur provient de l'API et contient une réponse
    if (error.response && error.response.data) {
      const responseData = error.response.data;
      errorMessage = responseData.message || errorMessage;
      
      // Afficher des détails supplémentaires si disponibles
      if (responseData.errors) {
        console.error('Détails de validation:', responseData.errors);
        const errorDetails = Object.entries(responseData.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        errorMessage += ` (${errorDetails})`;
      }
    } 
    // Si c'est une erreur locale
    else if (error.message) {
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

// Charger les données nécessaires au chargement du composant
onMounted(() => {
  loadCategories();
});

// Réinitialiser le formulaire lorsque la boîte de dialogue s'ouvre
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetForm();
  }
});
</script>