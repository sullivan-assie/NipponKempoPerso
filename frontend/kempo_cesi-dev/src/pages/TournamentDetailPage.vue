<template>
  <q-page padding>
    <div class="container" v-if="!loading && tournament">
      <div class="q-pb-md">
        <q-btn
          icon="arrow_back"
          label="Retour aux tournois"
          color="secondary"
          flat
          to="/tournaments"
        />
      </div>
      
      <div class="tournament-header">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-img
              :src="tournament.imageUrl || '/Image1MainMenu.png'"
              class="rounded-borders full-height"
              style="min-height: 250px"
              fit="cover"
            />
          </div>
          
          <div class="col-12 col-md-8">
            <div class="row items-center justify-between">
              <h1 class="text-h3 q-mb-md">{{ tournament.name }}</h1>
              <div>
                <q-btn
                  v-if="isAdmin"
                  icon="edit"
                  color="primary"
                  label="Modifier"
                  @click="showEditDialog = true"
                  class="q-mb-md q-mr-sm"
                />
                <q-btn
                  v-if="isAdmin"
                  icon="delete"
                  color="negative"
                  label="Supprimer"
                  @click="showDeleteDialog = true"
                  class="q-mb-md"
                />
              </div>
            </div>
            <div class="text-body1 q-mb-md tournament-description">
              {{ tournament.description || 'Pas de description pour ce tournoi.' }}
            </div>
            
            <div class="tournament-details">
              <div class="detail-item">
                <q-icon name="event" size="sm" />
                <span>{{ formatDate(tournament.startDate) }} - {{ formatDate(tournament.endDate) }}</span>
              </div>
              
              <div class="detail-item">
                <q-icon name="location_on" size="sm" />
                <span>{{ tournament.location || 'Lieu non précisé' }}</span>
              </div>
              
              <div class="detail-item">
                <q-icon name="people" size="sm" />
                <span>{{ tournament.status || 'Statut inconnu' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <q-separator class="q-my-md" />
      
      <!-- Catégories du tournoi -->
      <div class="tournament-categories q-mt-xl">
        <div class="row items-center justify-between">
          <h2 class="text-h4">Catégories</h2>
          <div v-if="isAdmin">
            <q-btn 
              color="primary" 
              label="Gérer les catégories" 
              icon="settings" 
              @click="showCategoryManagerDialog = true"
            />
          </div>
        </div>
        
        <div v-if="!tournament.categories || tournament.categories.length === 0" class="text-center q-pa-md">
          <q-icon name="category" size="3em" color="grey-7" />
          <p class="text-subtitle1">Aucune catégorie n'a encore été définie pour ce tournoi.</p>
        </div>
        
        <div v-else class="row q-col-gutter-md q-mt-md">
          <div v-for="category in tournament.categories" :key="category._id" class="col-12 col-sm-6 col-md-4">
            <q-card class="category-card">
              <q-card-section>
                <div class="text-h6">{{ category.name }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      
      <q-separator class="q-my-xl" />
      
      <!-- Participants du tournoi -->
      <div class="tournament-competitors q-mt-xl" v-if="showCategoryCompetitors">
        <div class="category-header q-mb-md">
          <h2 class="text-h4">Participants - {{ selectedCategory ? selectedCategory.name : '' }}</h2>
          <q-btn flat icon="close" @click="closeCategoryCompetitors" />
        </div>
        
        <div v-if="!competitors || competitors.length === 0" class="text-center q-pa-md">
          <q-icon name="person_off" size="3em" color="grey-7" />
          <p class="text-subtitle1">Aucun participant n'est inscrit dans cette catégorie.</p>
        </div>
        
        <div v-else>
          <q-table
            :rows="competitors"
            :columns="competitorColumns"
            row-key="_id"
            flat
            bordered
          />
        </div>
      </div>
      
      <!-- Liste des utilisateurs inscrits au tournoi (admin uniquement) -->
      <div class="tournament-users q-mt-xl" v-if="isAdmin">
        <div class="row items-center justify-between">
          <h2 class="text-h4">Utilisateurs inscrits</h2>
          <div>
            <q-btn 
              color="primary" 
              label="Convertir en compétiteurs" 
              icon="person_add" 
              @click="showAddUsersDialog = true"
            />
          </div>
        </div>

        <q-table
          :rows="tournamentParticipants"
          :columns="participantColumns"
          row-key="_id"
          flat
          bordered
          class="q-mt-md"
        />
      </div>

      <!-- Section des compétiteurs du tournoi -->
      <div class="tournament-competitors-section q-mt-xl">
        <div class="row items-center justify-between">
          <h2 class="text-h4">Compétiteurs du tournoi</h2>
          <div>
            <q-btn 
              v-if="isAdmin"
              color="secondary" 
              label="Gérer les compétiteurs" 
              icon="sports_kabaddi" 
              @click="showAddCompetitorsDialog = true"
            />
          </div>
        </div>
        
        <div v-if="!tournament.competitors || tournament.competitors.length === 0" class="text-center q-pa-md">
          <q-icon name="sports_martial_arts" size="3em" color="grey-7" />
          <p class="text-subtitle1">Aucun compétiteur n'est inscrit à ce tournoi.</p>
        </div>
        
        <div v-else>
          <q-table
            :rows="tournament.competitors"
            :columns="competitorColumns"
            row-key="_id"
            flat
            bordered
            class="q-mt-md"
          >
            <template v-slot:body-cell-nationality="props">
              <q-td :props="props">
                <div class="row items-center">
                  <country-flag :country="getCountryCode(props.value)" size="small" class="q-mr-sm" />
                  {{ props.value }}
                </div>
              </q-td>
            </template>
          </q-table>
        </div>
      </div>
    </div>
    
    <div v-else-if="loading" class="full-center">
      <q-spinner size="3em" color="primary" />
      <p class="text-subtitle1 q-mt-md">Chargement des détails du tournoi...</p>
    </div>
    
    <div v-else class="full-center">
      <q-icon name="sports_mma" size="4em" color="negative" />
      <h2 class="text-h5 q-mt-md q-mb-none">Tournoi introuvable</h2>
      <p class="q-mt-sm">Le tournoi demandé n'existe pas ou a été supprimé.</p>
      <q-btn
        color="primary"
        label="Retour aux tournois"
        to="/tournaments"
        class="q-mt-md"
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
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirmation de suppression</span>
        </q-card-section>

        <q-card-section>
          <p>Êtes-vous sûr de vouloir supprimer le tournoi "<strong>{{ tournament?.name }}</strong>" ?</p>
          <p class="text-caption text-negative">
            <q-icon name="warning" />
            Cette action est irréversible. Toutes les données associées à ce tournoi (catégories, compétiteurs, matchs, etc.) seront définitivement perdues.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup @click="cancelDelete" />
          <q-btn 
            flat 
            label="Supprimer" 
            color="negative" 
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
.container {
  max-width: 1200px;
  margin: 0 auto;
}

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
    margin-bottom: 0.5rem;
    
    .q-icon {
      margin-right: 0.5rem;
    }
  }
}

.category-card {
  height: 100%;
  display: flex;
  flex-direction: column;
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
</style>