// backend/controllers/tournamentController.js
const Tournament = require('../models/Tournament');
const SyncManager = require('../utils/syncManager');
const mongoose = require('mongoose');

// @desc    Récupérer tous les tournois
// @route   GET /api/tournaments
// @access  Public
exports.getTournaments = async (request, reply) => {
  try {
    let tournaments;
    
    // Si une date est fournie, récupérer seulement les tournois modifiés après cette date
    if (request.query.updatedAfter) {
      const date = new Date(request.query.updatedAfter);
      
      tournaments = await Tournament.find({
        updatedAt: { $gt: date }
      });
    } else {
      // Sinon, récupérer tous les tournois
      tournaments = await Tournament.find();
    }
    
    return tournaments;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer les tournois publics
// @route   GET /api/tournaments/public
// @access  Public
exports.getPublicTournaments = async (request, reply) => {
  try {
    // Récupérer les tournois marqués comme publics ou qui sont à venir
    const currentDate = new Date();
    
    const tournaments = await Tournament.find({
      $or: [
        { isPublic: true },
        { startDate: { $gte: currentDate } }
      ]
    })
    .populate({
      path: 'categories',
      select: 'name'
    })
    // Ne pas exclure les compétiteurs, mais les transformer pour ne renvoyer que leur nombre
    .sort({ startDate: 1 }); // Trier par date croissante
    
    // Transformer les données pour n'inclure que le nombre de compétiteurs, pas leurs détails
    const formattedTournaments = tournaments.map(tournament => {
      const tournamentObj = tournament.toObject();
      
      // Si competitors existe, conserve seulement la longueur du tableau
      if (tournamentObj.competitors) {
        tournamentObj.competitorsCount = tournamentObj.competitors.length;
      } else {
        tournamentObj.competitorsCount = 0;
      }
      
      // Supprime les détails des compétiteurs pour des raisons de sécurité et de performance
      delete tournamentObj.competitors;
      
      return tournamentObj;
    });
    
    return formattedTournaments;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer un tournoi par ID
// @route   GET /api/tournaments/:id
// @access  Public
exports.getTournament = async (request, reply) => {
  try {
    const tournament = await Tournament.findById(request.params.id)
      .populate('competitors')
      .populate('categories');
    
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${request.params.id}` });
    }
    
    // Vérifier si l'utilisateur est connecté et a le rôle admin
    const isAdmin = request.user && request.user.role === 'admin';
    
    // Ajouter l'information sur le statut administrateur dans la réponse
    const response = {
      ...tournament.toObject(),
      isAdmin: isAdmin
    };
    
    return response;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Créer un nouveau tournoi
// @route   POST /api/tournaments
// @access  Private
exports.createTournament = async (request, reply) => {
  try {
    console.log('Création de tournoi - données reçues:', JSON.stringify(request.body, null, 2));

    // Valider les données requises
    const { name, date, matchType, categories } = request.body;
    if (!name || !date) {
      return reply.code(400).send({ 
        message: 'Les champs nom et date sont obligatoires',
        missingFields: { 
          name: !name,
          date: !date
        }
      });
    }

    // Valider le type de match
    const validMatchTypes = ['individual', 'team', 'mixed', 'Élimination directe', 'Poules', 'Mixte'];
    if (matchType && !validMatchTypes.includes(matchType)) {
      return reply.code(400).send({ 
        message: 'Type de match invalide',
        validTypes: validMatchTypes,
        receivedType: matchType
      });
    }
    
    // Validation du format de date
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return reply.code(400).send({ 
          message: 'Format de date invalide',
          receivedDate: date
        });
      }
    } catch (dateError) {
      return reply.code(400).send({ 
        message: 'Erreur lors du traitement de la date',
        error: dateError.message,
        receivedDate: date
      });
    }
    
    // Préparer le tournoi pour la création
    const tournamentData = { ...request.body };
    
    // Validation des catégories et conversion en ObjectId si nécessaire
    if (categories) {
      console.log('Catégories fournies:', categories);
      
      if (!Array.isArray(categories)) {
        return reply.code(400).send({
          message: 'Le champ categories doit être un tableau',
          received: typeof categories
        });
      }
      
      // S'assurer que les catégories sont des ObjectId MongoDB valides
      const processedCategories = [];
      for (const category of categories) {
        if (typeof category === 'object' && category._id) {
          // Si c'est déjà un objet avec _id, prendre l'ID
          if (!mongoose.Types.ObjectId.isValid(category._id)) {
            return reply.code(400).send({
              message: 'ID de catégorie invalide',
              invalidId: category._id
            });
          }
          processedCategories.push(category._id);
        } else if (typeof category === 'string') {
          // Si c'est une chaîne, vérifier que c'est un ObjectId valide
          if (!mongoose.Types.ObjectId.isValid(category)) {
            return reply.code(400).send({
              message: 'ID de catégorie invalide (string)',
              invalidId: category
            });
          }
          processedCategories.push(category);
        } else {
          return reply.code(400).send({
            message: 'Format de catégorie invalide',
            invalidCategory: category
          });
        }
      }
      
      // Remplacer les catégories par le tableau traité
      tournamentData.categories = processedCategories;
      console.log('Catégories traitées:', tournamentData.categories);
    }

    // Création du tournoi
    const tournament = new Tournament(tournamentData);
    const savedTournament = await tournament.save();
    
    console.log('Tournoi créé avec succès, ID:', savedTournament._id);
    console.log('Catégories associées:', savedTournament.categories);
    
    reply.code(201).send(savedTournament);
  } catch (error) {
    console.error('Erreur lors de la création du tournoi:', error);
    
    // Si c'est une erreur de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return reply.code(400).send({
        message: 'Erreur de validation',
        errors: validationErrors
      });
    }
    
    // Si c'est une erreur de duplicate key (par exemple si le nom doit être unique)
    if (error.code === 11000) {
      return reply.code(400).send({
        message: 'Un tournoi avec ce nom existe déjà',
        duplicateKey: Object.keys(error.keyPattern)[0]
      });
    }
    
    reply.code(500).send({ 
      message: 'Erreur lors de la création du tournoi',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Mettre à jour un tournoi
// @route   PUT /api/tournaments/:id
// @access  Private
exports.updateTournament = async (request, reply) => {
  try {
    const { id } = request.params;
    const updates = request.body;
    
    const tournament = await Tournament.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${id}` });
    }
    
    return tournament;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Supprimer un tournoi
// @route   DELETE /api/tournaments/:id
// @access  Private
exports.deleteTournament = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const tournament = await Tournament.findByIdAndDelete(id);
    
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${id}` });
    }
    
    return { success: true, message: 'Tournoi supprimé avec succès' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Ajouter des compétiteurs à un tournoi
// @route   POST /api/tournaments/:id/competitors
// @access  Private
exports.addCompetitors = async (request, reply) => {
  try {
    const { id } = request.params;
    const { competitors } = request.body;
    
    const tournament = await Tournament.findById(id);
    
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${id}` });
    }
    
    // Ajouter uniquement les compétiteurs qui ne sont pas déjà dans le tournoi
    const existingIds = tournament.competitors.map(comp => comp.toString());
    const newCompetitors = competitors.filter(compId => !existingIds.includes(compId));
    
    tournament.competitors = [...tournament.competitors, ...newCompetitors];
    tournament.updatedAt = Date.now();
    
    await tournament.save();
    
    return tournament;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Synchroniser les tournois entre DexieJS et MongoDB
// @route   POST /api/tournaments/sync
// @access  Private
exports.syncTournaments = async (request, reply) => {
  try {
    // Récupérer les données à synchroniser depuis la requête
    const { data, lastSyncDate } = request.body;
    
    // Synchroniser les données reçues
    let syncResult = {};
    if (data && data.length > 0) {
      syncResult = await SyncManager.syncData(data, 'tournaments', Tournament);
    }
    
    // Récupérer les tournois mis à jour après la dernière synchronisation
    const updatedTournaments = await SyncManager.getUpdatedItems(Tournament, lastSyncDate);
    
    return {
      result: syncResult,
      updatedItems: updatedTournaments
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Inscrire un utilisateur à un tournoi
// @route   POST /api/tournaments/:id/register
// @access  Private (utilisateur connecté)
exports.registerForTournament = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id; // ID de l'utilisateur connecté (extrait du token JWT)
    
    const tournament = await Tournament.findById(id);
    
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${id}` });
    }
    
    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = tournament.participants.find(
      p => p.user && p.user.toString() === userId
    );
    
    if (existingRegistration) {
      // Si l'utilisateur était précédemment annulé, on change son statut en pending
      if (existingRegistration.status === 'cancelled') {
        existingRegistration.status = 'pending';
        existingRegistration.registeredAt = Date.now();
        await tournament.save();
        return reply.code(200).send({ 
          message: 'Votre inscription a été réactivée',
          registration: existingRegistration 
        });
      }
      
      return reply.code(400).send({ error: 'Bad Request', message: 'Vous êtes déjà inscrit à ce tournoi' });
    }
    
    // Ajouter l'inscription
    tournament.participants.push({
      user: userId,
      registeredAt: Date.now(),
      status: 'pending'
    });
    
    await tournament.save();
    
    return reply.code(201).send({ 
      message: 'Inscription réussie',
      tournament: tournament.name
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Annuler l'inscription d'un utilisateur à un tournoi
// @route   DELETE /api/tournaments/:id/register
// @access  Private (utilisateur connecté)
exports.cancelRegistration = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;
    
    const tournament = await Tournament.findById(id);
    
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${id}` });
    }
    
    // Trouver l'inscription de l'utilisateur
    const participantIndex = tournament.participants.findIndex(
      p => p.user && p.user.toString() === userId
    );
    
    if (participantIndex === -1) {
      return reply.code(400).send({ error: 'Bad Request', message: "Vous n'êtes pas inscrit à ce tournoi" });
    }
    
    // Marquer l'inscription comme annulée
    tournament.participants[participantIndex].status = 'cancelled';
    await tournament.save();
    
    return reply.send({ 
      message: 'Inscription annulée avec succès',
      tournament: tournament.name
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer les participants inscrits à un tournoi
// @route   GET /api/tournaments/:id/participants
// @access  Private (Admin)
exports.getTournamentParticipants = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const tournament = await Tournament.findById(id)
      .populate({
        path: 'participants.user',
        select: 'firstName lastName email role fighterNumber'
      });
    
    if (!tournament) {
      return reply.code(404).send({ error: 'Not Found', message: `Tournoi non trouvé avec l'ID: ${id}` });
    }
    
    // Transformer les données pour faciliter leur utilisation par le frontend
    const participants = tournament.participants.map(p => {
      return {
        _id: p._id,
        userId: p.user?._id || null,
        firstName: p.user?.firstName || 'N/A',
        lastName: p.user?.lastName || 'N/A',
        email: p.user?.email || 'N/A',
        fighterNumber: p.user?.fighterNumber || 'N/A',
        status: p.status || 'pending',
        registeredAt: p.registeredAt || null
      };
    });
    
    return participants;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Convertir des utilisateurs en compétiteurs et les ajouter au tournoi
// @route   POST /api/tournaments/:id/convert-users
// @access  Private (Admin uniquement)
exports.convertUsersToCompetitors = async (request, reply) => {
  try {
    const { id } = request.params;
    const { userIds, defaultValues, categoryId } = request.body;
    
    // Vérifier que les données nécessaires sont présentes
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'La liste des IDs utilisateurs est requise et doit être un tableau non vide' 
      });
    }
    
    // Récupérer le tournoi
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Tournoi non trouvé avec l'ID: ${id}` 
      });
    }
    
    // Récupérer les modèles nécessaires
    const User = require('../models/User');
    const Competitor = require('../models/Competitor');
    
    // Récupérer les utilisateurs à convertir
    const users = await User.find({ _id: { $in: userIds } });
    if (!users.length) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'Aucun utilisateur trouvé avec les IDs fournis' 
      });
    }
    
    // Valeurs par défaut pour les nouveaux compétiteurs
    const defaultCompetitorValues = {
      nationality: defaultValues?.nationality || 'France',
      gender: defaultValues?.gender || 'Male',
      clubName: defaultValues?.clubName || '',
      age: defaultValues?.age || null
    };
    
    // Pour suivre les compétiteurs créés et les erreurs éventuelles
    const results = {
      competitors: [],
      createdCount: 0,
      updatedCount: 0,
      removedFromParticipants: 0,
      errors: []
    };
    
    // Traiter chaque utilisateur
    for (const user of users) {
      try {
        // Rechercher si cet utilisateur a déjà un compétiteur associé
        let competitor = await Competitor.findOne({ userId: user._id });
        let isNewCompetitor = false;
        
        if (!competitor) {
          // Créer un nouveau compétiteur si aucun n'existe pour cet utilisateur
          competitor = new Competitor({
            firstname: user.firstName,
            lastname: user.lastName,
            userId: user._id,
            registrationNumber: user.fighterNumber || '',
            clubName: user.clubName || defaultCompetitorValues.clubName,
            ...defaultCompetitorValues
          });
          isNewCompetitor = true;
          results.createdCount++;
        }
        
        // Vérifier si le compétiteur participe déjà à ce tournoi
        const existingTournamentEntry = competitor.tournaments.find(
          t => t.tournament && t.tournament.toString() === id
        );
        
        if (!existingTournamentEntry) {
          // Ajouter ce tournoi à la liste des tournois du compétiteur
          const tournamentEntry = {
            tournament: id,
            status: 'registered'
          };
          
          // Ajouter la catégorie si elle est spécifiée
          if (categoryId) {
            tournamentEntry.category = categoryId;
          }
          
          competitor.tournaments.push(tournamentEntry);
          results.updatedCount++;
        }
        
        // Sauvegarder le compétiteur
        await competitor.save();
        
        // Ajouter le compétiteur au tournoi s'il n'y est pas déjà
        if (!tournament.competitors.includes(competitor._id)) {
          tournament.competitors.push(competitor._id);
        }
        
        // Retirer l'utilisateur de la liste des participants
        const participantIndex = tournament.participants.findIndex(
          p => p.user && p.user.toString() === user._id.toString()
        );
        
        if (participantIndex !== -1) {
          // Retirer le participant du tableau
          tournament.participants.splice(participantIndex, 1);
          results.removedFromParticipants++;
        }
        
        results.competitors.push(competitor);
      } catch (error) {
        results.errors.push({
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`,
          error: error.message
        });
      }
    }
    
    // Sauvegarder les modifications du tournoi
    await tournament.save();
    
    // Retourner les résultats
    return reply.code(200).send({
      message: `${results.createdCount} nouveau(x) compétiteur(s) créé(s) et ${results.updatedCount} tournoi(s) associé(s)`,
      tournamentId: tournament._id,
      tournamentName: tournament.name,
      ...results
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      error: 'Server Error', 
      message: error.message 
    });
  }
};

// @desc    Récupérer les tournois auxquels l'utilisateur est inscrit
// @route   GET /api/tournaments/me/participating
// @access  Private (utilisateur connecté)
exports.getUserParticipatingTournaments = async (request, reply) => {
  try {
    const userId = request.user.id; // ID de l'utilisateur connecté (extrait du token JWT)
    
    // Rechercher tous les tournois où l'utilisateur est listé comme participant
    const tournaments = await Tournament.find({
      'participants.user': userId,
      'participants.status': { $in: ['pending', 'confirmed'] } // Seulement les inscriptions actives
    })
    .populate({
      path: 'categories',
      select: 'name'
    })
    .sort({ date: 1, startDate: 1 }); // Trier par date
    
    if (!tournaments || tournaments.length === 0) {
      return [];
    }
    
    return tournaments;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Ajouter des catégories à un tournoi
// @route   POST /api/tournaments/:id/categories
// @access  Private (Admin uniquement)
exports.addCategoriesToTournament = async (request, reply) => {
  try {
    const { id } = request.params;
    const { categories } = request.body;
    
    // Vérifier que les catégories sont fournies
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'La liste des catégories est requise et doit être un tableau non vide' 
      });
    }
    
    // Récupérer le tournoi
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Tournoi non trouvé avec l'ID: ${id}` 
      });
    }
    
    // Vérifier si l'utilisateur est un administrateur (cette vérification devrait idéalement être dans un middleware)
    if (request.user && request.user.role !== 'admin') {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: 'Seuls les administrateurs peuvent modifier les catégories d\'un tournoi' 
      });
    }
    
    // Convertir les catégories en ObjectId si nécessaire
    const categoryIds = categories.map(cat => {
      if (typeof cat === 'object' && cat._id) {
        return cat._id.toString();
      }
      return cat.toString();
    });
    
    // Filtrer les catégories qui ne sont pas déjà présentes dans le tournoi
    if (!tournament.categories) {
      tournament.categories = [];
    }
    
    const existingCategoryIds = tournament.categories.map(cat => cat.toString());
    const newCategoryIds = categoryIds.filter(id => !existingCategoryIds.includes(id));
    
    // Ajouter les nouvelles catégories au tournoi
    tournament.categories = [...tournament.categories, ...newCategoryIds];
    tournament.updatedAt = Date.now();
    
    await tournament.save();
    
    return reply.code(200).send({
      message: `${newCategoryIds.length} catégorie(s) ajoutée(s) au tournoi`,
      tournamentId: tournament._id,
      categoryIds: newCategoryIds,
      totalCategories: tournament.categories.length
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      error: 'Server Error', 
      message: error.message 
    });
  }
};

// @desc    Supprimer une catégorie d'un tournoi
// @route   DELETE /api/tournaments/:id/categories/:categoryId
// @access  Private (Admin uniquement)
exports.removeCategoryFromTournament = async (request, reply) => {
  try {
    const { id, categoryId } = request.params;
    
    // Récupérer le tournoi
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Tournoi non trouvé avec l'ID: ${id}` 
      });
    }
    
    // Vérifier si l'utilisateur est un administrateur (cette vérification devrait idéalement être dans un middleware)
    if (request.user && request.user.role !== 'admin') {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: 'Seuls les administrateurs peuvent modifier les catégories d\'un tournoi' 
      });
    }
    
    // Vérifier si la catégorie existe dans le tournoi
    if (!tournament.categories) {
      tournament.categories = [];
    }
    
    const categoryIndex = tournament.categories.findIndex(
      cat => cat.toString() === categoryId
    );
    
    if (categoryIndex === -1) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Catégorie non trouvée dans le tournoi avec l'ID: ${categoryId}` 
      });
    }
    
    // Supprimer la catégorie du tournoi
    tournament.categories.splice(categoryIndex, 1);
    tournament.updatedAt = Date.now();
    
    await tournament.save();
    
    return reply.code(200).send({
      message: 'Catégorie supprimée du tournoi avec succès',
      tournamentId: tournament._id,
      removedCategoryId: categoryId,
      remainingCategories: tournament.categories.length
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      error: 'Server Error', 
      message: error.message 
    });
  }
};