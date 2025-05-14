<template>
  <div class="select-mode-root">
    <div class="select-mode-title">SELECT MODE</div>
    <div class="select-mode-btn master-btn" @click="goMaster">
      <div class="btn-desc-container">
        <div class="btn-desc">
          Gérez l'ensemble du tournoi. Suivez les statistiques globales, paramétrez les matchs et supervisez l'avancement de la compétition.
        </div>
      </div>
      <div class="btn-title-container">
        <div class="btn-title">MASTER</div>
      </div>
    </div>
    <div class="select-mode-btn assistant-btn" @click="goAssistant">
      <div class="btn-desc-container">
        <div class="btn-desc">
          Tableau de bord pour un match. Suivez les scores, les actions et gérez en direct le déroulement d'une rencontre.
        </div>
      </div>
      <div class="btn-title-container">
        <div class="btn-title">ASSISTANT</div>
      </div>
      <img class="img2-abs" src="../assets/Image2MainMenu.png" alt="Assistant" />
    </div>
    <img class="img1-abs" src="../assets/Image1MainMenu.png" alt="Master" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goMaster = () => {
  router.push('/mainMenu')
}

const goAssistant = () => {
  router.push('/tests')
}
</script>

<style scoped>
.select-mode-root {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: white;
  overflow: hidden;
}


@media (min-width: 901px) {
  .select-mode-root {
    width: 1366px;
    height: 768px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.select-mode-title {
  position: absolute;
  left: 445px;
  top: 78px;
  color: #000;
  font-size: 60px;
  font-family: Arial, sans-serif;
  font-weight: 700;
  line-height: 72px;
  word-wrap: break-word;
}
.select-mode-btn {
  cursor: pointer;
  width: 573px;
  height: 219px;
  position: absolute;
  overflow: hidden;
  border-radius: 8px;
}
.master-btn {
  left: 95px;
  top: 262px;
  background: linear-gradient(180deg, #212f77 0%, #9333ea 100%);
}
.assistant-btn {
  left: 698px;
  top: 262px;
  background: linear-gradient(180deg, rgba(52,189,123,0.68) 0%, #203A43 100%);
  box-shadow: 0px 0px 0px black;
}
.btn-desc-container {
  width: 508.13px;
  height: 24px;
  left: 32.43px;
  top: 64px;
  position: absolute;
}
.btn-desc {
  width: 310px;
  left: -0.43px;
  top: 0px;
  position: absolute;
  color: white;
  font-size: 16px;
  font-family: Roboto, Arial, sans-serif;
  font-weight: 400;
  line-height: 24px;
  word-wrap: break-word;
}
.btn-title-container {
  width: 508.13px;
  height: 32px;
  left: 32.43px;
  top: 24px;
  position: absolute;
}
.btn-title {
  width: 239.2px;
  left: 0px;
  top: 0px;
  position: absolute;
  color: white;
  font-size: 24px;
  font-family: Roboto, Arial, sans-serif;
  font-weight: 700;
  line-height: 32px;
  word-wrap: break-word;
}
.img2-abs {
  width: 215px;
  height: 234px;
  left: 364px;
  top: 40px;
  position: absolute;
}
.img1-abs {
  width: 286px;
  height: 288px;
  left: 397px;
  top: 240px;
  position: absolute;
}

@media (max-width: 900px) {
  .select-mode-root {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: 100vh;
  }
  .select-mode-title {
    position: static;
    margin-top: 32px;
    margin-bottom: 24px;
    left: unset;
    top: unset;
    text-align: center;
    font-size: 2.3rem;
  }
  .master-btn, .assistant-btn {
    position: relative !important;
    left: unset !important;
    top: unset !important;
    margin: 0 auto 32px auto;
    transform: none !important;
    display: block;
    width: 94vw !important;
    max-width: 98vw;
    min-width: 0;
    height: 180px;
  }
  .btn-desc-container, .btn-title-container {
    left: 24px !important;
    width: 90vw !important;
    min-width: 0;
    max-width: 92vw;
  }
  .btn-title {
    font-size: 1.2rem;
    width: 80vw !important;
    left: 0 !important;
  }
  .btn-desc {
    font-size: 0.95rem;
    width: 80vw !important;
    left: 0 !important;
  }
  .img2-abs {
    left: unset;
    right: 8px;
    top: 24px;
    width: 90px;
    height: 98px;
    display: none;
    position: absolute;
  }
  .img1-abs {
    left: 50vw;
    top: 340px;
    transform: translateX(-50%);
    width: 120px;
    height: 120px;
    display: none;
    position: absolute;
  }
}
@media (max-width: 600px) {
  .img1-abs, .img2-abs {
    display: none !important;
  }
  .master-btn, .assistant-btn {
    height: 120px;
  }
  .btn-title {
    font-size: 1rem;
  }
  .btn-desc {
    font-size: 0.85rem;
  }
}
</style>
