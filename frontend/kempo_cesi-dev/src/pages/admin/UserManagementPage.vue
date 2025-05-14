<template>
  <q-page padding>
    <div class="container">
      <h1 class="text-h3 q-mb-md">Gestion des Utilisateurs</h1>
      
      <div class="filters q-mb-md">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <q-input 
              v-model="filter" 
              outlined 
              dense 
              placeholder="Rechercher un utilisateur" 
              clearable
              debounce="300"
            >
              <template v-slot:append>
                <q-icon name="search" />
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
              @update:model-value="loadUsers"
            />
          </div>
        </div>
      </div>
      
      <q-table
        v-model:pagination="pagination"
        :loading="loading"
        :rows="users"
        :columns="columns"
        row-key="_id"
        :filter="filter"
        :rows-per-page-options="[10, 20, 50, 0]"
        flat
        bordered
      >
        <template v-slot:top-right>
          <q-btn 
            color="primary" 
            icon="add" 
            label="Ajouter un utilisateur" 
            @click="openCreateUserDialog"
          />
        </template>
        
        <template v-slot:body-cell-role="props">
          <q-td :props="props">
            <q-badge :color="getRoleColor(props.value)">
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>
        
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="row items-center justify-center q-gutter-xs">
              <q-btn 
                flat 
                round 
                color="primary" 
                icon="edit" 
                size="sm"
                @click="editUser(props.row)"
              >
                <q-tooltip>Modifier l'utilisateur</q-tooltip>
              </q-btn>
              <q-btn 
                flat 
                round 
                color="negative" 
                icon="delete" 
                size="sm"
                @click="confirmDeleteUser(props.row)"
              >
                <q-tooltip>Supprimer l'utilisateur</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Dialog pour créer un nouvel utilisateur -->
    <q-dialog v-model="createUserDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Créer un nouvel utilisateur</div>
        </q-card-section>
        
        <q-card-section class="q-pt-none">
          <q-form @submit="submitCreateUser" ref="createForm">
            <q-input
              v-model="newUser.firstName"
              label="Prénom"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || 'Le prénom est requis']"
            />
            
            <q-input
              v-model="newUser.lastName"
              label="Nom"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || 'Le nom est requis']"
            />
            
            <q-input
              v-model="newUser.email"
              label="Email"
              outlined
              dense
              class="q-mb-md"
              type="email"
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
              class="q-mb-md"
              type="password"
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
              class="q-mb-md"
              :rules="[val => !!val || 'Le rôle est requis']"
            />
          </q-form>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="negative" v-close-popup />
          <q-btn flat label="Créer" color="positive" type="submit" @click="submitCreateUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog pour éditer un utilisateur -->
    <q-dialog v-model="editUserDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Modifier l'utilisateur</div>
        </q-card-section>
        
        <q-card-section class="q-pt-none">
          <q-form @submit="submitEditUser" ref="editForm">
            <q-input
              v-model="editedUser.firstName"
              label="Prénom"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || 'Le prénom est requis']"
            />
            
            <q-input
              v-model="editedUser.lastName"
              label="Nom"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || 'Le nom est requis']"
            />
            
            <q-input
              v-model="editedUser.email"
              label="Email"
              outlined
              dense
              class="q-mb-md"
              type="email"
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
              class="q-mb-md"
              :rules="[val => !!val || 'Le rôle est requis']"
            />
            
            <q-input
              v-model="editedUser.newPassword"
              label="Nouveau mot de passe (laisser vide pour ne pas changer)"
              outlined
              dense
              class="q-mb-md"
              type="password"
              :rules="[
                val => !val || val.length >= 6 || 'Le mot de passe doit contenir au moins 6 caractères'
              ]"
            />
          </q-form>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="negative" v-close-popup />
          <q-btn flat label="Enregistrer" color="positive" type="submit" @click="submitEditUser" />
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

// Supprimer un utilisateur
const confirmDeleteUser = (user) => {
  $q.dialog({
    title: 'Confirmation',
    message: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.firstName} ${user.lastName} ?`,
    cancel: true,
    persistent: true
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
      return 'purple';
    case 'referee':
      return 'blue';
    default:
      return 'green';
  }
};

// Charger les utilisateurs au montage du composant
onMounted(() => {
  loadUsers();
});
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>