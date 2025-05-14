<template>
    <q-page class="q-pa-md">
        <!-- Fil d'Ariane -->
        <div class="row q-mb-md items-center">
            <q-btn flat round dense icon="home" to="/mainMenu" class="q-mr-sm" />
            <q-icon name="chevron_right" size="xs" class="q-mr-sm" />
            <div class="text-primary text-h6">Paramètres - Catégories</div>
        </div>
        YOOOOOO
        <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md-8">
                <q-card flat bordered>
                    <q-card-section>
                        <div class="text-h6">Gestion des catégories</div>
                        <div class="text-subtitle2 q-mt-sm">
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
                    <div class="row q-mb-md items-center">
                        <div class="q-mr-sm">
                            <q-btn color="primary" icon="add" label="Ajouter une catégorie"
                                @click="openCreateCategorieDialog" />
                        </div>
                        <div>
                            <q-btn color="negative" icon="delete" label="Supprimer les catégories"
                                @click="confirmDeleteAll" />
                        </div>
                        <div class="col q-ml-md">
                            <q-input dense outlined v-model="search" placeholder="Rechercher..." class="float-right"
                                style="width: 250px">
                                <template v-slot:prepend>
                                    <q-icon name="search" />
                                </template>
                            </q-input>
                        </div>
                    </div>

                    <q-card>
                        <q-card-section class="row items-center q-pb-none">
                            <div class="text-h6">Catégories ({{ categories.length }})</div>
                            <q-space />
                        </q-card-section>
                        <q-card-section>
                            <q-table 
                                :style="tableStyle" 
                                :rows="categories" 
                                :columns="columns" 
                                row-key="id"
                                selection="multiple" 
                                v-model:selected="selected"
                                :rows-per-page-options="[0]" 
                                flat 
                                bordered
                                no-data-label="Aucune catégorie créée" 
                                :filter="search">

                                <template v-slot:header="props">
                                    <q-tr :props="props">
                                        <q-th auto-width>
                                            <q-checkbox v-model="props.selected" />
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
                                            <q-checkbox v-model="props.selected" />
                                        </q-td>
                                        <q-td v-for="col in props.cols" :key="col.name" :props="props">
                                            {{ props.row[col.field] }}
                                        </q-td>
                                        <q-td auto-width>
                                            <q-btn flat round dense icon="more_vert">
                                                <q-menu>
                                                    <q-list style="min-width: 100px">
                                                        <q-item clickable v-close-popup
                                                            @click="openModifCategorieDialog(props.row)">
                                                            <q-item-section>Modifier</q-item-section>
                                                        </q-item>
                                                        <q-item clickable v-close-popup
                                                            @click="confirmDeleteCategorie(props.row)">
                                                            <q-item-section>Supprimer</q-item-section>
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

// Confirmation avant suppression d'une catégorie
const confirmDeleteCategorie = (categorie) => {
    $q.dialog({
        title: 'Confirmation',
        message: `Êtes-vous sûr de vouloir supprimer la catégorie "${categorie.name}" ?`,
        cancel: true,
        persistent: true
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

// Confirmation avant suppression de toutes les catégories
const confirmDeleteAll = () => {
    $q.dialog({
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir supprimer toutes les catégories ?',
        cancel: true,
        persistent: true
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

// Taille du tableau
const tableStyle = computed(() => ({
    height: (categories.value && categories.value.length > 0) ? "400px" : "auto",
}));

onMounted(() => {
    getCategories();
})
</script>