// backend/controllers/matchController.js
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Poule = require('../models/Poule');
const Competitor = require('../models/Competitor');
const SyncManager = require('../utils/syncManager');

// @desc    Récupérer tous les matchs
// @route   GET /api/matches
// @access  Public
exports.getMatches = async (request, reply) => {
  try {
    let matches;
    
    // Si une date est fournie, récupérer seulement les matchs modifiés après cette date
    if (request.query.updatedAfter) {
      const date = new Date(request.query.updatedAfter);
      
      matches = await Match.find({
        updatedAt: { $gt: date }
      });
    } else {
      // Sinon, récupérer tous les matchs
      matches = await Match.find();
    }
    
    return matches;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer tous les matchs d'un tournoi
// @route   GET /api/tournaments/:tournamentId/matches
// @access  Public
exports.getTournamentMatches = async (request, reply) => {
  try {
    const { tournamentId } = request.params;
    
    const matches = await Match.find({ tournament: tournamentId })
      .populate('competitor1', 'firstName lastName club')
      .populate('competitor2', 'firstName lastName club')
      .populate('winner', 'firstName lastName')
      .sort({ type: 1, round: 1, matchIndex: 1 });
    
    return matches;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer un match par ID
// @route   GET /api/matches/:id
// @access  Public
exports.getMatch = async (request, reply) => {
  try {
    const match = await Match.findById(request.params.id)
      .populate('competitor1', 'firstName lastName club country')
      .populate('competitor2', 'firstName lastName club country')
      .populate('winner', 'firstName lastName')
      .populate('tournament', 'name')
      .populate('category', 'name');
    
    if (!match) {
      return reply.code(404).send({ error: 'Not Found', message: `Match non trouvé avec l'ID: ${request.params.id}` });
    }
    
    return match;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Créer un nouveau match
// @route   POST /api/matches
// @access  Private
exports.createMatch = async (request, reply) => {
  try {
    const matchData = request.body;
    
    // Vérifier si le tournoi existe
    const tournament = await Tournament.findById(matchData.tournament);
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: 'Tournoi non trouvé' });
    }
    
    const match = new Match(matchData);
    await match.save();
    
    return reply.code(201).send(match);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Mettre à jour un match
// @route   PUT /api/matches/:id
// @access  Private
exports.updateMatch = async (request, reply) => {
  try {
    const { id } = request.params;
    const updates = request.body;
    
    const match = await Match.findById(id);
    
    if (!match) {
      return reply.code(404).send({ error: 'Not Found', message: `Match non trouvé avec l'ID: ${id}` });
    }
    
    // Si on met à jour le statut à "completed", on enregistre l'heure de fin
    if (updates.status === 'completed' && match.status !== 'completed') {
      updates.endTime = new Date();
      
      // Mise à jour du match suivant si nécessaire (pour les brackets)
      if (match.type === 'bracket' && match.nextMatch) {
        await updateNextMatch(match, updates);
      }
    }
    
    // Si on met à jour le statut à "ongoing", on enregistre l'heure de début
    if (updates.status === 'ongoing' && match.status !== 'ongoing') {
      updates.startTime = new Date();
    }
    
    // Mise à jour du match
    Object.assign(match, updates);
    await match.save();
    
    return match;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Supprimer un match
// @route   DELETE /api/matches/:id
// @access  Private
exports.deleteMatch = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const match = await Match.findByIdAndDelete(id);
    
    if (!match) {
      return reply.code(404).send({ error: 'Not Found', message: `Match non trouvé avec l'ID: ${id}` });
    }
    
    return { success: true, message: 'Match supprimé avec succès' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Générer les matchs pour une poule
// @route   POST /api/poules/:id/generate-matches
// @access  Private
exports.generatePouleMatches = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const poule = await Poule.findById(id).populate('competitors');
    
    if (!poule) {
      return reply.code(404).send({ error: 'Not Found', message: 'Poule non trouvée' });
    }
    
    if (poule.competitors.length < 2) {
      return reply.code(400).send({ error: 'Bad Request', message: 'La poule doit contenir au moins 2 compétiteurs' });
    }
    
    // Vérifier si des matchs existent déjà pour cette poule
    const existingMatches = await Match.countDocuments({ poule: id });
    if (existingMatches > 0) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Des matchs ont déjà été générés pour cette poule' });
    }
    
    const competitors = poule.competitors;
    const matches = [];
    
    // Générer les matchs: chaque compétiteur affronte tous les autres une fois
    for (let i = 0; i < competitors.length - 1; i++) {
      for (let j = i + 1; j < competitors.length; j++) {
        const matchData = {
          tournament: poule.tournament,
          category: poule.category,
          type: 'poule',
          poule: id,
          competitor1: competitors[i]._id,
          competitor2: competitors[j]._id,
          status: 'pending',
          matchIndex: matches.length
        };
        
        const match = new Match(matchData);
        await match.save();
        matches.push(match);
      }
    }
    
    // Mettre à jour le statut de la poule
    poule.status = 'active';
    await poule.save();
    
    return {
      success: true,
      message: `${matches.length} matchs générés avec succès`,
      matches
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Générer les matchs pour un bracket (tournoi à élimination directe)
// @route   POST /api/tournaments/:id/generate-bracket
// @access  Private
exports.generateBracketMatches = async (request, reply) => {
  try {
    const { id } = request.params;
    const { categoryId, competitorIds } = request.body;
    
    // Vérifier si le tournoi existe
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: 'Tournoi non trouvé' });
    }
    
    // Vérifier s'il y a suffisamment de compétiteurs
    if (!competitorIds || competitorIds.length < 2) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Au moins 2 compétiteurs sont nécessaires pour créer un bracket' });
    }
    
    // Vérifier si des matchs de bracket existent déjà pour cette catégorie dans ce tournoi
    const existingMatches = await Match.countDocuments({ 
      tournament: id, 
      category: categoryId,
      type: 'bracket'
    });
    
    if (existingMatches > 0) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Un bracket existe déjà pour cette catégorie' });
    }
    
    // Mélanger les compétiteurs pour un tirage aléatoire
    const shuffledCompetitors = [...competitorIds].sort(() => Math.random() - 0.5);
    
    // Calculer le nombre de rounds et le format du bracket
    const numCompetitors = shuffledCompetitors.length;
    const numRounds = Math.ceil(Math.log2(numCompetitors));
    const totalMatches = Math.pow(2, numRounds) - 1;
    const firstRoundMatches = Math.pow(2, numRounds - 1);
    
    // Calculer le nombre de byes requis
    const totalPositions = Math.pow(2, numRounds);
    const numByes = totalPositions - numCompetitors;
    
    // Créer la structure du bracket
    const matches = [];
    
    // Créer d'abord tous les matchs avec références croisées
    for (let round = 1; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);
      
      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
        const match = new Match({
          tournament: id,
          category: categoryId,
          type: 'bracket',
          round,
          matchIndex,
          status: 'pending'
        });
        
        await match.save();
        matches.push(match);
      }
    }
    
    // Établir les relations entre les matchs
    for (let round = 1; round < numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);
      const startIndex = totalMatches - Math.pow(2, numRounds - round + 1) + 1;
      
      for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
        const currentMatchIdx = startIndex + matchIndex;
        const nextMatchIdx = startIndex + Math.pow(2, numRounds - round) + Math.floor(matchIndex / 2);
        
        // Mettre à jour nextMatch
        matches[currentMatchIdx].nextMatch = matches[nextMatchIdx]._id;
        await matches[currentMatchIdx].save();
      }
    }
    
    // Distribuer les compétiteurs dans les matchs du premier tour
    // et tenir compte des byes éventuels
    let competitorIndex = 0;
    
    for (let matchIndex = 0; matchIndex < firstRoundMatches; matchIndex++) {
      const match = matches[matchIndex];
      
      // Assignation du premier compétiteur
      if (competitorIndex < shuffledCompetitors.length) {
        match.competitor1 = shuffledCompetitors[competitorIndex++];
      }
      
      // Assignation du deuxième compétiteur (ou bye)
      if (competitorIndex < shuffledCompetitors.length) {
        match.competitor2 = shuffledCompetitors[competitorIndex++];
      }
      
      // Si c'est un match avec un bye, marquer comme complété et propager le gagnant
      if (!match.competitor2 && match.competitor1) {
        match.winner = match.competitor1;
        match.status = 'completed';
        
        // Propager au match suivant
        if (match.nextMatch) {
          await propagateWinner(match);
        }
      }
      
      await match.save();
    }
    
    return {
      success: true,
      message: `Bracket généré avec succès avec ${totalMatches} matchs`,
      matches
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Mettre à jour les scores d'un match
// @route   PUT /api/matches/:id/score
// @access  Private
exports.updateScore = async (request, reply) => {
  try {
    const { id } = request.params;
    const { score1, score2, fouls1, fouls2, winner } = request.body;
    
    const match = await Match.findById(id);
    
    if (!match) {
      return reply.code(404).send({ error: 'Not Found', message: `Match non trouvé avec l'ID: ${id}` });
    }
    
    // Mise à jour des scores et fautes
    if (score1 !== undefined) match.score1 = score1;
    if (score2 !== undefined) match.score2 = score2;
    if (fouls1 !== undefined) match.fouls1 = fouls1;
    if (fouls2 !== undefined) match.fouls2 = fouls2;
    
    // Mise à jour du gagnant si spécifié
    if (winner === '1') {
      match.winner = match.competitor1;
    } else if (winner === '2') {
      match.winner = match.competitor2;
    } else if (winner === null || winner === '') {
      match.winner = null;
    }
    
    // Si un gagnant est défini, marquer le match comme terminé
    if (match.winner) {
      match.status = 'completed';
      match.endTime = new Date();
      
      // Si c'est un match de bracket, propager le gagnant au match suivant
      if (match.type === 'bracket' && match.nextMatch) {
        await propagateWinner(match);
      }
      
      // Si c'est un match de poule, vérifier si tous les matchs sont terminés
      if (match.type === 'poule' && match.poule) {
        await checkPouleCompletion(match.poule);
      }
    }
    
    await match.save();
    
    return match;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Synchroniser les matchs entre DexieJS et MongoDB
// @route   POST /api/matches/sync
// @access  Private
exports.syncMatches = async (request, reply) => {
  try {
    // Récupérer les données à synchroniser depuis la requête
    const { data, lastSyncDate } = request.body;
    
    // Synchroniser les données reçues
    let syncResult = {};
    if (data && data.length > 0) {
      syncResult = await SyncManager.syncData(data, 'matches', Match);
    }
    
    // Récupérer les matchs mis à jour après la dernière synchronisation
    const updatedMatches = await SyncManager.getUpdatedItems(Match, lastSyncDate);
    
    return {
      result: syncResult,
      updatedItems: updatedMatches
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer les matchs à venir ou en cours
// @route   GET /api/matches/active
// @access  Public
exports.getActiveMatches = async (request, reply) => {
  try {
    const matches = await Match.find({
      status: { $in: ['pending', 'ongoing'] }
    })
    .populate('competitor1', 'firstName lastName club')
    .populate('competitor2', 'firstName lastName club')
    .populate('tournament', 'name')
    .populate('category', 'name')
    .sort({ scheduledTime: 1, status: -1 });
    
    return matches;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer les matchs d'un tatami spécifique
// @route   GET /api/matches/tatami/:tatamiNumber
// @access  Public
exports.getTatamiMatches = async (request, reply) => {
  try {
    const { tatamiNumber } = request.params;
    
    const matches = await Match.find({
      tatami: parseInt(tatamiNumber),
      status: { $in: ['pending', 'ongoing'] }
    })
    .populate('competitor1', 'firstName lastName club')
    .populate('competitor2', 'firstName lastName club')
    .sort({ scheduledTime: 1, status: -1 });
    
    return matches;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

/* ===== Fonctions utilitaires ===== */

// Fonction pour propager un gagnant au match suivant dans un bracket
async function propagateWinner(match) {
  try {
    if (!match.nextMatch || !match.winner) return;
    
    const nextMatch = await Match.findById(match.nextMatch);
    if (!nextMatch) return;
    
    // Déterminer si le gagnant va à la position 1 ou 2 du match suivant
    // En fonction de l'index du match actuel (pair ou impair)
    if (match.matchIndex % 2 === 0) {
      nextMatch.competitor1 = match.winner;
    } else {
      nextMatch.competitor2 = match.winner;
    }
    
    await nextMatch.save();
    
    // Si les deux compétiteurs du match suivant sont déterminés mais qu'un seul est présent
    // (l'autre est un bye), alors on propage directement le gagnant
    if (nextMatch.competitor1 && !nextMatch.competitor2) {
      nextMatch.winner = nextMatch.competitor1;
      nextMatch.status = 'completed';
      await nextMatch.save();
      
      // Propager récursivement
      await propagateWinner(nextMatch);
    } else if (!nextMatch.competitor1 && nextMatch.competitor2) {
      nextMatch.winner = nextMatch.competitor2;
      nextMatch.status = 'completed';
      await nextMatch.save();
      
      // Propager récursivement
      await propagateWinner(nextMatch);
    }
  } catch (error) {
    console.error('Erreur lors de la propagation du gagnant:', error);
  }
}

// Fonction pour mettre à jour le match suivant
async function updateNextMatch(match, updates) {
  try {
    if (!match.nextMatch || !updates.winner) return;
    
    const nextMatchId = match.nextMatch;
    const nextMatch = await Match.findById(nextMatchId);
    
    if (!nextMatch) return;
    
    // Mettre à jour le prochain match avec le compétiteur gagnant
    if (match.matchIndex % 2 === 0) {
      nextMatch.competitor1 = updates.winner;
    } else {
      nextMatch.competitor2 = updates.winner;
    }
    
    await nextMatch.save();
  } catch (error) {
    console.error('Erreur lors de la mise à jour du match suivant:', error);
  }
}

// Fonction pour vérifier si tous les matchs d'une poule sont terminés
async function checkPouleCompletion(pouleId) {
  try {
    const matches = await Match.find({ poule: pouleId });
    const allCompleted = matches.every(m => m.status === 'completed');
    
    if (allCompleted) {
      const poule = await Poule.findById(pouleId);
      poule.status = 'completed';
      await poule.save();
      
      // Ici, on pourrait ajouter une logique pour déterminer les gagnants de la poule
      // en fonction des résultats des matchs
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la complétion de la poule:', error);
  }
}