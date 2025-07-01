<template>
  <q-page class="github-page" padding>
    <div class="container" v-if="!loading && tournament">
      <div class="q-pb-md">
        <q-btn
          icon="arrow_back"
          label="Retour aux tournois"
          color="grey-4"
          flat
          class="github-btn-flat"
          to="/tournaments"
        />
      </div>
      
      <div class="tournament-header">
        <q-card flat class="github-card q-pa-lg">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-img
                :src="tournament.imageUrl || '/Image1MainMenu.png'"
                class="rounded-borders full-height bg-grey-8"
                style="min-height: 250px"
                fit="cover"
              />
            </div>
            
            <div class="col-12 col-md-8">
              <div class="row items-center justify-between q-mb-md">
                <h1 class="text-h3 text-white">{{ tournament.name }}</h1>
                <div class="q-gutter-sm">
                  <q-btn
                    v-if="isAdmin"
                    icon="edit"
                    color="grey-4"
                    label="Modifier"
                    flat
                    class="github-btn-flat"
                    @click="showEditDialog = true"
                  />
                  <q-btn
                    v-if="isAdmin"
                    icon="delete"
                    color="red-4"
                    label="Supprimer"
                    flat
                    class="github-btn-danger"
                    @click="showDeleteDialog = true"
                  />
                </div>
              </div>
              
              <div class="text-body1 q-mb-md tournament-description text-grey-4">
                {{ tournament.description || 'Pas de description pour ce tournoi.' }}
              </div>
              
              <div class="tournament-details">
                <div class="detail-item">
                  <q-icon name="event" size="sm" color="grey-5" />
                  <span class="text-grey-4">{{ formatDate(tournament.startDate) }} - {{ formatDate(tournament.endDate) }}</span>
                </div>
                
                <div class="detail-item">
                  <q-icon name="location_on" size="sm" color="grey-5" />
                  <span class="text-grey-4">{{ tournament.location || 'Lieu non précisé' }}</span>
                </div>
                
                <div class="detail-item">
                  <q-icon name="people" size="sm" color="grey-5" />
                  <span class="text-grey-4">{{ tournament.status || 'Statut inconnu' }}</span>
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>
      
      <!-- Section Separator -->
      <div class="section-separator"></div>
      
      <!-- Catégories du tournoi -->
      <div class="tournament-categories q-mt-xl">
        <q-card flat class="github-card">
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <h2 class="text-h4 text-white">Catégories</h2>
              <div v-if="isAdmin">
                <q-btn 
                  color="grey-4" 
                  label="Gérer les catégories" 
                  icon="settings"
                  flat
                  class="github-btn-flat"
                  @click="showCategoryManagerDialog = true"
                />
              </div>
            </div>
            
            <div v-if="!tournament.categories || tournament.categories.length === 0" class="text-center q-pa-xl">
              <q-icon name="category" size="3em" color="grey-6" />
              <p class="text-h6 q-mt-md text-grey-4">Aucune catégorie n'a encore été définie pour ce tournoi.</p>
            </div>
            
            <div v-else class="row q-col-gutter-md">
              <div v-for="category in tournament.categories" :key="category._id" class="col-12 col-sm-6 col-md-4">
                <q-card flat class="github-category-card">
                  <q-card-section>
                    <div class="text-h6 text-white">{{ category.name }}</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- Section Separator -->
      <div class="section-separator"></div>
      
      <!-- Participants du tournoi -->
      <div class="tournament-competitors q-mt-xl" v-if="showCategoryCompetitors">
        <q-card flat class="github-card">
          <q-card-section>
            <div class="category-header q-mb-md">
              <h2 class="text-h4 text-white">Participants - {{ selectedCategory ? selectedCategory.name : '' }}</h2>
              <q-btn 
                flat 
                icon="close" 
                color="grey-4"
                class="github-btn-flat"
                @click="closeCategoryCompetitors" 
              />
            </div>
            
            <div v-if="!competitors || competitors.length === 0" class="text-center q-pa-xl">
              <q-icon name="person_off" size="3em" color="grey-6" />
              <p class="text-h6 q-mt-md text-grey-4">Aucun participant n'est inscrit dans cette catégorie.</p>
            </div>
            
            <div v-else>
              <q-table
                :rows="competitors"
                :columns="competitorColumns"
                row-key="_id"
                flat
                class="github-table"
                dark
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- Liste des utilisateurs inscrits au tournoi (admin uniquement) -->
      <div class="tournament-users q-mt-xl" v-if="isAdmin">
        <q-card flat class="github-card">
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <h2 class="text-h4 text-white">Utilisateurs inscrits</h2>
              <div>
                <q-btn 
                  color="grey-4" 
                  label="Convertir en compétiteurs" 
                  icon="person_add"
                  flat
                  class="github-btn-flat"
                  @click="showAddUsersDialog = true"
                />
              </div>
            </div>

            <q-table
              :rows="tournamentParticipants"
              :columns="participantColumns"
              row-key="_id"
              flat
              class="github-table"
              dark
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Section des compétiteurs du tournoi -->
      <div class="tournament-competitors-section q-mt-xl">
        <q-card flat class="github-card">
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <h2 class="text-h4 text-white">Compétiteurs du tournoi</h2>
              <div>
                <q-btn 
                  v-if="isAdmin"
                  color="grey-4" 
                  label="Gérer les compétiteurs" 
                  icon="sports_kabaddi"
                  flat
                  class="github-btn-flat"
                  @click="showAddCompetitorsDialog = true"
                />
              </div>
            </div>
            
            <div v-if="!tournament.competitors || tournament.competitors.length === 0" class="text-center q-pa-xl">
              <q-icon name="sports_martial_arts" size="3em" color="grey-6" />
              <p class="text-h6 q-mt-md text-grey-4">Aucun compétiteur n'est inscrit à ce tournoi.</p>
            </div>
            
            <div v-else>
              <q-table
                :rows="tournament.competitors"
                :columns="competitorColumns"
                row-key="_id"
                flat
                class="github-table"
                dark
              >
                <template v-slot:body-cell-nationality="props">
                  <q-td :props="props">
                    <div class="row items-center">
                      <country-flag :country="getCountryCode(props.value)" size="small" class="q-mr-sm" />
                      <span class="text-grey-3">{{ props.value }}</span>
                    </div>
                  </q-td>
                </template>
              </q-table>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    
    <div v-else-if="loading" class="full-center">
      <q-spinner size="3em" color="primary" />
      <p class="text-h6 q-mt-md text-grey-4">Chargement des détails du tournoi...</p>
    </div>
    
    <div v-else class="full-center">
      <q-icon name="sports_mma" size="4em" color="red-4" />
      <h2 class="text-h5 q-mt-md q-mb-none text-white">Tournoi introuvable</h2>
      <p class="q-mt-sm text-grey-4">Le tournoi demandé n'existe pas ou a été supprimé.</p>
      <q-btn
        color="grey-4"
        label="Retour aux tournois"
        flat
        class="github-btn-flat q-mt-md"
        to="/tournaments"
      />
    </div>

    <!-- Dialogue pour ajouter des utilisateurs en tant que compétiteurs -->
    <TournamentAddUsers
      v-model="showAddUsersDialog"
      :tournament-id="route.params.id"
      @users-converted="onUsersConverted"
    />

    <!-- Dialogue pour ajouter des compétiteurs existants -->
    <TournamentAddCompetitors 
      v-model="showAddCompetitorsDialog"
      :tournament-id="route.params.id"
      :current-competitors="currentCompetitorIds"
      @competitors-added="onCompetitorsAdded"
    />

    <!-- Dialogue pour modifier le tournoi -->
    <TournamentEdit
      v-model="showEditDialog"
      :tournament="tournament"
      @tournament-updated="onTournamentUpdated"
    />

    <!-- Dialogue pour gérer les catégories du tournoi -->
    <TournamentCategoryManager
      v-model="showCategoryManagerDialog"
      :tournament-id="route.params.id"
      :tournament-categories="tournament?.categories || []"
      @categories-updated="onCategoriesUpdated"
    />
    
    <!-- Dialogue pour confirmer la suppression du tournoi -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card class="github-dialog">
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6 text-white">Confirmation de suppression</span>
        </q-card-section>

        <q-card-section>
          <p class="text-grey-4">Êtes-vous sûr de vouloir supprimer le tournoi "<strong class="text-white">{{ tournament?.name }}</strong>" ?</p>
          <p class="text-caption text-red-4">
            <q-icon name="warning" />
            Cette action est irréversible. Toutes les données associées à ce tournoi (catégories, compétiteurs, matchs, etc.) seront définitivement perdues.
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
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from 'src/boot/axios';
import { date } from 'quasar';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import TournamentAddUsers from 'src/components/TournamentAddUsers.vue';
import TournamentAddCompetitors from 'src/components/TournamentAddCompetitors.vue';
import TournamentEdit from 'src/components/TournamentEdit.vue';
import TournamentCategoryManager from 'src/components/TournamentCategoryManager.vue';
import CountryFlag from 'vue-country-flag-next';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const loading = ref(true);
const tournament = ref(null);
const competitors = ref([]);
const showCategoryCompetitors = ref(false);
const selectedCategory = ref(null);
const isAdmin = ref(false);
const tournamentParticipants = ref([]);
const showAddUsersDialog = ref(false);
const showAddCompetitorsDialog = ref(false);
const showEditDialog = ref(false);
const showCategoryManagerDialog = ref(false);
const showDeleteDialog = ref(false);
const deletingTournament = ref(false);

// Liste des IDs des compétiteurs actuellement dans le tournoi
const currentCompetitorIds = computed(() => {
  if (!tournament.value || !tournament.value.competitors) return [];
  return tournament.value.competitors.map(comp => typeof comp === 'object' ? comp._id : comp);
});

const competitorColumns = [
  { name: 'firstname', label: 'Prénom', field: 'firstname', align: 'left' },
  { name: 'lastname', label: 'Nom', field: 'lastname', align: 'left' },
  { name: 'clubName', label: 'Club', field: 'clubName', align: 'left' },
  { name: 'nationality', label: 'Nationalité', field: 'nationality', align: 'center' },
  { name: 'gender', label: 'Sexe', field: 'gender', align: 'center' },
  { name: 'age', label: 'Âge', field: 'age', align: 'center' },
];

const participantColumns = [
  { name: 'firstName', label: 'Prénom', field: 'firstName', align: 'left' },
  { name: 'lastName', label: 'Nom', field: 'lastName', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'status', label: 'Statut', field: 'status', align: 'center' },
  { name: 'registeredAt', label: 'Date d\'inscription', field: 'registeredAt', align: 'center' },
];

// Fonction pour obtenir le code pays à 2 lettres
const getCountryCode = (countryName) => {
  if (!countryName) return 'unknown';
  
  if (countryName.length === 2) {
    return countryName.toLowerCase();
  }
  
  const countryCodes = {
    'France': 'fr',
    'États-Unis': 'us',
    'USA': 'us',
    'États Unis': 'us',
    'Royaume-Uni': 'gb',
    'UK': 'gb',
    'Grande-Bretagne': 'gb',
    'Japon': 'jp',
    'Japan': 'jp',
    'Allemagne': 'de',
    'Germany': 'de',
    'Belgique': 'be',
    'Suisse': 'ch',
    'Canada': 'ca',
    'Espagne': 'es',
    'Italie': 'it',
    // Autres pays...
  };
  
  return countryCodes[countryName] || 'unknown';
};

// Formater les dates pour l'affichage
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return date.formatDate(new Date(dateStr), 'DD/MM/YYYY');
};

// Récupérer les détails du tournoi
const fetchTournamentDetails = async () => {
  loading.value = true;
  const tournamentId = route.params.id;
  
  try {
    const response = await api.get(`/tournaments/${tournamentId}`);
    tournament.value = response.data;
    console.log("Détails du tournoi récupérés:", tournament.value);
    console.log("Statut admin:", response.data.isAdmin);
    isAdmin.value = response.data.isAdmin || false;
    if (isAdmin.value) {
      fetchTournamentParticipants();
    } else {
      console.log("L'utilisateur n'est pas admin, les participants ne seront pas affichés");
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du tournoi:', error);
    tournament.value = null;
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les détails du tournoi',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Récupérer les participants inscrits au tournoi
const fetchTournamentParticipants = async () => {
  try {
    const tournamentId = route.params.id;
    console.log("Récupération des participants pour le tournoi:", tournamentId);
    const response = await api.get(`/tournaments/${tournamentId}/participants`);
    
    // Déboguer la structure des données reçues
    console.log('Données des participants reçues:', JSON.stringify(response.data, null, 2));
    
    // S'assurer que nous avons des données d'utilisateurs complètes
    if (response.data && Array.isArray(response.data)) {
      console.log("Nombre de participants reçus:", response.data.length);
      tournamentParticipants.value = response.data.map(participant => {
        console.log("Traitement du participant:", participant);
        // Si le participant contient directement les informations utilisateur
        if (participant.firstName && participant.lastName) {
          return {
            ...participant,
            status: participant.status || 'N/A',
            registeredAt: participant.registeredAt ? formatDate(participant.registeredAt) : 'N/A'
          };
        }
        
        // Si le participant a une référence à un utilisateur 
        return {
          _id: participant._id,
          firstName: participant.user?.firstName || 'N/A',
          lastName: participant.user?.lastName || 'N/A',
          email: participant.user?.email || 'N/A',
          status: participant.status || 'N/A',
          registeredAt: participant.registeredAt ? formatDate(participant.registeredAt) : 'N/A'
        };
      });
    } else if (tournament.value && tournament.value.participants && Array.isArray(tournament.value.participants)) {
      // Si les participants sont déjà inclus dans les données du tournoi
      tournamentParticipants.value = tournament.value.participants.map(participant => {
        return {
          _id: participant._id,
          firstName: participant.user?.firstName || 'N/A',
          lastName: participant.user?.lastName || 'N/A',
          email: participant.user?.email || 'N/A',
          status: participant.status || 'N/A',
          registeredAt: participant.registeredAt ? formatDate(participant.registeredAt) : 'N/A'
        };
      });
    } else {
      console.log("Aucune donnée de participants valide trouvée");
      tournamentParticipants.value = [];
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des participants du tournoi:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les participants du tournoi',
      icon: 'error'
    });
  }
};

// Afficher les participants d'une catégorie
const viewCategoryCompetitors = async (categoryId) => {
  try {
    // Trouver la catégorie sélectionnée
    selectedCategory.value = tournament.value.categories.find(cat => cat._id === categoryId);
    
    const response = await api.get(`/categories/${categoryId}/competitors`);
    competitors.value = response.data;
    showCategoryCompetitors.value = true;
  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les participants de cette catégorie',
      icon: 'error'
    });
  }
};

// Fermer la section des participants
const closeCategoryCompetitors = () => {
  showCategoryCompetitors.value = false;
  selectedCategory.value = null;
  competitors.value = [];
};

// Gestionnaire pour la conversion d'utilisateurs en compétiteurs
const onUsersConverted = async (convertedCompetitors) => {
  $q.notify({
    color: 'positive',
    message: 'Utilisateurs convertis en compétiteurs avec succès',
    icon: 'check_circle',
    timeout: 2000
  });
  
  // Recharger les détails du tournoi pour afficher les nouveaux compétiteurs
  await fetchTournamentDetails();
};

// Gestionnaire pour l'ajout de compétiteurs existants
const onCompetitorsAdded = async () => {
  $q.notify({
    color: 'positive',
    message: 'Compétiteurs ajoutés au tournoi avec succès',
    icon: 'check_circle',
    timeout: 2000
  });
  
  // Recharger les détails du tournoi
  await fetchTournamentDetails();
};

// Gestionnaire pour la mise à jour du tournoi
const onTournamentUpdated = async () => {
  $q.notify({
    color: 'positive',
    message: 'Tournoi mis à jour avec succès',
    icon: 'check_circle',
    timeout: 2000
  });

  // Recharger les détails du tournoi
  await fetchTournamentDetails();
};

// Gestionnaire pour la mise à jour des catégories
const onCategoriesUpdated = async () => {
  $q.notify({
    color: 'positive',
    message: 'Catégories mises à jour avec succès',
    icon: 'check_circle',
    timeout: 2000
  });

  // Recharger les détails du tournoi
  await fetchTournamentDetails();
};

// Confirmer et exécuter la suppression du tournoi
const deleteTournament = async () => {
  deletingTournament.value = true;
  try {
    const tournamentId = route.params.id;
    await api.delete(`/tournaments/${tournamentId}`);
    
    $q.notify({
      color: 'positive',
      message: `Le tournoi "${tournament.value.name}" a été supprimé avec succès`,
      icon: 'check_circle'
    });
    
    // Redirection vers la page des tournois en utilisant le router défini au niveau du composant
    router.push('/tournaments');
  } catch (error) {
    console.error('Erreur lors de la suppression du tournoi:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la suppression du tournoi',
      icon: 'error'
    });
  } finally {
    deletingTournament.value = false;
  }
};

const cancelDelete = () => {
  showDeleteDialog.value = false;
};

// Charger les détails du tournoi au montage du composant
onMounted(() => {
  fetchTournamentDetails();
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

// GitHub category cards
.github-category-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  transition: border-color 0.2s ease;
  
  &:hover {
    border-color: #58a6ff;
  }
}

// GitHub-style buttons (from previous artifacts)
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

// GitHub-style tables
.github-table {
  background: transparent !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
  
  :deep(.q-table__top) {
    background: transparent !important;
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

// GitHub-style dialog
.github-dialog {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
}

// Tournament details
.tournament-header {
  margin-bottom: 2rem;
}

.tournament-description {
  white-space: pre-line;
}

.tournament-details {
  margin-top: 1.5rem;
  
  .detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
    
    .q-icon {
      margin-right: 0.75rem;
    }
  }
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.full-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  text-align: center;
}

// Responsive
@media (max-width: 768px) {
  .row.items-center.justify-between {
    flex-direction: column;
    align-items: flex-start !important;
    
    .q-gutter-sm {
      margin-top: 1rem;
      align-self: flex-end;
    }
  }
}
</style>