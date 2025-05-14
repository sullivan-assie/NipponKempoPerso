<template>
  <div>
    <q-dialog v-model="dialogVisible" persistent>
      <q-card style="min-width: 600px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Générer des poules aléatoires</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="closeDialog" />
        </q-card-section>

        <q-form @submit.prevent="generatePoules">
          <q-card-section>
            <p class="text-body1">
              Cette fonctionnalité va créer des poules en répartissant aléatoirement les compétiteurs du tournoi.
            </p>
            
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12">
                <q-select
                  v-model="categoryId"
                  :options="categoriesOptions"
                  label="Catégorie *"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  :rules="[val => !!val || 'La catégorie est requise']"
                />
              </div>
              
              <div class="col-md-6 col-12">
                <q-input
                  v-model.number="numberOfPoules"
                  type="number"
                  label="Nombre de poules *"
                  outlined
                  min="1"
                  :rules="[
                    val => !!val || 'Le nombre de poules est requis',
                    val => val > 0 || 'Le nombre de poules doit être supérieur à 0'
                  ]"
                />
              </div>
              
              <div class="col-md-6 col-12">
                <q-input
                  v-model.number="competitorsPerPoule"
                  type="number"
                  label="Nombre de compétiteurs par poule (approximatif)"
                  outlined
                  min="2"
                  :rules="[
                    val => !!val || 'Le nombre de compétiteurs par poule est requis',
                    val => val >= 2 || 'Il faut au moins 2 compétiteurs par poule'
                  ]"
                  hint="Le nombre réel peut varier légèrement pour une répartition équitable"
                />
              </div>
            </div>

            <q-banner v-if="categoryId && competitorCount > 0" class="bg-blue-1 q-my-md">
              <template v-slot:avatar>
                <q-icon name="info" color="primary" />
              </template>
              <p class="q-mb-none">
                <strong>{{ competitorCount }}</strong> compétiteurs seront répartis dans 
                <strong>{{ numberOfPoules }}</strong> poules.
              </p>
              <p class="q-mb-none" v-if="competitorsPerPoule > 0">
                Chaque poule contiendra environ <strong>{{ competitorsPerPoule }}</strong> compétiteurs.
              </p>
            </q-banner>

            <q-banner v-if="categoryId && competitorCount === 0" class="bg-orange-1 q-my-md">
              <template v-slot:avatar>
                <q-icon name="warning" color="warning" />
              </template>
              <p class="q-mb-none">
                Aucun compétiteur n'est disponible dans cette catégorie. Veuillez ajouter des compétiteurs avant de créer des poules.
              </p>
            </q-banner>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn label="Annuler" color="negative" flat @click="closeDialog" />
            <q-btn 
              label="Générer les poules" 
              color="primary" 
              type="submit"
              :disable="categoryId === null || competitorCount === 0 || numberOfPoules <= 0 || competitorsPerPoule < 2"
              :loading="loading"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  tournamentId: {
    type: String,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'poules-generated']);

// Quasar notifications
const $q = useQuasar();

// État du composant
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const categoryId = ref(null);
const numberOfPoules = ref(2);
const competitorsPerPoule = ref(4);
const loading = ref(false);
const competitorsByCategory = ref({});
const competitorCount = computed(() => {
  if (!categoryId.value || !competitorsByCategory.value[categoryId.value]) {
    return 0;
  }
  return competitorsByCategory.value[categoryId.value].length;
});

// Options pour le sélecteur de catégories
const categoriesOptions = computed(() => {
  return props.categories.map(category => ({
    label: category.name,
    value: category._id
  }));
});

// Chargement des compétiteurs par catégorie
const loadCompetitorsByCategory = async () => {
  if (!props.tournamentId) return;
  
  try {
    loading.value = true;
    
    // Charger les compétiteurs par catégorie pour le tournoi
    const response = await api.get(`/tournaments/${props.tournamentId}/competitors-by-category`);
    competitorsByCategory.value = response.data;
    
    // Pré-calculer le nombre de compétiteurs par poule si une catégorie est sélectionnée
    if (categoryId.value && competitorCount.value) {
      calculateCompetitorsPerPoule();
    }
  } catch (error) {
    console.error('Erreur lors du chargement des compétiteurs par catégorie:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des compétiteurs',
      position: 'bottom-right'
    });
  } finally {
    loading.value = false;
  }
};

// Calcul du nombre approximatif de compétiteurs par poule
const calculateCompetitorsPerPoule = () => {
  if (competitorCount.value > 0 && numberOfPoules.value > 0) {
    competitorsPerPoule.value = Math.ceil(competitorCount.value / numberOfPoules.value);
  } else {
    competitorsPerPoule.value = 0;
  }
};

// Fermeture de la boîte de dialogue
const closeDialog = () => {
  categoryId.value = null;
  numberOfPoules.value = 2;
  competitorsPerPoule.value = 4;
  emit('update:modelValue', false);
};

// Génération des poules aléatoires
const generatePoules = async () => {
  if (!categoryId.value || numberOfPoules.value <= 0 || competitorCount.value === 0) {
    $q.notify({
      type: 'warning',
      message: 'Veuillez remplir tous les champs correctement',
      position: 'bottom-right'
    });
    return;
  }

  try {
    loading.value = true;
    
    // Appel à l'API pour générer les poules aléatoires
    const response = await api.post(`/tournaments/${props.tournamentId}/generate-poules`, {
      categoryId: categoryId.value,
      numberOfPoules: numberOfPoules.value
    });
    
    $q.notify({
      type: 'positive',
      message: `${response.data.poulesCreated} poules ont été générées avec succès`,
      position: 'bottom-right'
    });
    
    // Émettre l'événement pour informer le composant parent
    emit('poules-generated', response.data.poules);
    closeDialog();
  } catch (error) {
    console.error('Erreur lors de la génération des poules:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la génération des poules',
      position: 'bottom-right'
    });
  } finally {
    loading.value = false;
  }
};

// Observer les changements de catégorie pour mettre à jour le nombre de compétiteurs par poule
watch(categoryId, () => {
  calculateCompetitorsPerPoule();
});

// Observer les changements du nombre de poules pour mettre à jour le nombre de compétiteurs par poule
watch(numberOfPoules, () => {
  calculateCompetitorsPerPoule();
});

// Observer l'ouverture de la boîte de dialogue pour charger les données
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Si la boîte de dialogue s'ouvre, charger les compétiteurs par catégorie
    loadCompetitorsByCategory();
    
    // Si une seule catégorie est disponible, la sélectionner automatiquement
    if (props.categories.length === 1) {
      categoryId.value = props.categories[0]._id;
    }
  }
});
</script>