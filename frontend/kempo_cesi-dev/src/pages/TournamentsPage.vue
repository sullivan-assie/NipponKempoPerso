<template>
  <q-page padding>
    <div class="container">
      <div class="row justify-between items-center q-mb-xl">
        <h2 class="text-h3 text-center q-my-none col-12 col-sm-auto">Tournois disponibles</h2>
        
        <!-- Bouton pour créer un tournoi (visible uniquement pour les administrateurs) -->
        <q-btn 
          v-if="isAdmin"
          color="primary" 
          icon="add" 
          label="Créer un tournoi" 
          @click="openCreateTournamentDialog"
          class="q-mt-sm q-mt-sm-none col-12 col-sm-auto"
        />
      </div>
      
      <!-- Filtres pour les tournois -->
      <div class="q-mb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="searchQuery" outlined dense clearable placeholder="Rechercher un tournoi">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6" v-if="isUserLoggedIn">
            <q-select
              v-model="participationFilter"
              :options="participationOptions"
              outlined
              dense
              emit-value
              map-options
              option-label="label"
              option-value="value"
              label="Filtrer par participation"
            />
          </div>
        </div>
      </div>
      
      <div v-if="loading" class="text-center">
        <q-spinner size="3em" color="primary" />
        <p class="text-subtitle1 q-mt-md">Chargement des tournois...</p>
      </div>
      
      <div v-else-if="filteredTournaments.length === 0" class="text-center q-pa-xl">
        <q-icon name="event_busy" size="4em" color="grey-7" />
        <p class="text-subtitle1 q-mt-md">Aucun tournoi disponible pour le moment.</p>
        
        <!-- Message pour les administrateurs quand il n'y a pas de tournois -->
        <div v-if="isAdmin" class="q-mt-md">
          <p>Commencez par créer votre premier tournoi.</p>
          <q-btn color="primary" label="Créer un tournoi" icon="add" @click="openCreateTournamentDialog" />
        </div>
      </div>
      
      <div v-else class="row q-col-gutter-lg">
        <div v-for="tournament in filteredTournaments" :key="tournament._id" class="col-12 col-sm-6 col-md-4">
          <q-card class="tournament-card" flat bordered>
            <!-- Bannière de participation si l'utilisateur est participant ou compétiteur -->
            <div v-if="isUserLoggedIn && getUserParticipationStatus(tournament)" class="participation-banner" :class="getUserParticipationStatus(tournament).class">
              <q-icon :name="getUserParticipationStatus(tournament).icon" size="sm" class="q-mr-xs" />
              {{ getUserParticipationStatus(tournament).text }}
            </div>
            
            <q-img 
              :src="tournament.imageUrl || '/Image1MainMenu.png'" 
              height="200px"
              class="tournament-image"
            />
            <q-card-section>
              <div class="text-h6">{{ tournament.name }}</div>
              <div class="text-subtitle2">{{ formatDate(tournament.date) }}</div>
              <div class="text-body2 q-mt-sm">{{ tournament.location }}</div>
            </q-card-section>
            <q-card-section>
              <div class="text-body2">
                {{ tournament.description || 'Pas de description disponible.' }}
              </div>
            </q-card-section>
            <q-card-actions align="between">
              <q-btn flat color="primary" label="Voir détails" @click="viewTournamentDetails(tournament._id)" />
              
              <!-- Badge pour le nombre de catégories -->
              <div>
                <q-badge color="secondary" v-if="tournament.categories && tournament.categories.length" class="q-mr-sm">
                  {{ tournament.categories.length }} catégorie{{ tournament.categories.length > 1 ? 's' : '' }}
                </q-badge>
                
                <!-- Nouveau badge pour le nombre de compétiteurs -->
                <q-badge color="orange" v-if="tournament.competitorsCount > 0">
                  {{ tournament.competitorsCount }} compétiteur{{ tournament.competitorsCount > 1 ? 's' : '' }}
                </q-badge>
              </div>
            </q-card-actions>
            
            <!-- Actions supplémentaires pour les utilisateurs connectés -->
            <q-card-actions v-if="isUserLoggedIn" class="q-mt-none">
              <q-btn 
                :color="isUserRegistered(tournament) ? 'negative' : 'positive'"
                :icon="isUserRegistered(tournament) ? 'cancel' : 'how_to_reg'" 
                :label="isUserRegistered(tournament) ? 'Annuler inscription' : 'S\'inscrire'"
                class="full-width"
                @click="toggleRegistration(tournament)"
                :loading="processingRegistration[tournament._id]"
              />
            </q-card-actions>
            
            <!-- Message pour les utilisateurs non connectés -->
            <q-card-section v-else class="text-center q-pa-sm text-caption">
              <q-icon name="info" color="grey-7" size="xs" class="q-mr-xs" />
              Connectez-vous pour vous inscrire à ce tournoi
            </q-card-section>
            
            <!-- Badge pour les admins montrant le nombre d'inscrits -->
            <q-card-section v-if="isAdmin" class="q-pt-none">
              <q-badge color="info" class="cursor-pointer" @click="viewParticipants(tournament._id)">
                <q-icon name="people" size="xs" class="q-mr-xs" />
                {{ getTournamentParticipantsCount(tournament) }} inscrit{{ getTournamentParticipantsCount(tournament) !== 1 ? 's' : '' }}
              </q-badge>
            </q-card-section>
          </q-card>
        </div>
      </div>
      
      <div class="text-center q-mt-xl" v-if="tournaments.length > 0">
        <q-btn 
          color="primary" 
          icon="refresh" 
          label="Rafraîchir" 
          @click="fetchTournaments" 
          :loading="loading"
        />
      </div>
    </div>

    <!-- Modal pour la création de tournoi -->
    <tournament-create
      v-model="showCreateTournamentDialog"
      @tournament-created="onTournamentCreated"
    />
    
    <!-- Modal pour afficher les participants (admin seulement) -->
    <q-dialog v-model="showParticipantsDialog" persistent>
      <q-card style="min-width: 350px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Participants au tournoi</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-card-section v-if="loadingParticipants">
          <div class="text-center">
            <q-spinner color="primary" size="3em" />
            <div class="q-mt-sm">Chargement des participants...</div>
          </div>
        </q-card-section>
        
        <q-card-section v-else-if="currentTournamentParticipants.length === 0">
          <div class="text-center">
            <q-icon name="people_outline" size="3em" color="grey-7" />
            <div class="q-mt-sm">Aucun participant inscrit pour le moment.</div>
          </div>
        </q-card-section>
        
        <q-card-section v-else>
          <q-list bordered separator>
            <q-item v-for="participant in currentTournamentParticipants" :key="participant.user._id">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  {{ participant.user.name.charAt(0) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ participant.user.name }}</q-item-label>
                <q-item-label caption>{{ participant.user.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="participant.status === 'confirmed' ? 'positive' : 'warning'">
                  {{ participant.status === 'confirmed' ? 'Confirmé' : 'En attente' }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Fermer" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from 'src/boot/axios';
import { date } from 'quasar';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import TournamentCreate from 'src/components/TournamentCreate.vue';

const $q = useQuasar();
const router = useRouter();
const loading = ref(true);
const tournaments = ref([]);
const showCreateTournamentDialog = ref(false);

// États pour gérer l'inscription
const processingRegistration = ref({});
const showParticipantsDialog = ref(false);
const currentTournamentParticipants = ref([]);
const loadingParticipants = ref(false);
const currentTournamentId = ref(null);

// États pour le filtrage et la recherche
const searchQuery = ref('');
const participationFilter = ref('all');
const participationOptions = [
  { label: 'Tous les tournois', value: 'all' },
  { label: 'Mes participations', value: 'participating' },
  { label: 'Tournois où je suis compétiteur', value: 'competitor' }
];

// Vérifier si l'utilisateur est connecté
const isUserLoggedIn = computed(() => {
  return !!localStorage.getItem('token') && !!localStorage.getItem('user');
});

// Tournois filtrés en fonction de la recherche et des filtres de participation
const filteredTournaments = computed(() => {
  let result = [...tournaments.value];
  
  // Filtrer par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(query) || 
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.location && t.location.toLowerCase().includes(query))
    );
  }
  
  // Filtrer par participation
  if (isUserLoggedIn.value && participationFilter.value !== 'all') {
    const userId = getCurrentUserId();
    
    if (participationFilter.value === 'participating') {
      // Tournois où l'utilisateur est participant (inscrit)
      result = result.filter(tournament => 
        isUserRegistered(tournament)
      );
    } else if (participationFilter.value === 'competitor') {
      // Tournois où l'utilisateur est compétiteur
      result = result.filter(tournament => 
        isUserCompetitor(tournament)
      );
    }
  }
  
  return result;
});

// Obtenir l'ID de l'utilisateur connecté
const getCurrentUserId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return user._id || user.id;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    return null;
  }
};

// Vérifier si l'utilisateur est un administrateur
const isAdmin = computed(() => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  
  try {
    const user = JSON.parse(userStr);
    return user && user.role === 'admin';
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle de l\'utilisateur:', error);
    return false;
  }
});

// Vérifier si l'utilisateur est un compétiteur dans le tournoi
const isUserCompetitor = (tournament) => {
  if (!isUserLoggedIn.value) return false;
  
  const userId = getCurrentUserId();
  if (!userId || !tournament.competitors) return false;
  
  return tournament.competitors.some(comp => 
    comp.user === userId || 
    (comp.user && comp.user._id === userId)
  );
};

// Obtenir le statut de participation de l'utilisateur pour un tournoi
const getUserParticipationStatus = (tournament) => {
  if (!isUserLoggedIn.value) return null;
  
  if (isUserCompetitor(tournament)) {
    return {
      text: 'Vous êtes compétiteur',
      icon: 'emoji_events',
      class: 'competitor-status'
    };
  } else if (isUserRegistered(tournament)) {
    return {
      text: 'Vous êtes participant',
      icon: 'how_to_reg',
      class: 'participant-status'
    };
  }
  
  return null;
};

// Formater les dates pour l'affichage avec l'heure
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  const dateObj = new Date(dateStr);
  
  // Vérifie si l'heure est différente de minuit (00:00)
  const hasTime = dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0;
  
  if (hasTime) {
    // Format avec date et heure
    return date.formatDate(dateObj, 'DD/MM/YYYY HH:mm');
  } else {
    // Format avec date uniquement
    return date.formatDate(dateObj, 'DD/MM/YYYY');
  }
};

// Récupérer la liste des tournois publics/disponibles
const fetchTournaments = async () => {
  loading.value = true;
  try {
    // Endpoint pour récupérer les tournois publics ou à venir
    const response = await api.get('/tournaments/public');
    
    // Pour chaque tournoi, récupérer les informations sur les compétiteurs si nécessaire
    const tournamentsData = response.data;
    
    // Si l'utilisateur est connecté, récupérer les informations sur ses compétitions
    if (isUserLoggedIn.value) {
      const userId = getCurrentUserId();
      if (userId) {
        try {
          // Récupérer les tournois où l'utilisateur est compétiteur
          const competitorResp = await api.get(`/competitors/user/${userId}`);
          const competitorData = competitorResp.data;
          
          // Marquer les tournois où l'utilisateur est compétiteur
          if (competitorData && competitorData.length > 0) {
            tournamentsData.forEach(tournament => {
              const competitorsInTournament = competitorData.filter(c => 
                c.tournament === tournament._id || 
                (c.tournament && c.tournament._id === tournament._id)
              );
              
              // Ajouter la liste des compétiteurs pour ce tournoi
              if (competitorsInTournament.length > 0) {
                tournament.competitors = tournament.competitors || [];
                tournament.competitors.push(...competitorsInTournament);
              }
            });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des informations de compétiteur:', error);
        }
      }
    }
    
    tournaments.value = tournamentsData;
  } catch (error) {
    console.error('Erreur lors de la récupération des tournois:', error);
    tournaments.value = [];
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les tournois',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Vérifier si l'utilisateur est inscrit à un tournoi spécifique
const isUserRegistered = (tournament) => {
  if (!isUserLoggedIn.value) return false;
  
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  return tournament.participants && tournament.participants.some(p => 
    p.user === userId && (p.status === 'pending' || p.status === 'confirmed')
  );
};

// Obtenir le nombre de participants à un tournoi (pour les admins)
const getTournamentParticipantsCount = (tournament) => {
  if (!tournament.participants) return 0;
  
  return tournament.participants.filter(p => 
    p.status === 'pending' || p.status === 'confirmed'
  ).length;
};

// S'inscrire ou se désinscrire d'un tournoi
const toggleRegistration = async (tournament) => {
  if (!isUserLoggedIn.value) {
    $q.notify({
      color: 'negative',
      message: 'Vous devez être connecté pour vous inscrire',
      icon: 'error'
    });
    return;
  }
  
  processingRegistration.value[tournament._id] = true;
  
  try {
    if (isUserRegistered(tournament)) {
      // Annuler l'inscription
      await api.delete(`/tournaments/${tournament._id}/register`);
      
      // Mettre à jour localement
      const userId = getCurrentUserId();
      if (tournament.participants) {
        const participantIndex = tournament.participants.findIndex(p => p.user === userId);
        if (participantIndex !== -1) {
          tournament.participants[participantIndex].status = 'cancelled';
        }
      }
      
      $q.notify({
        color: 'info',
        message: `Inscription au tournoi ${tournament.name} annulée`,
        icon: 'check_circle'
      });
    } else {
      // S'inscrire au tournoi
      await api.post(`/tournaments/${tournament._id}/register`);
      
      // Mettre à jour localement
      if (!tournament.participants) tournament.participants = [];
      tournament.participants.push({
        user: getCurrentUserId(),
        registeredAt: new Date(),
        status: 'pending'
      });
      
      $q.notify({
        color: 'positive',
        message: `Inscription au tournoi ${tournament.name} réussie`,
        icon: 'check_circle'
      });
    }
    
    // Rafraîchir les données
    await fetchTournaments();
  } catch (error) {
    console.error('Erreur lors de la gestion de l\'inscription:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la gestion de l\'inscription',
      icon: 'error'
    });
  } finally {
    processingRegistration.value[tournament._id] = false;
  }
};

// Voir les participants à un tournoi (admin uniquement)
const viewParticipants = async (tournamentId) => {
  if (!isAdmin.value) return;
  
  currentTournamentId.value = tournamentId;
  loadingParticipants.value = true;
  showParticipantsDialog.value = true;
  currentTournamentParticipants.value = [];
  
  try {
    const response = await api.get(`/tournaments/${tournamentId}/participants`);
    currentTournamentParticipants.value = response.data.participants || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les participants',
      icon: 'error'
    });
  } finally {
    loadingParticipants.value = false;
  }
};

// Voir les détails d'un tournoi
const viewTournamentDetails = (tournamentId) => {
  router.push(`/tournaments/${tournamentId}`);
};

// Ouvrir la boîte de dialogue pour créer un tournoi
const openCreateTournamentDialog = () => {
  showCreateTournamentDialog.value = true;
};

// Gérer la création réussie d'un tournoi
const onTournamentCreated = (newTournament) => {
  $q.notify({
    color: 'positive',
    message: `Le tournoi "${newTournament.name}" a été créé avec succès`,
    icon: 'check_circle'
  });
  
  // Rafraîchir la liste des tournois
  fetchTournaments();
};

// Charger les tournois au montage du composant
onMounted(() => {
  fetchTournaments();
});
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.tournament-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
}

.tournament-image {
  object-fit: cover;
}

.participation-banner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 5px;
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
  text-align: center;
  z-index: 1;
  
  &.competitor-status {
    background-color: rgba(85, 110, 230, 0.85);
  }
  
  &.participant-status {
    background-color: rgba(38, 166, 154, 0.85);
  }
}
</style>