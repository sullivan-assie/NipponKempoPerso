<template>
    <q-dialog :modelValue="modelValue" @update:modelValue="updateModel" persistent>
        <q-card style="min-width: 350px">
            <q-card-section>
                <div class="text-h6">Créer une catégorie</div>
            </q-card-section>

            <q-card-section>
                <q-form @submit.prevent="onCreateCategorie" class="q-gutter-md">
                    <div class="row">
                        <div class="col-12">
                            <q-input v-model="categorieName" label="Catégorie"
                                :rules="[val => !!val || 'Le nom est requis']" outlined dense />
                        </div>
                    </div>
                </q-form>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat label="Annuler" color="primary" v-close-popup />
                <q-btn flat label="Créer" color="secondary" @click="onCreateCategorie" :loading="isLoading" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { db } from '../database/db'
import { useQuasar } from 'quasar'
import { useLogger } from 'src/composables/userLogger';
import { api } from 'src/boot/axios';

//pour les notifications
const $q = useQuasar();
const logger = useLogger('CategorieCreate');

defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'categorie-created']);

const categorieName = ref(null)
const isLoading = ref(false);

const updateModel = (val) => {
    emit('update:modelValue', val)
}

const onCreateCategorie = async () => {
    if (categorieName.value) {
        isLoading.value = true;

        // Vérification de doublon
        //Si categorieName est un object ou non
        let searchValue = typeof categorieName.value === 'object' ? categorieName.value.name : categorieName.value;
        const categorieStorage = await db.categories.where("name").equals(searchValue).first();

        if (categorieStorage) {
            logger.warn('Doublon de catégorie !');
            // Traitement en cas de doublon
            $q.notify({
                type: 'warning',
                message: 'Doublon de catégorie !',
                position: 'bottom-right',
                timeout: 3000
            });
            isLoading.value = false;
            return;
        } else {
            // Logique de création de catégorie
            const categorieData = {
                name: categorieName.value,
            }

            try {
                // 1. Enregistrer d'abord dans MongoDB via l'API
                const response = await api.post('/categories', categorieData);
                const savedCategory = response.data;
                
                // 2. Ensuite enregistrer dans IndexedDB avec l'ID généré par MongoDB
                const localCategoryData = {
                    _id: savedCategory._id, // Utiliser l'ID généré par MongoDB
                    name: categorieName.value,
                    updatedAt: new Date().toISOString() // Ajouter la date de mise à jour
                }
                
                // Ajouter la catégorie à IndexedDB
                await db.categories.add(localCategoryData);
                
                $q.notify({
                    type: 'positive',
                    message: 'Catégorie créée avec succès !',
                    position: 'bottom-right',
                    timeout: 3000
                })
                logger.info('✅ Catégorie ajoutée !');
                emit('categorie-created', savedCategory)
                emit('update:modelValue', false) // Ferme le dialogue
    
                // Réinitialiser les champs
                categorieName.value = ''
            } catch (error) {
                logger.error('Une erreur est survenue :', error);
                $q.notify({
                    type: 'negative',
                    message: 'Une erreur est survenue lors de la création de la catégorie !',
                    position: 'bottom-right',
                    timeout: 3000
                })
            } finally {
                isLoading.value = false;
            }
        }
    } else {
        $q.notify({
            type: 'warning',
            message: 'Veuillez remplir tous les champs !',
            position: 'bottom-right',
            timeout: 3000
        })
        logger.error('Une erreur est survenue !');
    }
}
</script>