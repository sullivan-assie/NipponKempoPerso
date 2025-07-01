<template>
  <div>
    <q-dialog :model-value="isOpen" @update:model-value="updateOpen" persistent>
      <q-card class="github-dialog" style="min-width: 800px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-white">Gestion des clubs</div>
          <q-space />
          <q-btn 
            icon="close" 
            flat 
            round 
            dense 
            color="grey-4"
            class="github-btn-flat"
            v-close-popup 
          />
        </q-card-section>

        <q-card-section class="q-pb-none">
          <q-tabs v-model="activeTab" class="github-tabs" indicator-color="primary">
            <q-tab name="list" label="Liste des Clubs" icon="list" class="github-tab" />
            <q-tab name="create" label="Créer un Club" icon="add" class="github-tab" />
          </q-tabs>
        </q-card-section>

        <q-separator color="grey-8" />

        <q-tab-panels v-model="activeTab" animated class="github-tab-panels">
          <!-- Liste des clubs -->
          <q-tab-panel name="list">
            <div v-if="loading" class="text-center q-py-xl">
              <q-spinner size="3em" color="primary" />
              <p class="text-h6 q-mt-md text-grey-4">Chargement des clubs...</p>
            </div>
            <div v-else-if="clubs.length === 0" class="text-center q-pa-xl">
              <q-icon name="business" size="3em" color="grey-6" />
              <p class="text-h6 q-mt-md text-grey-4">Aucun club n'a été créé pour le moment.</p>
              <q-btn 
                label="Créer un club" 
                color="negative"
                text-color="white"
                outline
                class="github-btn-important"
                @click="activeTab = 'create'" 
              />
            </div>
            <div v-else>
              <q-list class="github-list">
                <q-item v-for="club in clubs" :key="club._id" class="github-list-item">
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-white">{{ club.name }}</q-item-label>
                    <q-item-label caption class="text-grey-4">{{ club.description || 'Pas de description' }}</q-item-label>
                    <q-item-label caption class="text-grey-5">
                      <q-icon name="email" size="xs" class="q-mr-xs" />
                      {{ club.contactEmail || 'Aucun email' }}
                    </q-item-label>
                    <q-item-label caption v-if="club.address?.city" class="text-grey-5">
                      <q-icon name="location_on" size="xs" class="q-mr-xs" />
                      {{ formatAddress(club.address) }}
                    </q-item-label>
                  </q-item-section>
                  
                  <q-item-section side>
                    <div class="q-gutter-sm">
                      <q-badge color="grey-7" text-color="white">
                        {{ club.members ? club.members.length : 0 }} membre{{ club.members && club.members.length !== 1 ? 's' : '' }}
                      </q-badge>
                      <q-btn 
                        flat 
                        round 
                        color="grey-4" 
                        icon="group"
                        class="github-action-btn"
                        @click="openClubDetails(club)" 
                      />
                      <q-btn 
                        flat 
                        round 
                        color="grey-4" 
                        icon="edit"
                        class="github-action-btn"
                        @click="editClub(club)" 
                      />
                      <q-btn 
                        flat 
                        round 
                        color="red-4" 
                        icon="delete"
                        class="github-action-btn"
                        @click="confirmDeleteClub(club)" 
                      />
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
                outlined
                dark
                color="grey-4"
                label-color="grey-4"
                class="github-input"
                :rules="[val => !!val || 'Le nom est requis']"
              />
              <q-input
                v-model="clubForm.description"
                type="textarea"
                label="Description"
                outlined
                dark
                color="grey-4"
                label-color="grey-4"
                class="github-input"
              />
              
              <div class="row q-col-gutter-md">
                <div class="col-12 text-subtitle1 q-mb-sm text-grey-3">Adresse</div>
                <div class="col-12">
                  <q-input 
                    v-model="clubForm.address.street" 
                    label="Rue"
                    outlined
                    dark
                    color="grey-4"
                    label-color="grey-4"
                    class="github-input"
                  />
                </div>
                <div class="col-6">
                  <q-input 
                    v-model="clubForm.address.city" 
                    label="Ville"
                    outlined
                    dark
                    color="grey-4"
                    label-color="grey-4"
                    class="github-input"
                  />
                </div>
                <div class="col-6">
                  <q-input 
                    v-model="clubForm.address.postalCode" 
                    label="Code Postal"
                    outlined
                    dark
                    color="grey-4"
                    label-color="grey-4"
                    class="github-input"
                  />
                </div>
                <div class="col-12">
                  <q-input 
                    v-model="clubForm.address.country" 
                    label="Pays"
                    outlined
                    dark
                    color="grey-4"
                    label-color="grey-4"
                    class="github-input"
                  />
                </div>
              </div>
              
              <div class="row q-col-gutter-md">
                <div class="col-12 text-subtitle1 q-mb-sm text-grey-3">Contact</div>
                <div class="col-6">
                  <q-input
                    v-model="clubForm.contactEmail"
                    label="Email de contact"
                    type="email"
                    outlined
                    dark
                    color="grey-4"
                    label-color="grey-4"
                    class="github-input"
                  />
                </div>
                <div class="col-6">
                  <q-input
                    v-model="clubForm.contactPhone"
                    label="Téléphone de contact"
                    outlined
                    dark
                    color="grey-4"
                    label-color="grey-4"
                    class="github-input"
                  />
                </div>
              </div>
              
              <div class="row justify-end q-mt-md">
                <q-btn
                  label="Annuler"
                  type="reset"
                  flat
                  color="grey-4"
                  class="q-ml-sm github-btn-flat"
                  @click="resetForm"
                />
                <q-btn
                  :label="editMode ? 'Mettre à jour' : 'Créer'"
                  type="submit"
                  color="positive"
                  flat
                  class="q-ml-sm github-btn-success"
                  :loading="submitting"
                />
              </div>
            </q-form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </q-dialog>

    <!-- Dialogue pour afficher les détails du club et gérer les membres -->
    <q-dialog v-model="showClubDetails" persistent maximized>
      <q-card class="github-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-white">{{ selectedClub?.name }} - Gestion des membres</div>
          <q-space />
          <q-btn 
            icon="close" 
            flat 
            round 
            dense 
            color="grey-4"
            class="github-btn-flat"
            v-close-popup 
          />
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card class="github-card">
                <q-card-section>
                  <div class="text-h6 text-white">Informations du club</div>
                  <q-separator color="grey-8" class="q-my-md" />
                  
                  <div class="row q-col-gutter-sm">
                    <div class="col-12">
                      <div class="text-subtitle2 text-grey-3">Description</div>
                      <div class="text-grey-4">{{ selectedClub?.description || 'Pas de description' }}</div>
                    </div>
                    <div class="col-12">
                      <div class="text-subtitle2 text-grey-3">Adresse</div>
                      <div class="text-grey-4">{{ formatAddress(selectedClub?.address) || 'Pas d\'adresse' }}</div>
                    </div>
                    <div class="col-12">
                      <div class="text-subtitle2 text-grey-3">Contact</div>
                      <div class="text-grey-4">
                        <div v-if="selectedClub?.contactEmail">
                          <q-icon name="email" size="xs" color="grey-5" class="q-mr-xs" />
                          {{ selectedClub.contactEmail }}
                        </div>
                        <div v-if="selectedClub?.contactPhone">
                          <q-icon name="phone" size="xs" color="grey-5" class="q-mr-xs" />
                          {{ selectedClub.contactPhone }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card class="github-card">
                <q-card-section>
                  <div class="text-h6 text-white">Ajouter des membres</div>
                  <q-separator color="grey-8" class="q-my-md" />
                  
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
                    outlined
                    dark
                    color="grey-4"
                    label-color="grey-4"
                    class="github-input"
                    @filter="filterUsers"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey-4">
                          Aucun utilisateur trouvé
                        </q-item-section>
                      </q-item>
                    </template>
                    
                    <template v-slot:selected>
                      <span v-if="selectedUser" class="text-grey-3">{{ selectedUser.fullName }}</span>
                    </template>
                  </q-select>
                  
                  <div class="q-mt-md">
                    <q-checkbox 
                      v-model="isCoach" 
                      label="Ajouter comme entraîneur du club"
                      color="primary"
                      class="text-grey-4"
                    />
                  </div>
                  
                  <q-btn
                    class="q-mt-md github-btn-success"
                    color="positive"
                    label="Ajouter au club"
                    flat
                    :disabled="!selectedUser"
                    @click="addUserToClub"
                    :loading="addingUser"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>
          
          <q-card class="github-card q-mt-md">
            <q-card-section>
              <div class="text-h6 text-white">Membres du club</div>
              
              <div v-if="loadingMembers" class="text-center q-py-xl">
                <q-spinner size="2em" color="primary" />
                <p class="text-grey-4">Chargement des membres...</p>
              </div>
              
              <div v-else-if="!clubMembers || clubMembers.length === 0" class="text-center q-pa-xl">
                <q-icon name="person_off" size="2em" color="grey-6" />
                <p class="text-grey-4">Aucun membre inscrit dans ce club</p>
              </div>
              
              <div v-else>
                <q-table
                  :rows="clubMembers"
                  :columns="memberColumns"
                  row-key="_id"
                  :pagination="{ rowsPerPage: 10 }"
                  flat
                  class="github-table"
                  dark
                >
                  <template v-slot:body-cell-role="props">
                    <q-td :props="props">
                      <q-chip v-if="isCoachMember(props.row._id)" color="secondary" text-color="white" icon="sports">
                        Entraîneur
                      </q-chip>
                      <span v-else class="text-grey-4">Membre</span>
                    </q-td>
                  </template>
                  
                  <template v-slot:body-cell-actions="props">
                    <q-td :props="props">
                      <q-btn 
                        flat 
                        round 
                        color="red-4" 
                        icon="remove_circle"
                        class="github-action-btn"
                        @click="confirmRemoveUser(props.row)" 
                      />
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
      <q-card class="github-dialog" style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6 text-white">Confirmation de suppression</span>
        </q-card-section>

        <q-card-section>
          <p class="text-grey-4">Êtes-vous sûr de vouloir supprimer le club "<strong class="text-white">{{ clubToDelete?.name }}</strong>" ?</p>
          <p class="text-caption text-red-4">
            <q-icon name="warning" />
            Cette action est irréversible. Les utilisateurs ne seront plus affiliés à ce club.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn 
            flat 
            label="Annuler" 
            color="grey-4" 
            class="github-btn-flat"
            v-close-popup 
          />
          <q-btn 
            flat 
            label="Supprimer" 
            color="red-4" 
            class="github-btn-danger"
            @click="deleteClub" 
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de confirmation de retrait d'un utilisateur -->
    <q-dialog v-model="showRemoveUserConfirm" persistent>
      <q-card class="github-dialog" style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="remove_circle" color="warning" text-color="white" />
          <span class="q-ml-sm text-h6 text-white">Retirer du club</span>
        </q-card-section>

        <q-card-section>
          <p class="text-grey-4">Êtes-vous sûr de vouloir retirer <strong class="text-white">{{ userToRemove?.firstName }} {{ userToRemove?.lastName }}</strong> du club ?</p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn 
            flat 
            label="Annuler" 
            color="grey-4" 
            class="github-btn-flat"
            v-close-popup 
          />
          <q-btn 
            flat 
            label="Retirer" 
            color="red-4" 
            class="github-btn-danger"
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

<style lang="scss" scoped>
// GitHub-style dialog
.github-dialog {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
}

// GitHub-style card
.github-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
}

// GitHub-style tabs
.github-tabs {
  background: transparent !important;
  
  :deep(.q-tab) {
    color: #8b949e !important;
    
    &.q-tab--active {
      color: #58a6ff !important;
    }
    
    &:hover {
      color: #f0f6fc !important;
    }
  }
  
  :deep(.q-tabs__content) {
    border-bottom: 1px solid #30363d;
  }
}

.github-tab-panels {
  background: transparent !important;
  
  :deep(.q-tab-panel) {
    background: transparent !important;
    color: #f0f6fc !important;
  }
}

// GitHub-style inputs (from previous artifacts)
.github-input {
  :deep(.q-field__control) {
    background: #0d1117 !important;
    border: 1px solid #30363d !important;
    border-radius: 6px !important;
    
    &:hover {
      border-color: #58a6ff !important;
    }
    
    &:focus-within {
      border-color: #58a6ff !important;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3) !important;
    }
  }
  
  :deep(.q-field__native) {
    color: #f0f6fc !important;
    font-size: 14px !important;
  }
  
  :deep(.q-field__label) {
    color: #8b949e !important;
    font-size: 14px !important;
  }
  
  :deep(.q-field__append) {
    .q-icon {
      color: #8b949e !important;
    }
  }
}

// GitHub-style buttons
.github-btn-flat {
  color: #8b949e !important;
  font-size: 14px !important;
  
  &:hover {
    color: #f0f6fc !important;
    background: rgba(177, 186, 196, 0.12) !important;
  }
}

.github-btn-important {
  border: 1px solid #da3633 !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  background: transparent !important;
  color: #f85149 !important;
  
  &:hover {
    background: rgba(248, 81, 73, 0.1) !important;
    border-color: #f85149 !important;
    color: #ff7b72 !important;
  }
}

.github-btn-success {
  color: #238636 !important;
  font-size: 14px !important;
  
  &:hover {
    color: #2ea043 !important;
    background: rgba(35, 134, 54, 0.1) !important;
  }
}

.github-btn-danger {
  color: #f85149 !important;
  
  &:hover {
    color: #ff7b72 !important;
    background: rgba(248, 81, 73, 0.1) !important;
  }
}

.github-action-btn {
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: rgba(177, 186, 196, 0.12) !important;
  }
}

// GitHub-style list
.github-list {
  background: transparent !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
}

.github-list-item {
  border-bottom: 1px solid #21262d;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: rgba(177, 186, 196, 0.06) !important;
  }
}

// GitHub-style table (from previous artifacts)
.github-table {
  background: transparent !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
  
  :deep(.q-table__top) {
    background: #161b22 !important;
    border-bottom: 1px solid #30363d !important;
  }
  
  :deep(.q-table__middle) {
    background: transparent !important;
  }
  
  :deep(.q-table thead tr) {
    background: #161b22 !important;
  }
  
  :deep(.q-table thead th) {
    background: #161b22 !important;
    color: #f0f6fc !important;
    border-bottom: 1px solid #30363d !important;
    font-weight: 600 !important;
  }
  
  :deep(.q-table tbody tr) {
    background: transparent !important;
    
    &:hover {
      background: rgba(177, 186, 196, 0.06) !important;
    }
  }
  
  :deep(.q-table tbody td) {
    color: #e6edf3 !important;
    border-bottom: 1px solid #21262d !important;
  }
  
  :deep(.q-table tbody tr:last-child td) {
    border-bottom: none !important;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .github-dialog {
    margin: 8px !important;
    max-width: calc(100vw - 16px) !important;
  }
}
</style>