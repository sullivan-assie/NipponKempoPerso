<template>
  <div>
    <!-- head "sauvage" pour Tailwind / FontAwesome -->
    <meta name="viewport" content="width=1920, user-scalable=no">
    <link href="/dist/tailwind.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap" />

    <!-- Container principal -->
    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <!-- Header -->
      <header class="mb-8 text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Tableau de Classement</h1>
        <div class="h-1 w-24 bg-blue-500 mx-auto mb-3"></div>
        <p class="text-gray-600">Classement basé sur les points accumulés</p>
      </header>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Total de Participants</h3>
            <p class="text-2xl font-bold text-gray-800">{{ totalParticipants }}</p>
          </div>
          <div class="bg-blue-100 p-3 rounded-full">
            <i class="fas fa-users text-blue-500"></i>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Points Maximum</h3>
            <p class="text-2xl font-bold text-gray-800">{{ maxPoints }}</p>
          </div>
          <div class="bg-green-100 p-3 rounded-full">
            <i class="fas fa-trophy text-green-500"></i>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Moyenne des Points</h3>
            <p class="text-2xl font-bold text-gray-800">{{ avgPoints }}</p>
          </div>
          <div class="bg-yellow-100 p-3 rounded-full">
            <i class="fas fa-chart-line text-yellow-500"></i>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Max Ippon</h3>
            <p class="text-2xl font-bold text-gray-800">{{ maxIppon }}</p>
          </div>
          <div class="bg-red-100 p-3 rounded-full">
            <i class="fas fa-medal text-red-500"></i>
          </div>
        </div>
      </div>

      <!-- Boutons d'exportation -->
      <div class="flex justify-end mb-6 gap-4">
        <button @click="exportResultsCSV" class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          <i class="fas fa-file-csv"></i>
          Exporter Résultats
        </button>
        <button @click="exportBracketCSV" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          <i class="fas fa-file-export"></i>
          Exporter Bracket
        </button>
      </div>

      <!-- Podium -->
      <div class="flex items-end justify-center mb-12 py-6 hidden md:flex">
        <template v-for="(p, i) in top3" :key="i">
          <div
            :class="[
              'flex flex-col items-center mx-2',
              i === 1 ? 'z-10' : '',
              i === 2 ? 'z-10' : ''
            ]"
          >
            <div class="rounded-full bg-white shadow-lg border-2 overflow-hidden flex items-center justify-center mb-3 w-20 h-20"
                 :class="i===0? 'border-yellow-400' : i===1? 'border-gray-400' : 'border-yellow-700'">
              <span class="text-xl font-bold">{{ i+1 }}</span>
            </div>
            <div class="bg-gray-100 rounded-t-lg w-28 flex items-center justify-center shadow-md"
                 :class="i===0 ? 'h-32' : i===1 ? 'h-24' : 'h-20'">
              <div class="text-center">
                <p class="font-bold">{{ p.name }}</p>
                <p class="text-sm text-gray-600">{{ p.points }} pts</p>
                <p class="text-xs text-red-500">{{ p.ippon }} ippon</p>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Tableau général -->
      <div class="mb-12 bg-white rounded-xl shadow overflow-hidden">
        <div class="py-4 px-6 bg-gray-50 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">Classement Général</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
            <tr class="bg-gray-50 text-left">
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider w-16">Rang</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Participant</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Points</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Ikaku</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Ippon</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Matchs</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
            <tr
              v-for="(p, idx) in sorted"
              :key="p.name"
              :class="[
                  idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-50' : idx === 2 ? 'bg-yellow-50/50' : '',
                  'rank-card hover:bg-gray-50'
                ]"
            >
              <td class="py-4 px-6">
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold"
                     :class="idx===0 ? 'bg-yellow-100 text-yellow-800' : idx===1 ? 'bg-gray-100 text-gray-800' : idx===2 ? 'bg-yellow-50 text-yellow-800' : ''">
                  {{ idx+1 }}
                </div>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                       :class="`bg-${avatarBg(idx)}-100`">
                      <span :class="`font-bold text-${avatarBg(idx)}-700`">
                        {{ p.name.charAt(0).toUpperCase() }}
                      </span>
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">{{ p.name }}</div>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 font-bold text-gray-900">{{ p.points }}</td>
              <td class="py-4 px-6 font-medium text-gray-900">{{ p.ikaku }}</td>
              <td class="py-4 px-6 font-medium text-gray-900">{{ p.ippon }}</td>
              <td class="py-4 px-6 text-gray-900">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ p.matchCount }}
                </span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Détails des matches -->
      <div class="bg-white rounded-xl shadow overflow-hidden mb-12">
        <div class="py-4 px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">Détails des Matches</h2>
          <button @click="toggleMatchDetails" class="text-blue-500 hover:text-blue-700">
            <i :class="showMatchDetails ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </button>
        </div>
        <div v-if="showMatchDetails" class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
            <tr class="bg-gray-50 text-left">
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Tour</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Match</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Participant 1</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Ikaku</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Participant 2</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Ikaku</th>
              <th class="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Gagnant</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
            <tr v-for="(match, idx) in allMatches" :key="idx" class="hover:bg-gray-50">
              <td class="py-3 px-6 text-sm">{{ stageTitle(match.round-1) }}</td>
              <td class="py-3 px-6 text-sm">{{ match.idx + 1 }}</td>
              <td class="py-3 px-6 font-medium text-gray-900">{{ match.p1 || 'À Déterminer' }}</td>
              <td class="py-3 px-6 font-medium text-gray-900">{{ match.s1 || '-' }}</td>
              <td class="py-3 px-6 font-medium text-gray-900">{{ match.f1 || '-' }}</td>
              <td class="py-3 px-6 font-medium text-gray-900">{{ match.p2 || 'À Déterminer' }}</td>
              <td class="py-3 px-6 font-medium text-gray-900">{{ match.s2 || '-' }}</td>
              <td class="py-3 px-6 font-medium text-gray-900">{{ match.f2 || '-' }}</td>
              <td class="py-3 px-6">
                <span v-if="match.winner" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ match.winner === '1' ? match.p1 : match.p2 }}
                </span>
                <span v-else class="text-gray-500">-</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ bracket: { type: Object, required: true } })

const showMatchDetails = ref(false)

// Aplatir tous les matchs
const allMatches = computed(() => {
  if (!props.bracket || !props.bracket.rounds) return []
  return props.bracket.rounds.flat()
})

// Calculer les statistiques par participant
const participantStats = computed(() => {
  const stats = {}

  allMatches.value.forEach(match => {
    if (!match) return

    // Initialiser les stats pour chaque participant s'ils n'existent pas encore
    if (match.p1 && !stats[match.p1]) {
      stats[match.p1] = {
        points: 0,
        ikaku: 0,
        ippon: 0,
        matchCount: 0,
        wins: 0
      }
    }

    if (match.p2 && !stats[match.p2]) {
      stats[match.p2] = {
        points: 0,
        ikaku: 0,
        ippon: 0,
        matchCount: 0,
        wins: 0
      }
    }

    // Ajouter les scores et statistiques
    if (match.p1) {
      stats[match.p1].points += (match.s1 || 0)
      stats[match.p1].ikaku += (match.f1 || 0)
      stats[match.p1].ippon += (match.winner === '1' ? 1 : 0)
      stats[match.p1].matchCount += 1
      if (match.winner === '1') stats[match.p1].wins += 1
    }

    if (match.p2) {
      stats[match.p2].points += (match.s2 || 0)
      stats[match.p2].ikaku += (match.f2 || 0)
      stats[match.p2].ippon += (match.winner === '2' ? 1 : 0)
      stats[match.p2].matchCount += 1
      if (match.winner === '2') stats[match.p2].wins += 1
    }
  })

  return stats
})

// Transformer en array et trier
const sorted = computed(() =>
  Object.entries(participantStats.value)
    .map(([name, stats]) => ({
      name,
      points: stats.points,
      ikaku: stats.ikaku,
      ippon: stats.ippon,
      matchCount: stats.matchCount,
      wins: stats.wins
    }))
    .sort((a, b) => {
      // Trier d'abord par points
      if (b.points !== a.points) return b.points - a.points
      // En cas d'égalité, trier par ippon
      if (b.ippon !== a.ippon) return b.ippon - a.ippon
      // Ensuite par ikaku (moins c'est mieux)
      return a.ikaku - b.ikaku
    })
)

const totalParticipants = computed(() => sorted.value.length)
const maxPoints = computed(() => sorted.value[0]?.points || 0)
const maxIppon = computed(() => {
  const max = Math.max(...sorted.value.map(p => p.ippon))
  return max || 0
})
const avgPoints = computed(() => {
  const sum = sorted.value.reduce((acc, p) => acc + p.points, 0)
  return totalParticipants.value ? Math.round(sum/totalParticipants.value) : 0
})
const top3 = computed(() => sorted.value.slice(0, 3))

// Pour varier la couleur de l'avatar
function avatarBg(idx) {
  const colors = ['blue', 'pink', 'green', 'purple', 'red', 'yellow', 'indigo', 'gray', 'teal']
  return colors[idx % colors.length]
}

// Fonction pour basculer l'affichage des détails de match
function toggleMatchDetails() {
  showMatchDetails.value = !showMatchDetails.value
}

// Fonction pour déterminer le titre de l'étape
function stageTitle(rIdx) {
  if (!props.bracket || !props.bracket.rounds) return ''
  if (rIdx === 0) return '1er Tour'
  if (rIdx === props.bracket.rounds.length - 1) return 'Finale'
  if (rIdx === props.bracket.rounds.length - 2) return 'Demi‑Finale'
  return `Tour ${rIdx + 1}`
}

// Fonction pour exporter les résultats en CSV
function exportResultsCSV() {
  // En-têtes CSV
  let csv = 'Rang,Participant,Points,Ikaku,Ippon,Matchs\n'

  // Données
  sorted.value.forEach((p, idx) => {
    csv += `${idx+1},"${p.name}",${p.points},${p.ikaku},${p.ippon},${p.matchCount}\n`
  })

  // Créer un élément de lien pour le téléchargement
  downloadCSV(csv, 'resultats_tournoi.csv')
}

// Fonction pour exporter les détails du bracket en CSV
function exportBracketCSV() {
  // En-têtes CSV
  let csv = 'Tour,Match,Participant 1,Score 1,Ikaku 1,Participant 2,Score 2,Ikaku 2,Gagnant\n'

  // Données
  allMatches.value.forEach(match => {
    if (!match) return
    const winner = match.winner === '1' ? match.p1 : match.winner === '2' ? match.p2 : ''
    csv += `"${stageTitle(match.round-1)}",${match.idx+1},"${match.p1 || 'À Déterminer'}",${match.s1 || 0},${match.f1 || 0},"${match.p2 || 'À Déterminer'}",${match.s2 || 0},${match.f2 || 0},"${winner}"\n`
  })

  // Créer un élément de lien pour le téléchargement
  downloadCSV(csv, 'details_tournoi.csv')
}

// Fonction utilitaire pour télécharger un fichier CSV
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap');
html, body {
  background: #fff;
  font-family: 'Montserrat', sans-serif;
}

/* Styles pour le podium */
.border-yellow-400 {
  border-color: #facc15;
}
.border-gray-400 {
  border-color: #9ca3af;
}
.border-yellow-700 {
  border-color: #a16207;
}

/* Animation pour les badges */
.inline-flex {
  transition: all 0.3s ease;
}
.inline-flex:hover {
  transform: scale(1.05);
}

/* Styles pour les cartes de rang */
.rank-card {
  transition: transform 0.2s ease;
}
.rank-card:hover {
  transform: translateX(4px);
}
</style>
