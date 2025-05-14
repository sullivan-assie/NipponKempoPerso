<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 800px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Ajouter des utilisateurs comme compétiteurs</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <div class="row q-mb-md items-center">
          <div class="col">
            <q-input v-model="search" label="Rechercher un utilisateur" outlined dense>
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <q-icon v-if="search" name="clear" @click="search = ''" class="cursor-pointer" />
              </template>
            </q-input>
          </div>
        </div>

        <div class="q-mb-md">
          <div class="row items-center">
            <div class="q-mr-md">
              <q-chip color="green-7" text-color="white">
                <q-icon name="check_circle" left />
                Utilisateurs déjà convertis en compétiteurs
              </q-chip>
            </div>
            <div>
              <q-toggle
                v-model="showAlreadyConverted"
                label="Afficher les utilisateurs déjà convertis"
              />
            </div>
          </div>
        </div>

        <q-table
          :rows="displayedUsers"
          :columns="columns"
          row-key="_id"
          selection="multiple"
          v-model:selected="selectedUsers"
          :pagination="{ rowsPerPage: 10 }"
          :filter="search"
          :loading="loading"
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
              <q-th auto-width>Statut</q-th>
            </q-tr>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" :class="isUserAlreadyCompetitor(props.row) ? 'bg-green-1' : ''">
              <q-td auto-width>
                <q-checkbox 
                  v-model="props.selected" 
                  :disable="isUserAlreadyCompetitor(props.row)" 
                />
              </q-td>
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                {{ props.row[col.field] }}
              </q-td>
              <q-td auto-width>
                <q-badge v-if="isUserAlreadyCompetitor(props.row)" color="green-7" text-color="white">
                  <q-icon name="check_circle" size="xs" class="q-mr-xs" />
                  Déjà compétiteur
                </q-badge>
                <q-badge v-else color="grey-7" text-color="white">
                  <q-icon name="person_add" size="xs" class="q-mr-xs" />
                  À convertir
                </q-badge>
              </q-td>
            </q-tr>
          </template>

          <template v-slot:bottom>
            <div class="full-width row justify-between items-center q-px-sm">
              <div>{{ selectedUsers.length }} utilisateur(s) sélectionné(s)</div>
              <div>{{ filteredUsers.length }} utilisateurs correspondent à la recherche</div>
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-section v-if="selectedUsers.length > 0" class="q-pt-none">
        <q-banner class="bg-blue-1 q-pa-md">
          <template v-slot:avatar>
            <q-icon name="info" color="primary" />
          </template>
          <div>
            <p class="q-mb-sm">Les utilisateurs sélectionnés seront convertis en compétiteurs avec les informations suivantes :</p>
            <div class="row q-col-gutter-md">
              <div class="col-md-6 col-xs-12">
                <q-select 
                  v-model="defaultValues.nationality" 
                  :options="nationalityOptions" 
                  label="Nationalité par défaut" 
                  filled
                />
              </div>
              <div class="col-md-6 col-xs-12">
                <q-select 
                  v-model="defaultValues.gender" 
                  :options="genderOptions" 
                  label="Genre par défaut" 
                  filled
                />
              </div>
            </div>
            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-md-6 col-xs-12">
                <q-input 
                  v-model="defaultValues.clubName" 
                  label="Club par défaut" 
                  filled
                />
              </div>
              <div class="col-md-6 col-xs-12">
                <q-input 
                  v-model.number="defaultValues.age" 
                  type="number" 
                  label="Âge par défaut" 
                  filled
                />
              </div>
            </div>
          </div>
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Annuler" color="negative" flat @click="closeDialog" />
        <q-btn 
          label="Convertir et Ajouter" 
          color="primary" 
          @click="convertUsersToCompetitors" 
          :disable="selectedUsers.length === 0" 
          :loading="processing"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'users-converted']);

// Quasar notifications
const $q = useQuasar();

// Liaison de la visibilité du dialogue avec la prop modelValue
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// État du composant
const search = ref('');
const users = ref([]);
const selectedUsers = ref([]);
const loading = ref(false);
const processing = ref(false);
const showAlreadyConverted = ref(true);
const existingCompetitors = ref([]);

// Valeurs par défaut pour les nouveaux compétiteurs
const defaultValues = ref({
  nationality: 'France',
  gender: 'Male',
  clubName: '',
  age: null
});

// Options pour les sélecteurs
const nationalityOptions = ['France', 'Belgique', 'Suisse', 'Canada', 'Allemagne', 'Espagne', 'Italie', 'Royaume-Uni', 'Japon'];
const genderOptions = [
  { label: 'Homme', value: 'Homme' },
  { label: 'Femme', value: 'Femme' },
  { label: 'Autre', value: 'Autre' }
];

// Colonnes pour le tableau
const columns = [
  { name: 'firstName', label: 'Prénom', field: 'firstName', sortable: true },
  { name: 'lastName', label: 'Nom', field: 'lastName', sortable: true },
  { name: 'email', label: 'Email', field: 'email', sortable: true },
  { name: 'fighterNumber', label: 'Numéro de combattant', field: 'fighterNumber', sortable: true }
];

// Filtrer les utilisateurs en fonction de la recherche
const filteredUsers = computed(() => {
  if (!search.value) {
    return users.value;
  }
  
  const searchLower = search.value.toLowerCase();
  return users.value.filter(user => {
    return user.firstName?.toLowerCase().includes(searchLower) ||
           user.lastName?.toLowerCase().includes(searchLower) ||
           user.email?.toLowerCase().includes(searchLower) ||
           user.fighterNumber?.toString().includes(searchLower);
  });
});

// Utilisateurs à afficher selon le filtre "déjà convertis"
const displayedUsers = computed(() => {
  if (showAlreadyConverted.value) {
    return filteredUsers.value;
  } else {
    return filteredUsers.value.filter(user => !isUserAlreadyCompetitor(user));
  }
});

// Vérifier si un utilisateur est déjà un compétiteur dans ce tournoi spécifique
const isUserAlreadyCompetitor = (user) => {
  if (!user || !user._id) return false;
  
  // Vérifie si un compétiteur avec le même ID utilisateur et ID tournoi existe déjà
  return existingCompetitors.value.some(competitor => 
    competitor.userId === user._id && 
    competitor.tournamentId === props.tournamentId
  );
};

// Fermer la boîte de dialogue
const closeDialog = () => {
  search.value = '';
  selectedUsers.value = [];
  dialogVisible.value = false;
};

// Convertir les utilisateurs sélectionnés en compétiteurs et les ajouter au tournoi
const convertUsersToCompetitors = async () => {
  if (selectedUsers.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Aucun utilisateur sélectionné',
      position: 'bottom-right'
    });
    return;
  }

  try {
    processing.value = true;
    
    // Convertir les utilisateurs en compétiteurs via l'API
    const response = await api.post(`/tournaments/${props.tournamentId}/convert-users`, {
      userIds: selectedUsers.value.map(user => user._id),
      defaultValues: defaultValues.value
    });
    
    $q.notify({
      type: 'positive',
      message: `${response.data.convertedCount} utilisateur(s) converti(s) en compétiteurs et ajouté(s) au tournoi`,
      position: 'bottom-right'
    });
    
    // Émettre l'événement pour informer le composant parent
    emit('users-converted', response.data.competitors);
    closeDialog();
  } catch (error) {
    console.error('Erreur lors de la conversion des utilisateurs:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la conversion des utilisateurs',
      position: 'bottom-right'
    });
  } finally {
    processing.value = false;
  }
};

// Charger la liste des utilisateurs (uniquement les participants du tournoi actuel)
const loadUsers = async () => {
  loading.value = true;
  try {
    // Au lieu de charger tous les utilisateurs, récupérer uniquement les participants du tournoi
    const response = await api.get(`/tournaments/${props.tournamentId}/participants`);
    
    // Convertir les participants en format utilisateur pour le tableau
    users.value = response.data.map(participant => ({
      _id: participant.userId,
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      fighterNumber: participant.fighterNumber,
      status: participant.status,
      registeredAt: participant.registeredAt
    })).filter(user => user._id !== null); // Filtrer les participants sans userId valide
  } catch (error) {
    console.error('Erreur lors du chargement des participants du tournoi:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des participants du tournoi',
      position: 'bottom-right'
    });
    users.value = [];
  } finally {
    loading.value = false;
  }
};

// Charger la liste des compétiteurs existants pour le tournoi actuel seulement
const loadCompetitors = async () => {
  try {
    // Récupérer uniquement les compétiteurs pour ce tournoi spécifique
    const response = await api.get(`/competitors?tournamentId=${props.tournamentId}`);
    existingCompetitors.value = response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des compétiteurs du tournoi:', error);
    existingCompetitors.value = [];
  }
};

// Initialiser le composant au montage
onMounted(() => {
  loadUsers();
  loadCompetitors();
});

// Réinitialiser la sélection quand la boîte de dialogue s'ouvre
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedUsers.value = [];
  }
});
</script>

<style lang="scss" scoped>
.bg-green-1 {
  background-color: rgba(76, 175, 80, 0.1);
}
</style>