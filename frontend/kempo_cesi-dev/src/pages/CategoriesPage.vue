<template>
    <q-page class="github-page q-pa-md">
        <!-- Fil d'Ariane -->
        <div class="row q-mb-md items-center">
            <q-btn 
                flat 
                round 
                dense 
                icon="home" 
                color="grey-4"
                class="q-mr-sm github-btn-flat" 
                to="/mainMenu" 
            />
            <q-icon name="chevron_right" size="xs" color="grey-5" class="q-mr-sm" />
            <div class="text-primary text-h6">Paramètres - Catégories</div>
        </div>

        <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md-8">
                <q-card flat class="github-card">
                    <q-card-section>
                        <div class="text-h6 text-white">Gestion des catégories</div>
                        <div class="text-subtitle2 q-mt-sm text-grey-4">
                            Les catégories permettent de classer les compétiteurs lors des tournois en fonction de leur poids, âge, grade ou autre critère.
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <div class="q-mt-md">
            <!-- Contenu principal -->
            <div class="col-auto col-md-auto">
                <div class="q-mt-lg">
                    <div class="row q-mb-md items-center q-col-gutter-md">
                        <div class="col-auto">
                            <q-btn 
                                color="negative"
                                text-color="white"
                                icon="add" 
                                label="Ajouter une catégorie"
                                outline
                                class="github-btn-important"
                                @click="openCreateCategorieDialog" 
                            />
                        </div>
                        <div class="col-auto">
                            <q-btn 
                                color="red-4"
                                icon="delete" 
                                label="Supprimer les catégories"
                                flat
                                class="github-btn-danger"
                                @click="confirmDeleteAll" 
                            />
                        </div>
                        <div class="col">
                            <q-input 
                                dense 
                                outlined 
                                v-model="search" 
                                placeholder="Rechercher..." 
                                class="float-right github-input"
                                style="width: 250px"
                                dark
                                color="grey-4"
                                label-color="grey-4"
                            >
                                <template v-slot:prepend>
                                    <q-icon name="search" color="grey-4" />
                                </template>
                            </q-input>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12 col-md-6 col-lg-4">
                            <q-card flat class="github-card">
                                <q-card-section class="row items-center q-pb-none">
                                    <div class="text-h6 text-white">Catégories ({{ categories.length }})</div>
                                    <q-space />
                                </q-card-section>
                                <q-card-section class="q-pa-none">
                                    <q-table 
                                        :rows="categories" 
                                        :columns="columns" 
                                        row-key="id"
                                        selection="multiple" 
                                        v-model:selected="selected"
                                        :rows-per-page-options="[10, 25, 50, 0]"
                                        :pagination="{ rowsPerPage: 10 }"
                                        flat 
                                        class="github-table"
                                        dark
                                        no-data-label="Aucune catégorie créée" 
                                        :filter="search"
                                    >
                                        <template v-slot:header="props">
                                            <q-tr :props="props">
                                                <q-th auto-width>
                                                    <q-checkbox 
                                                        v-model="props.selected" 
                                                        color="primary"
                                                        class="github-checkbox"
                                                    />
                                                </q-th>
                                                <q-th v-for="col in props.cols" :key="col.name" :props="props">
                                                    {{ col.label }}
                                                </q-th>
                                                <q-th auto-width></q-th>
                                            </q-tr>
                                        </template>

                                        <template v-slot:body="props">
                                            <q-tr :props="props">
                                                <q-td auto-width>
                                                    <q-checkbox 
                                                        v-model="props.selected" 
                                                        color="primary"
                                                        class="github-checkbox"
                                                    />
                                                </q-td>
                                                <q-td v-for="col in props.cols" :key="col.name" :props="props">
                                                    {{ props.row[col.field] }}
                                                </q-td>
                                                <q-td auto-width>
                                                    <q-btn 
                                                        flat 
                                                        round 
                                                        dense 
                                                        icon="more_vert"
                                                        color="grey-4"
                                                        class="github-action-btn"
                                                    >
                                                        <q-menu class="github-menu">
                                                            <q-list style="min-width: 100px" class="github-menu-list">
                                                                <q-item 
                                                                    clickable 
                                                                    v-close-popup
                                                                    class="github-menu-item"
                                                                    @click="openModifCategorieDialog(props.row)"
                                                                >
                                                                    <q-item-section>
                                                                        <q-item-label class="text-grey-3">Modifier</q-item-label>
                                                                    </q-item-section>
                                                                </q-item>
                                                                <q-item 
                                                                    clickable 
                                                                    v-close-popup
                                                                    class="github-menu-item"
                                                                    @click="confirmDeleteCategorie(props.row)"
                                                                >
                                                                    <q-item-section>
                                                                        <q-item-label class="text-red-4">Supprimer</q-item-label>
                                                                    </q-item-section>
                                                                </q-item>
                                                            </q-list>
                                                        </q-menu>
                                                    </q-btn>
                                                </q-td>
                                            </q-tr>
                                        </template>
                                    </q-table>
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </q-page>

    <CreateCategorie v-model="createCategorieDialogVisible" @categorie-created="onCategorieCreated" />
    <ModifCategorie v-model="modifCategorieDialogVisible" :categorieSelect="categorieSelect"
        @categorie-modification="onCategorieModif" />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import CreateCategorie from '../components/CategorieCreate.vue';
import ModifCategorie from '../components/CategorieChange.vue';
import { db } from '../database/db';
import { useQuasar } from 'quasar';
import { api } from '../boot/axios'; // Correction de l'import de l'API

const $q = useQuasar();

const search = ref('');
const createCategorieDialogVisible = ref(false);
const modifCategorieDialogVisible = ref(false);
const selected = ref([]);
const categorieSelect = ref({});
const categories = ref([]);
const loading = ref(false);

const openCreateCategorieDialog = () => {
    createCategorieDialogVisible.value = true;
};

const openModifCategorieDialog = (categorieSelected) => {
    categorieSelect.value = JSON.parse(JSON.stringify(categorieSelected));
    modifCategorieDialogVisible.value = true;
};

const onCategorieCreated = async (categorieData) => {
    console.log('Catégorie créée:', categorieData)
    await getCategories();
}

const onCategorieModif = async (categorieData) => {
    console.log('Catégorie modifiée:', categorieData)
    await getCategories();
}

// Récupération des catégories depuis l'API et synchronisation avec IndexedDB
const getCategories = async () => {
    loading.value = true;
    try {
        // 1. Récupérer les catégories depuis l'API backend
        const response = await api.get('/categories');
        const backendCategories = response.data;
        
        // 2. Mettre à jour les catégories dans IndexedDB
        // D'abord, récupérer toutes les catégories locales
        const localCategories = await db.categories.toArray();
        
        // Identifier les catégories à ajouter ou mettre à jour
        for (const backendCategory of backendCategories) {
            const localCategory = localCategories.find(cat => cat._id === backendCategory._id);
            
            if (!localCategory) {
                // Ajouter la nouvelle catégorie à IndexedDB
                await db.categories.add({
                    _id: backendCategory._id,
                    name: backendCategory.name,
                    updatedAt: backendCategory.updatedAt || new Date().toISOString()
                });
            } else if (
                !localCategory.updatedAt || 
                new Date(backendCategory.updatedAt) > new Date(localCategory.updatedAt)
            ) {
                // Mettre à jour la catégorie locale si la version backend est plus récente
                await db.categories.update(localCategory._id, {
                    ...localCategory,
                    name: backendCategory.name,
                    updatedAt: backendCategory.updatedAt
                });
            }
        }
        
        // Mettre à jour le tableau des catégories pour l'affichage
        categories.value = backendCategories;
        console.log('Catégories récupérées:', categories.value);
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        
        // Si l'API échoue, utiliser les données locales
        categories.value = await db.categories.toArray();
        $q.notify({
            type: 'warning',
            message: 'Impossible de récupérer les catégories depuis le serveur. Données locales affichées.',
            position: 'bottom-right',
            timeout: 3000
        });
    } finally {
        loading.value = false;
    }
}

// Confirmation avant suppression d'une catégorie avec style GitHub
const confirmDeleteCategorie = (categorie) => {
    $q.dialog({
        title: 'Confirmation',
        message: `Êtes-vous sûr de vouloir supprimer la catégorie "${categorie.name}" ?`,
        cancel: true,
        persistent: true,
        dark: true,
        class: 'github-dialog'
    }).onOk(() => {
        deleteCategorie(categorie);
    });
}

// Suppression d'une catégorie
const deleteCategorie = async (categorie) => {
    // Récupérer l'ID correct (MongoDB ou IndexedDB)
    const categorieId = categorie._id || categorie.id;
    
    if (!categorieId) {
        console.error('Aucun ID de catégorie fourni !')
        $q.notify({
            type: 'warning',
            message: 'Suppression impossible',
            position: 'bottom-right',
            timeout: 3000
        })
        return;
    }

    try {
        // 1. Supprimer de MongoDB via l'API
        await api.delete(`/categories/${categorieId}`);
        
        // 2. Supprimer de IndexedDB
        await db.categories
            .where('_id')
            .equals(categorieId)
            .or('id')
            .equals(categorieId)
            .delete();
            
        console.log('Catégorie supprimée:', categorieId);
        $q.notify({
            type: 'positive',
            message: 'Catégorie supprimée',
            position: 'bottom-right',
            timeout: 3000
        })

        await getCategories();
    } catch (error) {
        $q.notify({
            type: 'warning',
            message: 'Une erreur est survenue lors de la suppression',
            position: 'bottom-right',
            timeout: 3000
        })
        console.error('Erreur lors de la suppression :', error)
    }
}

// Confirmation avant suppression de toutes les catégories avec style GitHub
const confirmDeleteAll = () => {
    $q.dialog({
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir supprimer toutes les catégories ?',
        cancel: true,
        persistent: true,
        dark: true,
        class: 'github-dialog'
    }).onOk(() => {
        deleteAllCategories();
    });
}

// Suppression de toutes les catégories
const deleteAllCategories = async () => {
    try {
        // 1. Supprimer toutes les catégories de MongoDB via l'API
        await api.delete('/categories');
        
        // 2. Supprimer toutes les catégories de IndexedDB
        await db.categories.clear();
        
        $q.notify({
            type: 'positive',
            message: 'Toutes les catégories ont été supprimées',
            position: 'bottom-right',
            timeout: 3000
        })
        await getCategories();
    } catch (error) {
        console.error(error)
        $q.notify({
            type: 'warning',
            message: 'Une erreur est survenue lors de la suppression des catégories',
            position: 'bottom-right',
            timeout: 3000
        })
    }
}

const columns = [
    { name: 'name', label: 'Nom', field: 'name', sortable: true },
];

onMounted(() => {
    getCategories();
})
</script>

<style lang="scss" scoped>
// Page background
.github-page {
  background: #0d1117;
  color: #f0f6fc;
}

// GitHub-style card
.github-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
}

// GitHub-style inputs (from previous artifacts)
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
  
  :deep(.q-field__append) {
    .q-icon {
      color: #8b949e !important;
    }
  }
}

// GitHub-style buttons
.github-btn-flat {
  color: #8b949e !important;
  font-size: 14px !important;
  
  &:hover {
    color: #f0f6fc !important;
    background: rgba(177, 186, 196, 0.12) !important;
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

.github-btn-danger {
  color: #f85149 !important;
  font-size: 14px !important;
  
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

// GitHub-style checkboxes
.github-checkbox {
  :deep(.q-checkbox__bg) {
    border: 2px solid #30363d !important;
    background: transparent !important;
    border-radius: 3px !important;
  }
  
  :deep(.q-checkbox__bg:hover) {
    border-color: #58a6ff !important;
  }
  
  :deep(.q-checkbox__bg .q-checkbox__svg) {
    color: #f0f6fc !important;
  }
  
  :deep(.q-checkbox__inner--active .q-checkbox__bg) {
    background: #1976d2 !important;
    border-color: #1976d2 !important;
  }
  
  :deep(.q-checkbox__inner--truthy .q-checkbox__bg) {
    background: #1976d2 !important;
    border-color: #1976d2 !important;
  }
}

// GitHub-style table (from previous artifacts)
.github-table {
  background: transparent !important;
  border-radius: 6px !important;
  overflow: hidden;
  
  :deep(.q-table__top) {
    background: #161b22 !important;
    border-bottom: 1px solid #30363d !important;
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
    font-size: 14px !important;
  }
  
  :deep(.q-table tbody tr) {
    background: transparent !important;
    border-bottom: 1px solid #21262d !important;
    
    &:hover {
      background: rgba(177, 186, 196, 0.06) !important;
    }
    
    &:last-child {
      border-bottom: none !important;
    }
  }
  
  :deep(.q-table tbody td) {
    color: #e6edf3 !important;
    font-size: 14px !important;
    padding: 12px 16px !important;
  }
  
  :deep(.q-spinner) {
    color: #58a6ff !important;
  }
}

// GitHub-style menus
.github-menu {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
}

.github-menu-list {
  background: transparent !important;
}

.github-menu-item {
  color: #f0f6fc !important;
  
  &:hover {
    background: rgba(177, 186, 196, 0.12) !important;
  }
}

// GitHub-style dialog
:deep(.github-dialog) {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 6px !important;
  
  .q-dialog__title {
    color: #f0f6fc !important;
  }
  
  .q-dialog__message {
    color: #8b949e !important;
  }
  
  .q-btn {
    border-radius: 6px !important;
  }
}

// Custom scrollbar
:deep(*) {
  scrollbar-width: thin;
  scrollbar-color: #30363d #0d1117;
}

:deep(*::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(*::-webkit-scrollbar-track) {
  background: #0d1117;
}

:deep(*::-webkit-scrollbar-thumb) {
  background: #30363d;
  border-radius: 4px;
}

:deep(*::-webkit-scrollbar-thumb:hover) {
  background: #484f58;
}

// Responsive
@media (max-width: 768px) {
  .row.q-col-gutter-md {
    flex-direction: column;
    
    .col-auto {
      margin-bottom: 0.5rem;
    }
    
    .github-input {
      width: 100% !important;
      float: none !important;
    }
  }
}
</style>