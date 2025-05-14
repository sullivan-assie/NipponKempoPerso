<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 800px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Ajouter des compétiteurs au tournoi</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <div class="row q-mb-md items-center">
          <div class="col">
            <q-input v-model="search" label="Rechercher un compétiteur" outlined dense>
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <q-icon v-if="search" name="clear" @click="search = ''" class="cursor-pointer" />
              </template>
            </q-input>
          </div>
          <div class="col-auto q-ml-md">
            <q-btn color="secondary" icon="person_add" label="Créer un compétiteur" @click="openCreateCompetitorDialog" />
          </div>
        </div>

        <div class="q-mb-md">
          <div class="row items-center">
            <div class="q-mr-md">
              <q-chip color="green-7" text-color="white">
                <q-icon name="check_circle" left />
                Compétiteurs déjà inscrits au tournoi
              </q-chip>
            </div>
            <div>
              <q-toggle
                v-model="showAlreadyAdded"
                label="Afficher les compétiteurs déjà inscrits"
              />
            </div>
          </div>
        </div>

        <q-table
          :rows="displayedCompetitors"
          :columns="columns"
          row-key="id"
          selection="multiple"
          v-model:selected="selectedCompetitors"
          :pagination="{ rowsPerPage: 0 }"
          :filter="search"
          :loading="loading"
          flat
          bordered
          :virtual-scroll="displayedCompetitors.length > 50"
          virtual-scroll-item-size="48"
        >
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th auto-width>
                <q-checkbox v-model="props.selected" />
              </q-th>
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
              <q-th auto-width>Statut</q-th>
            </q-tr>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" :class="isCompetitorAlreadyInTournament(props.row) ? 'bg-green-1' : ''">
              <q-td auto-width>
                <q-checkbox 
                  v-model="props.selected" 
                  :disable="isCompetitorAlreadyInTournament(props.row)" 
                />
              </q-td>
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'nationality'">
                  <div class="row items-center">
                    <country-flag :country="getCountryCode(props.row[col.field])" size="small" class="q-mr-sm" />
                    {{ props.row[col.field] }}
                  </div>
                </template>
                <template v-else>
                  {{ props.row[col.field] }}
                </template>
              </q-td>
              <q-td auto-width>
                <q-badge v-if="isCompetitorAlreadyInTournament(props.row)" color="green-7" text-color="white">
                  <q-icon name="check_circle" size="xs" class="q-mr-xs" />
                  Inscrit
                </q-badge>
                <q-badge v-else color="grey-7" text-color="white">
                  <q-icon name="person_add" size="xs" class="q-mr-xs" />
                  À inscrire
                </q-badge>
              </q-td>
            </q-tr>
          </template>

          <template v-slot:bottom>
            <div class="full-width row justify-between items-center q-px-sm">
              <div>{{ selectedCompetitors.length }} compétiteur(s) sélectionné(s)</div>
              <div>{{ filteredCompetitors.length }} compétiteurs correspondent à la recherche</div>
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Annuler" color="negative" flat @click="closeDialog" />
        <q-btn label="Ajouter" color="primary" @click="addCompetitors" :disable="selectedCompetitors.length === 0" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <CompetitorsCreate v-model="createCompetitorDialogVisible" @competitor-created="onCompetitorCreated" />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { db } from '../database/db';
import { useQuasar } from 'quasar';
import CountryFlag from 'vue-country-flag-next';
import CompetitorsCreate from './CompetitorsCreate.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  tournamentId: {
    type: [String, Number],
    required: false,
    default: null
  },
  currentCompetitors: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'competitors-added']);
const $q = useQuasar();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const search = ref('');
const competitors = ref([]);
const selectedCompetitors = ref([]);
const loading = ref(true);
const createCompetitorDialogVisible = ref(false);
const showAlreadyAdded = ref(true);

// Colonnes pour le tableau
const columns = [
  { name: 'firstname', label: 'Prénom', field: 'firstname', sortable: true },
  { name: 'lastname', label: 'Nom', field: 'lastname', sortable: true },
  { name: 'clubName', label: 'Club', field: 'clubName', sortable: true },
  { name: 'grade', label: 'Grade', field: 'grade', sortable: true },
  { name: 'danLevel', label: 'Dan', field: 'danLevel', sortable: true },
  { name: 'nationality', label: 'Nationalité', field: 'nationality', sortable: true },
  { name: 'gender', label: 'Sexe', field: 'gender', sortable: true },
  { name: 'age', label: 'Age', field: 'age', sortable: true }
];

// Filtrer les compétiteurs en fonction de la recherche
const filteredCompetitors = computed(() => {
  if (!search.value) {
    return competitors.value;
  }
  
  const searchLower = search.value.toLowerCase();
  return competitors.value.filter(competitor => {
    return competitor.firstname?.toLowerCase().includes(searchLower) ||
           competitor.lastname?.toLowerCase().includes(searchLower) ||
           competitor.clubName?.toLowerCase().includes(searchLower) ||
           competitor.nationality?.toLowerCase().includes(searchLower);
  });
});

// Compétiteurs à afficher selon le filtre "déjà ajoutés"
const displayedCompetitors = computed(() => {
  if (showAlreadyAdded.value) {
    return filteredCompetitors.value;
  } else {
    return filteredCompetitors.value.filter(competitor => !isCompetitorAlreadyInTournament(competitor));
  }
});

// Fonction pour obtenir le code pays à 2 lettres (reprise de TeamPage.vue)
const getCountryCode = (countryName) => {
  if (!countryName) return 'unknown';
  
  if (countryName.length === 2) {
    return countryName.toLowerCase();
  }
  
  const countryCodes = {
    'France': 'fr',
    'États-Unis': 'us',
    'USA': 'us',
    'États Unis': 'us',
    'Royaume-Uni': 'gb',
    'UK': 'gb',
    'Grande-Bretagne': 'gb',
    'Japon': 'jp',
    'Japan': 'jp',
    'Allemagne': 'de',
    'Germany': 'de',
    // Autres pays...
  };
  
  return countryCodes[countryName] || 'unknown';
};

// Vérifier si un compétiteur est déjà dans le tournoi
const isCompetitorAlreadyInTournament = (competitor) => {
  return props.currentCompetitors.includes(competitor.id);
};

// Fermer la boîte de dialogue
const closeDialog = () => {
  search.value = '';
  selectedCompetitors.value = [];
  dialogVisible.value = false;
};

// Ajouter les compétiteurs sélectionnés au tournoi
const addCompetitors = async () => {
  try {
    if (!props.tournamentId) {
      $q.notify({
        type: 'negative',
        message: 'Aucun tournoi sélectionné',
        position: 'bottom-right',
        timeout: 3000
      });
      closeDialog();
      return;
    }
    
    if (selectedCompetitors.value.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Aucun compétiteur sélectionné',
        position: 'bottom-right',
        timeout: 3000
      });
      return;
    }

    // Récupérer le tournoi actuel
    const tournament = await db.tournaments.get(props.tournamentId);
    
    if (!tournament) {
      throw new Error("Tournoi non trouvé");
    }
    
    // Préparer la liste des compétiteurs à ajouter (seulement les IDs)
    const competitorIds = selectedCompetitors.value
      .filter(competitor => !isCompetitorAlreadyInTournament(competitor))
      .map(competitor => competitor.id);
    
    if (competitorIds.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Tous les compétiteurs sélectionnés sont déjà dans le tournoi',
        position: 'bottom-right',
        timeout: 3000
      });
      return;
    }
    
    // S'assurer que competitors est un tableau
    let updatedCompetitors = Array.isArray(tournament.competitors) 
      ? [...tournament.competitors]
      : [];
      
    // Ajouter les nouveaux compétiteurs (en évitant les doublons)
    competitorIds.forEach(id => {
      if (!updatedCompetitors.includes(id)) {
        updatedCompetitors.push(id);
      }
    });
    
    // Mettre à jour le tournoi dans la base de données
    await db.tournaments.update(props.tournamentId, {
      competitors: updatedCompetitors
    });
    
    $q.notify({
      type: 'positive',
      message: `${competitorIds.length} compétiteur(s) ajouté(s) au tournoi`,
      position: 'bottom-right',
      timeout: 3000
    });
    
    // Émettre l'événement pour informer le composant parent
    emit('competitors-added', updatedCompetitors);
    closeDialog();
  } catch (error) {
    console.error("Erreur lors de l'ajout des compétiteurs:", error);
    $q.notify({
      type: 'negative',
      message: "Erreur lors de l'ajout des compétiteurs",
      position: 'bottom-right',
      timeout: 3000
    });
  }
};

// Charger tous les compétiteurs
const loadCompetitors = async () => {
  loading.value = true;
  try {
    competitors.value = await db.competitors.toArray();
  } catch (error) {
    console.error("Erreur lors du chargement des compétiteurs:", error);
    competitors.value = [];
  } finally {
    loading.value = false;
  }
};

// Ouvrir la boîte de dialogue pour créer un compétiteur
const openCreateCompetitorDialog = () => {
  createCompetitorDialogVisible.value = true;
};

// Gestionnaire d'événement pour la création réussie d'un compétiteur
const onCompetitorCreated = async (competitorData) => {
  console.log('Compétiteur créé:', competitorData);
  
  // Rafraîchir la liste des compétiteurs
  await loadCompetitors();
  
  // Présélectionner le nouveau compétiteur
  if (competitorData && competitorData.id) {
    const newCompetitor = await db.competitors.get(competitorData.id);
    if (newCompetitor) {
      selectedCompetitors.value = [...selectedCompetitors.value, newCompetitor];
    }
  }
  
  $q.notify({
    type: 'positive',
    message: 'Compétiteur créé avec succès et ajouté à la sélection',
    position: 'bottom-right',
    timeout: 3000
  });
};

// Initialiser les données
onMounted(() => {
  loadCompetitors();
});

// Réinitialiser la sélection quand la boîte de dialogue s'ouvre
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedCompetitors.value = [];
  }
});
</script>

<style lang="scss" scoped>
.competitor-already-added {
  background-color: rgba(76, 175, 80, 0.1);
}
</style>