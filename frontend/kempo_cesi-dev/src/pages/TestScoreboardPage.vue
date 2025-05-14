<template>
  <q-page class="flex flex-center bg-grey-3">
    <div class="column items-center q-pa-md">
      <q-btn label="Ouvrir Scoreboard" color="primary" @click="openPopup" class="q-mb-md" />
      <scoreboard-app
        :player1Name="'Julien WECKERLE'"
        :player1Club="'Chatenois'"
        :player1Score="1"
        :player1Fouls="0"
        :player2Name="'Mesut Aysel'"
        :player2Club="'Nancy'"
        :player2Score="2"
        :player2Fouls="0"
        :timerValue="'03:00'"
      />
    </div>
  </q-page>
</template>

<script setup>
import ScoreboardApp from 'src/components/ScoreboardApp.vue';



function openPopup() {
  const params = new URLSearchParams({
    player1Name: 'Julien WECKERLE',
    player1Club: 'Chatenois',
    player1Score: 1,
    player1Fouls: 0,
    player2Name: 'Mesut Aysel',
    player2Club: 'Nancy',
    player2Score: 2,
    player2Fouls: 0,
    timerValue: '03:00'
  }).toString();
  window.open(
    `/scoreboard-live?${params}`,
    'ScoreboardPopup',
    'width=1366,height=768,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no'
  );
}
</script>

<style scoped>

</style>
