<template>
  <q-dialog v-model="dialogVisible" persistent maximized>
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">Créer une nouvelle poule</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="cancelCreate" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md">
          <!-- Formulaire de poule -->
          <div class="col-12 col-md-4">
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <q-input
                v-model="poule.name"
                label="Nom de la poule *"
                :rules="[val => !!val || 'Le nom est requis']"
                outlined
                dense
              />

              <q-select
                v-model="poule.category"
                :options="categoryOptions"
                label="Catégorie *"
                option-value="id"
                option-label="name"
                map-options
                emit-value
                :rules="[val => !!val || 'La catégorie est requise']"
                outlined
                dense
              />
              
              <div class="q-mt-md">
                <q-btn 
                  label="Créer la poule" 
                  color="primary" 
                  :disabled="!isBasicFormValid"
                  @click="onSubmit"
                  class="full-width"
                />
              </div>
              
              <q-card v-if="createdPoules.length > 0" bordered class="q-mt-md">
                <q-card-section>
                  <div class="text-subtitle1">Poules créées ({{ createdPoules.length }})</div>
                  <q-list dense separator>
                    <q-item v-for="(createdPoule, index) in createdPoules" :key="index">
                      <q-item-section>
                        <q-item-label>{{ createdPoule.name }}</q-item-label>
                        <q-item-label caption>{{ getCategoryName(createdPoule.category) }} - {{ createdPoule.competitors ? createdPoule.competitors.length : 0 }} compétiteurs</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </q-form>
          </div>
          
          <!-- Sélection de compétiteurs -->
          <div class="col-12 col-md-8">
            <div class="row q-mb-md items-center">
              <div class="col">
                <q-input 
                  v-model="search" 
                  label="Rechercher des compétiteurs" 
                  outlined 
                  dense 
                  clearable
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-auto q-ml-md">
                <q-btn 
                  color="secondary" 
                  label="Sélectionner tous" 
                  dense 
                  @click="selectAllCompetitors"
                  v-if="filteredCompetitors.length > 0 && selectedCompetitors.length < filteredCompetitors.length"
                />
                <q-btn 
                  color="secondary" 
                  label="Désélectionner tous" 
                  dense 
                  @click="unselectAllCompetitors"
                  v-else-if="selectedCompetitors.length > 0"
                />
              </div>
            </div>
            
            <q-table
              :rows="filteredCompetitors"
              :columns="competitorColumns"
              :filter="search"
              row-key="id"
              selection="multiple"
              v-model:selected="selectedCompetitors"
              :pagination="{ rowsPerPage: 0 }"
              flat
              bordered
            >
              <template v-slot:header="props">
                <q-tr :props="props">
                  <q-th auto-width>
                    <q-checkbox v-model="props.selected" />
                  </q-th>
                  <q-th v-for="col in props.cols" :key="col.name" :props="props">
                    {{ col.label }}
                  </q-th>
                </q-tr>
              </template>
              
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td auto-width>
                    <q-checkbox v-model="props.selected" />
                  </q-td>
                  <q-td v-for="col in props.cols" :key="col.name" :props="props">
                    {{ props.row[col.field] }}
                  </q-td>
                </q-tr>
              </template>
              
              <template v-slot:bottom>
                <div class="full-width q-pa-sm">
                  <div class="text-body2">{{ selectedCompetitors.length }} compétiteur(s) sélectionné(s)</div>
                </div>
              </template>
            </q-table>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Terminer" color="positive" @click="finishCreation" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { db } from '../database/db';
import { useQuasar } from 'quasar';

const $q = useQuasar();

// Props pour le composant
const props = defineProps({
  modelValue: Boolean,
  tournamentId: {
    type: [Number, String],
    required: true
  }
});

// Événements émis
const emit = defineEmits(['update:modelValue', 'poule-created', 'poules-updated']);

// Variable réactive pour le dialogue
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Données des poules créées
const createdPoules = ref([]);

// Données de la nouvelle poule
const poule = ref({
  name: '',
  tournamentId: props.tournamentId,
  category: null
});

// Compétiteurs et catégories
const selectedCompetitors = ref([]);
const allCompetitors = ref([]);
const search = ref('');
const categories = ref([]);

// Colonnes pour le tableau de compétiteurs
const competitorColumns = [
  { name: 'firstname', label: 'Prénom', field: 'firstname', sortable: true },
  { name: 'lastname', label: 'Nom', field: 'lastname', sortable: true },
  { name: 'clubName', label: 'Club', field: 'clubName', sortable: true },
  { name: 'age', label: 'Age', field: 'age', sortable: true },
  { name: 'gender', label: 'Sexe', field: 'gender', sortable: true }
];

// Options de catégories
const categoryOptions = computed(() => {
  return categories.value.map(category => ({
    id: category.id,
    name: category.name
  }));
});

// Filtrer les compétiteurs en fonction de la recherche
const filteredCompetitors = computed(() => {
  if (!search.value) return allCompetitors.value;
  
  const searchLower = search.value.toLowerCase();
  return allCompetitors.value.filter(competitor => 
    competitor.firstname.toLowerCase().includes(searchLower) ||
    competitor.lastname.toLowerCase().includes(searchLower) ||
    competitor.clubName && competitor.clubName.toLowerCase().includes(searchLower)
  );
});

// Vérifier si le formulaire de base est valide
const isBasicFormValid = computed(() => {
  return poule.value.name && 
         poule.value.tournamentId && 
         poule.value.category;
});

// Charger les catégories
const loadCategories = async () => {
  try {
    categories.value = await db.categories.toArray();
  } catch (error) {
    console.error('Erreur lors du chargement des catégories:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des catégories',
      position: 'bottom-right',
      timeout: 3000
    });
    categories.value = [];
  }
};

// Charger les compétiteurs du tournoi
const loadCompetitors = async () => {
  if (!props.tournamentId) return;
  
  try {
    const tournament = await db.tournaments.get(props.tournamentId);
    
    if (!tournament || !Array.isArray(tournament.competitors)) {
      throw new Error("Tournoi non trouvé ou liste de compétiteurs invalide");
    }
    
    const tournamentCompetitorIds = tournament.competitors;
    
    // Récupérer toutes les poules de ce tournoi
    const tournamentPoules = await db.poules
      .where('tournamentId')
      .equals(props.tournamentId)
      .toArray();
    
    // Collecter tous les compétiteurs qui sont déjà dans des poules
    const competitorsInPoules = new Set();
    tournamentPoules.forEach(poule => {
      if (Array.isArray(poule.competitors)) {
        poule.competitors.forEach(id => competitorsInPoules.add(id));
      }
    });
    
    // Récupérer tous les compétiteurs du tournoi qui ne sont pas déjà dans une poule
    allCompetitors.value = await db.competitors
      .where('id')
      .anyOf(tournamentCompetitorIds)
      .filter(competitor => !competitorsInPoules.has(competitor.id))
      .toArray();
      
    // Ajouter un message si aucun compétiteur disponible
    if (allCompetitors.value.length === 0) {
      $q.notify({
        type: 'info',
        message: 'Tous les compétiteurs de ce tournoi sont déjà affectés à des poules',
        position: 'bottom-right',
        timeout: 3000
      });
    }
      
  } catch (error) {
    console.error("Erreur lors du chargement des compétiteurs:", error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des compétiteurs',
      position: 'bottom-right',
      timeout: 3000
    });
    allCompetitors.value = [];
  }
};

// Obtenir le nom d'une catégorie à partir de son ID
const getCategoryName = (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  return category ? category.name : 'Inconnue';
};

// Soumettre le formulaire pour créer une poule
const onSubmit = async () => {
  try {
    if (!isBasicFormValid.value) {
      $q.notify({
        type: 'warning',
        message: 'Veuillez remplir tous les champs requis',
        position: 'bottom-right',
        timeout: 3000
      });
      return;
    }
    
    if (selectedCompetitors.value.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Veuillez sélectionner au moins un compétiteur',
        position: 'bottom-right',
        timeout: 3000
      });
      return;
    }
    
    // Créer la nouvelle poule avec les compétiteurs sélectionnés
    const pouleData = {
      name: poule.value.name,
      tournamentId: props.tournamentId,
      category: poule.value.category,
      competitors: selectedCompetitors.value.map(comp => comp.id)
    };

    // Ajouter la poule à la base de données
    const newPouleId = await db.poules.add(pouleData);
    const createdPoule = { ...pouleData, id: newPouleId };
    
    // Ajouter à la liste des poules créées
    createdPoules.value.push(createdPoule);

    // Émettre l'événement pour informer le parent
    emit('poule-created', createdPoule);

    // Notification de succès
    $q.notify({
      type: 'positive',
      message: 'Poule créée avec succès',
      position: 'bottom-right',
      timeout: 3000
    });

    // Fermer le dialogue immédiatement après la création
    dialogVisible.value = false;
    emit('poules-updated', createdPoules.value);
    createdPoules.value = [];
    
  } catch (error) {
    console.error('Erreur lors de la création de la poule:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la création de la poule',
      position: 'bottom-right',
      timeout: 3000
    });
  }
};

// Terminer la création de toutes les poules
const finishCreation = () => {
  if (createdPoules.value.length === 0) {
    $q.dialog({
      title: 'Aucune poule créée',
      message: 'Vous n\'avez créé aucune poule. Voulez-vous vraiment quitter?',
      cancel: true,
      persistent: true
    }).onOk(() => {
      dialogVisible.value = false;
      emit('poules-updated', []);
    });
  } else {
    dialogVisible.value = false;
    emit('poules-updated', createdPoules.value);
    createdPoules.value = [];
  }
};

// Annuler la création de poules
const cancelCreate = () => {
  if (createdPoules.value.length > 0) {
    $q.dialog({
      title: 'Poules créées',
      message: `Vous avez créé ${createdPoules.value.length} poule(s). Êtes-vous sûr de vouloir fermer?`,
      cancel: true,
      persistent: true
    }).onOk(() => {
      dialogVisible.value = false;
      emit('poules-updated', createdPoules.value);
      createdPoules.value = [];
    });
  } else {
    dialogVisible.value = false;
  }
};

// Sélectionner tous les compétiteurs filtrés
const selectAllCompetitors = () => {
  // Créer un ensemble des IDs déjà sélectionnés
  const selectedIds = new Set(selectedCompetitors.value.map(comp => comp.id));
  
  // Ajouter les compétiteurs filtrés qui ne sont pas déjà sélectionnés
  filteredCompetitors.value.forEach(competitor => {
    if (!selectedIds.has(competitor.id)) {
      selectedCompetitors.value.push(competitor);
    }
  });
};

// Désélectionner tous les compétiteurs
const unselectAllCompetitors = () => {
  selectedCompetitors.value = [];
};

// Réinitialiser le formulaire
const resetForm = () => {
  poule.value = {
    name: '',
    tournamentId: props.tournamentId,
    category: null
  };
};

// Chargement initial des données
onMounted(async () => {
  await loadCategories();
  await loadCompetitors();
  resetForm();
});

// Recharger les données lorsque le dialogue s'ouvre
watch(() => dialogVisible.value, async (newVal) => {
  if (newVal) {
    await loadCategories();
    await loadCompetitors();
    resetForm();
  }
});
</script>

<style lang="scss" scoped>
.q-table__bottom {
  border-top: 1px solid rgba(0,0,0,0.12);
}
</style>