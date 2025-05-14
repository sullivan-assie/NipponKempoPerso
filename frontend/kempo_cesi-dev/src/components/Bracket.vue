<template>
  <meta name="viewport" content="width=1920, user-scalable=no">
  <link href="/dist/tailwind.css" rel="stylesheet" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css" rel="stylesheet">

  <div class="relative">
    <!-- Plein‑écran -->
    <button class="fullscreen-btn" @click="toggleFullscreen" title="Plein écran"><i class="fa fa-expand" /></button>

    <!-- Titre -->
    <div class="w-full text-center pt-6 pb-2">
      <h1 class="text-4xl font-extrabold tracking-wide mb-2 text-blue-800" style="letter-spacing:0.03em">BRACKET TOURNOI</h1>
    </div>

    <!-- Bracket -->
    <div class="bracket-container pb-10" ref="bracketEl" style="justify-content: center;">
      <template v-for="(round, rIdx) in bracket.rounds" :key="'round-'+rIdx">
        <div class="round relative" :style="{ marginRight: rIdx < bracket.rounds.length - 1 ? '1.5rem' : 0 }">
          <div class="round-title">{{ stageTitle(rIdx) }}</div>

          <template v-for="(match, mIdx) in round" :key="'m-'+rIdx+'-'+mIdx">
            <div
              :class="matchClass(match, rIdx)"
              tabindex="0"
              title="Double‑cliquez pour modifier"
              @dblclick="openEditModal(rIdx,mIdx)"
            >
              <div v-if="!match.p1 && !match.p2" class="tbd">À Déterminer</div>

              <template v-else>
                <div :class="rowClass(match,1)+' flex justify-between items-center py-1'">
                  <span class="truncate flex-1">{{ match.p1 }}</span>
                  <div class="scores-container">
                    <span class="score mx-1" :class="colorClass(rIdx)">{{ disp(match.s1) }}</span>
                    <span class="fault mx-1" :class="colorClass(rIdx)">{{ disp(match.f1) }}</span>
                  </div>
                </div>
                <div :class="rowClass(match,2)+' flex justify-between items-center py-1'">
                  <span class="truncate flex-1">{{ match.p2 }}</span>
                  <div class="scores-container">
                    <span class="score mx-1" :class="colorClass(rIdx)">{{ disp(match.s2) }}</span>
                    <span class="fault mx-1" :class="colorClass(rIdx)">{{ disp(match.f2) }}</span>
                  </div>
                </div>
              </template>

              <button class="edit-btn" @click.stop="openEditModal(rIdx,mIdx)"><i class="fa fa-pen" /></button>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- Lignes du bracket -->
    <svg class="bracket-lines" ref="linesSvg" />

    <!-- Modal d'édition match -->
    <div v-if="showModal" class="modal-bg" @click.self="closeModal">
      <div class="modal-content">
        <button class="modal-close-btn" @click="closeModal"><i class="fa fa-times" /></button>
        <h2 class="text-xl font-bold mb-4 text-blue-700">Modifier le match</h2>

        <form @submit.prevent="saveModal" autocomplete="off" spellcheck="false">
          <!-- P1 -->
          <div class="modal-row mb-2">
            <div class="w-full">
              <label>Participant 1</label>
              <input v-model="modalData.p1" type="text" maxlength="32" class="w-full" />
            </div>
          </div>
          <div class="score-grid mb-4">
            <div class="score-item">
              <label class="score-label">Score</label>
              <input v-model.number="modalData.s1" type="number" min="0" class="w-full" />
            </div>
            <div class="score-item">
              <label class="score-label">Fautes</label>
              <input v-model.number="modalData.f1" type="number" min="0" class="w-full" />
            </div>
          </div>
          <!-- P2 -->
          <div class="modal-row mb-2">
            <div class="w-full">
              <label>Participant 2</label>
              <input v-model="modalData.p2" type="text" maxlength="32" class="w-full" />
            </div>
          </div>
          <div class="score-grid mb-4">
            <div class="score-item">
              <label class="score-label">Score</label>
              <input v-model.number="modalData.s2" type="number" min="0" class="w-full" />
            </div>
            <div class="score-item">
              <label class="score-label">Fautes</label>
              <input v-model.number="modalData.f2" type="number" min="0" class="w-full" />
            </div>
          </div>
          <!-- gagnant -->
          <div class="modal-winner mt-4 items-center gap-4">
            <label>Désigner le gagnant :</label>
            <label class="flex items-center gap-2">
              <input type="radio" v-model="modalData.winner" value="1" />
              <span>{{ modalData.p1 || 'Participant 1' }}</span>
            </label>
            <label class="flex items-center gap-2 ml-6">
              <input type="radio" v-model="modalData.winner" value="2" />
              <span>{{ modalData.p2 || 'Participant 2' }}</span>
            </label>
            <label class="flex items-center gap-2 ml-6">
              <input type="radio" v-model="modalData.winner" value="" />
              <span>Aucun</span>
            </label>
          </div>
          <div class="modal-actions mt-4 flex justify-end gap-4">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-1 rounded-lg">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Nouveau bouton pour ouvrir la popup /test -->
    <button
      @click="openTestPopup"
      title="Ouvrir la fenêtre de test"
      class="fixed bottom-24 right-6 bg-green-600 hover:bg-green-700 text-white font-semibold h-12 flex items-center justify-center rounded-lg shadow-lg transition-shadow"
      style="padding-inline: 15px; z-index: 48;"
    >
      Ouvrir la vue Arbitre
      <i class="fas fa-external-link-alt text-lg" style="margin-left: 10px;"></i>
    </button>

    <!-- Bouton existant pour voir les résultats -->
    <button
      @click="$emit('view-results')"
      title="Voir les résultats"
      class="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 flex items-center justify-center rounded-lg shadow-lg transition-shadow"
      style="padding-inline: 15px;"
    >
      Voir les résultats
      <i class="fas fa-chart-bar text-lg" style="margin-left: 10px;"></i>
    </button>

  </div>
</template>

<script setup>
import { reactive, ref, watch, nextTick, onMounted } from 'vue'

/**
 * Props : liste des compétiteurs [{ id, nom, prenom, country, club }]
 */
const props = defineProps({ participants: { type: Array, required: true } })
const emit = defineEmits(['update:modelValue', 'finished', 'view-results'])

/* ====== CLASSES & HELPERS ====== */
const COLORS = ['green', 'orange', 'blue']
class Match {
  constructor (round, idx, p1 = '', p2 = '') {
    this.round = round
    this.idx = idx
    this.p1 = p1
    this.p2 = p2
    this.s1 = this.s2 = this.f1 = this.f2 = null
    this.winner = '' // '1' | '2' | ''
  }
}
class Bracket {
  constructor (participants) {
    this.nbRounds = Math.ceil(Math.log2(participants.length))
    this.rounds = []
    let n = participants.length
    const round1 = []
    for (let i = 0; i < n; i += 2) {
      round1.push(new Match(1, i / 2, fullName(participants[i]), fullName(participants[i + 1])))
    }
    this.rounds.push(round1)
    for (let r = 2; r <= this.nbRounds; r++) {
      const prevConut = this.rounds[r - 2].length
      const currCount = Math.ceil(prevConut / 2)
      const arr = []
      for (let m = 0; m < currCount; m++) arr.push(new Match(r, m))
      this.rounds.push(arr)
    }
  }
}
function fullName (p) {
  if (!p) return ''
  return `${p.prenom ?? ''} ${p.nom ?? ''}`.trim()
}

/* ====== STATE ====== */
const bracket = reactive(new Bracket(props.participants))
const linesSvg = ref(null)
const bracketEl = ref(null)

/* ====== MODAL STATE ====== */
const showModal = ref(false)
const editRound = ref(0)
const editMatch = ref(0)
const modalData = reactive({ p1: '', p2: '', s1: null, s2: null, f1: null, f2: null, winner: '' })

/* ====== MODAL FUNCS ====== */
function openEditModal (rIdx, mIdx) {
  const m = bracket.rounds[rIdx][mIdx]
  Object.assign(modalData, JSON.parse(JSON.stringify(m)))
  editRound.value = rIdx
  editMatch.value = mIdx
  showModal.value = true
}
function closeModal () {
  showModal.value = false
}
function saveModal () {
  const m = bracket.rounds[editRound.value][editMatch.value]
  Object.assign(m, JSON.parse(JSON.stringify(modalData)))
  propagateWinner(editRound.value, editMatch.value)
  showModal.value = false
}

/* ====== PROPAGATE WINNERS ====== */
function propagateWinner (rIdx, mIdx) {
  if (rIdx >= bracket.rounds.length - 1) {
    emit('finished', bracket.rounds[rIdx][0])
    emit('update:modelValue', JSON.parse(JSON.stringify(bracket)))
    return
  }
  const current = bracket.rounds[rIdx][mIdx]
  const nextIdx = Math.floor(mIdx / 2)
  const nextMatch = bracket.rounds[rIdx + 1][nextIdx]
  const winnerName = current.winner === '1' ? current.p1 : current.winner === '2' ? current.p2 : ''
  if (mIdx % 2 === 0) nextMatch.p1 = winnerName
  else nextMatch.p2 = winnerName
  resetChildRounds(rIdx + 1, nextIdx)
  emit('update:modelValue', JSON.parse(JSON.stringify(bracket)))
}
function resetChildRounds (roundIdx, matchIdx) {
  for (let r = roundIdx; r < bracket.rounds.length; r++) {
    const m = bracket.rounds[r][matchIdx]
    m.s1 = m.s2 = m.f1 = m.f2 = null
    m.winner = ''
    if (r < bracket.rounds.length - 1) {
      const childIdx = Math.floor(matchIdx / 2)
      const child = bracket.rounds[r + 1][childIdx]
      if (matchIdx % 2 === 0) child.p1 = ''
      else child.p2 = ''
      matchIdx = childIdx
    }
  }
}

/* ====== LINES DRAWING ====== */
function drawLines () {
  nextTick(() => {
    const svg = linesSvg.value
    const br = bracketEl.value
    if (!svg || !br) return
    svg.innerHTML = ''
    const rounds = br.querySelectorAll('.round')
    svg.setAttribute('width', document.body.scrollWidth * 3)
    svg.setAttribute('height', document.body.scrollHeight * 3)
    rounds.forEach((roundDiv, r) => {
      if (r >= rounds.length - 1) return
      const leftMatches = roundDiv.querySelectorAll('.match')
      const rightMatches = rounds[r + 1].querySelectorAll('.match')
      leftMatches.forEach((lm, idx) => {
        const toIdx = Math.floor(idx / 2)
        const rm = rightMatches[toIdx]
        if (!rm) return
        const a = lm.getBoundingClientRect()
        const b = rm.getBoundingClientRect()
        const x1 = a.right + window.scrollX
        const y1 = a.top + a.height / 2 + window.scrollY
        const x2 = b.left + window.scrollX - 8
        const y2 = b.top + b.height / 2 + window.scrollY
        const col = COLORS[r % COLORS.length] === 'green' ? '#22c55e' : COLORS[r % COLORS.length] === 'orange' ? '#f59e42' : '#0ea5e9'
        svg.innerHTML += `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${(y1 + y2) / 2} T${x2},${y2}" stroke="${col}" stroke-width="3" fill="none" stroke-opacity="0.18" />`
      })
    })
  })
}

/* ====== POPUP FUNCTION ====== */
function openTestPopup() {
  // Ouvrir une fenêtre popup vers la route /test avec une taille de 1365x768
  const width = 1365
  const height = 768
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2

  window.open(
    '/#/tests',
    'TestWindow',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,location=yes`
  )
}

watch(() => bracket.rounds, drawLines, { deep: true })
onMounted(() => {
  drawLines()
  window.addEventListener('resize', drawLines)
})
setTimeout(function() {
  drawLines()
}, 50);
/* ====== UI HELPERS ====== */
function stageTitle (rIdx) {
  if (rIdx === 0) return '1er Tour'
  if (rIdx === bracket.rounds.length - 1) return 'Finale'
  if (rIdx === bracket.rounds.length - 2) return 'Demi‑Finale'
  return `Tour ${rIdx + 1}`
}
function matchClass (match, rIdx) {
  return 'match'+(match.winner==='1'?' border-green-400':match.winner==='2'?' border-blue-400':'')
}
function rowClass (match, who) {
  if (!match.winner) return ''
  return match.winner===String(who)?'winner':'loser'
}
function colorClass (rIdx) { return COLORS[rIdx % COLORS.length] }
function disp (v) {return v===null||v===undefined?'-':v}

/* ====== FULLSCREEN ====== */
function toggleFullscreen () {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen()
  else document.exitFullscreen()
}
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap');
html, body {
  background: #fff;
  font-family: 'Montserrat', sans-serif;
  font-size: 20px;
  overflow-x: hidden;
}
.bracket-container {
  width: 100%;
  margin: 0 auto;
  padding-top: 2rem;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  min-height: 85vh;
  overflow-x: visible;
}
.round {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 300px;
  z-index: 10;
  margin-right: 1.5rem !important;
  margin-bottom: 0;
}
.round > .round-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a202c;
  text-align: center;
  margin-bottom: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.match {
  background: #f9fafb;
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.09), 0 2px 4px rgba(0,0,0,0.07);
  border: 3px solid #e5e7eb;
  min-width: 250px;
  max-width: 340px;
  transition: box-shadow 0.3s, border-color 0.3s;
  cursor: pointer;
  position: relative;
  font-size: 1.07rem;
  padding: 0.67rem 1.2rem 0.67rem 1.2rem;
  margin: 0 auto;
}
.match:hover {
  border-color: #0ea5e9;
  box-shadow: 0 4px 22px rgba(14,165,233,0.19);
}
.winner {
  background: linear-gradient(90deg,#4ade80 75%,#f9fafb 100%);
  border-left: 5px solid #16a34a !important;
  font-weight: 900;
  color: #292524;
  box-shadow: 0 4px 18px rgba(34,197,94,0.09), 0 2px 4px rgba(14,165,233,0.13);
  animation: pop 0.6s cubic-bezier(0.33, 1, 0.68, 1);
}
@keyframes pop {
  0% { transform: scale(1.05); }
  70% { transform: scale(1.03);}
  100% { transform: scale(1);}
}
.loser {
  opacity: 0.4;
  text-decoration: line-through;
  color: #64748b;
}
.tbd {
  color: #94a3b8;
  font-style: italic;
  font-size: 1.1rem;
  text-align: left;
}
.match .edit-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  color: #2563eb;
  font-size: 1.2rem;
  opacity: 0.75;
  transition: color 0.2s;
}
.match .edit-btn:hover { color: #2563eb; opacity: 1; }
.scores-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.score {
  min-width: 34px;
  padding: 0 0.2rem;
  font-size: 1.11rem;
  border-radius: 0.4rem;
  font-weight: 700;
  display: inline-block;
  text-align: center;
}
.fault {
  min-width: 32px;
  padding: 0 0.2rem;
  font-size: 1rem;
  border-radius: 0.4rem;
  font-weight: 700;
  display: inline-block;
  text-align: center;
  opacity: 0.85;
}
.score.green { background: #bbf7d0; color: #166534; }
.score.orange { background: #fed7aa; color: #c2410c; }
.score.blue { background: #bae6fd; color: #0369a1; }

.fault.green { background: #dcfce7; color: #166534; }
.fault.orange { background: #fff7ed; color: #c2410c; }
.fault.blue { background: #e0f2fe; color: #0369a1; }

.bracket-lines {
  position: absolute;
  top: 0; left: 0;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
  width: 100%; height: 100%;
}
.modal-bg {
  background: rgba(17,24,39,0.78);
  position: fixed;
  z-index: 50;
  left:0; top:0; width:100vw; height:100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
}
@keyframes fadeIn {
  0% { opacity: 0;}
  100% { opacity: 1;}
}
.modal-content {
  background: #fff;
  border-radius: 2rem;
  padding: 2.5rem 2.2rem;
  min-width: 340px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 16px 40px 0 rgba(16, 185, 129, 0.13);
  position: relative;
  font-size: 1.12rem !important;
  z-index: 1000;
}
.modal-content label {
  font-weight: 700;
  color: #166534;
  font-size: 1.07rem;
  margin-bottom: 0.44rem;
  display:inline-block;
}
.modal-content input[type=text], .modal-content input[type=number] {
  background: #f1f5f9;
  border: 1.4px solid #bae6fd;
  font-size: 1.02rem;
  border-radius: 0.45rem;
  padding: 0.35rem;
  width: 100%;
  transition: border-color 0.2s;
  margin-bottom: 0.65rem;
}
.modal-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.modal-winner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.18rem;
}
.modal-actions {
  margin-top: 1.1rem;
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
}
.modal-close-btn {
  position: absolute;
  top: 0.7rem;
  right: 1.1rem;
  font-size: 1.67rem;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.92;
  padding: 0;
}
.score-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-align: center;
  display: block;
  margin-bottom: 0.1rem;
}

.fullscreen-btn {
  position: fixed;
  top: 1rem;
  right: 1.5rem;
  z-index: 49;
  background: #2563eb;
  color: #fff;
  border-radius: 50%;
  width: 3.45rem;
  height: 3.45rem;
  border: none;
  box-shadow: 0 4px 14px 0 rgba(14,165,233,0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.42rem;
  cursor: pointer;
  opacity:0.84;
  transition: background 0.16s, opacity 0.18s;
}
.fullscreen-btn:hover { background: #1e40af; opacity: 1;}
@media (max-width: 1200px) {
  html { font-size: 16px;}
  .bracket-container { max-width: 99vw; }
}
@media (max-width: 800px) {
  html { font-size: 14px;}
  .bracket-container { flex-direction: column; flex-wrap: nowrap; }
  .round { min-width:88vw;}
  .modal-content { min-width:220px; max-width:97vw;}
  .fullscreen-btn { top:0.7rem; right:0.8rem; width:2em; height:2em; font-size:1em;}
}

@media print {
  .bracket-container {
    overflow-x: visible !important;
    flex-wrap: wrap !important;
  }
  body, html {
    overflow: visible !important;
    font-size: 12px !important;
  }
}
.score-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}
.score-item {
  display: flex;
  flex-direction: column;
}
</style>
