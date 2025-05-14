// backend/controllers/competitorController.js
const Competitor = require('../models/Competitor');
const Tournament = require('../models/Tournament');
const Category = require('../models/Category');
const SyncManager = require('../utils/syncManager');

// @desc    Récupérer tous les compétiteurs
// @route   GET /api/competitors
// @access  Public
exports.getCompetitors = async (request, reply) => {
  try {
    let query = {};
    
    // Filtrer par tournoi si spécifié
    if (request.query.tournamentId) {
      query.tournamentId = request.query.tournamentId;
    }
    
    // Filtrer par userId si spécifié
    if (request.query.userId) {
      query.userId = request.query.userId;
    }
    
    // Si une date est fournie, récupérer seulement les compétiteurs modifiés après cette date
    if (request.query.updatedAfter) {
      const date = new Date(request.query.updatedAfter);
      query.updatedAt = { $gt: date };
    }
    
    // Récupérer les compétiteurs selon les filtres
    const competitors = await Competitor.find(query);
    
    return competitors;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer un compétiteur par ID
// @route   GET /api/competitors/:id
// @access  Public
exports.getCompetitor = async (request, reply) => {
  try {
    const competitor = await Competitor.findById(request.params.id);
    
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${request.params.id}` });
    }
    
    return competitor;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Créer un nouveau compétiteur
// @route   POST /api/competitors
// @access  Private
exports.createCompetitor = async (request, reply) => {
  try {
    const competitor = new Competitor(request.body);
    await competitor.save();
    
    return reply.code(201).send(competitor);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Mettre à jour un compétiteur
// @route   PUT /api/competitors/:id
// @access  Private
exports.updateCompetitor = async (request, reply) => {
  try {
    const { id } = request.params;
    const updates = request.body;
    
    const competitor = await Competitor.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }
    
    return competitor;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Supprimer un compétiteur
// @route   DELETE /api/competitors/:id
// @access  Private
exports.deleteCompetitor = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const competitor = await Competitor.findByIdAndDelete(id);
    
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }
    
    return { success: true, message: 'Compétiteur supprimé avec succès' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Synchroniser les compétiteurs entre DexieJS et MongoDB
// @route   POST /api/competitors/sync
// @access  Private
exports.syncCompetitors = async (request, reply) => {
  try {
    // Récupérer les données à synchroniser depuis la requête
    const { data, lastSyncDate } = request.body;
    
    // Synchroniser les données reçues
    let syncResult = {};
    if (data && data.length > 0) {
      syncResult = await SyncManager.syncData(data, 'competitors', Competitor);
    }
    
    // Récupérer les compétiteurs mis à jour après la dernière synchronisation
    const updatedCompetitors = await SyncManager.getUpdatedItems(Competitor, lastSyncDate);
    
    return {
      result: syncResult,
      updatedItems: updatedCompetitors
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Ajouter un compétiteur à un tournoi
// @route   POST /api/competitors/:id/tournaments/:tournamentId
// @access  Private
exports.addCompetitorToTournament = async (request, reply) => {
  try {
    const { id, tournamentId } = request.params;
    const { categoryId } = request.body;

    // Vérifier si le compétiteur existe
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }

    // Vérifier si le tournoi existe
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${tournamentId}` });
    }

    // Vérifier si la catégorie existe
    const category = await Category.findById(categoryId);
    if (!categoryId || !category) {
      return reply.code(400).send({ error: 'Bad Request', message: 'ID de catégorie requis et valide' });
    }

    // Vérifier si le compétiteur est déjà inscrit à ce tournoi dans cette catégorie
    const alreadyRegistered = competitor.tournaments.find(
      t => t.tournament.toString() === tournamentId && t.category.toString() === categoryId
    );

    if (alreadyRegistered) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Le compétiteur est déjà inscrit à ce tournoi dans cette catégorie' 
      });
    }

    // Ajouter le tournoi au compétiteur
    competitor.tournaments.push({
      tournament: tournamentId,
      category: categoryId,
      results: {
        points: 0,
        faults: 0,
        matches: [],
        status: 'registered'
      }
    });

    // Ajouter la catégorie au compétiteur si elle n'y est pas déjà
    if (!competitor.categories.includes(categoryId)) {
      competitor.categories.push(categoryId);
    }

    await competitor.save();

    return reply.code(200).send({ success: true, competitor });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Supprimer un compétiteur d'un tournoi
// @route   DELETE /api/competitors/:id/tournaments/:tournamentId
// @access  Private
exports.removeCompetitorFromTournament = async (request, reply) => {
  try {
    const { id, tournamentId } = request.params;
    const { categoryId } = request.body;

    // Vérifier si le compétiteur existe
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }

    // Filtrer les tournois pour retirer celui spécifié
    const initialLength = competitor.tournaments.length;
    competitor.tournaments = competitor.tournaments.filter(
      t => !(t.tournament.toString() === tournamentId && t.category.toString() === categoryId)
    );

    // Si aucun tournoi n'a été retiré
    if (initialLength === competitor.tournaments.length) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'Le compétiteur n\'est pas inscrit à ce tournoi dans cette catégorie' 
      });
    }

    await competitor.save();

    return reply.code(200).send({ success: true, message: 'Compétiteur retiré du tournoi avec succès' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Mettre à jour les résultats d'un compétiteur dans un tournoi
// @route   PUT /api/competitors/:id/tournaments/:tournamentId/results
// @access  Private
exports.updateCompetitorResults = async (request, reply) => {
  try {
    const { id, tournamentId } = request.params;
    const { categoryId, points, faults, rank, status, matches } = request.body;

    // Vérifier si le compétiteur existe
    const competitor = await Competitor.findById(id);
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }

    // Trouver l'entrée du tournoi pour ce compétiteur
    const tournamentIndex = competitor.tournaments.findIndex(
      t => t.tournament.toString() === tournamentId && t.category.toString() === categoryId
    );

    if (tournamentIndex === -1) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'Le compétiteur n\'est pas inscrit à ce tournoi dans cette catégorie' 
      });
    }

    // Mettre à jour les résultats
    const tournamentEntry = competitor.tournaments[tournamentIndex];
    
    if (points !== undefined) tournamentEntry.results.points = points;
    if (faults !== undefined) tournamentEntry.results.faults = faults;
    if (rank !== undefined) tournamentEntry.results.rank = rank;
    if (status !== undefined) tournamentEntry.results.status = status;
    
    // Mettre à jour les matches si fournis
    if (matches && Array.isArray(matches)) {
      tournamentEntry.results.matches = matches;
    }

    competitor.tournaments[tournamentIndex] = tournamentEntry;
    await competitor.save();

    return reply.code(200).send({ success: true, competitor });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Obtenir tous les compétiteurs d'un tournoi par catégorie
// @route   GET /api/competitors/tournaments/:tournamentId/categories/:categoryId
// @access  Public
exports.getCompetitorsByTournamentAndCategory = async (request, reply) => {
  try {
    const { tournamentId, categoryId } = request.params;

    // Rechercher les compétiteurs inscrits à ce tournoi dans cette catégorie
    const competitors = await Competitor.find({
      "tournaments": {
        $elemMatch: {
          "tournament": tournamentId,
          "category": categoryId
        }
      }
    });

    return competitors;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Obtenir le classement des compétiteurs dans un tournoi par catégorie
// @route   GET /api/competitors/tournaments/:tournamentId/categories/:categoryId/ranking
// @access  Public
exports.getTournamentRanking = async (request, reply) => {
  try {
    const { tournamentId, categoryId } = request.params;

    // Rechercher les compétiteurs inscrits à ce tournoi dans cette catégorie
    const competitors = await Competitor.find({
      "tournaments": {
        $elemMatch: {
          "tournament": tournamentId,
          "category": categoryId
        }
      }
    }).select('firstname lastname tournaments');

    // Filtrer et préparer les données de classement
    const ranking = competitors
      .map(competitor => {
        const tournamentEntry = competitor.tournaments.find(
          t => t.tournament.toString() === tournamentId && t.category.toString() === categoryId
        );
        
        if (!tournamentEntry) return null;
        
        return {
          id: competitor._id,
          name: `${competitor.firstname} ${competitor.lastname}`,
          points: tournamentEntry.results.points || 0,
          faults: tournamentEntry.results.faults || 0,
          rank: tournamentEntry.results.rank,
          status: tournamentEntry.results.status
        };
      })
      .filter(entry => entry !== null)
      .sort((a, b) => {
        // D'abord par rang (si disponible)
        if (a.rank && b.rank) return a.rank - b.rank;
        // Puis par points
        if (a.points !== b.points) return b.points - a.points;
        // Puis par fautes (moins de fautes est mieux)
        return a.faults - b.faults;
      });

    return ranking;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Ajouter des résultats pour un compétiteur dans un tournoi
// @route   POST /api/competitors/:id/results/:tournamentId
// @access  Private
exports.addCompetitorResults = async (request, reply) => {
  try {
    const { id, tournamentId } = request.params;
    const { points, faults, rank, matchResults, categoryId } = request.body;
    
    const competitor = await Competitor.findById(id);
    
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }
    
    // Vérifier si le tournoi existe
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${tournamentId}` });
    }
    
    // Rechercher si le compétiteur est déjà inscrit à ce tournoi
    const tournamentIndex = competitor.tournaments.findIndex(
      t => t.tournament.toString() === tournamentId && t.category.toString() === categoryId
    );
    
    if (tournamentIndex === -1) {
      // Si le compétiteur n'est pas inscrit, on l'ajoute avec ses résultats
      competitor.tournaments.push({
        tournament: tournamentId,
        category: categoryId,
        results: {
          points: points || 0,
          faults: faults || 0,
          rank: rank || null,
          matches: matchResults || [],
          status: 'active'
        }
      });
    } else {
      // Mettre à jour les résultats existants
      competitor.tournaments[tournamentIndex].results.points = points || competitor.tournaments[tournamentIndex].results.points;
      competitor.tournaments[tournamentIndex].results.faults = faults || competitor.tournaments[tournamentIndex].results.faults;
      competitor.tournaments[tournamentIndex].results.rank = rank !== undefined ? rank : competitor.tournaments[tournamentIndex].results.rank;
      
      // Mettre à jour ou ajouter des résultats de match
      if (matchResults && matchResults.length > 0) {
        // Si des matches existent déjà, on les met à jour ou ajoute de nouveaux
        matchResults.forEach(matchResult => {
          const existingMatchIndex = competitor.tournaments[tournamentIndex].results.matches.findIndex(
            m => m.opponent.toString() === matchResult.opponent
          );
          
          if (existingMatchIndex !== -1) {
            competitor.tournaments[tournamentIndex].results.matches[existingMatchIndex] = {
              ...competitor.tournaments[tournamentIndex].results.matches[existingMatchIndex],
              ...matchResult
            };
          } else {
            competitor.tournaments[tournamentIndex].results.matches.push(matchResult);
          }
        });
      }
      
      // Mettre à jour le statut
      if (request.body.status) {
        competitor.tournaments[tournamentIndex].results.status = request.body.status;
      }
    }
    
    competitor.updatedAt = Date.now();
    await competitor.save();
    
    return competitor;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Obtenir tous les résultats d'un compétiteur
// @route   GET /api/competitors/:id/results
// @access  Public
exports.getCompetitorResults = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const competitor = await Competitor.findById(id)
      .populate('tournaments.tournament', 'name date')
      .populate('tournaments.category', 'name ageRange weightRange')
      .populate('tournaments.results.matches.opponent', 'firstname lastname');
    
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }
    
    return competitor.tournaments;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Obtenir les résultats d'un compétiteur pour un tournoi spécifique
// @route   GET /api/competitors/:id/results/:tournamentId
// @access  Public
exports.getCompetitorTournamentResults = async (request, reply) => {
  try {
    const { id, tournamentId } = request.params;
    
    const competitor = await Competitor.findById(id)
      .populate('tournaments.tournament', 'name date')
      .populate('tournaments.category', 'name ageRange weightRange')
      .populate('tournaments.results.matches.opponent', 'firstname lastname');
    
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }
    
    const tournamentResults = competitor.tournaments.find(
      t => t.tournament._id.toString() === tournamentId
    );
    
    if (!tournamentResults) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Résultats non trouvés pour le compétiteur ID: ${id} dans le tournoi ID: ${tournamentId}` 
      });
    }
    
    return tournamentResults;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Mettre à jour le statut d'un compétiteur dans un tournoi
// @route   PATCH /api/competitors/:id/status/:tournamentId
// @access  Private
exports.updateCompetitorTournamentStatus = async (request, reply) => {
  try {
    const { id, tournamentId } = request.params;
    const { status, categoryId } = request.body;
    
    const competitor = await Competitor.findById(id);
    
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }
    
    const tournamentIndex = competitor.tournaments.findIndex(
      t => t.tournament.toString() === tournamentId && t.category.toString() === categoryId
    );
    
    if (tournamentIndex === -1) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Le compétiteur ID: ${id} n'est pas inscrit au tournoi ID: ${tournamentId} dans cette catégorie` 
      });
    }
    
    competitor.tournaments[tournamentIndex].results.status = status;
    competitor.updatedAt = Date.now();
    await competitor.save();
    
    return competitor;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Enregistrer le résultat d'un match entre deux compétiteurs
// @route   POST /api/competitors/:id/match/:opponentId
// @access  Private
exports.recordMatchResult = async (request, reply) => {
  try {
    const { id, opponentId } = request.params;
    const { tournamentId, categoryId, result, points, faults } = request.body;
    
    // Vérifier que les deux compétiteurs existent
    const [competitor, opponent] = await Promise.all([
      Competitor.findById(id),
      Competitor.findById(opponentId)
    ]);
    
    if (!competitor) {
      return reply.code(404).send({ error: 'Not Found', message: `Compétiteur non trouvé avec l'ID: ${id}` });
    }
    
    if (!opponent) {
      return reply.code(404).send({ error: 'Not Found', message: `Adversaire non trouvé avec l'ID: ${opponentId}` });
    }
    
    // Mettre à jour le résultat pour le premier compétiteur
    const tournamentIndex1 = competitor.tournaments.findIndex(
      t => t.tournament.toString() === tournamentId && t.category.toString() === categoryId
    );
    
    if (tournamentIndex1 === -1) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Le compétiteur ID: ${id} n'est pas inscrit au tournoi ID: ${tournamentId} dans cette catégorie` 
      });
    }
    
    // Vérifier si un match contre cet adversaire existe déjà
    const matchIndex1 = competitor.tournaments[tournamentIndex1].results.matches.findIndex(
      m => m.opponent.toString() === opponentId
    );
    
    if (matchIndex1 !== -1) {
      // Mettre à jour le match existant
      competitor.tournaments[tournamentIndex1].results.matches[matchIndex1].result = result;
      competitor.tournaments[tournamentIndex1].results.matches[matchIndex1].points = points || 0;
      competitor.tournaments[tournamentIndex1].results.matches[matchIndex1].faults = faults || 0;
    } else {
      // Ajouter un nouveau match
      competitor.tournaments[tournamentIndex1].results.matches.push({
        opponent: opponentId,
        result: result,
        points: points || 0,
        faults: faults || 0
      });
    }
    
    // Mettre à jour les points totaux du compétiteur
    let totalPoints = 0;
    let totalFaults = 0;
    
    competitor.tournaments[tournamentIndex1].results.matches.forEach(match => {
      totalPoints += match.points || 0;
      totalFaults += match.faults || 0;
    });
    
    competitor.tournaments[tournamentIndex1].results.points = totalPoints;
    competitor.tournaments[tournamentIndex1].results.faults = totalFaults;
    
    // Faire de même pour l'adversaire avec le résultat inversé
    const tournamentIndex2 = opponent.tournaments.findIndex(
      t => t.tournament.toString() === tournamentId && t.category.toString() === categoryId
    );
    
    if (tournamentIndex2 !== -1) {
      const matchIndex2 = opponent.tournaments[tournamentIndex2].results.matches.findIndex(
        m => m.opponent.toString() === id
      );
      
      // Déterminer le résultat inverse
      let inverseResult;
      if (result === 'win') inverseResult = 'loss';
      else if (result === 'loss') inverseResult = 'win';
      else inverseResult = result; // draw ou autres restent les mêmes
      
      if (matchIndex2 !== -1) {
        // Mettre à jour le match existant
        opponent.tournaments[tournamentIndex2].results.matches[matchIndex2].result = inverseResult;
        // Pour les points et fautes, ils doivent être déterminés séparément
        if (request.body.opponentPoints !== undefined) {
          opponent.tournaments[tournamentIndex2].results.matches[matchIndex2].points = request.body.opponentPoints;
        }
        if (request.body.opponentFaults !== undefined) {
          opponent.tournaments[tournamentIndex2].results.matches[matchIndex2].faults = request.body.opponentFaults;
        }
      } else {
        // Ajouter un nouveau match
        opponent.tournaments[tournamentIndex2].results.matches.push({
          opponent: id,
          result: inverseResult,
          points: request.body.opponentPoints || 0,
          faults: request.body.opponentFaults || 0
        });
      }
      
      // Mettre à jour les points totaux de l'adversaire
      let oppTotalPoints = 0;
      let oppTotalFaults = 0;
      
      opponent.tournaments[tournamentIndex2].results.matches.forEach(match => {
        oppTotalPoints += match.points || 0;
        oppTotalFaults += match.faults || 0;
      });
      
      opponent.tournaments[tournamentIndex2].results.points = oppTotalPoints;
      opponent.tournaments[tournamentIndex2].results.faults = oppTotalFaults;
    }
    
    // Sauvegarder les modifications pour les deux compétiteurs
    competitor.updatedAt = Date.now();
    opponent.updatedAt = Date.now();
    
    await Promise.all([
      competitor.save(),
      opponent.save()
    ]);
    
    return { success: true, message: 'Résultat du match enregistré avec succès' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer les données du compétiteur d'un utilisateur avec ses tournois
// @route   GET /api/competitors/user/:userId
// @access  Public
exports.getUserCompetitorData = async (request, reply) => {
  try {
    const { userId } = request.params;
    
    // Trouver le compétiteur associé à cet utilisateur
    const competitor = await Competitor.findOne({ userId })
      .populate({
        path: 'tournaments.tournament',
        select: 'name date location startDate description imageUrl'
      })
      .populate({
        path: 'tournaments.category',
        select: 'name ageRange weightRange'
      });
    
    if (!competitor) {
      // L'utilisateur n'est pas encore un compétiteur
      return [];
    }
    
    // Transformer les données pour qu'elles soient plus faciles à utiliser par le frontend
    const tournamentEntries = competitor.tournaments.map(entry => {
      return {
        _id: entry.tournament._id,
        tournament: entry.tournament,
        tournamentId: entry.tournament._id,
        category: entry.category,
        categoryName: entry.category?.name || '',
        results: entry.results,
        status: entry.results.status
      };
    });
    
    return tournamentEntries;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};