<template>
    <q-dialog :modelValue="modelValue" @update:modelValue="updateModel" persistent>
        <q-card class="q-pa-md">
            <q-card-section>
                <div class="text-h6">Modifier une Catégorie</div>
            </q-card-section>

            <q-card-section>
                <q-input v-model="categorie.name" label="Nom" outlined dense
                    :rules="[val => !!val || 'Le nom est requiis']" />
            </q-card-section>

            <q-card-section>
                <q-btn flat label="Annuler" color="primary" v-close-popup />
                <q-btn flat label="Modifier Catégorie" color="secondary" @click="modifCategorie" :loading="isLoading" />
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { db } from "../database/db";
import { useQuasar } from "quasar";
import { useLogger } from "src/composables/userLogger";
import { api } from "src/boot/axios";

//pour les notifications
const $q = useQuasar();
const logger = useLogger('CompetitorsCreate');
const isLoading = ref(false);

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    categorieSelect: {
        type: Object,
        default: () => ({})
    }
});

const initialCategorieState = {
    name: ""
};

const categorie = ref({ ...initialCategorieState });

const resetForm = () => {
    // Réinitialiser le formulaire après l'ajout
    categorie.value = { ...initialCategorieState };
}

const emit = defineEmits(["categorie-modification", "update:modelValue"]);

const updateModel = (val) => {
    emit('update:modelValue', val)
}

const modifCategorie = async () => {
    if (!categorie.value.name) {
        $q.notify({
            type: 'warning',
            message: 'Veuillez remplir tous les champs obligatoires',
            position: 'bottom-right',
            timeout: 3000
        });
        return;
    }

    isLoading.value = true;

    try {
        const modifCategorie = JSON.parse(JSON.stringify(categorie.value));

        // Vérification de doublon (sauf si c'est la même catégorie)
        if (modifCategorie.name) {
            const categorieStorage = await db.categories
                .where("name")
                .equals(modifCategorie.name)
                .and(item => item._id !== modifCategorie._id) // Exclure la catégorie actuelle
                .first();
            
            if (categorieStorage) {
                logger.warn('Doublon de catégorie !')
                // Traitement en cas de doublon
                $q.notify({
                    type: 'warning',
                    message: 'Doublon de catégorie !',
                    position: 'bottom-right',
                    timeout: 3000
                });
                isLoading.value = false;
                return;
            }
        }

        try {
            // 1. Mettre à jour dans MongoDB via l'API
            const categoryId = modifCategorie._id || modifCategorie.id;
            if (categoryId) {
                // Préparer les données pour l'API
                const apiCategoryData = {
                    name: modifCategorie.name
                };
                
                // Appel à l'API pour mettre à jour
                await api.put(`/categories/${categoryId}`, apiCategoryData);
                
                // 2. Mettre à jour dans IndexedDB
                const updatedLocalData = {
                    ...modifCategorie,
                    updatedAt: new Date().toISOString()
                };
                
                // Si nous avons un _id MongoDB, utiliser cela, sinon utiliser l'id local
                if (modifCategorie._id) {
                    await db.categories.update(modifCategorie._id, updatedLocalData);
                } else if (modifCategorie.id) {
                    await db.categories.update(modifCategorie.id, updatedLocalData);
                }
                
                $q.notify({
                    type: 'positive',
                    message: 'Catégorie modifiée avec succès !',
                    position: 'bottom-right',
                    timeout: 3000
                })
            } else {
                throw new Error("ID de catégorie manquant");
            }
        } catch (error) {
            logger.error('Erreur lors de la mise à jour de la catégorie:', error);
            $q.notify({
                type: 'negative',
                message: 'Une erreur est survenue lors de la modification de la catégorie !',
                position: 'bottom-right',
                timeout: 3000
            });
            throw error; // Rethrow pour le traitement externe
        }

        emit("categorie-modification", modifCategorie);
        resetForm();
        updateModel(false);
    } catch (error) {
        $q.notify({
            type: 'negative',
            message: 'Une erreur est survenue !',
            position: 'bottom-right',
            timeout: 3000
        });
        logger.error('Une erreur est survenue :', error);
    } finally {
        isLoading.value = false;
    }
};

// Surveiller les changements de categorieSelect et mettre à jour le formulaire
watch(() => props.categorieSelect, (newVal) => {
    if (newVal && Object.keys(newVal).length > 0) {
        // Copier les valeurs du compétiteur sélectionné dans le formulaire
        categorie.value = { ...newVal };
    } else {
        resetForm();
    }
}, { deep: true, immediate: true });

onMounted(() => {
    // Initialisation si nécessaire
})
</script>