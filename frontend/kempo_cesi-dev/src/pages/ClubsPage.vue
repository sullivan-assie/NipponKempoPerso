<template>
  <q-page padding>
    <div class="container">
      <div class="row justify-between items-center q-mb-xl">
        <h2 class="text-h3 text-center q-my-none col-12 col-sm-auto">Gestion des clubs</h2>
        
        <q-btn 
          color="primary" 
          icon="add" 
          label="Créer un club" 
          @click="openClubManager"
          class="q-mt-sm q-mt-sm-none col-12 col-sm-auto"
        />
      </div>
      
      <div v-if="loading" class="text-center">
        <q-spinner size="3em" color="primary" />
        <p class="text-subtitle1 q-mt-md">Chargement des clubs...</p>
      </div>
      
      <div v-else-if="clubs.length === 0" class="text-center q-pa-xl">
        <q-icon name="business" size="4em" color="grey-7" />
        <p class="text-subtitle1 q-mt-md">Aucun club disponible pour le moment.</p>
        <q-btn color="primary" label="Créer un club" icon="add" @click="openClubManager" class="q-mt-md" />
      </div>
      
      <div v-else class="row q-col-gutter-lg">
        <div v-for="club in clubs" :key="club._id" class="col-12 col-sm-6 col-md-4">
          <q-card class="club-card" flat bordered>
            <q-card-section>
              <div class="text-h6">{{ club.name }}</div>
              <q-separator class="q-my-sm" />
              <div class="text-body2 q-mt-sm">{{ club.description || 'Pas de description disponible' }}</div>
            </q-card-section>
            
            <q-card-section>
              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-icon name="location_on" size="xs" class="q-mr-xs" />
                  {{ formatAddress(club.address) || 'Adresse non précisée' }}
                </div>
                <div class="col-12">
                  <q-icon name="email" size="xs" class="q-mr-xs" />
                  {{ club.contactEmail || 'Email non précisé' }}
                </div>
                <div class="col-12">
                  <q-icon name="phone" size="xs" class="q-mr-xs" />
                  {{ club.contactPhone || 'Téléphone non précisé' }}
                </div>
              </div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <div class="text-subtitle2">Membres</div>
              <div class="row items-center">
                <q-chip 
                  color="primary" 
                  text-color="white" 
                  icon="people" 
                  class="q-mr-sm"
                >
                  {{ club.members ? club.members.length : 0 }} membre{{ club.members && club.members.length !== 1 ? 's' : '' }}
                </q-chip>
                
                <q-chip 
                  color="secondary" 
                  text-color="white" 
                  icon="sports" 
                  class="q-mr-sm"
                  v-if="club.coaches && club.coaches.length"
                >
                  {{ club.coaches.length }} entraîneur{{ club.coaches.length > 1 ? 's' : '' }}
                </q-chip>
              </div>
            </q-card-section>
            
            <q-card-actions align="right">
              <q-btn flat color="primary" icon="group" @click="viewClubDetails(club)" />
              <q-btn flat color="secondary" icon="edit" @click="editClub(club)" />
              <q-btn flat color="negative" icon="delete" @click="confirmDeleteClub(club)" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
    
    <!-- Gestionnaire de clubs (création, modification, gestion des membres) -->
    <ClubManager 
      v-model:isOpen="showClubManager" 
      @club-updated="fetchClubs"
    />
    
    <!-- Dialogue de confirmation de suppression -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirmation de suppression</span>
        </q-card-section>

        <q-card-section>
          <p>Êtes-vous sûr de vouloir supprimer le club "<strong>{{ clubToDelete?.name }}</strong>" ?</p>
          <p class="text-caption text-negative">
            <q-icon name="warning" />
            Cette action est irréversible. Les utilisateurs ne seront plus affiliés à ce club.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn 
            flat 
            label="Supprimer" 
            color="negative" 
            @click="deleteClub" 
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import ClubManager from 'src/components/ClubManager.vue';

const $q = useQuasar();

// État de la page
const loading = ref(false);
const clubs = ref([]);
const showClubManager = ref(false);
const selectedClubId = ref(null);

// Variables pour la suppression
const showDeleteConfirm = ref(false);
const clubToDelete = ref(null);
const deleting = ref(false);

// Récupérer tous les clubs
const fetchClubs = async () => {
  loading.value = true;
  try {
    const response = await api.get('/clubs');
    clubs.value = response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des clubs:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger la liste des clubs',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Formatage d'une adresse
const formatAddress = (address) => {
  if (!address) return '';
  
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.postalCode || address.city) {
    const cityPart = [address.postalCode, address.city].filter(Boolean).join(' ');
    parts.push(cityPart);
  }
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
};

// Ouvrir la modale de gestion des clubs
const openClubManager = () => {
  showClubManager.value = true;
};

// Afficher les détails d'un club
const viewClubDetails = (club) => {
  // Utiliser ClubManager pour voir les détails
  selectedClubId.value = club._id;
  showClubManager.value = true;
};

// Éditer un club
const editClub = (club) => {
  // Utiliser ClubManager pour l'édition
  selectedClubId.value = club._id;
  showClubManager.value = true;
};

// Confirmer la suppression d'un club
const confirmDeleteClub = (club) => {
  clubToDelete.value = club;
  showDeleteConfirm.value = true;
};

// Supprimer un club
const deleteClub = async () => {
  if (!clubToDelete.value) return;
  
  deleting.value = true;
  try {
    await api.delete(`/clubs/${clubToDelete.value._id}`);
    
    $q.notify({
      color: 'positive',
      message: `Le club "${clubToDelete.value.name}" a été supprimé avec succès`,
      icon: 'check_circle'
    });
    
    await fetchClubs();
  } catch (error) {
    console.error('Erreur lors de la suppression du club:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Erreur lors de la suppression du club',
      icon: 'error'
    });
  } finally {
    deleting.value = false;
    showDeleteConfirm.value = false;
    clubToDelete.value = null;
  }
};

// Charger les clubs au montage du composant
onMounted(() => {
  fetchClubs();
});
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.club-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
}
</style>