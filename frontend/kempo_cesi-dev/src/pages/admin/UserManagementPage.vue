<template>
  <q-page class="github-page" padding>
    <div class="container">
      <h1 class="text-h3 q-mb-md text-white">Gestion des Utilisateurs</h1>
      
      <q-card flat class="github-card q-mb-xl">
        <q-card-section>
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <q-input 
                v-model="filter" 
                outlined 
                dense 
                placeholder="Rechercher un utilisateur" 
                clearable
                debounce="300"
                dark
                color="grey-4"
                label-color="grey-4"
                class="github-input"
              >
                <template v-slot:append>
                  <q-icon name="search" color="grey-4" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-select 
                v-model="roleFilter" 
                :options="roleOptions" 
                outlined 
                dense 
                emit-value 
                map-options
                label="Filtrer par rôle" 
                clearable
                dark
                color="grey-4"
                label-color="grey-4"
                class="github-input"
                @update:model-value="loadUsers"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
      
      <q-card flat class="github-card">
        <q-card-section class="q-pa-none">
          <q-table
            v-model:pagination="pagination"
            :loading="loading"
            :rows="users"
            :columns="columns"
            row-key="_id"
            :filter="filter"
            :rows-per-page-options="[10, 20, 50, 0]"
            flat
            class="github-table"
            dark
          >
            <template v-slot:top-right>
              <q-btn 
                color="negative"
                text-color="white"
                icon="add" 
                label="Ajouter un utilisateur"
                outline
                class="github-btn-important"
                @click="openCreateUserDialog"
              />
            </template>
            
            <template v-slot:body-cell-role="props">
              <q-td :props="props">
                <q-badge :color="getRoleColor(props.value)" text-color="white">
                  {{ getRoleLabel(props.value) }}
                </q-badge>
              </q-td>
            </template>
            
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <div class="row items-center justify-center q-gutter-xs">
                  <q-btn 
                    flat 
                    round 
                    color="grey-4" 
                    icon="edit" 
                    size="sm"
                    class="github-action-btn"
                    @click="editUser(props.row)"
                  >
                    <q-tooltip>Modifier l'utilisateur</q-tooltip>
                  </q-btn>
                  <q-btn 
                    flat 
                    round 
                    color="red-4" 
                    icon="delete" 
                    size="sm"
                    class="github-action-btn"
                    @click="confirmDeleteUser(props.row)"
                  >
                    <q-tooltip>Supprimer l'utilisateur</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- Dialog pour créer un nouvel utilisateur -->
    <q-dialog v-model="createUserDialog" persistent>
      <q-card class="github-dialog" style="min-width: 350px">
        <q-card-section>
          <div class="text-h6 text-white">Créer un nouvel utilisateur</div>
        </q-card-section>
        
        <q-card-section class="q-pt-none">
          <q-form @submit="submitCreateUser" ref="createForm">
            <q-input
              v-model="newUser.firstName"
              label="Prénom"
              outlined
              dense
              class="q-mb-md github-input"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[val => !!val || 'Le prénom est requis']"
            />
            
            <q-input
              v-model="newUser.lastName"
              label="Nom"
              outlined
              dense
              class="q-mb-md github-input"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[val => !!val || 'Le nom est requis']"
            />
            
            <q-input
              v-model="newUser.email"
              label="Email"
              outlined
              dense
              class="q-mb-md github-input"
              type="email"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[
                val => !!val || 'L\'email est requis',
                val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Adresse email invalide'
              ]"
            />
            
            <q-input
              v-model="newUser.password"
              label="Mot de passe"
              outlined
              dense
              class="q-mb-md github-input"
              type="password"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[
                val => !!val || 'Le mot de passe est requis',
                val => val.length >= 6 || 'Le mot de passe doit contenir au moins 6 caractères'
              ]"
            />
            
            <q-select
              v-model="newUser.role"
              :options="roleOptions"
              label="Rôle"
              outlined
              dense
              class="q-mb-md github-input"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[val => !!val || 'Le rôle est requis']"
            />
          </q-form>
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
            label="Créer" 
            color="positive" 
            class="github-btn-success"
            type="submit" 
            @click="submitCreateUser" 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog pour éditer un utilisateur -->
    <q-dialog v-model="editUserDialog" persistent>
      <q-card class="github-dialog" style="min-width: 350px">
        <q-card-section>
          <div class="text-h6 text-white">Modifier l'utilisateur</div>
        </q-card-section>
        
        <q-card-section class="q-pt-none">
          <q-form @submit="submitEditUser" ref="editForm">
            <q-input
              v-model="editedUser.firstName"
              label="Prénom"
              outlined
              dense
              class="q-mb-md github-input"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[val => !!val || 'Le prénom est requis']"
            />
            
            <q-input
              v-model="editedUser.lastName"
              label="Nom"
              outlined
              dense
              class="q-mb-md github-input"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[val => !!val || 'Le nom est requis']"
            />
            
            <q-input
              v-model="editedUser.email"
              label="Email"
              outlined
              dense
              class="q-mb-md github-input"
              type="email"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[
                val => !!val || 'L\'email est requis',
                val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Adresse email invalide'
              ]"
            />
            
            <q-select
              v-model="editedUser.role"
              :options="roleOptions"
              label="Rôle"
              outlined
              dense
              class="q-mb-md github-input"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[val => !!val || 'Le rôle est requis']"
            />
            
            <q-input
              v-model="editedUser.newPassword"
              label="Nouveau mot de passe (laisser vide pour ne pas changer)"
              outlined
              dense
              class="q-mb-md github-input"
              type="password"
              dark
              color="grey-4"
              label-color="grey-4"
              :rules="[
                val => !val || val.length >= 6 || 'Le mot de passe doit contenir au moins 6 caractères'
              ]"
            />
          </q-form>
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
            label="Enregistrer" 
            color="positive" 
            class="github-btn-success"
            type="submit" 
            @click="submitEditUser" 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

const $q = useQuasar();
const loading = ref(false);
const users = ref([]);
const filter = ref('');
const roleFilter = ref(null);
const createUserDialog = ref(false);
const editUserDialog = ref(false);
const newUser = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'user'
});
const editedUser = ref({
  _id: '',
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  newPassword: ''
});
const pagination = ref({
  sortBy: 'lastName',
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
});

const columns = [
  { name: 'firstName', align: 'left', label: 'Prénom', field: 'firstName', sortable: true },
  { name: 'lastName', align: 'left', label: 'Nom', field: 'lastName', sortable: true },
  { name: 'email', align: 'left', label: 'Email', field: 'email', sortable: true },
  { name: 'role', align: 'center', label: 'Rôle', field: 'role', sortable: true },
  { name: 'createdAt', align: 'center', label: 'Date de création', field: 'createdAt', sortable: true,
    format: val => new Date(val).toLocaleDateString('fr-FR') },
  { name: 'actions', align: 'center', label: 'Actions', field: '', sortable: false }
];

const roleOptions = [
  { label: 'Utilisateur', value: 'user' },
  { label: 'Administrateur', value: 'admin' },
  { label: 'Arbitre', value: 'referee' }
];

// Charger la liste des utilisateurs
const loadUsers = async () => {
  loading.value = true;
  try {
    let url = '/users';
    if (roleFilter.value) {
      url += `?role=${roleFilter.value}`;
    }
    const response = await api.get(url);
    users.value = response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
    $q.notify({
      color: 'negative',
      message: 'Erreur lors du chargement des utilisateurs',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Ouvrir le dialog de création d'utilisateur
const openCreateUserDialog = () => {
  newUser.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user'
  };
  createUserDialog.value = true;
};

// Créer un nouvel utilisateur
const submitCreateUser = async () => {
  try {
    await api.post('/auth/register', newUser.value);
    
    $q.notify({
      color: 'positive',
      message: 'Utilisateur créé avec succès',
      icon: 'check_circle'
    });
    
    createUserDialog.value = false;
    await loadUsers();
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur',
      icon: 'error'
    });
  }
};

// Éditer un utilisateur
const editUser = (user) => {
  editedUser.value = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    newPassword: ''
  };
  editUserDialog.value = true;
};

// Soumettre les modifications d'un utilisateur
const submitEditUser = async () => {
  try {
    const userData = { ...editedUser.value };
    
    // Ne pas envoyer le mot de passe s'il est vide
    if (!userData.newPassword) {
      delete userData.newPassword;
    }
    
    await api.put(`/users/${userData._id}`, userData);
    
    $q.notify({
      color: 'positive',
      message: 'Utilisateur mis à jour avec succès',
      icon: 'check_circle'
    });
    
    editUserDialog.value = false;
    await loadUsers();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur',
      icon: 'error'
    });
  }
};

// Supprimer un utilisateur avec dialog GitHub
const confirmDeleteUser = (user) => {
  $q.dialog({
    title: 'Confirmation',
    message: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.firstName} ${user.lastName} ?`,
    cancel: true,
    persistent: true,
    dark: true,
    class: 'github-dialog'
  }).onOk(async () => {
    try {
      await api.delete(`/users/${user._id}`);
      
      $q.notify({
        color: 'positive',
        message: 'Utilisateur supprimé avec succès',
        icon: 'check_circle'
      });
      
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      $q.notify({
        color: 'negative',
        message: error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur',
        icon: 'error'
      });
    }
  });
};

// Obtenir la couleur pour un badge de rôle
const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'purple-5';
    case 'referee':
      return 'blue-5';
    default:
      return 'green-5';
  }
};

// Obtenir le label pour un rôle
const getRoleLabel = (role) => {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'referee':
      return 'Arbitre';
    default:
      return 'Utilisateur';
  }
};

// Charger les utilisateurs au montage du composant
onMounted(() => {
  loadUsers();
});
</script>

<style lang="scss" scoped>
// Page background
.github-page {
  background: #0d1117;
  color: #f0f6fc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

// GitHub-style card
.github-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
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

// GitHub-style table
.github-table {
  background: transparent !important;
  border-radius: 6px !important;
  overflow: hidden;
  
  :deep(.q-table__top) {
    background: #161b22 !important;
    border-bottom: 1px solid #30363d !important;
    padding: 16px !important;
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
    font-size: 14px !important;
  }
  
  :deep(.q-table tbody tr) {
    background: transparent !important;
    border-bottom: 1px solid #21262d !important;
    
    &:hover {
      background: rgba(177, 186, 196, 0.06) !important;
    }
    
    &:last-child {
      border-bottom: none !important;
    }
  }
  
  :deep(.q-table tbody td) {
    color: #e6edf3 !important;
    font-size: 14px !important;
    padding: 12px 16px !important;
  }
  
  :deep(.q-spinner) {
    color: #58a6ff !important;
  }
}

// GitHub-style buttons
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

.github-btn-flat {
  color: #8b949e !important;
  font-size: 14px !important;
  
  &:hover {
    color: #f0f6fc !important;
    background: rgba(177, 186, 196, 0.12) !important;
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

.github-action-btn {
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: rgba(177, 186, 196, 0.12) !important;
  }
}

// GitHub-style dialog
.github-dialog {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
}

// Custom scrollbar
:deep(*) {
  scrollbar-width: thin;
  scrollbar-color: #30363d #0d1117;
}

:deep(*::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(*::-webkit-scrollbar-track) {
  background: #0d1117;
}

:deep(*::-webkit-scrollbar-thumb) {
  background: #30363d;
  border-radius: 4px;
}

:deep(*::-webkit-scrollbar-thumb:hover) {
  background: #484f58;
}

// Responsive
@media (max-width: 768px) {
  .github-table {
    :deep(.q-table__top) {
      flex-direction: column;
      align-items: stretch;
      
      .q-btn {
        margin-top: 1rem;
        align-self: flex-end;
      }
    }
  }
}
</style>