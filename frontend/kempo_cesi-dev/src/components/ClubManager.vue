<template>
  <div>
    <q-dialog :model-value="isOpen" @update:model-value="updateOpen" persistent>
      <q-card style="min-width: 800px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Gestion des clubs</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pb-none">
          <q-tabs v-model="activeTab" class="text-primary">
            <q-tab name="list" label="Liste des Clubs" icon="list" />
            <q-tab name="create" label="Créer un Club" icon="add" />
          </q-tabs>
        </q-card-section>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- Liste des clubs -->
          <q-tab-panel name="list">
            <div v-if="loading" class="text-center">
              <q-spinner size="3em" color="primary" />
              <p class="text-subtitle1 q-mt-md">Chargement des clubs...</p>
            </div>
            <div v-else-if="clubs.length === 0" class="text-center q-pa-md">
              <q-icon name="business" size="3em" color="grey-7" />
              <p class="text-subtitle1">Aucun club n'a été créé pour le moment.</p>
              <q-btn label="Créer un club" color="primary" @click="activeTab = 'create'" />
            </div>
            <div v-else>
              <q-list bordered separator>
                <q-item v-for="club in clubs" :key="club._id" class="club-item">
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ club.name }}</q-item-label>
                    <q-item-label caption>{{ club.description || 'Pas de description' }}</q-item-label>
                    <q-item-label caption>
                      <q-icon name="email" size="xs" class="q-mr-xs" />
                      {{ club.contactEmail || 'Aucun email' }}
                    </q-item-label>
                    <q-item-label caption v-if="club.address?.city">
                      <q-icon name="location_on" size="xs" class="q-mr-xs" />
                      {{ formatAddress(club.address) }}
                    </q-item-label>
                  </q-item-section>
                  
                  <q-item-section side>
                    <div class="q-gutter-sm">
                      <q-badge color="primary">
                        {{ club.members ? club.members.length : 0 }} membre{{ club.members && club.members.length !== 1 ? 's' : '' }}
                      </q-badge>
                      <q-btn flat round color="primary" icon="group" @click="openClubDetails(club)" />
                      <q-btn flat round color="secondary" icon="edit" @click="editClub(club)" />
                      <q-btn flat round color="negative" icon="delete" @click="confirmDeleteClub(club)" />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-tab-panel>

          <!-- Création/Édition de club -->
          <q-tab-panel name="create">
            <q-form @submit="submitClub" class="q-gutter-md">
              <q-input
                v-model="clubForm.name"
                label="Nom du Club *"
                :rules="[val => !!val || 'Le nom est requis']"
              />
              <q-input
                v-model="clubForm.description"
                type="textarea"
                label="Description"
              />
              
              <div class="row q-col-gutter-md">
                <div class="col-12 text-subtitle1 q-mb-sm">Adresse</div>
                <div class="col-12">
                  <q-input v-model="clubForm.address.street" label="Rue" />
                </div>
                <div class="col-6">
                  <q-input v-model="clubForm.address.city" label="Ville" />
                </div>
                <div class="col-6">
                  <q-input v-model="clubForm.address.postalCode" label="Code Postal" />
                </div>
                <div class="col-12">
                  <q-input v-model="clubForm.address.country" label="Pays" />
                </div>
              </div>
              
              <div class="row q-col-gutter-md">
                <div class="col-12 text-subtitle1 q-mb-sm">Contact</div>
                <div class="col-6">
                  <q-input
                    v-model="clubForm.contactEmail"
                    label="Email de contact"
                    type="email"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model="clubForm.contactPhone"
                    label="Téléphone de contact"
                  />
                </div>
              </div>
              
              <div class="row justify-end q-mt-md">
                <q-btn
                  label="Annuler"
                  type="reset"
                  flat
                  class="q-ml-sm"
                  @click="resetForm"
                />
                <q-btn
                  :label="editMode ? 'Mettre à jour' : 'Créer'"
                  type="submit"
                  color="primary"
                  :loading="submitting"
                  class="q-ml-sm"
                />
              </div>
            </q-form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </q-dialog>

    <!-- Dialogue pour afficher les détails du club et gérer les membres -->
    <q-dialog v-model="showClubDetails" persistent maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedClub?.name }} - Gestion des membres</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card class="club-info">
                <q-card-section>
                  <div class="text-h6">Informations du club</div>
                  <q-separator class="q-my-md" />
                  
                  <div class="row q-col-gutter-sm">
                    <div class="col-12">
                      <div class="text-subtitle2">Description</div>
                      <div>{{ selectedClub?.description || 'Pas de description' }}</div>
                    </div>
                    <div class="col-12">
                      <div class="text-subtitle2">Adresse</div>
                      <div>{{ formatAddress(selectedClub?.address) || 'Pas d\'adresse' }}</div>
                    </div>
                    <div class="col-12">
                      <div class="text-subtitle2">Contact</div>
                      <div>
                        <div v-if="selectedClub?.contactEmail">
                          <q-icon name="email" size="xs" class="q-mr-xs" />
                          {{ selectedClub.contactEmail }}
                        </div>
                        <div v-if="selectedClub?.contactPhone">
                          <q-icon name="phone" size="xs" class="q-mr-xs" />
                          {{ selectedClub.contactPhone }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section>
                  <div class="text-h6">Ajouter des membres</div>
                  <q-separator class="q-my-md" />
                  
                  <q-select
                    v-model="selectedUser"
                    :options="availableUsers"
                    option-label="fullName"
                    label="Sélectionner un utilisateur"
                    clearable
                    use-input
                    hide-selected
                    fill-input
                    input-debounce="0"
                    @filter="filterUsers"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Aucun utilisateur trouvé
                        </q-item-section>
                      </q-item>
                    </template>
                    
                    <template v-slot:selected>
                      <span v-if="selectedUser">{{ selectedUser.fullName }}</span>
                    </template>
                  </q-select>
                  
                  <div class="q-mt-md">
                    <q-checkbox v-model="isCoach" label="Ajouter comme entraîneur du club" />
                  </div>
                  
                  <q-btn
                    class="q-mt-md"
                    color="primary"
                    label="Ajouter au club"
                    :disabled="!selectedUser"
                    @click="addUserToClub"
                    :loading="addingUser"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>
          
          <q-card class="q-mt-md">
            <q-card-section>
              <div class="text-h6">Membres du club</div>
              
              <div v-if="loadingMembers" class="text-center">
                <q-spinner size="2em" color="primary" />
                <p>Chargement des membres...</p>
              </div>
              
              <div v-else-if="!clubMembers || clubMembers.length === 0" class="text-center q-pa-md">
                <q-icon name="person_off" size="2em" color="grey-7" />
                <p>Aucun membre inscrit dans ce club</p>
              </div>
              
              <div v-else>
                <q-table
                  :rows="clubMembers"
                  :columns="memberColumns"
                  row-key="_id"
                  :pagination="{ rowsPerPage: 10 }"
                >
                  <template v-slot:body-cell-role="props">
                    <q-td :props="props">
                      <q-chip v-if="isCoachMember(props.row._id)" color="secondary" text-color="white" icon="sports">
                        Entraîneur
                      </q-chip>
                      <span v-else>Membre</span>
                    </q-td>
                  </template>
                  
                  <template v-slot:body-cell-actions="props">
                    <q-td :props="props">
                      <q-btn flat round color="negative" icon="remove_circle" 
                        @click="confirmRemoveUser(props.row)" />
                    </q-td>
                  </template>
                </q-table>
              </div>
            </q-card-section>
          </q-card>
        </q-card-section>
      </q-card>
    </q-dialog>
    
    <!-- Dialogue de confirmation de suppression d'un club -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirmation de suppression</span>
        </q-card-section>

        <q-card-section>
          <p>Êtes-vous sûr de vouloir supprimer le club "<strong>{{ clubToDelete?.name }}</strong>" ?</p>
          <p class="text-caption text-negative">
            <q-icon name="warning" />
            Cette action est irréversible. Les utilisateurs ne seront plus affiliés à ce club.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn 
            flat 
            label="Supprimer" 
            color="negative" 
            @click="deleteClub" 
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de confirmation de retrait d'un utilisateur -->
    <q-dialog v-model="showRemoveUserConfirm" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="remove_circle" color="warning" text-color="white" />
          <span class="q-ml-sm text-h6">Retirer du club</span>
        </q-card-section>

        <q-card-section>
          <p>Êtes-vous sûr de vouloir retirer <strong>{{ userToRemove?.firstName }} {{ userToRemove?.lastName }}</strong> du club ?</p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn 
            flat 
            label="Retirer" 
            color="negative" 
            @click="removeUserFromClub" 
            :loading="removingUser"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:isOpen']);

// État de la modale
const activeTab = ref('list');
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const editMode = ref(false);

// Liste des clubs
const clubs = ref([]);

// Formulaire pour création/édition de club
const clubForm = reactive({
  name: '',
  description: '',
  address: {
    street: '',
    city: '',
    postalCode: '',
    country: ''
  },
  contactEmail: '',
  contactPhone: ''
});

// Variables pour la suppression d'un club
const showDeleteConfirm = ref(false);
const clubToDelete = ref(null);

// Variables pour les détails d'un club
const showClubDetails = ref(false);
const selectedClub = ref(null);
const clubMembers = ref([]);
const loadingMembers = ref(false);

// Variables pour l'ajout d'utilisateurs au club
const allUsers = ref([]);
const availableUsers = ref([]);
const selectedUser = ref(null);
const isCoach = ref(false);
const addingUser = ref(false);

// Variables pour le retrait d'utilisateurs du club
const showRemoveUserConfirm = ref(false);
const userToRemove = ref(null);
const removingUser = ref(false);

// Colonnes pour le tableau des membres
const memberColumns = [
  { name: 'firstName', field: 'firstName', label: 'Prénom', align: 'left' },
  { name: 'lastName', field: 'lastName', label: 'Nom', align: 'left' },
  { name: 'email', field: 'email', label: 'Email', align: 'left' },
  { name: 'fighterNumber', field: 'fighterNumber', label: 'N° Combattant', align: 'left' },
  { name: 'role', field: 'role', label: 'Rôle', align: 'left' },
  { name: 'actions', field: '_id', label: 'Actions', align: 'center' }
];

// Charger la liste des clubs
const fetchClubs = async () => {
  loading.value = true;
  try {
    const response = await api.get('/clubs');
    clubs.value = response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des clubs:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger la liste des clubs',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Fonction pour formater une adresse
const formatAddress = (address) => {
  if (!address) return '';
  
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.postalCode || address.city) {
    const cityPart = [address.postalCode, address.city].filter(Boolean).join(' ');
    parts.push(cityPart);
  }
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
};

// Réinitialiser le formulaire
const resetForm = () => {
  editMode.value = false;
  clubForm.name = '';
  clubForm.description = '';
  clubForm.address = {
    street: '',
    city: '',
    postalCode: '',
    country: ''
  };
  clubForm.contactEmail = '';
  clubForm.contactPhone = '';
  activeTab.value = 'list';
};

// Soumettre le formulaire (création ou modification)
const submitClub = async () => {
  submitting.value = true;
  try {
    let response;
    
    if (editMode.value && clubForm._id) {
      // Mise à jour d'un club existant
      response = await api.put(`/clubs/${clubForm._id}`, clubForm);
      $q.notify({
        color: 'positive',
        message: 'Club mis à jour avec succès',
        icon: 'check_circle'
      });
    } else {
      // Création d'un nouveau club
      response = await api.post('/clubs', clubForm);
      $q.notify({
        color: 'positive',
        message: 'Club créé avec succès',
        icon: 'check_circle'
      });
    }
    
    await fetchClubs();
    resetForm();
  } catch (error) {
    console.error('Erreur lors de la soumission du formulaire:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la création/modification du club',
      icon: 'error'
    });
  } finally {
    submitting.value = false;
  }
};

// Éditer un club existant
const editClub = (club) => {
  editMode.value = true;
  clubForm._id = club._id;
  clubForm.name = club.name;
  clubForm.description = club.description || '';
  clubForm.address = {
    street: club.address?.street || '',
    city: club.address?.city || '',
    postalCode: club.address?.postalCode || '',
    country: club.address?.country || ''
  };
  clubForm.contactEmail = club.contactEmail || '';
  clubForm.contactPhone = club.contactPhone || '';
  activeTab.value = 'create';
};

// Confirmer la suppression d'un club
const confirmDeleteClub = (club) => {
  clubToDelete.value = club;
  showDeleteConfirm.value = true;
};

// Supprimer un club
const deleteClub = async () => {
  deleting.value = true;
  try {
    await api.delete(`/clubs/${clubToDelete.value._id}`);
    $q.notify({
      color: 'positive',
      message: `Le club "${clubToDelete.value.name}" a été supprimé avec succès`,
      icon: 'check_circle'
    });
    await fetchClubs();
  } catch (error) {
    console.error('Erreur lors de la suppression du club:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la suppression du club',
      icon: 'error'
    });
  } finally {
    deleting.value = false;
    showDeleteConfirm.value = false;
    clubToDelete.value = null;
  }
};

// Charger les détails d'un club et ouvrir la modale
const openClubDetails = async (club) => {
  selectedClub.value = club;
  showClubDetails.value = true;
  loadingMembers.value = true;
  
  try {
    // Charger les détails du club avec les membres
    const response = await api.get(`/clubs/${club._id}`);
    selectedClub.value = response.data;
    
    if (response.data.members && response.data.members.length > 0) {
      clubMembers.value = response.data.members;
    } else {
      clubMembers.value = [];
    }
    
    // Charger la liste des utilisateurs disponibles
    await loadAvailableUsers();
  } catch (error) {
    console.error('Erreur lors du chargement des détails du club:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les détails du club',
      icon: 'error'
    });
  } finally {
    loadingMembers.value = false;
  }
};

// Charger les utilisateurs disponibles pour l'ajout au club
const loadAvailableUsers = async () => {
  try {
    const response = await api.get('/users');
    allUsers.value = response.data.map(user => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName} (${user.email})`
    }));
    
    // Filtrer les utilisateurs qui ne sont pas déjà dans le club
    updateAvailableUsers();
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger la liste des utilisateurs',
      icon: 'error'
    });
  }
};

// Mettre à jour la liste des utilisateurs disponibles
const updateAvailableUsers = () => {
  if (!selectedClub.value || !selectedClub.value.members) {
    availableUsers.value = [...allUsers.value];
    return;
  }
  
  const memberIds = selectedClub.value.members.map(member => member._id);
  availableUsers.value = allUsers.value.filter(user => !memberIds.includes(user._id));
};

// Filtrer les utilisateurs dans le q-select
const filterUsers = (val, update) => {
  if (val === '') {
    update(() => {
      availableUsers.value = allUsers.value.filter(user => 
        !selectedClub.value.members.some(member => member._id === user._id)
      );
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    availableUsers.value = allUsers.value.filter(user => 
      (user.fullName.toLowerCase().indexOf(needle) > -1) && 
      !selectedClub.value.members.some(member => member._id === user._id)
    );
  });
};

// Ajouter un utilisateur au club
const addUserToClub = async () => {
  if (!selectedUser.value) return;
  
  addingUser.value = true;
  try {
    await api.post(`/clubs/${selectedClub.value._id}/users`, {
      userId: selectedUser.value._id,
      isCoach: isCoach.value
    });
    
    $q.notify({
      color: 'positive',
      message: `${selectedUser.value.firstName} ${selectedUser.value.lastName} a été ajouté au club avec succès`,
      icon: 'check_circle'
    });
    
    // Recharger les détails du club
    await openClubDetails(selectedClub.value);
    
    // Réinitialiser le formulaire
    selectedUser.value = null;
    isCoach.value = false;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur au club:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors de l\'ajout de l\'utilisateur au club',
      icon: 'error'
    });
  } finally {
    addingUser.value = false;
  }
};

// Vérifier si un utilisateur est coach
const isCoachMember = (userId) => {
  return selectedClub.value && 
         selectedClub.value.coaches && 
         selectedClub.value.coaches.some(coach => coach._id === userId);
};

// Confirmer le retrait d'un utilisateur
const confirmRemoveUser = (user) => {
  userToRemove.value = user;
  showRemoveUserConfirm.value = true;
};

// Retirer un utilisateur du club
const removeUserFromClub = async () => {
  if (!userToRemove.value) return;
  
  removingUser.value = true;
  try {
    await api.delete(`/clubs/${selectedClub.value._id}/users`, {
      data: { userId: userToRemove.value._id }
    });
    
    $q.notify({
      color: 'positive',
      message: `${userToRemove.value.firstName} ${userToRemove.value.lastName} a été retiré du club avec succès`,
      icon: 'check_circle'
    });
    
    // Recharger les détails du club
    await openClubDetails(selectedClub.value);
  } catch (error) {
    console.error('Erreur lors du retrait de l\'utilisateur du club:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors du retrait de l\'utilisateur du club',
      icon: 'error'
    });
  } finally {
    removingUser.value = false;
    showRemoveUserConfirm.value = false;
    userToRemove.value = null;
  }
};

// Observer les changements de la propriété isOpen
watch(() => props.isOpen, async (newValue) => {
  if (newValue) {
    await fetchClubs();
  }
});

// Fermer la modale
watch(showClubDetails, (newValue) => {
  if (!newValue) {
    selectedClub.value = null;
    clubMembers.value = [];
  }
});

// Monter le composant
onMounted(async () => {
  if (props.isOpen) {
    await fetchClubs();
  }
});

// Mettre à jour la valeur de la prop isOpen
const updateOpen = (value) => {
  emit('update:isOpen', value);
};
</script>

<style scoped>
.club-item {
  transition: background-color 0.3s;
}

.club-item:hover {
  background-color: #f0f0f0;
}

.club-info {
  height: 100%;
}
</style>