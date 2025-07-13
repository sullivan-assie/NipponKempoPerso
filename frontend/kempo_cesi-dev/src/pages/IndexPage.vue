<template>
  <q-page class="landing-page bg-dark-page text-white">
    <!-- Hero Section -->
    <section class="hero-section bg-dark text-white">
      <div class="container q-pa-xl">
        <div class="row items-center q-col-gutter-xl">
          <div class="col-12 col-md-7">
            <q-badge color="grey-8" text-color="grey-3" class="q-mb-md">
              <q-icon name="sports_martial_arts" class="q-mr-xs" />
              Plateforme officielle
            </q-badge>
            
            <h1 class="text-h2 text-weight-bold q-mb-md text-white">
              Nippon Kempo Tournament Manager
            </h1>
            
            <p class="text-h6 text-weight-light q-mb-xl text-grey-4">
              La solution complète pour organiser et gérer vos tournois de Nippon Kempo. 
              Inscriptions, brackets, résultats en temps réel.
            </p>
            
            <div class="q-gutter-md">
              <q-btn
                size="lg"
                color="negative"
                text-color="white"
                label="Commencer"
                icon="rocket_launch"
                outline
                class="github-btn-important"
                @click="showAuthModal = true"
              />
              <q-btn
                size="lg"
                color="grey-6"
                text-color="white"
                label="En savoir plus"
                outline
                class="github-btn"
                @click="scrollToTournaments"
              />
            </div>
          </div>
          
          <div class="col-12 col-md-5 text-center">
            <q-card class="hero-card bg-grey-9 text-white">
              <q-card-section class="text-center">
                <q-avatar size="80px">
                  <img src="/kempoimh.png" alt="Logo" />
                </q-avatar>
                <div class="text-h6 q-mt-md text-white">Tournoi National 2025</div>
                <q-linear-progress value="0.7" color="primary" class="q-my-md" />
                <div class="text-body2 text-grey-4">142 participants inscrits</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Section Separator -->
    <div class="section-separator"></div>
    
    <!-- Tournaments Section -->
    <section ref="tournamentsSection" class="q-pa-xl bg-dark">
      <div class="container">
        <div class="text-center q-mb-xl">
          <h2 class="text-h3 text-weight-bold q-mb-md text-white">Tournois à venir</h2>
          <p class="text-body1 text-grey-4">
            Découvrez les prochains tournois et inscrivez-vous dès maintenant
          </p>
        </div>
        
        <!-- Search Filters -->
        <q-card flat class="github-card q-mb-xl">
          <q-card-section>
            <div class="row justify-center q-col-gutter-md">
              <div class="col-12 col-sm-5 col-md-4">
                <q-input
                  v-model="dateFilter.startDate"
                  outlined
                  type="date"
                  label="Date de début"
                  dark
                  color="grey-4"
                  label-color="grey-4"
                  class="github-input"
                  @update:model-value="filterTournaments"
                >
                  <template v-slot:prepend>
                    <q-icon name="event" color="grey-4" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-5 col-md-4">
                <q-input
                  v-model="dateFilter.endDate"
                  outlined
                  type="date"
                  label="Date de fin"
                  dark
                  color="grey-4"
                  label-color="grey-4"
                  class="github-input"
                  @update:model-value="filterTournaments"
                >
                  <template v-slot:prepend>
                    <q-icon name="event" color="grey-4" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-2 col-md-1 flex items-end justify-center">
                <q-btn
                  color="grey-6"
                  text-color="white"
                  icon="refresh"
                  outline
                  round
                  class="github-btn-icon"
                  @click="resetFilters"
                >
                  <q-tooltip>Réinitialiser les filtres</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
        
        <!-- Loading -->
        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner size="3em" color="primary" />
          <p class="text-h6 q-mt-md text-grey-4">Chargement...</p>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="filteredTournaments.length === 0" class="text-center q-pa-xl">
          <q-icon name="event_busy" size="4em" color="grey-6" />
          <h3 class="text-h5 q-mt-md text-grey-4">Aucun tournoi trouvé</h3>
          <p class="text-body1 text-grey-5 q-mb-md">
            Aucun tournoi ne correspond à vos critères.
          </p>
          <q-btn 
            color="grey-6"
            text-color="white"
            label="Réinitialiser" 
            outline
            class="github-btn"
            @click="resetFilters" 
          />
        </div>
        
        <!-- Tournaments Grid -->
        <div v-else class="row q-col-gutter-lg">
          <div 
            v-for="tournament in filteredTournaments" 
            :key="tournament._id" 
            class="col-12 col-sm-6 col-lg-4"
          >
            <q-card flat class="github-card full-height">
              <q-img 
                :src="tournament.imageUrl || '/Image1MainMenu.png'" 
                height="200px"
                class="bg-grey-8"
              />
              
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <q-chip 
                    color="grey-8" 
                    text-color="grey-3" 
                    icon="schedule"
                    size="sm"
                  >
                    {{ formatDateRange(tournament.startDate, tournament.endDate) }}
                  </q-chip>
                  <q-space />
                  <q-badge 
                    v-if="tournament.categories?.length"
                    color="grey-7"
                    text-color="white"
                  >
                    {{ tournament.categories.length }} catégorie{{ tournament.categories.length > 1 ? 's' : '' }}
                  </q-badge>
                </div>
                
                <h3 class="text-h6 text-weight-medium q-mb-sm text-white">
                  {{ tournament.name }}
                </h3>
                
                <div class="row items-center q-mb-sm text-grey-4">
                  <q-icon name="location_on" class="q-mr-xs" />
                  <span>{{ tournament.location }}</span>
                </div>
                
                <p class="text-body2 text-grey-5">
                  {{ tournament.description || 'Pas de description disponible.' }}
                </p>
              </q-card-section>
              
              <!-- Categories -->
              <q-card-section v-if="tournament.categories?.length" class="q-pt-none">
                <q-expansion-item
                  icon="category"
                  label="Voir les catégories"
                  :caption="`${tournament.categories.length} catégorie(s)`"
                  text-color="grey-4"
                  dark
                >
                  <q-list dense dark>
                    <q-item v-for="category in tournament.categories" :key="category._id">
                      <q-item-section>
                        <q-item-label class="text-grey-3">{{ category.name }}</q-item-label>
                        <q-item-label caption class="text-grey-5">
                          <span v-if="category.weightMin || category.weightMax">
                            {{ category.weightMin || '0' }}-{{ category.weightMax || '∞' }} kg
                          </span>
                          <span v-if="category.gender" class="q-ml-sm">
                            • {{ category.gender === 'M' ? 'Hommes' : category.gender === 'F' ? 'Femmes' : 'Mixte' }}
                          </span>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-chip 
                          :color="category.type === 'individual' ? 'primary' : 'secondary'" 
                          text-color="white"
                          size="sm"
                        >
                          {{ category.type === 'individual' ? 'Individuel' : 'Poids' }}
                        </q-chip>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>
              </q-card-section>
              
              <q-card-actions>
                <q-btn 
                  color="grey-6" 
                  text-color="white"
                  label="Voir détails" 
                  outline
                  class="github-btn"
                  @click="showAuthModal = true" 
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Section Separator -->
    <div class="section-separator"></div>

    <!-- Features Section -->
    <section class="bg-dark q-pa-xl">
      <div class="container">
        <div class="text-center q-mb-xl">
          <h2 class="text-h3 text-weight-bold q-mb-md text-white">Fonctionnalités</h2>
          <p class="text-body1 text-grey-4">
            Tout ce dont vous avez besoin pour gérer vos tournois
          </p>
        </div>
        
        <div class="row q-col-gutter-lg">
          <div 
            v-for="feature in features" 
            :key="feature.title" 
            class="col-12 col-sm-6 col-lg-4"
          >
            <q-card flat class="github-card text-center q-pa-lg full-height">
              <q-icon 
                :name="feature.icon" 
                :color="feature.color" 
                size="3rem" 
                class="q-mb-md" 
              />
              <h4 class="text-h6 text-weight-medium q-mb-sm text-white">
                {{ feature.title }}
              </h4>
              <p class="text-body2 text-grey-4">
                {{ feature.description }}
              </p>
            </q-card>
          </div>
        </div>
        
        <div class="text-center q-mt-xl">
          <q-btn 
            size="lg"
            color="negative"
            text-color="white"
            label="Découvrir toutes les fonctionnalités" 
            outline
            class="github-btn-important"
            @click="showAuthModal = true" 
          />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-grey-9 text-white q-pa-xl github-footer">
      <div class="container">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-4">
            <div class="row items-center q-mb-md">
              <q-avatar size="32px" class="q-mr-sm">
                <img src="/kempoimh.png" alt="Logo" />
              </q-avatar>
              <span class="text-h6 text-weight-medium text-white">Nippon Kempo</span>
            </div>
            <p class="text-body2 text-grey-4">
              La plateforme de référence pour organiser et gérer vos tournois de Nippon Kempo.
            </p>
          </div>
          
          <div class="col-12 col-md-2">
            <h6 class="text-subtitle1 text-weight-medium q-mb-md text-grey-3">Plateforme</h6>
            <q-list dense class="text-grey-5">
              <q-item clickable @click="toggleAuthMode('login')" class="text-grey-5">
                <q-item-section>Connexion</q-item-section>
              </q-item>
              <q-item clickable @click="toggleAuthMode('register')" class="text-grey-5">
                <q-item-section>Inscription</q-item-section>
              </q-item>
            </q-list>
          </div>
          
          <div class="col-12 col-md-3">
            <h6 class="text-subtitle1 text-weight-medium q-mb-md text-grey-3">Support</h6>
            <q-list dense class="text-grey-5">
              <div class="col-12 col-md-3">
  <h6 class="text-subtitle1 text-weight-medium q-mb-md text-grey-3">Support</h6>
  <q-list dense class="text-grey-5">
    <q-item 
      clickable 
      class="text-grey-5"
      @click="openSupportTicket"
    >
      <q-item-section avatar>
        <q-icon name="bug_report" color="negative" />
      </q-item-section>
      <q-item-section>Signaler un problème</q-item-section>
    </q-item>
    
    <q-item 
      clickable 
      class="text-grey-5"
      @click="openEvolutionRequest"
    >
      <q-item-section avatar>
        <q-icon name="lightbulb" color="warning" />
      </q-item-section>
      <q-item-section>Demander une évolution</q-item-section>
    </q-item>
    
    <q-item 
      clickable 
      class="text-grey-5"
      @click="openSupportDashboard"
    >
      <q-item-section avatar>
        <q-icon name="dashboard" color="primary" />
      </q-item-section>
      <q-item-section>Suivi de mes tickets</q-item-section>
    </q-item>
    
    <q-item clickable class="text-grey-5">
      <q-item-section avatar>
        <q-icon name="help" color="info" />
      </q-item-section>
      <q-item-section>Centre d'aide</q-item-section>
    </q-item>
  </q-list>
</div>
              <q-item clickable class="text-grey-5">
                <q-item-section>Centre d'aide</q-item-section>
              </q-item>
              <q-item clickable class="text-grey-5">
                <q-item-section>Contact</q-item-section>
              </q-item>
            </q-list>
          </div>
          
          <div class="col-12 col-md-3">
            <h6 class="text-subtitle1 text-weight-medium q-mb-md text-grey-3">Contact</h6>
            <div class="text-body2 text-grey-5">
              <div class="q-mb-sm">
                <q-icon name="email" class="q-mr-sm" />
                support@nipponkempo.fr
              </div>
              <div class="q-mb-sm">
                <q-icon name="location_on" class="q-mr-sm" />
                Paris, France
              </div>
            </div>
          </div>
        </div>
        
        <q-separator color="grey-8" class="q-my-lg" />
        
        <div class="row items-center">
          <div class="col-12 col-md-6">
            <p class="text-caption text-grey-6">
              © {{ new Date().getFullYear() }} Nippon Kempo. Tous droits réservés.
            </p>
          </div>
          <div class="col-12 col-md-6 text-right">
            <q-btn flat size="sm" label="Mentions légales" color="grey-5" />
            <q-btn flat size="sm" label="Confidentialité" color="grey-5" />
          </div>
        </div>
      </div>
    </footer>

    <!-- Auth Modal -->
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
const filteredTournaments = ref([]);
const showAuthModal = ref(false);
const isRegister = ref(false);
const tournamentsSection = ref(null);

const dateFilter = ref({
  startDate: '',
  endDate: ''
});

const features = [
  {
    icon: 'event_note',
    color: 'primary',
    title: 'Gestion de tournois',
    description: 'Créez et gérez facilement vos tournois avec notre interface intuitive.'
  },
  {
    icon: 'groups',
    color: 'secondary',
    title: 'Inscriptions en ligne',
    description: 'Permettez aux participants de s\'inscrire directement en ligne.'
  },
  {
    icon: 'account_tree',
    color: 'accent',
    title: 'Brackets automatiques',
    description: 'Génération automatique des poules et des arbres de tournoi.'
  },
  {
    icon: 'speed',
    color: 'positive',
    title: 'Résultats temps réel',
    description: 'Suivez et partagez les résultats en direct pendant les compétitions.'
  },
  {
    icon: 'analytics',
    color: 'info',
    title: 'Statistiques',
    description: 'Analysez les performances avec des statistiques complètes.'
  },
  {
    icon: 'mobile_friendly',
    color: 'warning',
    title: 'Interface mobile',
    description: 'Accédez à toutes les fonctionnalités depuis votre smartphone.'
  }
];

// Utility functions
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return date.formatDate(new Date(dateStr), 'DD/MM/YYYY');
};

const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start === end) return start;
  return `${start} - ${end}`;
};

const scrollToTournaments = () => {
  if (tournamentsSection.value) {
    tournamentsSection.value.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

const toggleAuthMode = (mode) => {
  isRegister.value = mode === 'register';
  showAuthModal.value = true;
};

const filterTournaments = () => {
  const { startDate, endDate } = dateFilter.value;
  filteredTournaments.value = tournaments.value.filter(tournament => {
    const tournamentStartDate = new Date(tournament.startDate);
    const tournamentEndDate = new Date(tournament.endDate);
    const filterStartDate = startDate ? new Date(startDate) : null;
    const filterEndDate = endDate ? new Date(endDate) : null;

    return (!filterStartDate || tournamentStartDate >= filterStartDate) &&
           (!filterEndDate || tournamentEndDate <= filterEndDate);
  });
};

const resetFilters = () => {
  dateFilter.value.startDate = '';
  dateFilter.value.endDate = '';
  filteredTournaments.value = tournaments.value;
};

const fetchTournaments = async () => {
  loading.value = true;
  try {
    const response = await api.get('/tournaments/public');
    tournaments.value = response.data;
    filteredTournaments.value = response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des tournois:', error);
    tournaments.value = [];
    filteredTournaments.value = [];
  } finally {
    loading.value = false;
  }
};

const checkUserAndRedirect = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'admin') {
        router.push('/admin/users');
      } else {
        router.push('/tournaments');
      }
    } catch (e) {
      console.error('Erreur lors de la récupération des données utilisateur:', e);
    }
  } else {
    fetchTournaments();
  }
};

const onAuthSuccess = (user) => {
  if (user.role === 'admin') {
    router.push('/admin/users');
  } else {
    router.push('/tournaments');
  }
};
// Ajoute ces variables dans ton setup()
const supportFab = ref(false);
const supportDialog = ref(false);

// Ajoute ces méthodes
const openIncidentDialog = () => {
  supportFab.value = false;
  supportDialog.value = true;
};

const openEvolutionDialog = () => {
  supportFab.value = false;
  redirectToEvolution();
};

const openSupportDashboard = () => {
  const projectUrl = 'https://github.com/users/sullivan-assie/projects/[TON_PROJECT_NUMBER]';
  window.open(projectUrl, '_blank');
};

const redirectToP1Incident = () => {
  const url = 'https://github.com/sullivan-assie/nipponKempoPerso/issues/new?template=01-incident-bloquant.yml';
  window.open(url, '_blank');
  supportDialog.value = false;
};

const redirectToP2Incident = () => {
  const url = 'https://github.com/sullivan-assie/nipponKempoPerso/issues/new?template=02-incident-majeur.yml';
  window.open(url, '_blank');
  supportDialog.value = false;
};

const redirectToEvolution = () => {
  const url = 'https://github.com/sullivan-assie/nipponKempoPerso/issues/new?template=04-evolution.yml';
  window.open(url, '_blank');
  supportDialog.value = false;
};

const redirectToQuestion = () => {
  const url = 'https://github.com/sullivan-assie/nipponKempoPerso/issues/new?template=05-question.yml';
  window.open(url, '_blank');
  supportDialog.value = false;
};

const openSupportTicket = () => {
  const url = 'https://github.com/sullivan-assie/nipponKempoPerso/issues/new/choose';
  window.open(url, '_blank');
};

const openEvolutionRequest = () => {
  redirectToEvolution();
};

onMounted(() => {
  checkUserAndRedirect();
});
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-card {
  max-width: 320px;
  margin: 0 auto;
}

// Section separators like GitHub
.section-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  margin: 0;
}

// GitHub-style card
.github-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
}

// GitHub-style inputs
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
}

// GitHub-style buttons
.github-btn {
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  padding: 5px 16px !important;
  
  &:hover {
    border-color: #58a6ff !important;
    background: rgba(88, 166, 255, 0.1) !important;
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

.github-btn-icon {
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
  width: 32px !important;
  height: 32px !important;
  
  &:hover {
    border-color: #58a6ff !important;
    background: rgba(88, 166, 255, 0.1) !important;
  }
}

// GitHub-style footer
.github-footer {
  border-top: 1px solid #30363d !important;
  background: #0d1117 !important;
}

@media (max-width: 768px) {
  .text-right {
    text-align: center !important;
  }
}
</style>