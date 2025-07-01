<template>
  <q-layout view="lHh Lpr lFf" class="github-layout">
    <q-header class="github-header">
      <q-toolbar class="github-toolbar">
        <q-toolbar-title class="github-title">
          <q-avatar size="28px" class="q-mr-sm">
            <img src="/kempoimh.png" alt="Logo" />
          </q-avatar>
          Nippon Kempo 
        </q-toolbar-title>
        
        <!-- Bouton vers la page d'accueil - caché quand on est déjà sur l'indexPage -->
        <q-btn
          flat
          round
          dense
          icon="home"
          class="q-mr-sm github-header-btn"
          aria-label="Page d'accueil"
          @click="goToIndexPage"
          v-if="!isOnIndexPage"
        >
          <q-tooltip>Page d'accueil</q-tooltip>
        </q-btn>
        
        <!-- Bouton Administration pour les admins -->
        <q-btn-dropdown
          flat
          dense
          icon="admin_panel_settings"
          class="q-mr-sm github-header-btn"
          aria-label="Administration"
          v-if="isUserLoggedIn && isAdmin"
        >
          <q-list class="github-dropdown">
            <q-item clickable v-close-popup @click="router.push('/admin/users')" class="github-dropdown-item">
              <q-item-section avatar>
                <q-icon name="people" color="grey-4" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-grey-3">Gestion des utilisateurs</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item clickable v-close-popup @click="router.push('/admin/clubs')" class="github-dropdown-item">
              <q-item-section avatar>
                <q-icon name="business" color="grey-4" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-grey-3">Gestion des clubs</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item clickable v-close-popup @click="router.push('/tournaments')" class="github-dropdown-item">
              <q-item-section avatar>
                <q-icon name="emoji_events" color="grey-4" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-grey-3">Gestion des tournois</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        
        <!-- Bouton Sauvegarde pour les admins -->
        <q-btn
          flat
          round
          dense
          icon="backup"
          class="q-mr-sm github-header-btn"
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
          class="github-header-btn"
          @click="goToProfile"
          v-if="isUserLoggedIn"
        >
          <q-tooltip>Mon profil</q-tooltip>
        </q-btn>
        
        <!-- Email de l'utilisateur connecté -->
        <span class="q-mr-md github-user-email" v-if="isUserLoggedIn && userEmail">
          {{ userEmail }}
        </span>
        
        <!-- Bouton de déconnexion -->
        <q-btn
          flat
          round
          dense
          icon="logout"
          aria-label="Déconnexion"
          class="github-header-btn"
          @click="logout"
          v-if="isUserLoggedIn"
        >
          <q-tooltip>Déconnexion</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container class="github-page-container">
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
// GitHub Layout styling
.github-layout {
  background: #0d1117;
}

.github-header {
  background: #161b22 !important;
  border-bottom: 1px solid #30363d;
  box-shadow: none !important;
}

.github-toolbar {
  min-height: 64px;
  padding: 0 16px;
  border: none;
}

.github-title {
  color: #f0f6fc;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.github-header-btn {
  color: #8b949e !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    color: #f0f6fc !important;
    background: rgba(177, 186, 196, 0.12) !important;
  }
  
  // Style pour les icônes
  .q-icon {
    font-size: 16px;
  }
}

.github-user-email {
  font-size: 14px;
  color: #8b949e;
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  font-weight: 500;
}

.github-dropdown {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
  margin-top: 8px;
}

.github-dropdown-item {
  color: #f0f6fc !important;
  padding: 8px 16px !important;
  
  &:hover {
    background: rgba(177, 186, 196, 0.12) !important;
  }
  
  .q-item-label {
    font-size: 14px;
    font-weight: 400;
  }
}

.github-page-container {
  background: #0d1117;
  min-height: calc(100vh - 64px);
}

// Responsive
@media (max-width: 768px) {
  .github-user-email {
    display: none;
  }
  
  .github-toolbar {
    padding: 0 8px;
  }
  
  .github-title {
    font-size: 14px;
  }
}

// Dark scrollbar pour être cohérent
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
</style>