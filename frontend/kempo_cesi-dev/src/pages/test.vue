<script setup>
import { ref } from 'vue'
import Bracket from 'components/Bracket.vue'
import Results from 'components/Results.vue'

const players = [
  { id: 1, nom: 'Dupont', prenom: 'Léa', country: 'FR', club: 'Dojo' },
  { id: 2, nom: 'Dupont2', prenom: 'Léa2', country: 'FR', club: 'Dojo' },
  { id: 3, nom: 'Dupont3', prenom: 'Léa3', country: 'FR', club: 'Dojo' },
  { id: 4, nom: 'Dupont4', prenom: 'Léa4', country: 'FR', club: 'Dojo' },
  { id: 5, nom: 'Dupont4', prenom: 'Léa4', country: 'FR', club: 'Dojo' },
  { id: 6, nom: 'Dupont4', prenom: 'Léa4', country: 'FR', club: 'Dojo' }
]


const bracketJson = ref(null)
const showResults = ref(false)

function doSomethingWithResult(result) {
  console.log('Résultat du bracket :', result)
}

function handleViewResults(){
  if (
    !bracketJson.value ||
    !Array.isArray(bracketJson.value.rounds) ||
    bracketJson.value.rounds.length === 0
  ) {
    alert('Le bracket n’est pas encore rempli ou est invalide.')
  } else {
    showResults.value = true
  }
}

</script>

<template>
  <link href="/dist/fontawesome.css" rel="stylesheet">
    <div v-if="!showResults">
      <Bracket
        :participants="players"
        v-model="bracketJson"
        @finished="doSomethingWithResult"
        @view-results="handleViewResults"
      />
    </div>
    <div v-else>
      <Results :bracket="bracketJson" />
    </div>
</template>
