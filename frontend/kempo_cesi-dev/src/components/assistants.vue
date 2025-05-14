<template>
  <div class="tableau-score" style="width: 100vw; height: 100vh; position: relative; overflow: hidden;">
    <!-- Container qui va s'adapter à la taille de l'écran tout en préservant les proportions -->
    <div class="scaling-container" :style="containerStyle">
      <!-- Zones de couleur principales -->
      <div :style="{ width: '1366px', height: '251px', left: '0px', top: '0px', position: 'absolute', background: '#FE0000' }"></div>
      <div :style="{ width: '1366px', height: '261px', left: '0px', top: '251px', position: 'absolute', background: '#FFFFFD' }"></div>
      <div :style="{ width: '1366px', height: '261px', left: '0px', top: '507px', position: 'absolute', background: 'black' }"></div>

      <!-- Gradient overlay -->
      <div :style="{ width: '1366px', height: '521px', left: '0px', top: '-14px', position: 'absolute', background: 'linear-gradient(272deg, black 0%, rgba(102, 102, 102, 0) 100%)' }"></div>

      <!-- Joueur 1 -->
      <div class="drapeau" @click="openFlagDialog(0)" :style="{ width: '175px', height: '115px', left: '9px', top: '55px', position: 'absolute', overflow: 'hidden' }">
        <flag :country="players[0].flag" />
      </div>
      <div @dblclick="openNameDialog(0)" :style="{ width: '792px', left: '202px', top: '30px', position: 'absolute', color: 'black', fontSize: '79px', fontFamily: 'Inter', fontWeight: '700', letterSpacing: '2.37px', wordWrap: 'break-word' }">
        {{ players[0].name }}
      </div>
      <div @dblclick="openCityDialog(0)" :style="{ width: '792px', left: '202px', top: '126px', position: 'absolute', color: 'black', fontSize: '75px', fontFamily: 'Inter', fontWeight: '400', letterSpacing: '2.25px', wordWrap: 'break-word' }">
        {{ players[0].city }}
      </div>

      <!-- Score Joueur 1 -->
      <div :style="{ width: '61px', height: '61px', left: '1014px', top: '52px', position: 'absolute', background: '#D9D9D9' }">
        <div @click="incrementScore(0)" :style="{ left: '0', top: '0', width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }">
          <span :style="{ color: 'black', fontSize: '72px', fontFamily: 'Inter', fontWeight: '700', lineHeight: '20px' }">+</span>
        </div>
      </div>
      <div :style="{ width: '61px', height: '61px', left: '1014px', top: '137px', position: 'absolute', background: '#D9D9D9' }">
        <div @click="decrementScore(0)" :style="{ left: '0', top: '0', width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }">
          <span :style="{ color: 'black', fontSize: '72px', fontFamily: 'Inter', fontWeight: '700', lineHeight: '20px' }">-</span>
        </div>
      </div>
      <div :style="{ width: '149px', left: '1083px', top: '0px', position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: '186px', fontFamily: 'Digital Numbers, monospace', fontWeight: '400', wordWrap: 'break-word' }">
        {{ players[0].score }}
      </div>

      <!-- Fautes Joueur 1 -->
      <div :style="{ width: '45px', height: '46px', left: '1241px', top: '89px', position: 'absolute', background: '#D9D9D9' }">
        <div @click="incrementFouls(0)" :style="{ left: '0', top: '0', width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }">
          <span :style="{ color: 'black', fontSize: '52px', fontFamily: 'Inter', fontWeight: '700', lineHeight: '20px' }">+</span>
        </div>
      </div>
      <div :style="{ width: '45px', height: '46px', left: '1303px', top: '89px', position: 'absolute', background: '#D9D9D9' }">
        <div @click="decrementFouls(0)" :style="{ left: '0', top: '0', width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }">
          <span :style="{ color: 'black', fontSize: '52px', fontFamily: 'Inter', fontWeight: '700', lineHeight: '20px' }">-</span>
        </div>
      </div>
      <div :style="{ width: '121px', left: '1236px', top: '137px', position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: '66px', fontFamily: 'Digital Numbers, monospace', fontWeight: '400', wordWrap: 'break-word' }">
        {{ players[0].fouls }}
      </div>

      <!-- Joueur 2 -->
      <div class="drapeau" @click="openFlagDialog(1)" :style="{ width: '175px', height: '115px', left: '9px', top: '316px', position: 'absolute', overflow: 'hidden' }">
        <flag :country="players[1].flag" />
      </div>
      <div @dblclick="openNameDialog(1)" :style="{ width: '792px', left: '202px', top: '280px', position: 'absolute', color: 'black', fontSize: '79px', fontFamily: 'Inter', fontWeight: '700', letterSpacing: '2.37px', wordWrap: 'break-word' }">
        {{ players[1].name }}
      </div>
      <div @dblclick="openCityDialog(1)" :style="{ width: '792px', left: '202px', top: '376px', position: 'absolute', color: 'black', fontSize: '75px', fontFamily: 'Inter', fontWeight: '400', letterSpacing: '2.25px', wordWrap: 'break-word' }">
        {{ players[1].city }}
      </div>

      <!-- Score Joueur 2 -->
      <div :style="{ width: '61px', height: '61px', left: '1013px', top: '298px', position: 'absolute', background: '#D9D9D9' }">
        <div @click="incrementScore(1)" :style="{ left: '0', top: '0', width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }">
          <span :style="{ color: 'black', fontSize: '72px', fontFamily: 'Inter', fontWeight: '700', lineHeight: '20px' }">+</span>
        </div>
      </div>
      <div :style="{ width: '61px', height: '61px', left: '1013px', top: '383px', position: 'absolute', background: '#D9D9D9' }">
        <div @click="decrementScore(1)" :style="{ left: '0', top: '0', width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }">
          <span :style="{ color: 'black', fontSize: '72px', fontFamily: 'Inter', fontWeight: '700', lineHeight: '20px' }">-</span>
        </div>
      </div>
      <div :style="{ width: '149px', left: '1101px', top: '251px', position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: '186px', fontFamily: 'Digital Numbers, monospace', fontWeight: '400', wordWrap: 'break-word' }">
        {{ players[1].score }}
      </div>

      <!-- Fautes Joueur 2 -->
      <div :style="{ width: '45px', height: '46px', left: '1244px', top: '333px', position: 'absolute', background: '#D9D9D9' }">
        <div @click="incrementFouls(1)" :style="{ left: '0', top: '0', width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }">
          <span :style="{ color: 'black', fontSize: '52px', fontFamily: 'Inter', fontWeight: '700', lineHeight: '20px' }">+</span>
        </div>
      </div>
      <div :style="{ width: '45px', height: '46px', left: '1306px', top: '333px', position: 'absolute', background: '#D9D9D9' }">
        <div @click="decrementFouls(1)" :style="{ left: '0', top: '0', width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }">
          <span :style="{ color: 'black', fontSize: '52px', fontFamily: 'Inter', fontWeight: '700', lineHeight: '20px' }">-</span>
        </div>
      </div>
      <div :style="{ width: '121px', left: '1236px', top: '384px', position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: '66px', fontFamily: 'Digital Numbers, monospace', fontWeight: '400', wordWrap: 'break-word' }">
        {{ players[1].fouls }}
      </div>

      <!-- Timer Controls -->
      <div :style="{ position: 'absolute', left: '361px', top: '510px', background: '#D9D9D9' }">
        <q-input
          v-model.number="timerMinutes"
          type="number"
          min="0"
          max="99"
          label="Minutes"
          filled
          :style="{ width: '127px', height: '46px' }"
        />
      </div>

      <div :style="{ position: 'absolute', left: '501px', top: '510px', background: '#D9D9D9' }">
        <q-input
          v-model.number="timerSeconds"
          type="number"
          min="0"
          max="59"
          label="Secondes"
          filled
          :style="{ width: '127px', height: '46px' }"
        />
      </div>

      <!-- Control Buttons -->
      <div :style="{ width: '267px', height: '39px', left: '361px', top: '557px', position: 'absolute', background: '#01DDEF', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }" @click="selectTimer">
        <span :style="{ color: 'white', fontSize: '18px', fontFamily: 'Inter', fontWeight: '700', letterSpacing: '1.80px' }">SELECT</span>
      </div>
      <div :style="{ width: '267px', height: '39px', left: '361px', top: '599px', position: 'absolute', background: '#03CC0C', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }" @click="startTimer">
        <span :style="{ color: 'white', fontSize: '18px', fontFamily: 'Inter', fontWeight: '700', letterSpacing: '1.80px' }">START</span>
      </div>
      <div :style="{ width: '267px', height: '39px', left: '361px', top: '641px', position: 'absolute', background: '#FFFA00', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }" @click="pauseTimer">
        <span :style="{ color: 'black', fontSize: '18px', fontFamily: 'Inter', fontWeight: '700', letterSpacing: '1.80px' }">PAUSE</span>
      </div>
      <div :style="{ width: '267px', height: '39px', left: '361px', top: '683px', position: 'absolute', background: '#E59E06', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }" @click="resetTimer">
        <span :style="{ color: 'white', fontSize: '18px', fontFamily: 'Inter', fontWeight: '700', letterSpacing: '1.80px' }">RESET</span>
      </div>
      <div :style="{ width: '267px', height: '39px', left: '361px', top: '725px', position: 'absolute', background: '#68030B', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }" @click="endTimer">
        <span :style="{ color: 'white', fontSize: '18px', fontFamily: 'Inter', fontWeight: '700', letterSpacing: '1.80px' }">END</span>
      </div>

      <!-- Timer Display -->
      <div :style="{ width: '587px', left: '773px', top: '550px', position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: '136px', fontFamily: 'Digital Numbers, monospace', fontWeight: '400', wordWrap: 'break-word' }">
        {{ formattedTime }}
      </div>

      <!-- Logo -->
      <img :style="{ width: '239px', height: '218px', left: '36px', top: '529px', position: 'absolute' }" src="/kempoimh.png" />
    </div>

    <!-- Dialogs -->
    <q-dialog v-model="nameDialog.show">
      <q-card style="width: 500px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Modifier le nom</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="nameDialog.value" label="Nom et prénom" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Sauvegarder" color="primary" @click="saveName" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="cityDialog.show">
      <q-card style="width: 500px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Modifier la ville</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="cityDialog.value" label="Ville" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Sauvegarder" color="primary" @click="saveCity" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="flagDialog.show">
      <q-card style="width: 500px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Choisir un drapeau</div>
        </q-card-section>
        <q-card-section>
          <q-select v-model="flagDialog.value" :options="availableFlags" label="Drapeau" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn flat label="Sauvegarder" color="primary" @click="saveFlag" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { h, onMounted, onUnmounted, ref, computed, watch } from 'vue';

export default {
  props: {
    player1Name: { type: String, default: 'Joueur 1' },
    player1Club: { type: String, default: '' },
    player1Score: { type: Number, default: 0 },
    player1Fouls: { type: Number, default: 0 },
    player2Name: { type: String, default: 'Joueur 2' },
    player2Club: { type: String, default: '' },
    player2Score: { type: Number, default: 0 },
    player2Fouls: { type: Number, default: 0 },
    timerValue: { type: String, default: '00:00' }
  },
  name: 'TableauScore',
  components: {
    flag: {
      props: {
        country: {
          type: String,
          default: 'France'
        }
      },
      render() {
        if (this.country === 'France') {
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '175px', height: '115px', position: 'absolute', background: '#CE1126' } }),
            h('div', { style: { width: '116.67px', height: '115px', position: 'absolute', background: 'white' } }),
            h('div', { style: { width: '58.33px', height: '115px', position: 'absolute', background: '#002654' } })
          ]);
        } else if (this.country === 'Allemagne') {
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '175px', height: '38.33px', top: '0px', position: 'absolute', background: '#000000' } }),
            h('div', { style: { width: '175px', height: '38.33px', top: '38.33px', position: 'absolute', background: '#DD0000' } }),
            h('div', { style: { width: '175px', height: '38.33px', top: '76.66px', position: 'absolute', background: '#FFCE00' } })
          ]);
        } else if (this.country === 'Italie') {
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '58.33px', height: '115px', left: '0px', position: 'absolute', background: '#009246' } }),
            h('div', { style: { width: '58.33px', height: '115px', left: '58.33px', position: 'absolute', background: 'white' } }),
            h('div', { style: { width: '58.33px', height: '115px', left: '116.66px', position: 'absolute', background: '#CE2B37' } })
          ]);
        } else if (this.country === 'Espagne') {
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '175px', height: '28.75px', top: '0px', position: 'absolute', background: '#AA151B' } }),
            h('div', { style: { width: '175px', height: '57.5px', top: '28.75px', position: 'absolute', background: '#F1BF00' } }),
            h('div', { style: { width: '175px', height: '28.75px', top: '86.25px', position: 'absolute', background: '#AA151B' } })
          ]);
        } else {
          // Drapeau par défaut (France)
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '175px', height: '115px', position: 'absolute', background: '#CE1126' } }),
            h('div', { style: { width: '116.67px', height: '115px', position: 'absolute', background: 'white' } }),
            h('div', { style: { width: '58.33px', height: '115px', position: 'absolute', background: '#002654' } })
          ]);
        }
      }
    }
  },
  emits: [
    'update:player1-name',
    'update:player1-club',
    'update:player1-score',
    'update:player1-fouls',
    'update:player1-flag',
    'update:player2-name',
    'update:player2-club',
    'update:player2-score',
    'update:player2-fouls',
    'update:player2-flag',
    'update:timer-value'
  ],
  setup(props, { emit }) {
    const [initialMinutes, initialSeconds] = (props.timerValue || '00:00').split(':').map(Number);

    // État réactif pour le scaling
    const scale = ref(1);
    const containerWidth = ref(1366);
    const containerHeight = ref(768);

    // Données des joueurs
    const players = ref([
      {
        name: props.player1Name || 'Joueur 1',
        city: props.player1Club || '',
        flag: 'France',
        score: props.player1Score ?? 0,
        fouls: props.player1Fouls ?? 0
      },
      {
        name: props.player2Name || 'Joueur 2',
        city: props.player2Club || '',
        flag: 'France',
        score: props.player2Score ?? 0,
        fouls: props.player2Fouls ?? 0
      }
    ]);

    // Timer
    const timerMinutes = ref(initialMinutes);
    const timerSeconds = ref(initialSeconds);
    const timerInterval = ref(null);
    const timerRunning = ref(false);
    const timerTotalSeconds = ref(initialMinutes * 60 + initialSeconds);
    const timerOriginalValue = ref(timerTotalSeconds.value);

    // Dialogs
    const nameDialog = ref({
      show: false,
      value: '',
      playerIndex: 0
    });

    const cityDialog = ref({
      show: false,
      value: '',
      playerIndex: 0
    });

    const flagDialog = ref({
      show: false,
      value: 'France',
      playerIndex: 0
    });

    const availableFlags = ref(['France', 'Allemagne', 'Italie', 'Espagne']);
    const buzzerSound = new Audio('/sounds/finalSound.ogg');

    // Calculer le scaling en fonction de la taille de la fenêtre
    const calculateScale = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Calculer le rapport d'aspect pour s'assurer que tout est visible
      const scaleX = windowWidth / containerWidth.value;
      const scaleY = windowHeight / containerHeight.value;

      // Utiliser le plus petit des deux pour garantir que tout tient à l'écran
      scale.value = Math.min(scaleX, scaleY);
    };

    // Style du conteneur qui se met à l'échelle
    const containerStyle = computed(() => {
      return {
        width: `${containerWidth.value}px`,
        height: `${containerHeight.value}px`,
        transform: `scale(${scale.value})`,
        transformOrigin: 'top left',
        position: 'absolute',
        top: '0',
        left: '0'
      };
    });

    // Format du timer
    const formattedTime = computed(() => {
      const minutes = Math.floor(timerTotalSeconds.value / 60);
      const seconds = timerTotalSeconds.value % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    });

    // Player Score Methods
    function incrementScore(playerIndex) {
      players.value[playerIndex].score++;

      // Émettre l'événement pour mise à jour
      if (playerIndex === 0) {
        emit('update:player1-score', players.value[playerIndex].score);
      } else {
        emit('update:player2-score', players.value[playerIndex].score);
      }
    }

    function decrementScore(playerIndex) {
      if (players.value[playerIndex].score > 0) {
        players.value[playerIndex].score--;

        // Émettre l'événement pour mise à jour
        if (playerIndex === 0) {
          emit('update:player1-score', players.value[playerIndex].score);
        } else {
          emit('update:player2-score', players.value[playerIndex].score);
        }
      }
    }

    function incrementFouls(playerIndex) {
      players.value[playerIndex].fouls++;

      // Émettre l'événement pour mise à jour
      if (playerIndex === 0) {
        emit('update:player1-fouls', players.value[playerIndex].fouls);
      } else {
        emit('update:player2-fouls', players.value[playerIndex].fouls);
      }
    }

    function decrementFouls(playerIndex) {
      if (players.value[playerIndex].fouls > 0) {
        players.value[playerIndex].fouls--;

        // Émettre l'événement pour mise à jour
        if (playerIndex === 0) {
          emit('update:player1-fouls', players.value[playerIndex].fouls);
        } else {
          emit('update:player2-fouls', players.value[playerIndex].fouls);
        }
      }
    }

    // Timer Methods
    function selectTimer() {
      timerTotalSeconds.value = (parseInt(timerMinutes.value) * 60) + parseInt(timerSeconds.value);
      timerOriginalValue.value = timerTotalSeconds.value;

      // Émettre l'événement pour mise à jour
      emit('update:timer-value', formattedTime.value);
    }

    function startTimer() {
      if (!timerRunning.value) {
        timerRunning.value = true;
        timerInterval.value = setInterval(() => {
          if (timerTotalSeconds.value > 0) {
            timerTotalSeconds.value--;

            // Émettre l'événement pour mise à jour
            emit('update:timer-value', formattedTime.value);
          } else {
            endTimer();
          }
        }, 1000);
      }
    }

    function pauseTimer() {
      timerRunning.value = false;
      clearInterval(timerInterval.value);
    }

    function resetTimer() {
      timerTotalSeconds.value = timerOriginalValue.value;

      // Émettre l'événement pour mise à jour
      emit('update:timer-value', formattedTime.value);
    }

    function endTimer() {
      timerRunning.value = false;
      clearInterval(timerInterval.value);
      buzzerSound.play();
    }

    // Dialog Methods
    function openNameDialog(playerIndex) {
      nameDialog.value.playerIndex = playerIndex;
      nameDialog.value.value = players.value[playerIndex].name;
      nameDialog.value.show = true;
    }

    function saveName() {
      players.value[nameDialog.value.playerIndex].name = nameDialog.value.value;

      // Émettre l'événement pour mise à jour
      if (nameDialog.value.playerIndex === 0) {
        emit('update:player1-name', nameDialog.value.value);
      } else {
        emit('update:player2-name', nameDialog.value.value);
      }
    }

    function openCityDialog(playerIndex) {
      cityDialog.value.playerIndex = playerIndex;
      cityDialog.value.value = players.value[playerIndex].city;
      cityDialog.value.show = true;
    }

    function saveCity() {
      players.value[cityDialog.value.playerIndex].city = cityDialog.value.value;

      // Émettre l'événement pour mise à jour
      if (cityDialog.value.playerIndex === 0) {
        emit('update:player1-club', cityDialog.value.value);
      } else {
        emit('update:player2-club', cityDialog.value.value);
      }
    }

    function openFlagDialog(playerIndex) {
      flagDialog.value.playerIndex = playerIndex;
      flagDialog.value.value = players.value[playerIndex].flag;
      flagDialog.value.show = true;
    }

    function saveFlag() {
      players.value[flagDialog.value.playerIndex].flag = flagDialog.value.value;

      // Émettre l'événement pour mise à jour
      if (flagDialog.value.playerIndex === 0) {
        emit('update:player1-flag', flagDialog.value.value);
      } else {
        emit('update:player2-flag', flagDialog.value.value);
      }
    }

// Watch pour les changements de propriétés
    watch(() => props.player1Name, (newVal) => {
      if (newVal !== undefined && newVal !== players.value[0].name) {
        players.value[0].name = newVal;
      }
    });

    watch(() => props.player1Club, (newVal) => {
      if (newVal !== undefined && newVal !== players.value[0].city) {
        players.value[0].city = newVal;
      }
    });

    watch(() => props.player1Score, (newVal) => {
      if (newVal !== undefined && newVal !== players.value[0].score) {
        players.value[0].score = newVal;
      }
    });

    watch(() => props.player1Fouls, (newVal) => {
      if (newVal !== undefined && newVal !== players.value[0].fouls) {
        players.value[0].fouls = newVal;
      }
    });

    watch(() => props.player2Name, (newVal) => {
      if (newVal !== undefined && newVal !== players.value[1].name) {
        players.value[1].name = newVal;
      }
    });

    watch(() => props.player2Club, (newVal) => {
      if (newVal !== undefined && newVal !== players.value[1].city) {
        players.value[1].city = newVal;
      }
    });

    watch(() => props.player2Score, (newVal) => {
      if (newVal !== undefined && newVal !== players.value[1].score) {
        players.value[1].score = newVal;
      }
    });

    watch(() => props.player2Fouls, (newVal) => {
      if (newVal !== undefined && newVal !== players.value[1].fouls) {
        players.value[1].fouls = newVal;
      }
    });

    watch(() => props.timerValue, (newVal) => {
      if (newVal !== undefined && newVal !== formattedTime.value) {
        const [minutes, seconds] = newVal.split(':').map(Number);
        timerMinutes.value = minutes;
        timerSeconds.value = seconds;
        timerTotalSeconds.value = minutes * 60 + seconds;
        timerOriginalValue.value = timerTotalSeconds.value;
      }
    });

    // Écouter les changements de taille de fenêtre
    onMounted(() => {
      calculateScale();
      window.addEventListener('resize', calculateScale);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', calculateScale);
      clearInterval(timerInterval.value);
    });

    return {
      players,
      timerMinutes,
      timerSeconds,
      timerInterval,
      timerRunning,
      timerTotalSeconds,
      timerOriginalValue,
      nameDialog,
      cityDialog,
      flagDialog,
      availableFlags,
      containerStyle,
      formattedTime,
      calculateScale,
      incrementScore,
      decrementScore,
      incrementFouls,
      decrementFouls,
      selectTimer,
      startTimer,
      pauseTimer,
      resetTimer,
      endTimer,
      openNameDialog,
      saveName,
      openCityDialog,
      saveCity,
      openFlagDialog,
      saveFlag
    };
  }
};
</script>

<style>
@font-face {
  font-family: 'Digital Numbers';
  src: url('/DigitalNumbers-Regular.ttf') format('woff');
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.tableau-score {
  display: flex;
  justify-content: center;
  align-items: center;
}

.scaling-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center;
}

.drapeau {
  cursor: pointer;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
