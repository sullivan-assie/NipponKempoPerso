<template>
  <div class="scoreboard-container" :style="containerStyle">
    <div class="section red-section">
      <div class="flag">
        <flag :country="player1Flag" />
      </div>
      <div class="player-info">
        <div class="player-name">{{ player1Name }}</div>
        <div class="player-club">{{ player1Club }}</div>
      </div>
      <div class="score-fouls">
        <div class="main-score player1-score">{{ player1Score }}</div>
        <div class="fouls player1-fouls">{{ player1Fouls }}</div>
      </div>
    </div>

    <div class="section white-section">
      <div class="flag">
        <flag :country="player2Flag" />
      </div>
      <div class="player-info">
        <div class="player-name">{{ player2Name }}</div>
        <div class="player-club">{{ player2Club }}</div>
      </div>
      <div class="score-fouls">
        <div class="main-score player2-score">{{ player2Score }}</div>
        <div class="fouls player2-fouls">{{ player2Fouls }}</div>
      </div>
    </div>

    <div class="section black-section">
      <div class="logo">
        <img src="/kempoimh.png" alt="Kempo Logo" />
      </div>
      <div class="timer-section">
        <div class="timer-value">{{ timerValue }}</div>
        <div class="timer-label">Minutes</div>
      </div>
    </div>
  </div>
</template>

<script>
import { h, onMounted, onUnmounted, ref, computed } from 'vue';

export default {
  name: 'ScoreboardLive',
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
            h('div', { style: { width: '100%', height: '100%', position: 'absolute', background: '#CE1126' } }),
            h('div', { style: { width: '66.67%', height: '100%', position: 'absolute', background: 'white' } }),
            h('div', { style: { width: '33.33%', height: '100%', position: 'absolute', background: '#002654' } })
          ]);
        } else if (this.country === 'Allemagne') {
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '100%', height: '33.33%', top: '0px', position: 'absolute', background: '#000000' } }),
            h('div', { style: { width: '100%', height: '33.33%', top: '33.33%', position: 'absolute', background: '#DD0000' } }),
            h('div', { style: { width: '100%', height: '33.33%', top: '66.66%', position: 'absolute', background: '#FFCE00' } })
          ]);
        } else if (this.country === 'Italie') {
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '33.33%', height: '100%', left: '0px', position: 'absolute', background: '#009246' } }),
            h('div', { style: { width: '33.33%', height: '100%', left: '33.33%', position: 'absolute', background: 'white' } }),
            h('div', { style: { width: '33.33%', height: '100%', left: '66.66%', position: 'absolute', background: '#CE2B37' } })
          ]);
        } else if (this.country === 'Espagne') {
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '100%', height: '25%', top: '0px', position: 'absolute', background: '#AA151B' } }),
            h('div', { style: { width: '100%', height: '50%', top: '25%', position: 'absolute', background: '#F1BF00' } }),
            h('div', { style: { width: '100%', height: '25%', top: '75%', position: 'absolute', background: '#AA151B' } })
          ]);
        } else {
          // Drapeau par défaut (France)
          return h('div', { style: { width: '100%', height: '100%', position: 'relative' } }, [
            h('div', { style: { width: '100%', height: '100%', position: 'absolute', background: '#CE1126' } }),
            h('div', { style: { width: '66.67%', height: '100%', position: 'absolute', background: 'white' } }),
            h('div', { style: { width: '33.33%', height: '100%', position: 'absolute', background: '#002654' } })
          ]);
        }
      }
    }
  },
  setup() {
    // Récupérer les paramètres de l'URL
    const params = new URLSearchParams(window.location.search);

    // Données du match
    const player1Name = ref(params.get('player1Name') || 'Joueur 1');
    const player1Club = ref(params.get('player1Club') || '');
    const player1Score = ref(parseInt(params.get('player1Score')) || 0);
    const player1Fouls = ref(parseInt(params.get('player1Fouls')) || 0);
    const player1Flag = ref(params.get('player1Flag') || 'France');

    const player2Name = ref(params.get('player2Name') || 'Joueur 2');
    const player2Club = ref(params.get('player2Club') || '');
    const player2Score = ref(parseInt(params.get('player2Score')) || 0);
    const player2Fouls = ref(parseInt(params.get('player2Fouls')) || 0);
    const player2Flag = ref(params.get('player2Flag') || 'France');

    const timerValue = ref(params.get('timerValue') || '00:00');

    // État réactif pour le scaling
    const scale = ref(1);
    const containerWidth = ref(1366);
    const containerHeight = ref(768);

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

    // Fonction pour recevoir les mises à jour de la fenêtre parente
    const handleMessage = (event) => {
      // Vérifier que le message est bien du type attendu
      if (event.data && event.data.type === 'UPDATE_SCOREBOARD') {
        const data = event.data.data;

        // Mettre à jour les données
        if (data.player1Name !== undefined) player1Name.value = data.player1Name;
        if (data.player1Club !== undefined) player1Club.value = data.player1Club;
        if (data.player1Score !== undefined) player1Score.value = data.player1Score;
        if (data.player1Fouls !== undefined) player1Fouls.value = data.player1Fouls;
        if (data.player1Flag !== undefined) player1Flag.value = data.player1Flag;

        if (data.player2Name !== undefined) player2Name.value = data.player2Name;
        if (data.player2Club !== undefined) player2Club.value = data.player2Club;
        if (data.player2Score !== undefined) player2Score.value = data.player2Score;
        if (data.player2Fouls !== undefined) player2Fouls.value = data.player2Fouls;
        if (data.player2Flag !== undefined) player2Flag.value = data.player2Flag;

        if (data.timerValue !== undefined) timerValue.value = data.timerValue;
      }
    };

    // Écouter les changements de taille de fenêtre et les messages
    onMounted(() => {
      calculateScale();
      window.addEventListener('resize', calculateScale);
      window.addEventListener('message', handleMessage);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', calculateScale);
      window.removeEventListener('message', handleMessage);
    });

    return {
      player1Name,
      player1Club,
      player1Score,
      player1Fouls,
      player1Flag,
      player2Name,
      player2Club,
      player2Score,
      player2Fouls,
      player2Flag,
      timerValue,
      containerStyle
    };
  }
};
</script>

<style scoped>
@font-face {
  font-family: 'Digital Numbers';
  src: url('/DigitalNumbers-Regular.ttf') format('woff');
}

.scoreboard-container {
  width: 1366px;
  height: 768px;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  position: absolute;
  top: 0;
  left: 0;
}

.section {
  width: 100%;
  position: absolute;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;
}

.red-section {
  height: 251px;
  background-color: #FE0000;
  top: 0;
  left: 0;
  z-index: 1;
}

.white-section {
  height: 261px;
  background-color: #FFFFFD;
  top: 251px;
  left: 0;
  color: black;
  z-index: 1;
}

.black-section {
  height: 261px;
  background-color: black;
  top: 512px;
  left: 0;
  color: white;
  justify-content: space-between;
  z-index: 1;
}

/* Gradient overlay */
.red-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 512px;
  background: linear-gradient(272deg, rgba(0, 0, 0, 0.7) 0%, rgba(102, 102, 102, 0) 100%);
  pointer-events: none;
  z-index: 0;
}

.flag {
  width: 175px;
  height: 115px;
  margin-right: 20px;
  flex-shrink: 0;
  z-index: 2;
  position: relative;
}

.player-info {
  flex-grow: 1;
  z-index: 2;
  position: relative;
}

.player-name {
  font-size: 79px;
  font-weight: 700;
  letter-spacing: 2.37px;
  line-height: 1.1;
  text-shadow: 0 1px 5px rgba(0,0,0,0.3);
}

.player-club {
  font-size: 75px;
  font-weight: 400;
  letter-spacing: 2.25px;
  line-height: 1.1;
  text-shadow: 0 1px 5px rgba(0,0,0,0.3);
}

.red-section .player-name,
.red-section .player-club {
  color: white;
}
.white-section .player-name,
.white-section .player-club {
  color: black;
}

.score-fouls {
  display: flex;
  align-items: center;
  font-family: 'Digital Numbers', monospace;
  color: white;
  margin-left: auto;
  z-index: 2;
  position: relative;
}

.main-score {
  font-size: 186px;
  font-weight: 400;
  text-align: center;
  min-width: 150px;
}

.fouls {
  font-size: 66px;
  font-weight: 400;
  text-align: center;
  margin-left: 40px;
  min-width: 100px;
}

.white-section .score-fouls {
  color: black;
}

.logo {
  width: 239px;
  height: 218px;
  flex-shrink: 0;
  margin-left: 36px;
  z-index: 2;
  position: relative;
}
.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.timer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 50px;
  flex-grow: 1;
  z-index: 2;
  position: relative;
}

.timer-value {
  font-family: 'Digital Numbers', monospace;
  font-size: 136px;
  font-weight: 400;
  text-align: center;
  color: white;
  line-height: 1;
}

.timer-label {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 0.54px;
  text-align: center;
  color: white;
  margin-top: 5px;
}
</style>
