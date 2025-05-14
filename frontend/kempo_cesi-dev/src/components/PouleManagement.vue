<template>
  <div>
    <div class="row q-mb-md items-center justify-between">
      <div class="text-h6">Gestion des poules</div>
      <q-btn
        color="primary"
        icon="add"
        label="Nouvelle poule"
        @click="openCreatePouleDialog"
      />
    </div>

    <!-- Filtres et recherche -->
    <div class="row q-mb-md items-center">
      <div class="col-12 col-md-4 q-pr-md">
        <q-select
          v-model="selectedCategory"
          :options="categoryOptions"
          label="Filtrer par catégorie"
          option-value="id"
          option-label="name"
          map-options
          emit-value
          clearable
          dense
          outlined
        />
      </div>
      <div class="col-12 col-md-8">
        <q-input
          v-model="search"
          label="Rechercher"
          outlined
          dense
          clearable
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Liste des poules -->
    <div v-if="filteredPoules.length > 0">
      <div class="row q-col-gutter-md">
        <div 
          v-for="poule in filteredPoules" 
          :key="poule.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <q-card class="poule-card">
            <q-card-section class="bg-primary text-white">
              <div class="row items-center justify-between">
                <div class="text-h6">{{ poule.name }}</div>
                <div>
                  <q-btn flat round dense icon="edit" @click="editPoule(poule)" />
                  <q-btn flat round dense icon="delete" @click="confirmDeletePoule(poule)" />
                </div>
              </div>
              <div class="text-caption">Catégorie: {{ poule.category ? getCategoryName(poule.category) : 'Non définie' }}</div>
            </q-card-section>
            
            <q-card-section>
              <div class="text-subtitle1 q-mb-xs">Compétiteurs ({{ poule.competitors ? poule.competitors.length : 0 }})</div>
              <q-list dense>
                <q-item v-for="competitorId in poule.competitors" :key="competitorId" class="q-py-xs">
                  <q-item-section>
                    <div class="row items-center">
                      <div>{{ getCompetitorName(competitorId) }}</div>
                      <q-btn flat round dense icon="close" size="xs" class="q-ml-auto" @click="removeCompetitorFromPoule(poule.id, competitorId)" />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-if="!poule.competitors || poule.competitors.length === 0" class="text-grey-6 text-center q-pa-md">
                Aucun compétiteur dans cette poule
              </div>
              <q-btn 
                color="secondary" 
                flat 
                class="full-width q-mt-sm" 
                icon="person_add" 
                label="Ajouter des compétiteurs" 
                @click="addCompetitorsToPoule(poule)" 
              />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center q-pa-lg text-grey">
      Aucune poule n'a été créée. Cliquez sur "Nouvelle poule" pour en créer une.
    </div>
  </div>
  
  <!-- Dialogue de création de poule -->
  <poule-create 
    v-model="createPouleDialogVisible" 
    :tournament-id="tournamentId"
    @poule-created="onPouleCreated"
    @poules-updated="onPoulesUpdated"
  />
  
  <!-- Dialogue d'édition de poule -->
  <q-dialog v-model="editPouleDialogVisible" persistent maximized>
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">Modifier la poule</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      
      <q-card-section class="q-pt-none">
        <q-input v-model="pouleToEdit.name" label="Nom de la poule" filled dense class="q-mb-md" />
        
        <q-select
          v-model="pouleToEdit.category"
          :options="categoryOptions"
          label="Catégorie"
          filled
          dense
          class="q-mb-md"
          option-value="id"
          option-label="name"
          map-options
          emit-value
        />
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn flat label="Enregistrer" color="primary" @click="saveEditedPoule" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  
  <!-- Dialogue d'ajout de compétiteurs à une poule -->
  <q-dialog v-model="addCompetitorsDialogVisible" persistent maximized>
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">Ajouter des compétiteurs à la poule</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      
      <q-card-section>
        <q-input v-model="competitorSearch" label="Rechercher un compétiteur" filled dense class="q-mb-md">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        
        <q-table
          :rows="availableCompetitors"
          :columns="competitorColumns"
          :filter="competitorSearch"
          row-key="id"
          selection="multiple"
          v-model:selected="selectedCompetitors"
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
        </q-table>
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn flat label="Ajouter" color="primary" @click="confirmAddCompetitorsToPoule" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  
  <!-- Dialogue de confirmation de suppression -->
  <q-dialog v-model="deletePouleDialog" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="warning" color="negative" text-color="white" />
        <span class="q-ml-sm">Voulez-vous vraiment supprimer cette poule?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn flat label="Supprimer" color="negative" @click="deletePoule" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useQuasar } from 'quasar';
import { db } from '../database/db';
import PouleCreate from './PouleCreate.vue';

const $q = useQuasar();

// Props
const props = defineProps({
  tournamentId: {
    type: Number,
    required: true
  }
});

// Émissions d'évènements
const emit = defineEmits(['poules-updated']);

// Données réactives
const poules = ref([]);
const search = ref('');
const selectedCategory = ref(null);
const categories = ref([]);
const createPouleDialogVisible = ref(false);
const editPouleDialogVisible = ref(false);
const addCompetitorsDialogVisible = ref(false);
const deletePouleDialog = ref(false);
const pouleToEdit = ref({});
const pouleToDelete = ref(null);
const competitorSearch = ref('');
const availableCompetitors = ref([]);
const selectedCompetitors = ref([]);
const currentPouleForCompetitors = ref(null);
const allCompetitors = ref([]);

// Colonnes pour le tableau des compétiteurs
const competitorColumns = [
  { name: 'firstname', label: 'Prénom', field: 'firstname', sortable: true },
  { name: 'lastname', label: 'Nom', field: 'lastname', sortable: true },
  { name: 'clubName', label: 'Club', field: 'clubName', sortable: true },
  { name: 'age', label: 'Age', field: 'age', sortable: true },
  { name: 'gender', label: 'Sexe', field: 'gender', sortable: true },
  { name: 'weight', label: 'Poids', field: 'weight', sortable: true },
];

// Options de catégories
const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    id: cat.id,
    name: cat.name
  }));
});

// Poules filtrées par catégorie et recherche
const filteredPoules = computed(() => {
  let result = poules.value;
  
  // Filtre par catégorie
  if (selectedCategory.value) {
    result = result.filter(poule => poule.category === selectedCategory.value);
  }
  
  // Filtre par recherche
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter(poule => {
      return poule.name.toLowerCase().includes(searchLower);
    });
  }
  
  return result;
});

// Chargement des poules du tournoi
const loadPoules = async () => {
  if (!props.tournamentId) return;
  
  try {
    // Récupérer les poules qui appartiennent à ce tournoi
    poules.value = await db.poules
      .where('tournamentId')
      .equals(props.tournamentId)
      .toArray();
  } catch (error) {
    console.error("Erreur lors du chargement des poules:", error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des poules',
      position: 'bottom-right',
      timeout: 3000
    });
  }
};

// Chargement des catégories
const loadCategories = async () => {
  try {
    categories.value = await db.categories.toArray();
  } catch (error) {
    console.error("Erreur lors du chargement des catégories:", error);
    categories.value = [];
  }
};

// Chargement des compétiteurs
const loadCompetitors = async () => {
  try {
    allCompetitors.value = await db.competitors.toArray();
  } catch (error) {
    console.error("Erreur lors du chargement des compétiteurs:", error);
    allCompetitors.value = [];
  }
};


// Obtenir le nom d'une catégorie à partir de son ID
const getCategoryName = (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  return category ? category.name : 'Inconnue';
};

// Obtenir le nom d'un compétiteur à partir de son ID
const getCompetitorName = (competitorId) => {
  const competitor = allCompetitors.value.find(comp => comp.id === competitorId);
  return competitor ? `${competitor.firstname} ${competitor.lastname}` : 'Inconnu';
};

// Ouvrir le dialogue de création de poule
const openCreatePouleDialog = () => {
  createPouleDialogVisible.value = true;
};

// Gérer la création d'une poule
// const onPouleCreated = async (pouleData) => {
//   await loadPoules();
//   emit('poules-updated', poules.value);
//};

// Gérer la mise à jour des poules
const onPoulesUpdated = async () => {
  await loadPoules();
  emit('poules-updated', poules.value);
};

// Éditer une poule
const editPoule = (poule) => {
  pouleToEdit.value = { ...poule };
  editPouleDialogVisible.value = true;
};

// Sauvegarder les modifications d'une poule
const saveEditedPoule = async () => {
  try {
    await db.poules.update(pouleToEdit.value.id, {
      name: pouleToEdit.value.name,
      category: pouleToEdit.value.category
    });
    
    await loadPoules();
    emit('poules-updated', poules.value);
    
    $q.notify({
      type: 'positive',
      message: 'Poule modifiée',
      position: 'bottom-right',
      timeout: 3000
    });
  } catch (error) {
    console.error("Erreur lors de la modification de la poule:", error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la modification de la poule',
      position: 'bottom-right',
      timeout: 3000
    });
  }
};

// Confirmer la suppression d'une poule
const confirmDeletePoule = (poule) => {
  pouleToDelete.value = poule;
  deletePouleDialog.value = true;
};

// Supprimer une poule
const deletePoule = async () => {
  if (!pouleToDelete.value) return;
  
  try {
    await db.poules.delete(pouleToDelete.value.id);
    await loadPoules();
    emit('poules-updated', poules.value);
    
    $q.notify({
      type: 'positive',
      message: 'Poule supprimée',
      position: 'bottom-right',
      timeout: 3000
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la poule:", error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la suppression de la poule',
      position: 'bottom-right',
      timeout: 3000
    });
  }
};

// Ajouter des compétiteurs à une poule
const addCompetitorsToPoule = async (poule) => {
  if (!props.tournamentId) return;
  
  try {
    // Récupérer le tournoi pour obtenir la liste des compétiteurs disponibles
    const tournament = await db.tournaments.get(props.tournamentId);
    
    if (!tournament || !Array.isArray(tournament.competitors)) {
      throw new Error("Tournoi non trouvé ou liste de compétiteurs invalide");
    }
    
    // Filtrer les compétiteurs qui ne sont pas déjà dans la poule sélectionnée
    const pouleCompetitorIds = poule.competitors || [];
    const tournamentCompetitorIds = tournament.competitors || [];
    
    // Récupérer toutes les poules de ce tournoi
    const tournamentPoules = await db.poules
      .where('tournamentId')
      .equals(props.tournamentId)
      .toArray();
    
    // Collecter tous les compétiteurs qui sont déjà dans des poules (sauf celle en cours)
    const competitorsInOtherPoules = new Set();
    tournamentPoules.forEach(p => {
      if (p.id !== poule.id && Array.isArray(p.competitors)) {
        p.competitors.forEach(id => competitorsInOtherPoules.add(id));
      }
    });
    
    // Récupérer tous les compétiteurs du tournoi qui ne sont pas déjà dans une poule
    availableCompetitors.value = await db.competitors
      .where('id')
      .anyOf(tournamentCompetitorIds)
      .filter(competitor => 
        !pouleCompetitorIds.includes(competitor.id) && 
        !competitorsInOtherPoules.has(competitor.id)
      )
      .toArray();
    
    if (availableCompetitors.value.length === 0) {
      $q.notify({
        type: 'info',
        message: 'Tous les compétiteurs de ce tournoi sont déjà affectés à des poules',
        position: 'bottom-right',
        timeout: 3000
      });
    }
    
    currentPouleForCompetitors.value = poule;
    selectedCompetitors.value = [];
    addCompetitorsDialogVisible.value = true;
  } catch (error) {
    console.error("Erreur lors du chargement des compétiteurs disponibles:", error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des compétiteurs',
      position: 'bottom-right',
      timeout: 3000
    });
  }
};

// Confirmer l'ajout de compétiteurs à une poule
const confirmAddCompetitorsToPoule = async () => {
  if (!currentPouleForCompetitors.value || !selectedCompetitors.value.length) return;
  
  try {
    const poule = await db.poules.get(currentPouleForCompetitors.value.id);
    
    if (!poule) {
      throw new Error("Poule non trouvée");
    }
    
    const existingCompetitors = poule.competitors || [];
    const newCompetitors = selectedCompetitors.value.map(competitor => competitor.id);
    
    // Mettre à jour la poule avec les nouveaux compétiteurs
    await db.poules.update(poule.id, {
      competitors: [...existingCompetitors, ...newCompetitors]
    });
    
    await loadPoules();
    emit('poules-updated', poules.value);
    
    $q.notify({
      type: 'positive',
      message: `${newCompetitors.length} compétiteur(s) ajouté(s) à la poule`,
      position: 'bottom-right',
      timeout: 3000
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout des compétiteurs à la poule:", error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'ajout des compétiteurs',
      position: 'bottom-right',
      timeout: 3000
    });
  }
};

// Retirer un compétiteur d'une poule
const removeCompetitorFromPoule = async (pouleId, competitorId) => {
  try {
    const poule = await db.poules.get(pouleId);
    
    if (!poule || !Array.isArray(poule.competitors)) {
      throw new Error("Poule non trouvée ou liste de compétiteurs invalide");
    }
    
    // Filtrer pour retirer le compétiteur
    const updatedCompetitors = poule.competitors.filter(id => id !== competitorId);
    
    // Mettre à jour la poule
    await db.poules.update(pouleId, {
      competitors: updatedCompetitors
    });
    
    await loadPoules();
    emit('poules-updated', poules.value);
    
    $q.notify({
      type: 'positive',
      message: 'Compétiteur retiré de la poule',
      position: 'bottom-right',
      timeout: 3000
    });
  } catch (error) {
    console.error("Erreur lors du retrait du compétiteur:", error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du retrait du compétiteur',
      position: 'bottom-right',
      timeout: 3000
    });
  }
};

// Chargement des données au montage du composant
onMounted(async () => {
  await loadCategories();
  await loadCompetitors();
  await loadPoules();
});

// Observer les changements de l'ID du tournoi
watchEffect(() => {
  if (props.tournamentId) {
    loadPoules();
  }
});
</script>

<style lang="scss" scoped>
.poule-card {
  height: 100%;
  
  .q-card__section {
    &.bg-primary {
      border-top-left-radius: inherit;
      border-top-right-radius: inherit;
    }
  }
}
</style>