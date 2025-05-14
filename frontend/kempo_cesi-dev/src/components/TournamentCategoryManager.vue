<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 500px; max-width: 700px;">
      <q-card-section class="row items-center">
        <div class="text-h6">Gérer les catégories du tournoi</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <q-btn color="primary" icon="add" label="Ajouter une catégorie existante" @click="showExistingCategoriesDialog = true" />
          </div>
          <div>
            <q-btn color="secondary" icon="add_circle" label="Créer une nouvelle catégorie" @click="showCreateCategoryDialog = true" />
          </div>
        </div>

        <q-list v-if="tournamentCategories.length > 0" bordered separator class="q-mb-md">
          <q-item v-for="category in tournamentCategories" :key="category._id" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-subtitle1">{{ category.name }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row q-gutter-sm">
                <q-btn flat dense round color="amber" icon="edit" @click="editCategory(category)" />
                <q-btn flat dense round color="negative" icon="delete" @click="confirmRemoveCategory(category)" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="text-center q-pa-md">
          <q-icon name="category" size="3em" color="grey-7" />
          <p class="text-subtitle1">Aucune catégorie n'est associée à ce tournoi.</p>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Fermer" color="primary" v-close-popup @click="closeDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog pour sélectionner des catégories existantes -->
  <q-dialog v-model="showExistingCategoriesDialog">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Ajouter des catégories existantes</div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedCategories"
          :options="availableCategories"
          label="Catégories"
          multiple
          use-chips
          option-label="name"
          option-value="_id"
          emit-value
          map-options
          :loading="loadingCategories"
          class="q-mb-md"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section>
                <q-item-label>Aucune catégorie disponible</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn flat label="Ajouter" color="positive" @click="addExistingCategories" :loading="savingCategories" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog pour créer une nouvelle catégorie -->
  <CategorieCreate
    v-model="showCreateCategoryDialog"
    @categorie-created="onCategoryCreated"
  />

  <!-- Dialog pour éditer une catégorie -->
  <q-dialog v-model="showEditCategoryDialog">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Modifier la catégorie</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="editedCategoryName"
          label="Nom de la catégorie"
          :rules="[val => !!val || 'Le nom est requis']"
          outlined
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn flat label="Enregistrer" color="positive" @click="updateCategory" :loading="savingCategories" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog de confirmation de suppression -->
  <q-dialog v-model="showConfirmDialog">
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="warning" color="warning" text-color="white" />
        <span class="q-ml-sm">Êtes-vous sûr de vouloir supprimer cette catégorie du tournoi ?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annuler" color="primary" v-close-popup />
        <q-btn flat label="Supprimer" color="negative" @click="removeCategory" :loading="savingCategories" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { db } from 'src/database/db';
import CategorieCreate from './CategorieCreate.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  tournamentId: {
    type: String,
    required: true
  },
  tournamentCategories: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'categories-updated']);
const $q = useQuasar();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Catégories
const availableCategories = ref([]);
const selectedCategories = ref([]);
const loadingCategories = ref(false);
const savingCategories = ref(false);
const showExistingCategoriesDialog = ref(false);
const showCreateCategoryDialog = ref(false);
const showEditCategoryDialog = ref(false);
const showConfirmDialog = ref(false);
const editedCategory = ref(null);
const editedCategoryName = ref('');
const categoryToRemove = ref(null);

// Fermer la boîte de dialogue principale
const closeDialog = () => {
  dialogVisible.value = false;
};

// Charger toutes les catégories disponibles
const loadCategories = async () => {
  loadingCategories.value = true;
  try {
    // Récupérer les catégories depuis IndexedDB
    let dbCategories = await db.categories.toArray();
    
    // Si pas de catégories locales, récupérer depuis l'API
    if (dbCategories.length === 0) {
      const response = await api.get('/categories');
      dbCategories = response.data;
      
      // Mettre à jour IndexedDB avec les catégories récupérées
      await db.categories.bulkPut(dbCategories);
    }
    
    // Filtrer les catégories déjà présentes dans le tournoi
    const tournamentCategoryIds = props.tournamentCategories.map(cat => typeof cat === 'object' ? cat._id : cat);
    availableCategories.value = dbCategories.filter(cat => !tournamentCategoryIds.includes(cat._id));
  } catch (error) {
    console.error('Erreur lors du chargement des catégories:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de charger les catégories',
      icon: 'warning'
    });
  } finally {
    loadingCategories.value = false;
  }
};

// Ajouter des catégories existantes au tournoi
const addExistingCategories = async () => {
  if (!selectedCategories.value || selectedCategories.value.length === 0) {
    $q.notify({
      color: 'warning',
      message: 'Veuillez sélectionner au moins une catégorie',
      icon: 'warning'
    });
    return;
  }

  savingCategories.value = true;
  try {
    // Préparer les données à envoyer
    const categoryIds = selectedCategories.value.map(cat => typeof cat === 'object' ? cat._id : cat);
    
    // Appel API pour ajouter les catégories au tournoi
    await api.post(`/tournaments/${props.tournamentId}/categories`, { 
      categories: categoryIds 
    });
    
    $q.notify({
      color: 'positive',
      message: 'Catégories ajoutées avec succès',
      icon: 'check'
    });
    
    // Fermer le dialogue et émettre l'événement de mise à jour
    showExistingCategoriesDialog.value = false;
    selectedCategories.value = [];
    emit('categories-updated');
  } catch (error) {
    console.error('Erreur lors de l\'ajout des catégories au tournoi:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible d\'ajouter les catégories au tournoi',
      icon: 'warning'
    });
  } finally {
    savingCategories.value = false;
  }
};

// Gérer la création d'une nouvelle catégorie
const onCategoryCreated = (newCategory) => {
  // Ajouter automatiquement la nouvelle catégorie au tournoi
  addCategoryToTournament(newCategory);
};

// Ajouter une catégorie nouvellement créée au tournoi
const addCategoryToTournament = async (category) => {
  savingCategories.value = true;
  try {
    // Appel API pour ajouter la catégorie au tournoi
    await api.post(`/tournaments/${props.tournamentId}/categories`, { 
      categories: [category._id] 
    });
    
    $q.notify({
      color: 'positive',
      message: 'Catégorie ajoutée au tournoi avec succès',
      icon: 'check'
    });
    
    emit('categories-updated');
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la catégorie au tournoi:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible d\'ajouter la catégorie au tournoi',
      icon: 'warning'
    });
  } finally {
    savingCategories.value = false;
  }
};

// Préparer la modification d'une catégorie
const editCategory = (category) => {
  editedCategory.value = category;
  editedCategoryName.value = category.name;
  showEditCategoryDialog.value = true;
};

// Mettre à jour une catégorie
const updateCategory = async () => {
  if (!editedCategoryName.value.trim()) {
    $q.notify({
      color: 'warning',
      message: 'Le nom de la catégorie est requis',
      icon: 'warning'
    });
    return;
  }

  savingCategories.value = true;
  try {
    // Appel API pour mettre à jour la catégorie
    await api.put(`/categories/${editedCategory.value._id}`, {
      name: editedCategoryName.value
    });
    
    // Mettre à jour dans IndexedDB également
    await db.categories.update(editedCategory.value._id, {
      name: editedCategoryName.value,
      updatedAt: new Date().toISOString()
    });
    
    $q.notify({
      color: 'positive',
      message: 'Catégorie mise à jour avec succès',
      icon: 'check'
    });
    
    showEditCategoryDialog.value = false;
    emit('categories-updated');
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de mettre à jour la catégorie',
      icon: 'warning'
    });
  } finally {
    savingCategories.value = false;
  }
};

// Préparer la suppression d'une catégorie
const confirmRemoveCategory = (category) => {
  categoryToRemove.value = category;
  showConfirmDialog.value = true;
};

// Supprimer une catégorie du tournoi
const removeCategory = async () => {
  savingCategories.value = true;
  try {
    // Appel API pour supprimer la catégorie du tournoi
    await api.delete(`/tournaments/${props.tournamentId}/categories/${categoryToRemove.value._id}`);
    
    $q.notify({
      color: 'positive',
      message: 'Catégorie supprimée du tournoi avec succès',
      icon: 'check'
    });
    
    showConfirmDialog.value = false;
    emit('categories-updated');
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie du tournoi:', error);
    $q.notify({
      color: 'negative',
      message: 'Impossible de supprimer la catégorie du tournoi',
      icon: 'warning'
    });
  } finally {
    savingCategories.value = false;
  }
};

// Charger les catégories au montage du composant et à chaque ouverture
onMounted(() => {
  if (dialogVisible.value) {
    loadCategories();
  }
});

watch(() => dialogVisible.value, (newValue) => {
  if (newValue) {
    loadCategories();
  }
});

// Recharger les catégories disponibles lorsque les catégories du tournoi changent
watch(() => props.tournamentCategories, () => {
  if (dialogVisible.value) {
    loadCategories();
  }
}, { deep: true });
</script>