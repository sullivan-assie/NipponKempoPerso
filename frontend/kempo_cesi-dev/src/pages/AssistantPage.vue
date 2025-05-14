<template>
  <q-page class="flex flex-center bg-grey-3">
    <div class="column items-center q-pa-md">
      <button
        @click="openScoreboard"
        title="Ouvrir le tableau des scores"
        class="fixed bottom-6 left-6 bg-red-600 hover:bg-red-700 font-semibold h-12 flex items-center justify-center rounded-lg shadow-lg transition-shadow"
        style="padding-inline: 15px; z-index: 48; background-color: darkgray;"
      >
        Ouvrir scoreboard
        <i class="fas fa-chart-line text-lg" style="margin-left: 10px;"></i>
      </button>
      <TableauScore
        :player1Name="player1Name"
        :player1Club="player1Club"
        :player1Score="player1Score"
        :player1Fouls="player1Fouls"
        :player2Name="player2Name"
        :player2Club="player2Club"
        :player2Score="player2Score"
        :player2Fouls="player2Fouls"
        :timerValue="timerValue"
        @update:player1-name="updatePlayer1Name"
        @update:player1-club="updatePlayer1Club"
        @update:player1-score="updatePlayer1Score"
        @update:player1-fouls="updatePlayer1Fouls"
        @update:player1-flag="updatePlayer1Flag"
        @update:player2-name="updatePlayer2Name"
        @update:player2-club="updatePlayer2Club"
        @update:player2-score="updatePlayer2Score"
        @update:player2-fouls="updatePlayer2Fouls"
        @update:player2-flag="updatePlayer2Flag"
        @update:timer-value="updateTimerValue"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue';
import TableauScore from 'src/components/assistants.vue';

// Données du match
const player1Name = ref('Julien WECKERLE');
const player1Club = ref('Chatenois');
const player1Score = ref(1);
const player1Fouls = ref(0);
const player1Flag = ref('France');

const player2Name = ref('Mesut Aysel');
const player2Club = ref('Nancy');
const player2Score = ref(2);
const player2Fouls = ref(0);
const player2Flag = ref('France');

const timerValue = ref('03:00');

// Référence à la fenêtre du scoreboard
let scoreboardWindow = null;

// Fonction pour ouvrir le scoreboard
function openScoreboard() {
  const params = new URLSearchParams({
    player1Name: player1Name.value,
    player1Club: player1Club.value,
    player1Score: player1Score.value,
    player1Fouls: player1Fouls.value,
    player1Flag: player1Flag.value,
    player2Name: player2Name.value,
    player2Club: player2Club.value,
    player2Score: player2Score.value,
    player2Fouls: player2Fouls.value,
    player2Flag: player2Flag.value,
    timerValue: timerValue.value
  }).toString();

  // Fermer la fenêtre précédente si elle existe
  if (scoreboardWindow && !scoreboardWindow.closed) {
    scoreboardWindow.close();
  }

  // Ouvrir une nouvelle fenêtre
  scoreboardWindow = window.open(
    `/#/test2?${params}`,
    'ScoreboardPopup',
    'width=1366,height=768,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no'
  );


  if (scoreboardWindow) {
    scoreboardWindow.opener = window;
    setTimeout(() => {
      updateScoreboard();
    }, 500);
  }
}


function updatePlayer1Name(value) {
  player1Name.value = value;
  updateScoreboard();
}

function updatePlayer1Club(value) {
  player1Club.value = value;
  updateScoreboard();
}

function updatePlayer1Score(value) {
  player1Score.value = value;
  updateScoreboard();
}

function updatePlayer1Fouls(value) {
  player1Fouls.value = value;
  updateScoreboard();
}

function updatePlayer1Flag(value) {
  player1Flag.value = value;
  updateScoreboard();
}

function updatePlayer2Name(value) {
  player2Name.value = value;
  updateScoreboard();
}

function updatePlayer2Club(value) {
  player2Club.value = value;
  updateScoreboard();
}

function updatePlayer2Score(value) {
  player2Score.value = value;
  updateScoreboard();
}

function updatePlayer2Fouls(value) {
  player2Fouls.value = value;
  updateScoreboard();
}

function updatePlayer2Flag(value) {
  player2Flag.value = value;
  updateScoreboard();
}

function updateTimerValue(value) {
  timerValue.value = value;
  updateScoreboard();
}

// Fonction pour envoyer les mises à jour au scoreboard
function updateScoreboard() {
  if (scoreboardWindow && !scoreboardWindow.closed) {
    try {
      scoreboardWindow.postMessage({
        type: 'UPDATE_SCOREBOARD',
        data: {
          player1Name: player1Name.value,
          player1Club: player1Club.value,
          player1Score: player1Score.value,
          player1Fouls: player1Fouls.value,
          player1Flag: player1Flag.value,
          player2Name: player2Name.value,
          player2Club: player2Club.value,
          player2Score: player2Score.value,
          player2Fouls: player2Fouls.value,
          player2Flag: player2Flag.value,
          timerValue: timerValue.value
        }
      }, '*');
    } catch (e) {
      console.error('Erreur lors de la mise à jour du scoreboard:', e);


      scoreboardWindow = null;
    }
  }
}
</script>
