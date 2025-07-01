<template>
  <q-page class="github-page" padding>
    <div class="container">
      <div class="row justify-between items-center q-mb-xl">
        <h2 class="text-h3 q-my-none col-12 col-sm-auto text-white">Gestion des clubs</h2>
        
        <q-btn 
          color="negative"
          text-color="white"
          icon="add" 
          label="Créer un club"
          outline
          class="q-mt-sm q-mt-sm-none col-12 col-sm-auto github-btn-important"
          @click="openClubManager"
        />
      </div>
      
      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner size="3em" color="primary" />
        <p class="text-h6 q-mt-md text-grey-4">Chargement des clubs...</p>
      </div>
      
      <div v-else-if="clubs.length === 0" class="empty-state text-center q-pa-xl">
        <q-icon name="business" size="4em" color="grey-6" />
        <p class="text-h6 q-mt-md text-grey-4">Aucun club disponible pour le moment.</p>
        <q-btn 
          color="negative"
          text-color="white"
          label="Créer un club" 
          icon="add"
          outline
          class="q-mt-md github-btn-important"
          @click="openClubManager" 
        />
      </div>
      
      <div v-else class="row q-col-gutter-lg">
        <div v-for="club in clubs" :key="club._id" class="col-12 col-sm-6 col-md-4">
          <q-card class="github-club-card full-height">
            <q-card-section>
              <div class="text-h6 text-white">{{ club.name }}</div>
              <q-separator color="grey-8" class="q-my-sm" />
              <div class="text-body2 q-mt-sm text-grey-4">{{ club.description || 'Pas de description disponible' }}</div>
            </q-card-section>
            
            <q-card-section>
              <div class="club-details">
                <div class="detail-item">
                  <q-icon name="location_on" size="xs" color="grey-5" class="q-mr-xs" />
                  <span class="text-grey-4">{{ formatAddress(club.address) || 'Adresse non précisée' }}</span>
                </div>
                <div class="detail-item">
                  <q-icon name="email" size="xs" color="grey-5" class="q-mr-xs" />
                  <span class="text-grey-4">{{ club.contactEmail || 'Email non précisé' }}</span>
                </div>
                <div class="detail-item">
                  <q-icon name="phone" size="xs" color="grey-5" class="q-mr-xs" />
                  <span class="text-grey-4">{{ club.contactPhone || 'Téléphone non précisé' }}</span>
                </div>
              </div>
            </q-card-section>
            
            <q-separator color="grey-8" />
            
            <q-card-section>
              <div class="text-subtitle2 text-grey-3 q-mb-sm">Membres</div>
              <div class="row items-center q-gutter-xs">
                <q-chip 
                  color="grey-7" 
                  text-color="white" 
                  icon="people" 
                  size="sm"
                >
                  {{ club.members ? club.members.length : 0 }} membre{{ club.members && club.members.length !== 1 ? 's' : '' }}
                </q-chip>
                
                <q-chip 
                  color="secondary" 
                  text-color="white" 
                  icon="sports" 
                  size="sm"
                  v-if="club.coaches && club.coaches.length"
                >
                  {{ club.coaches.length }} entraîneur{{ club.coaches.length > 1 ? 's' : '' }}
                </q-chip>
              </div>
            </q-card-section>
            
            <q-card-actions align="right" class="q-mt-auto">
              <q-btn 
                flat 
                color="grey-4" 
                icon="group"
                round
                dense
                class="github-action-btn"
                @click="viewClubDetails(club)"
              >
                <q-tooltip>Voir les détails</q-tooltip>
              </q-btn>
              <q-btn 
                flat 
                color="grey-4" 
                icon="edit"
                round
                dense
                class="github-action-btn"
                @click="editClub(club)"
              >
                <q-tooltip>Modifier le club</q-tooltip>
              </q-btn>
              <q-btn 
                flat 
                color="red-4" 
                icon="delete"
                round
                dense
                class="github-action-btn"
                @click="confirmDeleteClub(club)"
              >
                <q-tooltip>Supprimer le club</q-tooltip>
              </q-btn>
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
      <q-card class="github-dialog" style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6 text-white">Confirmation de suppression</span>
        </q-card-section>

        <q-card-section>
          <p class="text-grey-4">Êtes-vous sûr de vouloir supprimer le club "<strong class="text-white">{{ clubToDelete?.name }}</strong>" ?</p>
          <p class="text-caption text-red-4">
            <q-icon name="warning" />
            Cette action est irréversible. Les utilisateurs ne seront plus affiliés à ce club.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn 
            flat 
            label="Annuler" 
            color="grey-4" 
            class="github-btn-flat"
            v-close-popup 
          />
          <q-btn 
            flat 
            label="Supprimer" 
            color="red-4" 
            class="github-btn-danger"
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
// Page background
.github-page {
  background: #0d1117;
  color: #f0f6fc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

// GitHub-style club cards
.github-club-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  transition: transform 0.2s ease, border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    border-color: #58a6ff;
  }
}

// Club details
.club-details {
  .detail-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 0.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .q-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
    
    span {
      word-break: break-word;
      line-height: 1.4;
    }
  }
}

// GitHub-style buttons (from previous artifacts)
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

.github-action-btn {
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: rgba(177, 186, 196, 0.12) !important;
  }
}

// GitHub-style dialog
.github-dialog {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
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
    
    h2 {
      margin-bottom: 1rem;
    }
  }
  
  .github-club-card {
    margin-bottom: 1.5rem;
  }
  
  .club-details {
    .detail-item {
      span {
        font-size: 13px;
      }
    }
  }
}

// Card spacing adjustments
.q-card-section {
  &:last-child {
    padding-bottom: 16px;
  }
}

.q-card-actions {
  padding: 8px 16px 16px 16px;
}

// Chips styling
.q-chip {
  font-size: 12px;
  font-weight: 500;
}
</style>