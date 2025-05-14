<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Informations de profil -->
      <div class="col-12 col-md-5">
        <q-card class="q-mx-auto full-height">
          <q-card-section>
            <div class="text-h6">Mon profil</div>
          </q-card-section>
          <q-separator />
          
          <!-- Affichage d'un spinner pendant le chargement initial -->
          <q-card-section v-if="initialLoading" class="text-center">
            <q-spinner color="primary" size="3em" />
            <p class="q-mt-sm">Chargement de votre profil...</p>
          </q-card-section>
          
          <!-- Affichage du formulaire une fois les données chargées -->
          <q-card-section v-else>
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <q-input 
                v-model="form.firstName" 
                label="Prénom" 
                :rules="[val => !!val || 'Champ requis']"
                :disable="loading"
              />
              <q-input 
                v-model="form.lastName" 
                label="Nom" 
                :rules="[val => !!val || 'Champ requis']"
                :disable="loading"
              />
              <q-input 
                v-model="form.fighterNumber" 
                label="Numéro de combattant"
                :disable="loading"
              />
              <q-input 
                v-model="form.clubName" 
                label="Nom du club"
                :disable="loading"
              />
              <q-input 
                v-model="form.address" 
                label="Adresse"
                :disable="loading"
              />
              <q-input 
                v-model="form.email" 
                label="Email" 
                disable 
              />
              
              <div class="row justify-end q-gutter-sm">
                <q-btn label="Enregistrer" color="primary" type="submit" :loading="loading" />
                <q-btn label="Annuler" flat @click="resetForm" :disable="loading" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Liste des tournois de l'utilisateur -->
      <div class="col-12 col-md-7">
        <q-card class="q-mx-auto full-height">
          <q-tabs
            v-model="activeTab"
            dense
            class="text-primary"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="participating" label="Mes participations" />
            <q-tab name="competing" label="Mes compétitions" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="activeTab" animated>
            <!-- Panel des tournois où l'utilisateur est inscrit -->
            <q-tab-panel name="participating">
              <div class="text-h6 q-mb-md">Tournois auxquels je suis inscrit</div>
              
              <div v-if="loadingTournaments" class="text-center q-py-md">
                <q-spinner color="primary" size="3em" />
                <p class="q-mt-sm">Chargement de vos tournois...</p>
              </div>
              
              <div v-else-if="participatingTournaments.length === 0" class="text-center q-py-xl">
                <q-icon name="event_busy" size="4em" color="grey-7" />
                <p class="text-subtitle1 q-mt-md">Vous n'êtes inscrit à aucun tournoi pour le moment.</p>
                <q-btn 
                  color="primary" 
                  label="Parcourir les tournois" 
                  icon="search" 
                  class="q-mt-md" 
                  @click="router.push('/tournaments')"
                />
              </div>
              
              <div v-else>
                <q-list bordered separator>
                  <q-item v-for="tournament in participatingTournaments" :key="tournament._id" clickable @click="viewTournamentDetails(tournament._id)">
                    <q-item-section avatar>
                      <q-avatar rounded>
                        <img :src="tournament.imageUrl || '/Image1MainMenu.png'" />
                      </q-avatar>
                    </q-item-section>
                    
                    <q-item-section>
                      <q-item-label>{{ tournament.name }}</q-item-label>
                      <q-item-label caption>{{ formatDate(tournament.date || tournament.startDate) }}</q-item-label>
                      <q-item-label caption>{{ tournament.location }}</q-item-label>
                    </q-item-section>
                    
                    <q-item-section side>
                      <q-badge :color="getParticipationStatusColor(tournament.participationStatus)">
                        {{ getParticipationStatusText(tournament.participationStatus) }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-tab-panel>

            <!-- Panel des tournois où l'utilisateur est compétiteur -->
            <q-tab-panel name="competing">
              <div class="text-h6 q-mb-md">Tournois où je suis compétiteur</div>
              
              <div v-if="loadingTournaments" class="text-center q-py-md">
                <q-spinner color="primary" size="3em" />
                <p class="q-mt-sm">Chargement de vos compétitions...</p>
              </div>
              
              <div v-else-if="competingTournaments.length === 0" class="text-center q-py-xl">
                <q-icon name="emoji_events" size="4em" color="grey-7" />
                <p class="text-subtitle1 q-mt-md">Vous n'êtes compétiteur dans aucun tournoi pour le moment.</p>
              </div>
              
              <div v-else>
                <q-list bordered separator>
                  <q-item v-for="tournament in competingTournaments" :key="tournament._id" clickable @click="viewTournamentDetails(tournament._id)">
                    <q-item-section avatar>
                      <q-avatar rounded>
                        <img :src="tournament.imageUrl || '/Image1MainMenu.png'" />
                      </q-avatar>
                    </q-item-section>
                    
                    <q-item-section>
                      <q-item-label>{{ tournament.name }}</q-item-label>
                      <q-item-label caption>{{ formatDate(tournament.date || tournament.startDate) }}</q-item-label>
                      <q-item-label caption>{{ tournament.location }}</q-item-label>
                      <q-item-label caption v-if="tournament.categoryName" class="text-primary">
                        <q-icon name="category" size="xs" class="q-mr-xs" />
                        Catégorie: {{ tournament.categoryName }}
                      </q-item-label>
                    </q-item-section>
                    
                    <q-item-section side>
                      <q-badge color="blue">Compétiteur</q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useRouter } from 'vue-router';
import { date } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const loading = ref(false);
const initialLoading = ref(true);
const loadingTournaments = ref(true);
const activeTab = ref('participating');
const participatingTournaments = ref([]);
const competingTournaments = ref([]);

const form = ref({
  firstName: '',
  lastName: '',
  fighterNumber: '',
  clubName: '',
  address: '',
  email: ''
});
const original = ref({});

// Récupère les informations du profil de l'utilisateur connecté
const fetchProfile = async () => {
  try {
    initialLoading.value = true;
    
    // Utilisation de l'instance api qui gère automatiquement le token
    const { data } = await api.get('/users/me');
    console.log('Données utilisateur reçues:', data); // Pour le débogage
    
    // Remplissage du formulaire avec les données utilisateur
    form.value = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      fighterNumber: data.fighterNumber || '',
      clubName: data.clubName || '',
      address: data.address || '',
      email: data.email || ''
    };
    
    // Sauvegarde des données originales pour pouvoir annuler les modifications
    original.value = { ...form.value };
  } catch (e) {
    console.error('Erreur lors du chargement du profil:', e);
    
    // Message d'erreur plus précis basé sur le code d'erreur HTTP
    const errorMessage = e.response?.status === 401 
      ? "Votre session a expiré. Veuillez vous reconnecter."
      : "Impossible de charger votre profil. Veuillez réessayer.";
    
    $q.notify({ type: 'negative', message: errorMessage });
    router.push('/');
  } finally {
    initialLoading.value = false;
  }
};

// Récupérer les tournois de l'utilisateur
const fetchUserTournaments = async () => {
  try {
    loadingTournaments.value = true;
    
    // Récupérer les tournois où l'utilisateur est inscrit
    const participatingResp = await api.get('/tournaments/me/participating');
    participatingTournaments.value = participatingResp.data.map(tournament => ({
      ...tournament,
      participationStatus: tournament.participants.find(p => 
        p.user === getUserId() || (p.user && p.user._id === getUserId())
      )?.status || 'pending'
    }));
    
    // Récupérer les tournois où l'utilisateur est compétiteur
    const userId = getUserId();
    if (userId) {
      const competingResp = await api.get(`/competitors/user/${userId}`);
      
      // Traiter les données pour avoir des informations complètes sur les tournois
      const competitorData = competingResp.data || [];
      
      if (competitorData.length > 0) {
        // Récupérer les détails des tournois pour chaque compétition
        const tournamentIds = [...new Set(competitorData.map(c => 
          c.tournament._id || c.tournament
        ))];
        
        const tournamentDetailsPromises = tournamentIds.map(id => 
          api.get(`/tournaments/${id}`).catch(() => ({ data: null }))
        );
        
        const tournamentResponses = await Promise.all(tournamentDetailsPromises);
        const tournamentDetails = tournamentResponses
          .map(resp => resp.data)
          .filter(data => data !== null);
        
        // Associer les détails des tournois aux données de compétiteur
        competingTournaments.value = tournamentDetails.map(tournament => {
          const competitorInfo = competitorData.find(c => 
            (c.tournament._id === tournament._id) || (c.tournament === tournament._id)
          );
          
          return {
            ...tournament,
            categoryName: competitorInfo?.category?.name || '',
            competitorId: competitorInfo?._id
          };
        });
      } else {
        competingTournaments.value = [];
      }
    }
  } catch (e) {
    console.error('Erreur lors du chargement des tournois:', e);
    $q.notify({
      type: 'negative',
      message: 'Impossible de charger vos tournois. Veuillez réessayer.'
    });
  } finally {
    loadingTournaments.value = false;
  }
};

// Obtenir l'ID de l'utilisateur connecté
const getUserId = () => {
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

// Formater les dates pour l'affichage
const formatDate = (dateStr) => {
  if (!dateStr) return 'Date non définie';
  
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

// Obtenir la couleur du badge en fonction du statut de participation
const getParticipationStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return 'positive';
    case 'pending': return 'warning';
    case 'cancelled': return 'negative';
    default: return 'grey';
  }
};

// Obtenir le texte du statut de participation
const getParticipationStatusText = (status) => {
  switch (status) {
    case 'confirmed': return 'Confirmé';
    case 'pending': return 'En attente';
    case 'cancelled': return 'Annulé';
    default: return 'Inconnu';
  }
};

// Voir les détails d'un tournoi
const viewTournamentDetails = (tournamentId) => {
  router.push(`/tournaments/${tournamentId}`);
};

// Soumet les modifications du profil
const onSubmit = async () => {
  try {
    loading.value = true;
    
    // Utilisation de l'instance api qui gère automatiquement le token
    const { data } = await api.put('/users/me', form.value);
    
    // Mise à jour des données originales avec les nouvelles valeurs
    original.value = { ...form.value };
    
    $q.notify({ 
      type: 'positive', 
      message: 'Votre profil a été mis à jour avec succès !',
      timeout: 2000
    });
  } catch (e) {
    console.error('Erreur lors de la mise à jour du profil:', e);
    
    // Message d'erreur plus précis basé sur le code d'erreur HTTP
    const errorMessage = e.response?.status === 401 
      ? "Votre session a expiré. Veuillez vous reconnecter."
      : e.response?.status === 400
        ? "Données invalides. Veuillez vérifier vos informations."
        : "Erreur lors de la mise à jour de votre profil. Veuillez réessayer.";
    
    $q.notify({ type: 'negative', message: errorMessage });
  } finally {
    loading.value = false;
  }
};

// Réinitialise le formulaire aux valeurs d'origine et redirige vers la liste des tournois
const resetForm = () => {
  form.value = { ...original.value };
  $q.notify({ 
    type: 'info', 
    message: 'Modifications annulées',
    timeout: 1000
  });
};

// Charge le profil et les tournois de l'utilisateur au chargement de la page
onMounted(() => {
  fetchProfile();
  fetchUserTournaments();
});
</script>

<style lang="scss" scoped>
.full-height {
  height: 100%;
}
</style>
