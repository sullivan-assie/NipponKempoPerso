<template>
  <q-page class="landing-page">
    <!-- Section d'entête -->
    <div class="header-section">
      <div class="header-content">
        <div class="logo-container">
          <img src="/kempoimh.png" alt="Nippon Kempo" class="logo" />
        </div>

        <div class="header-text">
          <h1 class="text-h2 text-weight-bold text-black">Nippon Kempo</h1>
          <p class="text-h5 q-mb-lg">Gestion de tournois et compétitions</p>
          <div class="auth-buttons">
            <q-btn
              color="primary"
              label="Connexion / Inscription"
              size="lg"
              rounded
              @click="showAuthModal = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Section des tournois -->
    <div class="tournaments-section q-pa-md q-py-lg">
      <div class="container">
        <h2 class="text-h3 text-center q-mb-xl">Tournois à venir</h2>
        
        <div v-if="loading" class="text-center">
          <q-spinner size="3em" color="primary" />
          <p class="text-subtitle1 q-mt-md">Chargement des tournois...</p>
        </div>
        
        <div v-else-if="tournaments.length === 0" class="text-center q-pa-xl">
          <q-icon name="event_busy" size="4em" color="grey-7" />
          <p class="text-subtitle1 q-mt-md">Aucun tournoi à venir pour le moment.</p>
        </div>
        
        <div v-else class="row q-col-gutter-lg">
          <div v-for="tournament in tournaments" :key="tournament._id" class="col-12 col-sm-6 col-md-4">
            <q-card class="tournament-card" flat bordered>
              <q-img 
                :src="tournament.imageUrl || '/Image1MainMenu.png'" 
                height="200px"
                class="tournament-image"
              />
              <q-card-section>
                <div class="text-h6">{{ tournament.name }}</div>
                <div class="text-subtitle2">{{ formatDate(tournament.startDate) }} - {{ formatDate(tournament.endDate) }}</div>
                <div class="text-body2 q-mt-sm">{{ tournament.location }}</div>
              </q-card-section>
              <q-card-section>
                <div class="text-body2">
                  {{ tournament.description || 'Pas de description disponible.' }}
                </div>
              </q-card-section>
              <q-card-actions>
                <q-btn flat color="primary" label="Voir détails" @click="showAuthModal = true" />
                <q-space />
                <q-badge color="secondary" v-if="tournament.categories?.length">
                  {{ tournament.categories?.length }} catégorie{{ tournament.categories?.length > 1 ? 's' : '' }}
                </q-badge>
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Section description -->
    <div class="feature-section q-pa-md q-py-lg bg-grey-2">
      <div class="container">
        <div class="row q-col-gutter-xl">
          <div class="col-12 col-md-6">
            <h3 class="text-h4 q-mb-md">Organisez vos tournois de Nippon Kempo</h3>
            <p class="text-body1">
              Notre plateforme vous permet de gérer facilement tous les aspects de vos tournois de Nippon Kempo :
            </p>
            <ul class="text-body1 q-my-md">
              <li class="q-mb-sm">Création et gestion de tournois</li>
              <li class="q-mb-sm">Inscription des compétiteurs et formation d'équipes</li>
              <li class="q-mb-sm">Génération automatique de poules et de brackets</li>
              <li class="q-mb-sm">Suivi des résultats en temps réel</li>
            </ul>
            <p class="text-body1">
              Pour accéder à toutes les fonctionnalités, veuillez vous connecter ou créer un compte.
            </p>
            <q-btn color="primary" label="En savoir plus" flat @click="showAuthModal = true" />
          </div>
          <div class="col-12 col-md-6 flex flex-center">
            <img src="/Image3MainMenu.png" class="feature-image" alt="Gestion de tournoi" />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-section q-pa-md bg-dark text-white">
      <div class="container">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4 q-mb-md">
            <h6 class="text-h6">Nippon Kempo</h6>
            <p class="text-body2">
              Plateforme de gestion de tournois et compétitions de Nippon Kempo.
            </p>
          </div>
          <div class="col-12 col-md-4 q-mb-md">
            <h6 class="text-h6">Liens rapides</h6>
            <q-list dense>
              <q-item clickable @click="toggleAuthMode('login')">
                <q-item-section>Connexion</q-item-section>
              </q-item>
              <q-item clickable @click="toggleAuthMode('register')">
                <q-item-section>Inscription</q-item-section>
              </q-item>
              <q-item clickable to="/forgot-password">
                <q-item-section>Mot de passe oublié</q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="col-12 col-md-4 q-mb-md">
            <h6 class="text-h6">Contact</h6>
            <p class="text-body2">
              Pour toute question ou assistance, contactez-nous à support@nipponkempo.fr
            </p>
          </div>
        </div>
        <div class="text-center q-pt-md q-mt-md" style="border-top: 1px solid rgba(255, 255, 255, 0.2);">
          <p class="text-caption">© {{ new Date().getFullYear() }} Nippon Kempo - Tous droits réservés</p>
        </div>
      </div>
    </div>

    <!-- Modal d'authentification -->
    <auth-modal
      :isOpen="showAuthModal"
      :initialMode="isRegister ? 'register' : 'login'"
      @update:isOpen="showAuthModal = $event"
      @auth-success="onAuthSuccess"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import { date } from 'quasar';
import AuthModal from 'components/AuthModal.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);
const tournaments = ref([]);
const showAuthModal = ref(false);
const isRegister = ref(false);

// Formater les dates pour l'affichage
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return date.formatDate(new Date(dateStr), 'DD/MM/YYYY');
};

// Basculer entre le mode inscription et connexion
const toggleAuthMode = (mode) => {
  isRegister.value = mode === 'register';
  showAuthModal.value = true;
};

// Récupérer la liste des tournois publics
const fetchTournaments = async () => {
  loading.value = true;
  try {
    // Endpoint pour récupérer les tournois publics ou à venir
    const response = await api.get('/tournaments/public');
    tournaments.value = response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des tournois:', error);
    tournaments.value = [];
  } finally {
    loading.value = false;
  }
};

// Vérifier si l'utilisateur est connecté et le rediriger en fonction de son rôle
const checkUserAndRedirect = () => {
  // Récupérer les informations de l'utilisateur depuis le localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      // Parser les données de l'utilisateur
      const user = JSON.parse(userStr);
      
      // Rediriger en fonction du rôle
      if (user.role === 'admin') {
        // Si c'est un admin, rediriger vers la page d'administration
        router.push('/admin/users');
      } else {
        // Si c'est un utilisateur normal, rediriger vers la liste des tournois
        router.push('/tournaments');
      }
    } catch (e) {
      console.error('Erreur lors de la récupération des données utilisateur:', e);
    }
  } else {
    // Si l'utilisateur n'est pas connecté, charger normalement la page
    fetchTournaments();
  }
};

// Action après une authentification réussie
const onAuthSuccess = (user) => {
  if (user.role === 'admin') {
    // Rediriger l'admin vers la page d'administration
    router.push('/admin/users');
  } else {
    // Rediriger l'utilisateur normal vers la liste des tournois
    router.push('/tournaments');
  }
};

// Exécuter la vérification et la redirection au montage du composant
onMounted(() => {
  checkUserAndRedirect();
});
</script>

<style lang="scss" scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header-section {
  background: linear-gradient(135deg, #3B82F6 0%, #9333EA 100%);
  color: white;
  padding: 80px 24px;
  
  @media (max-width: 600px) {
    padding: 60px 16px;
  }
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
}

.logo-container {
  margin-right: 60px;
  
  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 30px;
  }
}

.logo {
  width: 200px;
  height: auto;
  
  @media (max-width: 768px) {
    width: 150px;
  }
}

.header-text {
  flex: 1;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.tournament-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
}

.tournament-image {
  object-fit: cover;
}

.feature-section {
  padding: 80px 24px;
  
  @media (max-width: 600px) {
    padding: 60px 16px;
  }
}

.feature-image {
  max-width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
}

.footer-section {
  padding: 40px 24px;
  margin-top: auto;
}

.auth-buttons {
  margin-top: 30px;
}
</style>
