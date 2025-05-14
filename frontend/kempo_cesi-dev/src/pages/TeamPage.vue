<template>
  <q-page class="q-pa-md">
    <!-- Fil d'Ariane -->
    <div class="row q-mb-md items-center">
      <q-btn flat round dense icon="home" to="/mainMenu" class="q-mr-sm" />
      <q-icon name="chevron_right" size="xs" class="q-mr-sm" />
      <div class="text-primary text-h6">Préréglage équipe</div>
    </div>

    <div class="row">
      <!-- Sidebar gauche -->
      <div class="col-12 col-md-3 q-pr-md">
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="q-pa-sm">
            <q-item clickable v-ripple @click="openCreateTeamDialog" class="rounded-borders">
              <q-item-section>Créer une équipe</q-item-section>
              <q-item-section avatar>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-card-section>
        </q-card>

        <div v-for="(team, index) in teams" :key="index" class="q-mb-md">
          <q-card flat bordered>
            <q-card-section class="bg-grey-2">
              <div class="row item-center">
                <div class="col">
                  <div class="text-weight-bold">{{ team.name }}</div>
                  <div class="text-caption">{{ team.size }} membre(s)</div>
                </div>
                <div class="col-auto">
                  <q-btn flat round icon="delete" color="negative" @click="deleteTeam(team.id)" />
                </div>
              </div>
            </q-card-section>
            <q-card-section class="q-pa-sm">
              <q-item clickable v-ripple class="rounded-borders" @click="showTeamDetails(team)">
                <q-item-section>Voir détails</q-item-section>
                <q-item-section avatar>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>
            </q-card-section>
          </q-card>
        </div>

      </div>

      <!-- Contenu principal -->
      <div class="col-12 col-md-9">
        <div class="row">
          <div class="col-12 col-md-8">
            <div class="text-h4 q-mb-md">Préréglage</div>
            
            <div class="q-mb-md">
              <div class="text-subtitle1 q-mb-sm">Nom de L'équipe</div>
              <q-input outlined v-model="teamName" placeholder="Nom équipe" class="q-mb-md" />
            </div>
          </div>
          <div class="col-12 col-md-4 flex flex-center">
            <q-card flat bordered class="text-center q-pa-md">
              <q-icon name="add" size="3rem" class="q-mb-sm" />
              <div class="text-caption">Sélection d'une photo d'équipe</div>
            </q-card>
          </div>
        </div>

        <div class="q-mt-lg">
          <div class="row q-mb-md">
            <div class="col-auto q-mr-sm">
              <q-btn color="primary" icon="upload" label="Upload CSV" @click="openImportCsvCompetitorsDialog" :disable="!selectedTeam" />
            </div>
            <div class="col-auto q-mr-sm">
              <q-btn color="primary" icon="person" label="Ajouter un membre" @click="openCreateCompetitorsDialog" :disabled="!selectedTeam" />
            </div>
            <div class="col-auto">
              <q-btn color="negative" icon="delete" label="Supprimer les membres" @click="deleteTeamMembers(selectedTeam?.id)" :disable="!selectedTeam || members.length === 0" />
            </div>
            <div class="col q-ml-md">
              <q-input dense outlined v-model="search" placeholder="Search..." class="float-right" style="width: 250px">
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>

            <q-card>
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ selectedTeam?.name || 'Aucune équipe sélectionner' }}</div>
                <q-space />
              </q-card-section>
              <q-card-section>
                <q-table
                  :style="tableStyle"
                  :virtual-scroll-item-size="10"
                  :rows="members ? members : []"
                  :columns="columns"
                  row-key="id"
                  selection="multiple"
                  virtual-scroll
                  v-model:selected="selected"
                  :rows-per-page-options="[0]"
                  flat
                  bordered
                  no-data-label="Aucun compétiteur dans l'équipe"
                  :filter="search"
                >
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
                        <template v-if="col.name === 'nationality'">
                          <div class="row items-center">
                            <country-flag :country="getCountryCode(props.row[col.field])" size="small" class="q-mr-sm" />
                            {{ props.row[col.field] }}
                          </div>
                        </template>
                        <template v-else>
                          {{ props.row[col.field] }}
                        </template>
                      </q-td>
                      <q-td auto-width>
                        <q-btn flat round dense icon="more_vert">
                          <q-menu>
                            <q-list style="min-width: 100px">
                              <q-item clickable v-close-popup @click="onCompetitorsModifiedDialog(props.row)">
                                <q-item-section>Modifier</q-item-section>
                              </q-item>
                              <q-item clickable v-close-popup @click="deleteCompetitor(props.row)">
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

  <CreateTeam v-model="createTeamDialogVisible" @team-created="onTeamCreated" />
  <CreateCompetitors v-model="createCompetitorsDialogVisible" @addCompetitor="onCompetitorsCreated" />
  <ModifyCompetitors v-model="modifiedCompetitorsDialogVisible" :competitorSelect="competitorSelect" @modifCompetitor="onCompetitorsModified" />
  <ImportCsvCompetitors v-model="importCsvCompetitorsDialogVisible" @importSuccess="onImportCompetitors" :teamId="selectedTeam.id"  />
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { db } from '../database/db';
import CountryFlag from 'vue-country-flag-next';

// Import des composant
import CreateTeam from '../components/TeamCreate.vue';
import CreateCompetitors from '../components/CompetitorsCreate.vue';
import ModifyCompetitors from '../components/CompetitorsChange.vue';
import ImportCsvCompetitors from '../components/csvUpload.vue';
import { useQuasar } from 'quasar';
  
const $q = useQuasar();

const teamName = ref('');
const search = ref('');
const selected = ref([]);

const createTeamDialogVisible = ref(false);
const createCompetitorsDialogVisible = ref(false);
const modifiedCompetitorsDialogVisible = ref(false);
const importCsvCompetitorsDialogVisible = ref(false);
const selectedTeam = ref(false);
const competitorSelect = ref({});

//pour la création d'équipe
const teams = ref([]);

//pour la création de compétiteur
const competitors = ref([]);

//pour le détail de l'équipe
const members = ref([]);

// Fonction pour obtenir le code pays à 2 lettres
const getCountryCode = (countryName) => {
  // Si countryName est déjà un code ISO à 2 lettres
  if (countryName && countryName.length === 2) {
    return countryName.toLowerCase();
  }
  
  // Dictionnaire de correspondance entre noms de pays et codes ISO
  const countryCodes = {
    'France': 'fr',
    'États-Unis': 'us',
    'USA': 'us',
    'États Unis': 'us',
    'Royaume-Uni': 'gb',
    'UK': 'gb',
    'Grande-Bretagne': 'gb',
    'Japon': 'jp',
    'Japan': 'jp',
    'Allemagne': 'de',
    'Germany': 'de',
    'Italie': 'it',
    'Italy': 'it',
    'Espagne': 'es',
    'Spain': 'es',
    'Canada': 'ca',
    'Australie': 'au',
    'Australia': 'au',
    'Brésil': 'br',
    'Brazil': 'br',
    'Russie': 'ru',
    'Russia': 'ru',
    'Chine': 'cn',
    'China': 'cn',
    'Inde': 'in',
    'India': 'in',
    'Portugal': 'pt',
    'Belgique': 'be',
    'Belgium': 'be',
    'Pays-Bas': 'nl',
    'Netherlands': 'nl',
    'Suisse': 'ch',
    'Switzerland': 'ch',
    'Suède': 'se',
    'Sweden': 'se',
    'Norvège': 'no',
    'Norway': 'no',
    'Danemark': 'dk',
    'Denmark': 'dk',
    'Finlande': 'fi',
    'Finland': 'fi',
    'Pologne': 'pl',
    'Poland': 'pl',
    'Autriche': 'at',
    'Austria': 'at',
    'Grèce': 'gr',
    'Greece': 'gr',
    'Turquie': 'tr',
    'Turkey': 'tr',
    'Israël': 'il',
    'Israel': 'il',
    'Corée du Sud': 'kr',
    'South Korea': 'kr',
    'Mexique': 'mx',
    'Mexico': 'mx',
    'Argentine': 'ar',
    'Argentina': 'ar',
    'Chili': 'cl',
    'Chile': 'cl',
    'Afrique du Sud': 'za',
    'South Africa': 'za',
    'Maroc': 'ma',
    'Morocco': 'ma',
    'Tunisie': 'tn',
    'Tunisia': 'tn',
    'Algérie': 'dz',
    'Algeria': 'dz',
    'Égypte': 'eg',
    'Egypt': 'eg',
    'Sénégal': 'sn',
    'Senegal': 'sn',
    'Côte d\'Ivoire': 'ci',
    'Ivory Coast': 'ci',
    'Nigeria': 'ng',
    'Irlande': 'ie',
    'Ireland': 'ie',
    // Ajoutez d'autres pays selon vos besoins
  };
  
  // Retourne le code du pays ou 'unknown' si non trouvé
  return countryCodes[countryName] || 'unknown';
};

//récupération des équipes
const getTeams = async () => {
  teams.value = await db.teams.toArray();
  // Utilisation de Promise.all pour exécuter les requêtes en parallèle
  const sizes = await Promise.all(
    teams.value.map(async (team) => {
      return { ...team, size: await getTeamSize(team.id) };
    })
  );
  teams.value = sizes;
}

//taille des équipes
const getTeamSize = async (teamId) => {
  const membersSize = await db.competitors.where("teamId").equals(teamId).toArray();
  return membersSize.length;
}

//récupération des compétiteurs
const getCompetitors = async () => {
  competitors.value = await db.competitors.toArray();
}

//récupération des compétiteurs pour une équipe séléctionner
const showTeamDetails = async (team) => {
  selectedTeam.value = team;
  await onFetchTeamMembers(team.id);
}

const openCreateTeamDialog = () => {
  createTeamDialogVisible.value = true;
};

const openCreateCompetitorsDialog = () => {
  createCompetitorsDialogVisible.value = true;
};

const openImportCsvCompetitorsDialog = () => {
  importCsvCompetitorsDialogVisible.value = true;
};

const onCompetitorsModifiedDialog = (competitor) => {
  competitorSelect.value = JSON.parse(JSON.stringify(competitor));
  modifiedCompetitorsDialogVisible.value = true;
};

const onTeamCreated = async () => {
  //Refresh le front
  await getTeams();
}

const onCompetitorsCreated = async () => {
  //Refresh le front
  selectedTeam.value = false;
  members.value = false;
  //recharge les équipes pour ajuster le nombre de compétiteur
  await getTeams();
}

const onCompetitorsModified = async () => {
  //Refresh le front
  selectedTeam.value = false;
  members.value = false;
  //recharge les équipes pour ajuster le nombre de compétiteur
  await getTeams();
}

const onImportCompetitors = async () => {
  //recharge les équipes pour ajuster le nombre de compétiteur
  await getTeams();
}

//récupération des membres d'une équipe
const fetchTeamMembers = async (teamId) => {
  const result = await db.competitors
    .where('teamId')
    .equals(teamId)
    .toArray();

  return result;
}

const onFetchTeamMembers = async (teamId) => {
  members.value = await fetchTeamMembers(teamId);
}

//suppression d'une équipe
const deleteTeam = async (teamId) => {
  if (!teamId) {
    console.error('Aucun ID d\'équipe fourni !');
    $q.notify({
      type: 'warning',
      message: 'Suppression impossible',
      position: 'bottom-right',
      timeout: 3000
    })
    return;
  }

  // Vérifie s'il y a encore des membres dans l'équipe
  const membersVerif = await fetchTeamMembers(teamId)

  if (membersVerif.length > 0) {
    $q.notify({
      type: 'warning',
      message: 'Impossible de supprimer l\'équipe : elle contient encore des membres.',
      position: 'bottom-right',
      timeout: 3000
    });
    return;
  }

  try {
    await db.teams
    .where('id')
    .equals(teamId)
    .delete();

    $q.notify({
       type: 'positive',
       message: 'Equipe supprimée',
       position: 'bottom-right',
       timeout: 3000
     })

    selectedTeam.value = false;
    await getTeams();
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'warning',
      message: 'Une erreur est survenue',
      position: 'bottom-right',
      timeout: 3000
    })
  }
}

//suppression d'un compétiteur
const deleteCompetitor = async (competitor) => {
  if (!competitor.id) {
    console.error('Aucun ID de compétiteur fourni !')
    $q.notify({
      type: 'warning',
      message: 'Suppression impossible',
      position: 'bottom-right',
      timeout: 3000
    })
    return;
  }

  try {
     await db.competitors
       .where('id')
       .equals(competitor.id)
       .delete();

     $q.notify({
       type: 'positive',
       message: 'Compétiteur supprimé',
       position: 'bottom-right',
       timeout: 3000
     })

    await fetchTeamMembers(competitor.teamId);
    await getTeams(competitor.teamId);

  } catch (error) {
    $q.notify({
      type: 'warning',
      message: 'Une erreur est survenue',
      position: 'bottom-right',
      timeout: 3000
    })
    console.error('Erreur lors de la suppression :', error)
  }
}

//suppression des memebres d'une équipe
const deleteTeamMembers = async (teamId) => {
  if (teamId) {
    try {
      members.value = await db.competitors
        .where('teamId')
        .equals(teamId)
        .delete()

      $q.notify({
        type: 'positive',
        message: 'Membres supprimés',
        position: 'bottom-right',
        timeout: 3000 //3 secondes
      })

      await getTeams(teamId);
        
    } catch (error) {
      console.error(error)
    }
  } else {
    $q.notify({
      type: 'warning',
      message: 'Aucune équipe sélectionnée',
      position: 'bottom-right',
      timeout: 3000 //3 secondes
    })
  }
}

const columns = [
  { name: 'firstname', label: 'Nom', field: 'firstname', sortable: true },
  { name: 'lastname', label: 'Prénom', field: 'lastname', sortable: true },
  { name: 'club', label: 'Club', field: 'clubName', sortable: true },
  { name: 'grade', label: 'Grade', field: 'grade', sortable: true },
  { name: 'danLevel', label: 'Dan', field: 'danLevel', sortable: true },
  { name: 'nationality', label: 'Nationalité', field: 'nationality', sortable: true },
  { name: 'gender', label: 'Sexe', field: 'gender', sortable: true },
  { name: 'age', label: 'Age', field: 'age', sortable: true },
];

//taille du tableau
const tableStyle = computed(() => ({
  height: (members.value && members.value.length > 0) ? "400px" : "auto",
}));


onMounted (() => {
  getTeams();
  getCompetitors();
})

</script>

<style lang="scss">
/* Styles pour les drapeaux */
</style>