<template>
  <div class="kempo-app">
    <div class="kempo-container">
      <h1 class="kempo-title">Kempo Tournois</h1>

      <div class="row q-col-gutter-md">
        <!-- Tournois & Match Card -->
        <div class="col-12 col-md-6">
          <div class="card-container tournois-card" @click="navigateToTournaments">
            <div class="card-content">
              <div class="card-title">Tournois & Match</div>
              <div class="card-description">Créez et gérez des tournois ou des matchs.</div>
            </div>
            <div class="card-image-container tournois-image-container">
              <img src="/Image1MainMenu.png" class="card-image" alt="Tournois & Match" />
            </div>
          </div>
        </div>

        <!-- Préréglage équipe Card -->
        <div class="col-12 col-md-6">
          <div class="card-container prereglage-card" @click="navigateToTeam">
            <div class="card-content">
              <div class="card-title">Préréglage équipe</div>
              <div class="card-description">Créez et gérez des équipes prédéfinies.</div>
            </div>
            <div class="card-image-container prereglage-image-container">
              <img src="/Image2MainMenu.png" class="card-image" alt="Préréglage équipe" />
            </div>
          </div>
        </div>

        <!-- Gestion Règle Card -->
        <div class="col-12 col-md-8">
          <div class="card-container gestion-card">
            <div class="card-content">
              <div class="card-title">Gestion Règle</div>
              <div class="card-description">Modifiez ou ajoutez des règles de jeu.</div>
            </div>
            <div class="card-image-container gestion-image-container">
              <img src="/Image3MainMenu.png" class="card-image" alt="Gestion Règle" />
            </div>
          </div>
        </div>

        <!-- Paramètre Card -->
        <div class="col-12 col-md-4">
          <div class="card-container parametre-card" @click="navigateToCategories">
            <div class="card-content">
              <div class="card-title">Paramètre</div>
              <div class="card-description">Gestion des catégories et paramètres</div>
            </div>
            <div class="card-image-container parametre-image-container">
              <img src="/Image4MainMenu.png" class="card-image" alt="Paramètre" />
            </div>
          </div>
        </div>
      </div>

      <div class="version-info"></div>
    </div>
  </div>
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

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}
</style>

<style scoped>
.kempo-app {
  min-height: 100vh;
  width: 100%;
  background: white;
  display: flex;
  flex-direction: column;
}

.kempo-container {
  flex: 1;
  width: 100%;
  padding: 40px 20px;
  max-width: 1366px;
  margin: 0 auto;
}

.kempo-title {
  color: black;
  font-size: 60px;
  font-family: Inter, sans-serif;
  font-weight: 700;
  line-height: 72px;
  word-wrap: break-word;
  text-align: center;
  margin-bottom: 40px;
}

.card-container {
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.card-container:hover {
  transform: translateY(-5px);
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.15);
}

.tournois-card, .prereglage-card {
  height: 219px;
}

.tournois-card {
  background: linear-gradient(180deg, #3B82F6 0%, #9333EA 100%);
}

.prereglage-card {
  background: linear-gradient(180deg, #22C55E 0%, #0D9488 100%);
}

.gestion-card {
  background: linear-gradient(180deg, #EF4444 0%, #DB2777 100%);
  height: 112px;
}

.parametre-card {
  background: linear-gradient(180deg, #EAB308 0%, #EA580C 100%);
  height: 112px;
}

.card-content {
  padding: 24px 32px;
  z-index: 2;
  position: relative;
}

.card-title {
  color: white;
  font-size: 24px;
  font-family: Roboto, sans-serif;
  font-weight: 700;
  line-height: 32px;
  word-wrap: break-word;
  margin-bottom: 8px;
}

.card-description {
  color: white;
  font-size: 16px;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  line-height: 24px;
  word-wrap: break-word;
}

.card-image-container {
  position: absolute;
  overflow: hidden;
  z-index: 1;
}

.tournois-image-container {
  width: 286px;
  height: 288px;
  right: 0;
  bottom: -35px;
}

.prereglage-image-container {
  width: 215px;
  height: 234px;
  right: 0;
  bottom: 0;
}

.gestion-image-container {
  width: 232px;
  height: 232px;
  right: 0;
  top: -120px;
}

.parametre-image-container {
  width: 97px;
  height: 98px;
  right: 0;
  top: 7px;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom right;
}

.version-info {
  opacity: 0.60;
  color: black;
  font-size: 12px;
  font-family: Inter, sans-serif;
  font-weight: 400;
  text-transform: uppercase;
  line-height: 12px;
  word-wrap: break-word;
  margin-top: 20px;
  position: absolute;
  bottom: 12px;
  left: 12px;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .kempo-title {
    font-size: 48px;
    line-height: 58px;
  }

  .tournois-image-container {
    width: 220px;
    height: 220px;
  }

  .prereglage-image-container {
    width: 180px;
    height: 200px;
  }

  .gestion-image-container {
    width: 180px;
    height: 230px;
  }
}

@media (max-width: 767px) {
  .kempo-title {
    font-size: 36px;
    line-height: 44px;
    margin-bottom: 30px;
  }

  .card-container {
    min-height: 120px;
  }

  .tournois-card, .prereglage-card {
    height: 180px;
  }

  .card-title {
    font-size: 20px;
  }

  .card-description {
    font-size: 14px;
  }

  .tournois-image-container {
    width: 160px;
    height: 160px;
  }

  .prereglage-image-container {
    width: 140px;
    height: 160px;
  }

  .gestion-image-container {
    width: 140px;
    height: 140px;
    top: -30px;
  }

  .parametre-image-container {
    width: 80px;
    height: 100px;
  }
}

@media (max-width: 480px) {
  .kempo-container {
    padding: 20px 15px;
  }

  .kempo-title {
    font-size: 28px;
    line-height: 36px;
    margin-bottom: 20px;
  }

  .card-content {
    padding: 16px;
  }

  .tournois-card, .prereglage-card {
    height: 160px;
  }

  .tournois-image-container {
    width: 120px;
    height: 120px;
  }

  .prereglage-image-container {
    width: 100px;
    height: 120px;
  }

}
</style>
