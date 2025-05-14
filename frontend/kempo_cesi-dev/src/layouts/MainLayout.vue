<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          Nippon Kempo
        </q-toolbar-title>
        
        <!-- Bouton vers la page d'accueil - caché quand on est déjà sur l'indexPage -->
        <q-btn
          flat
          round
          dense
          icon="home"
          class="q-mr-sm"
          aria-label="Page d'accueil"
          @click="goToIndexPage"
          v-if="!isOnIndexPage"
        >
          <q-tooltip>Page d'accueil</q-tooltip>
        </q-btn>
        
        <!-- Bouton de retour au menu principal
        <q-btn
          flat
          round
          dense
          icon="dashboard"
          class="q-mr-sm"
          aria-label="Menu principal"
          @click="goToMainMenu"
          v-if="!isOnMainMenu"
        >
          <q-tooltip>Menu principal</q-tooltip>
        </q-btn> -->
        
        <!-- Bouton Administration pour les admins -->
        <q-btn
          flat
          round
          dense
          icon="admin_panel_settings"
          class="q-mr-sm"
          aria-label="Administration"
          @click="goToAdmin"
          v-if="isUserLoggedIn && isAdmin"
        >
          <q-tooltip>Gestion administrateur</q-tooltip>
        </q-btn>
        
        <!-- Bouton Sauvegarde pour les admins -->
        <q-btn
          flat
          round
          dense
          icon="backup"
          class="q-mr-sm"
          aria-label="Sauvegarde"
          @click="showBackupManager = true"
          v-if="isUserLoggedIn && isAdmin"
        >
          <q-tooltip>Sauvegarde de la base de données</q-tooltip>
        </q-btn>
        
        <!-- Bouton Mon profil -->
        <q-btn
          flat
          round
          dense
          icon="account_circle"
          aria-label="Mon profil"
          @click="goToProfile"
          v-if="isUserLoggedIn"
        >
          <q-tooltip>Mon profil</q-tooltip>
        </q-btn>
        
        <!-- Email de l'utilisateur connecté -->
        <span class="q-mr-md user-email" v-if="isUserLoggedIn && userEmail">
          {{ userEmail }}
        </span>
        
        <!-- Bouton de déconnexion -->
        <q-btn
          flat
          round
          dense
          icon="logout"
          aria-label="Déconnexion"
          @click="logout"
          v-if="isUserLoggedIn"
        >
          <q-tooltip>Déconnexion</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
    
    <!-- Composant de gestion des sauvegardes -->
    <BackupManager v-model="showBackupManager" />
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BackupManager from 'src/components/BackupManager.vue';

const router = useRouter();
const route = useRoute();
const isUserLoggedIn = ref(false);
const isAdmin = ref(false);
const userEmail = ref('');
const showBackupManager = ref(false);

// Vérifier si l'utilisateur est sur la page du menu principal
const isOnMainMenu = computed(() => {
  return route.path === '/main-menu';
});

// Vérifier si l'utilisateur est sur la page d'index
const isOnIndexPage = computed(() => {
  return route.path === '/';
});

// Vérifier si l'utilisateur est connecté au chargement et lors des changements de route
const checkLoginStatus = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  isUserLoggedIn.value = !!(token && user);
  
  // Vérifier si l'utilisateur est admin et récupérer son email
  if (isUserLoggedIn.value && user) {
    try {
      const userData = JSON.parse(user);
      isAdmin.value = userData.role === 'admin';
      userEmail.value = userData.email || '';
    } catch (e) {
      isAdmin.value = false;
      userEmail.value = '';
    }
  } else {
    isAdmin.value = false;
    userEmail.value = '';
  }
};

// Fonction de redirection vers la page d'accueil
const goToIndexPage = () => {
  router.push('/');
};

// Fonction de retour au menu principal
const goToMainMenu = () => {
  router.push('/main-menu');
};

// Fonction Admin - modifiée pour rediriger vers l'indexPage
const goToAdmin = () => {
  router.push('/');
};

// Fonction Mon profil
const goToProfile = () => {
  router.push('/profil');
};

// Fonction de déconnexion
const logout = () => {
  // Supprimer les tokens du localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Notification de déconnexion réussie
  import('quasar').then(({ Notify }) => {
    Notify.create({
      type: 'positive',
      message: 'Déconnexion réussie',
      position: 'top-right',
      timeout: 2000
    });
  });
  
  // Rediriger vers la page d'accueil
  router.push('/');
};

// Effectuer la vérification au chargement
onMounted(() => {
  checkLoginStatus();
});

// Écouter les changements de route pour mettre à jour le statut de connexion
router.afterEach(() => {
  checkLoginStatus();
});
</script>

<style lang="scss" scoped>
.q-toolbar {
  min-height: 56px;
}

.user-email {
  font-size: 0.9rem;
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
