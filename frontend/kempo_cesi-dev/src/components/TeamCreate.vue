<template>
    <q-dialog :modelValue="modelValue" @update:modelValue="updateModel" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Créer une équipe</div>
        </q-card-section>
  
        <q-card-section>
          <q-form @submit.prevent="onCreateTeam" class="q-gutter-md">
            <div class="row">
              <div class="col-12">
                <q-input
                  v-model="teamName"
                  label="Nom de l'équipe"
                  :rules="[val => !!val || 'Le nom est requis']"
                  outlined
                  dense
                />
              </div>
            </div>
          </q-form>
        </q-card-section>
  
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Créer" color="secondary" @click="onCreateTeam" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { db } from '../database/db';
  import { useQuasar } from 'quasar';
  import { useLogger } from 'src/composables/userLogger';
  //pour les notifications
  const $q = useQuasar();
  const logger = useLogger('TeamCreate');
 
  defineProps({
    modelValue: {
      type: Boolean,
      default: false
    }
  })
  
  const emit = defineEmits(['update:modelValue', 'team-created'])
  
  const teamName = ref(null)
  
  const updateModel = (val) => {
    emit('update:modelValue', val)
  }
  
  const onCreateTeam = async () => {
    if (teamName.value) {
      // Logique de création d'équipe
      const teamData = {
        name: teamName.value,
      }

      const teamStorage = await db.teams.where('name').equals(teamName.value).first();
      if (teamStorage) {
        // Traitement en cas de doublon
        $q.notify({
            type: 'warning',
            message: 'Doublon d\'équipe !',
            position: 'bottom-right',
            timeout: 3000
        });
        logger.warn('Doublon d\'équipe !')
      } else {

        try {
          await db.teams.add(teamData);
          $q.notify({
            type: 'positive',
            message: 'Equipe créée avec succès !',
            position: 'bottom-right',
            timeout: 3000
          })
        } catch (error){
          $q.notify({
            type: 'negative',
            message: 'Une erreur est survenue !',
            position: 'bottom-right',
            timeout: 3000
          })
          logger.warn('Une erreur est survenue !', error)
          return;
        }

        emit('team-created', teamData)
        emit('update:modelValue', false) // Ferme le dialogue

        // Réinitialiser les champs
        teamName.value = ''
      }
    } else {
      return;
    }
  }
  </script>