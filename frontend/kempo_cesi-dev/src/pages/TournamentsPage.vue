<template>
  <q-page class="github-page" padding>
    <div class="container">
      <div class="row justify-between items-center q-mb-xl">
        <h2 class="text-h3 q-my-none col-12 col-sm-auto text-white">Tournois disponibles</h2>
        
        <!-- Bouton pour créer un tournoi (visible uniquement pour les administrateurs) -->
        <q-btn 
          v-if="isAdmin"
          color="negative" 
          text-color="white"
          icon="add" 
          label="Créer un tournoi" 
          outline
          class="q-mt-sm q-mt-sm-none col-12 col-sm-auto github-btn-important"
          @click="openCreateTournamentDialog"
        />
      </div>
      
      <!-- Filtres pour les tournois -->
      <q-card flat class="github-card q-mb-xl">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input 
                v-model="searchQuery" 
                outlined 
                dense 
                clearable 
                placeholder="Rechercher un tournoi"
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
                dark
                color="grey-4"
                label-color="grey-4"
                class="github-input"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
      
      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner size="3em" color="primary" />
        <p class="text-h6 q-mt-md text-grey-4">Chargement des tournois...</p>
      </div>
      
      <div v-else-if="filteredTournaments.length === 0" class="empty-state text-center q-pa-xl">
        <q-icon name="event_busy" size="4em" color="grey-6" />
        <p class="text-h6 q-mt-md text-grey-4">Aucun tournoi disponible pour le moment.</p>
        
        <!-- Message pour les administrateurs quand il n'y a pas de tournois -->
        <div v-if="isAdmin" class="q-mt-md">
          <p class="text-grey-5">Commencez par créer votre premier tournoi.</p>
          <q-btn 
            color="negative" 
            text-color="white"
            label="Créer un tournoi" 
            icon="add" 
            outline
            class="github-btn-important"
            @click="openCreateTournamentDialog" 
          />
        </div>
      </div>
      
      <div v-else class="row q-col-gutter-lg">
        <div v-for="tournament in filteredTournaments" :key="tournament._id" class="col-12 col-sm-6 col-md-4">
          <q-card class="github-tournament-card full-height">
            <!-- Bannière de participation si l'utilisateur est participant ou compétiteur -->
            <div v-if="isUserLoggedIn && getUserParticipationStatus(tournament)" class="participation-banner" :class="getUserParticipationStatus(tournament).class">
              <q-icon :name="getUserParticipationStatus(tournament).icon" size="sm" class="q-mr-xs" />
              {{ getUserParticipationStatus(tournament).text }}
            </div>
            
            <q-img 
              :src="tournament.imageUrl || '/Image1MainMenu.png'" 
              height="200px"
              class="tournament-image bg-grey-8"
            />
            <q-card-section>
              <div class="text-h6 text-white">{{ tournament.name }}</div>
              <div class="text-subtitle2 text-grey-4">{{ formatDate(tournament.date) }}</div>
              <div class="text-body2 q-mt-sm text-grey-4">{{ tournament.location }}</div>
            </q-card-section>
            <q-card-section>
              <div class="text-body2 text-grey-5">
                {{ tournament.description || 'Pas de description disponible.' }}
              </div>
            </q-card-section>
            <q-card-actions align="between">
              <div>
                <q-btn 
                  color="grey-6"
                  text-color="white"
                  label="Voir détails" 
                  outline
                  class="github-btn"
                  @click="viewTournamentDetails(tournament._id)" 
                />
                <!-- Bouton de suppression pour les admins -->
                <q-btn 
                  v-if="isAdmin"
                  flat 
                  color="red-4" 
                  icon="delete"
                  round
                  dense
                  class="github-btn-danger q-ml-sm"
                  @click.stop="confirmDeleteTournament(tournament)"
                />
              </div>
              
              <!-- Badge pour le nombre de catégories -->
              <div class="flex q-gutter-xs">
                <q-badge color="grey-7" text-color="white" v-if="tournament.categories && tournament.categories.length">
                  {{ tournament.categories.length }} catégorie{{ tournament.categories.length > 1 ? 's' : '' }}
                </q-badge>
                
                <!-- Nouveau badge pour le nombre de compétiteurs -->
                <q-badge color="secondary" v-if="tournament.competitorsCount > 0">
                  {{ tournament.competitorsCount }} compétiteur{{ tournament.competitorsCount > 1 ? 's' : '' }}
                </q-badge>
              </div>
            </q-card-actions>
            
            <!-- Actions supplémentaires pour les utilisateurs connectés -->
            <q-card-actions v-if="isUserLoggedIn" class="q-mt-none">
              <q-btn 
                :color="isUserRegistered(tournament) ? 'red-5' : 'positive'"
                text-color="white"
                :icon="isUserRegistered(tournament) ? 'cancel' : 'how_to_reg'" 
                :label="isUserRegistered(tournament) ? 'Annuler inscription' : 'S\'inscrire'"
                outline
                class="full-width github-btn-action"
                @click="toggleRegistration(tournament)"
                :loading="processingRegistration[tournament._id]"
              />
            </q-card-actions>
            
            <!-- Message pour les utilisateurs non connectés -->
            <q-card-section v-else class="text-center q-pa-sm">
              <div class="text-caption text-grey-5">
                <q-icon name="info" color="grey-6" size="xs" class="q-mr-xs" />
                Connectez-vous pour vous inscrire à ce tournoi
              </div>
            </q-card-section>
            
            <!-- Badge pour les admins montrant le nombre d'inscrits -->
            <q-card-section v-if="isAdmin" class="q-pt-none">
              <q-badge color="info" class="cursor-pointer github-badge-clickable" @click="viewParticipants(tournament._id)">
                <q-icon name="people" size="xs" class="q-mr-xs" />
                {{ getTournamentParticipantsCount(tournament) }} inscrit{{ getTournamentParticipantsCount(tournament) !== 1 ? 's' : '' }}
              </q-badge>
            </q-card-section>
          </q-card>
        </div>
      </div>
      
      <div class="text-center q-mt-xl" v-if="tournaments.length > 0">
        <q-btn 
          color="grey-6"
          text-color="white"
          icon="refresh" 
          label="Rafraîchir" 
          outline
          class="github-btn"
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
    
    <!-- Modal pour la confirmation de suppression de tournoi -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card class="github-dialog">
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6 text-white">Confirmation de suppression</span>
        </q-card-section>

        <q-card-section>
          <p class="text-grey-4">Êtes-vous sûr de vouloir supprimer le tournoi "<strong class="text-white">{{ tournamentToDelete?.name }}</strong>" ?</p>
          <p class="text-caption text-red-4">
            <q-icon name="warning" />
            Cette action est irréversible. Toutes les données associées à ce tournoi seront définitivement perdues.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn 
            flat 
            label="Annuler" 
            color="grey-4" 
            class="github-btn-flat"
            v-close-popup 
            @click="cancelDelete" 
          />
          <q-btn 
            flat 
            label="Supprimer" 
            color="red-4" 
            class="github-btn-danger"
            @click="deleteTournament" 
            :loading="deletingTournament"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- Modal pour afficher les participants (admin seulement) -->
    <q-dialog v-model="showParticipantsDialog" persistent>
      <q-card class="github-dialog" style="min-width: 350px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-white">Participants au tournoi</div>
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
        
        <q-card-section v-if="loadingParticipants">
          <div class="text-center">
            <q-spinner color="primary" size="3em" />
            <div class="q-mt-sm text-grey-4">Chargement des participants...</div>
          </div>
        </q-card-section>
        
        <q-card-section v-else-if="currentTournamentParticipants.length === 0">
          <div class="text-center">
            <q-icon name="people_outline" size="3em" color="grey-6" />
            <div class="q-mt-sm text-grey-4">Aucun participant inscrit pour le moment.</div>
          </div>
        </q-card-section>
        
        <q-card-section v-else>
          <q-list class="github-list">
            <q-item v-for="participant in currentTournamentParticipants" :key="participant.user._id" class="github-list-item">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  {{ participant.user.name.charAt(0) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-grey-3">{{ participant.user.name }}</q-item-label>
                <q-item-label caption class="text-grey-5">{{ participant.user.email }}</q-item-label>
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
          <q-btn 
            flat 
            color="grey-4" 
            label="Fermer" 
            class="github-btn-flat"
            v-close-popup 
          />
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

// Variables pour la suppression de tournoi
const showDeleteDialog = ref(false);
const tournamentToDelete = ref(null);
const deletingTournament = ref(false);

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

// Confirmer la suppression d'un tournoi
const confirmDeleteTournament = async (tournament) => {
  tournamentToDelete.value = tournament;
  showDeleteDialog.value = true;
};

const cancelDelete = () => {
  showDeleteDialog.value = false;
  tournamentToDelete.value = null;
};

const deleteTournament = async () => {
  if (!tournamentToDelete.value) return;

  deletingTournament.value = true;

  try {
    await api.delete(`/tournaments/${tournamentToDelete.value._id}`);
    $q.notify({
      color: 'positive',
      message: `Le tournoi "${tournamentToDelete.value.name}" a été supprimé avec succès`,
      icon: 'check_circle'
    });
    fetchTournaments();
  } catch (error) {
    console.error('Erreur lors de la suppression du tournoi:', error);
    $q.notify({
      color: 'negative',
      message: 'Erreur lors de la suppression du tournoi',
      icon: 'error'
    });
  } finally {
    deletingTournament.value = false;
    showDeleteDialog.value = false;
    tournamentToDelete.value = null;
  }
};

// Charger les tournois au montage du composant
onMounted(() => {
  fetchTournaments();
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

// Tournament cards
.github-tournament-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  transition: transform 0.2s ease, border-color 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    border-color: #58a6ff;
  }
}

// GitHub-style inputs (from landing page)
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

.github-btn-flat {
  color: #8b949e !important;
  font-size: 14px !important;
  
  &:hover {
    color: #f0f6fc !important;
    background: rgba(177, 186, 196, 0.12) !important;
  }
}

.github-btn-danger {
  color: #f85149 !important;
  
  &:hover {
    color: #ff7b72 !important;
    background: rgba(248, 81, 73, 0.1) !important;
  }
}

.github-btn-action {
  border: 1px solid currentColor !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
  }
}

.github-badge-clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(88, 166, 255, 0.2) !important;
  }
}

// Dialogs
.github-dialog {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
}

// Lists
.github-list {
  background: transparent !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
}

.github-list-item {
  border-bottom: 1px solid #30363d;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: rgba(177, 186, 196, 0.06) !important;
  }
}

// Participation banners
.participation-banner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  z-index: 1;
  
  &.competitor-status {
    background: linear-gradient(90deg, #1976d2, #1565c0);
  }
  
  &.participant-status {
    background: linear-gradient(90deg, #26a69a, #00695c);
  }
}

// Empty state
.empty-state {
  padding: 4rem 1rem;
  
  .q-icon {
    opacity: 0.6;
  }
}

// Responsive
@media (max-width: 768px) {
  .row.justify-between {
    flex-direction: column;
    align-items: center !important;
    text-align: center;
  }
}
</style>