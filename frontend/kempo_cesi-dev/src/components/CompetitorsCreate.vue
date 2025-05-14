<template>
    <q-dialog :modelValue="modelValue" @update:modelValue="updateModel" persistent>
        <q-card class="q-pa-md">
          <q-card-section>
            <div class="text-h6">Ajouter un Compétiteur</div>
          </q-card-section>
      
          <q-card-section>
            <q-input v-model="competitor.firstname" label="Prénom" outlined dense :rules="[val => !!val || 'Le nom est requis']" />
            <q-input v-model="competitor.lastname" label="Nom" outlined dense class="q-mt-sm" :rules="[val => !!val || 'Le prenom est requis']" />
            <q-input v-model="competitor.nationality" label="Nationalité" outlined dense class="q-mt-sm" :rules="[val => !!val || 'La nationalité est requis']" />
            <q-input v-model.number="competitor.age" type="number" label="Âge" outlined dense class="q-mt-sm" :rules="[val => !!val || 'L\'âge est requis']" />
            <q-input v-model.number="competitor.danLevel" type="number" label="Niveau Dan" outlined dense class="q-mt-sm" :rules="[val => !!val || 'Le dan est requis']" />
            <q-input v-model="competitor.grade" label="Grade" outlined dense class="q-mt-sm" :rules="[val => !!val || 'Le grade est requis']" />
            <q-select v-model="competitor.gender" :options="['Homme', 'Femme', 'X']" label="Genre" outlined dense class="q-mt-sm" :rules="[val => !!val || 'Le genre est requis']" />
            <q-input v-model="competitor.clubName" label="Nom du Club" outlined dense class="q-mt-sm" :rules="[val => !!val || 'Le club est requis']" />
            <q-select v-model="competitor.teamId" :options="teamOptions" option-label="label" option-value="value" label="Nom de l'équipe" outlined dense class="q-mt-sm" :rules="[val => !!val || 'Le nom d\'équipe est requis']" />
            <q-input v-model="competitor.registrationNumber" label="Numéro d'inscription" outlined dense class="q-mt-sm" :rules="[val => !!val || 'Le numéro est requis']" />
          </q-card-section>
      
          <q-card-section>
            <q-btn flat label="Annuler" color="primary" v-close-popup />
            <q-btn flat label="Ajouter Compétiteur" color="secondary" @click="addCompetitor" />
          </q-card-section>
        </q-card>
    </q-dialog>
  </template>
  
  <script setup>
  import { onUpdated, ref } from "vue";
  import { db } from "../database/db";
  import { useQuasar } from "quasar";
  import { useLogger } from 'src/composables/userLogger';
  //pour les notifications
  const $q = useQuasar();
  const logger = useLogger('CompetitorsCreate');

  defineProps({
    modelValue: {
      type: Boolean,
      default: false
    }
  })
  
  const emit = defineEmits(["addCompetitor", "update:modelValue"]);

  const updateModel = (val) => {
    emit('update:modelValue', val)
  }

  const teamOptions = ref([]);

  const initialCompetitorState = {
    firstname: "",
    lastname: "",
    nationality: "",
    age: null,
    danLevel: null,
    grade: "",
    gender: "",
    clubName: "",
    registrationNumber: "",
    teamId: null
  };
  
  const competitor = ref({ ...initialCompetitorState });
  const resetForm = () => {
    // Réinitialiser le formulaire après l'ajout
    competitor.value = { ...initialCompetitorState };
  }

  const fetchTeams = async () => {
    const teams = await db.teams.toArray();
    teamOptions.value = teams
      .filter(c => c.name) // Exclure les équipes sans nom
      .map(c => ({ label: c.name, value: c.id })); // Mapper chaque équipe avec un label et une valeur
  }
  
  const addCompetitor = async () => {
    if (!competitor.value.firstname || !competitor.value.lastname) {
      logger.warn('Nom ou Prénom manquant !');
      return;
    }

    const competitorStorage = await db.competitors.where('registrationNumber').equals(competitor.value.registrationNumber).first();
    if (competitorStorage) {
      logger.warn('Doublon de compétiteur lors de la création');
      // Traitement en cas de doublon
      $q.notify({
        type: 'warning',
        message: 'Doublon de compétiteur',
        position: 'bottom-right',
        timeout: 3000
      });
      return;
    } else {
  
      try {
          const cleanCompetitor = JSON.parse(JSON.stringify(competitor.value));

          // Extraire la valeur numérique de teamId si c'est un objet
          if (cleanCompetitor.teamId && typeof cleanCompetitor.teamId === 'object' && 'value' in cleanCompetitor.teamId) {
            cleanCompetitor.teamId = cleanCompetitor.teamId.value;
          }

          await db.competitors.add(cleanCompetitor);
        
          emit("addCompetitor", cleanCompetitor);
          resetForm();

          $q.notify({
            type: 'positive',
            message: 'Compétiteur créée avec succès !',
            position: 'bottom-right',
            timeout: 3000
          })

          updateModel(false);
      } catch(error) {
        $q.notify({
            type: 'negative',
            message: 'Une erreur est survenue !',
            position: 'bottom-right',
            timeout: 3000
          })
          logger.error('Une erreur est survenue lors de la création d\'un compétiteur :', error);
      }
    }
  };

  onUpdated (() => {
    fetchTeams();
  })
  </script>