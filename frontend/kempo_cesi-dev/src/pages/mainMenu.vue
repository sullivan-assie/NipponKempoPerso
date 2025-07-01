<template>
  <q-page class="q-pa-md">
    <div class="q-mb-xl text-center">
      <h1 class="text-h2 text-weight-bold q-ma-none">Kempo Tournois</h1>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Tournois & Match -->
      <div class="col-12 col-md-6">
        <q-card 
          class="menu-card cursor-pointer" 
          @click="navigateToTournaments"
          flat
          bordered
        >
          <q-card-section class="q-pa-lg">
            <div class="row items-center q-gutter-md">
              <q-icon 
                name="emoji_events" 
                size="48px" 
                color="primary"
              />
              <div class="col">
                <div class="text-h6 text-weight-medium q-mb-xs">
                  Tournois & Match
                </div>
                <div class="text-body2 text-grey-7">
                  Créez et gérez des tournois ou des matchs
                </div>
              </div>
              <q-icon 
                name="chevron_right" 
                size="24px" 
                color="grey-5"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Préréglage équipe -->
      <div class="col-12 col-md-6">
        <q-card 
          class="menu-card cursor-pointer" 
          @click="navigateToTeam"
          flat
          bordered
        >
          <q-card-section class="q-pa-lg">
            <div class="row items-center q-gutter-md">
              <q-icon 
                name="groups" 
                size="48px" 
                color="positive"
              />
              <div class="col">
                <div class="text-h6 text-weight-medium q-mb-xs">
                  Préréglage équipe
                </div>
                <div class="text-body2 text-grey-7">
                  Créez et gérez des équipes prédéfinies
                </div>
              </div>
              <q-icon 
                name="chevron_right" 
                size="24px" 
                color="grey-5"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Gestion Règle -->
      <div class="col-12 col-md-8">
        <q-card 
          class="menu-card cursor-pointer"
          flat
          bordered
        >
          <q-card-section class="q-pa-lg">
            <div class="row items-center q-gutter-md">
              <q-icon 
                name="rule" 
                size="48px" 
                color="negative"
              />
              <div class="col">
                <div class="text-h6 text-weight-medium q-mb-xs">
                  Gestion Règle
                </div>
                <div class="text-body2 text-grey-7">
                  Modifiez ou ajoutez des règles de jeu
                </div>
              </div>
              <q-icon 
                name="chevron_right" 
                size="24px" 
                color="grey-5"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Paramètre -->
      <div class="col-12 col-md-4">
        <q-card 
          class="menu-card cursor-pointer" 
          @click="navigateToCategories"
          flat
          bordered
        >
          <q-card-section class="q-pa-lg">
            <div class="row items-center q-gutter-md">
              <q-icon 
                name="settings" 
                size="48px" 
                color="warning"
              />
              <div class="col">
                <div class="text-h6 text-weight-medium q-mb-xs">
                  Paramètre
                </div>
                <div class="text-body2 text-grey-7">
                  Gestion des catégories et paramètres
                </div>
              </div>
              <q-icon 
                name="chevron_right" 
                size="24px" 
                color="grey-5"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateToTeam = () => {
  router.push('/team');
}

const navigateToTournaments = () => {
  router.push('/tournaments');
}

const navigateToCategories = () => {
  router.push('/categories');
}
</script>

<style scoped>
.menu-card {
  transition: all 0.2s ease;
}

.menu-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
</style>