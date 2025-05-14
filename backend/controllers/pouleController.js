// backend/controllers/pouleController.js
const Poule = require('../models/Poule');
const Competitor = require('../models/Competitor');
const Tournament = require('../models/Tournament');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// Fonctions existantes du contrôleur des poules...

// @desc    Générer des poules aléatoires pour un tournoi et une catégorie spécifique
// @route   POST /api/tournaments/:id/generate-poules
// @access  Private (Admin)
exports.generateRandomPoules = async (request, reply) => {
  try {
    const { id } = request.params; // ID du tournoi
    const { categoryId, numberOfPoules } = request.body;

    // Validation des entrées
    if (!categoryId) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'L\'ID de catégorie est requis' 
      });
    }

    if (!numberOfPoules || numberOfPoules <= 0) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Le nombre de poules doit être un entier positif' 
      });
    }

    // Vérifier que le tournoi existe
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Tournoi non trouvé avec l'ID: ${id}` 
      });
    }

    // Vérifier que la catégorie existe
    const category = await Category.findById(categoryId);
    if (!category) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Catégorie non trouvée avec l'ID: ${categoryId}` 
      });
    }

    // Récupérer tous les compétiteurs qui sont inscrits à ce tournoi et à cette catégorie
    const competitors = await Competitor.find({
      "tournaments": {
        $elemMatch: {
          "tournament": id,
          "category": categoryId
        }
      }
    });

    if (!competitors || competitors.length === 0) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Aucun compétiteur disponible pour cette catégorie dans ce tournoi' 
      });
    }

    // Vérifier s'il y a déjà des poules pour cette catégorie dans ce tournoi
    const existingPoules = await Poule.find({
      tournamentId: id,
      categoryId: categoryId
    });

    if (existingPoules.length > 0) {
      // Supprimer les poules existantes si l'utilisateur le souhaite
      if (request.body.replaceExisting === true) {
        await Poule.deleteMany({
          tournamentId: id,
          categoryId: categoryId
        });
      } else {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Des poules existent déjà pour cette catégorie dans ce tournoi. Définissez replaceExisting=true pour les remplacer.' 
        });
      }
    }

    // Mélanger les compétiteurs aléatoirement
    const shuffledCompetitors = [...competitors];
    for (let i = shuffledCompetitors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCompetitors[i], shuffledCompetitors[j]] = [shuffledCompetitors[j], shuffledCompetitors[i]];
    }

    // Calculer le nombre moyen de compétiteurs par poule
    const totalCompetitors = shuffledCompetitors.length;
    const competitorsPerPoule = Math.ceil(totalCompetitors / numberOfPoules);
    
    // Créer les poules avec une répartition équilibrée des compétiteurs
    const poules = [];
    for (let i = 0; i < numberOfPoules; i++) {
      const startIndex = i * competitorsPerPoule;
      const endIndex = Math.min(startIndex + competitorsPerPoule, totalCompetitors);
      
      // Si on atteint la fin et qu'il n'y a plus de compétiteurs, arrêter la création des poules
      if (startIndex >= totalCompetitors) {
        break;
      }

      // Récupérer les compétiteurs pour cette poule
      const pouleCompetitors = shuffledCompetitors.slice(startIndex, endIndex).map(comp => comp._id);

      // Créer la poule
      const poule = new Poule({
        name: `Poule ${i + 1}`,
        tournamentId: id,
        categoryId: categoryId,
        competitors: pouleCompetitors,
        status: 'pending'
      });

      await poule.save();
      poules.push(poule);
    }

    return reply.code(201).send({
      poulesCreated: poules.length,
      totalCompetitors,
      competitorsPerPoule,
      poules
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer les compétiteurs par catégorie pour un tournoi
// @route   GET /api/tournaments/:id/competitors-by-category
// @access  Private (Admin)
exports.getCompetitorsByCategory = async (request, reply) => {
  try {
    const { id } = request.params; // ID du tournoi

    // Vérifier que le tournoi existe
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Tournoi non trouvé avec l'ID: ${id}` 
      });
    }

    // Récupérer tous les compétiteurs du tournoi
    const competitors = await Competitor.find({
      "tournaments.tournament": id
    });

    // Organiser les compétiteurs par catégorie
    const competitorsByCategory = {};
    
    for (const competitor of competitors) {
      // Pour chaque compétiteur, parcourir ses tournois et trouver celui qui correspond
      for (const tournamentEntry of competitor.tournaments) {
        if (tournamentEntry.tournament.toString() === id && tournamentEntry.category) {
          const categoryId = tournamentEntry.category.toString();
          
          // Initialiser le tableau de catégories s'il n'existe pas encore
          if (!competitorsByCategory[categoryId]) {
            competitorsByCategory[categoryId] = [];
          }
          
          // Ajouter le compétiteur à la catégorie
          competitorsByCategory[categoryId].push({
            _id: competitor._id,
            firstname: competitor.firstname,
            lastname: competitor.lastname,
            userId: competitor.userId
          });
        }
      }
    }

    return competitorsByCategory;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer toutes les poules
// @route   GET /api/poules
// @access  Private
exports.getAllPoules = async (request, reply) => {
  try {
    const poules = await Poule.find()
      .populate('competitors', 'firstname lastname')
      .populate('tournamentId', 'name')
      .populate('categoryId', 'name');
    
    return poules;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer les poules d'un tournoi
// @route   GET /api/poules/tournament/:tournamentId
// @access  Private
exports.getPoulesByTournament = async (request, reply) => {
  try {
    const { tournamentId } = request.params;
    
    const poules = await Poule.find({ tournamentId })
      .populate('competitors', 'firstname lastname')
      .populate('categoryId', 'name');
    
    return poules;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Récupérer une poule par son ID
// @route   GET /api/poules/:id
// @access  Private
exports.getPouleById = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const poule = await Poule.findById(id)
      .populate('competitors', 'firstname lastname')
      .populate('tournamentId', 'name')
      .populate('categoryId', 'name');
    
    if (!poule) {
      return reply.code(404).send({ error: 'Not Found', message: `Poule non trouvée avec l'ID: ${id}` });
    }
    
    return poule;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Créer une nouvelle poule
// @route   POST /api/poules
// @access  Private (Admin)
exports.createPoule = async (request, reply) => {
  try {
    const { name, tournamentId, categoryId, competitors, status } = request.body;
    
    // Validation basique
    if (!name || !tournamentId || !categoryId) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Le nom, l\'ID du tournoi et l\'ID de la catégorie sont requis' 
      });
    }
    
    // Vérifier si le tournoi et la catégorie existent
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Tournoi non trouvé avec l'ID: ${tournamentId}` 
      });
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: `Catégorie non trouvée avec l'ID: ${categoryId}` 
      });
    }
    
    // Créer la poule
    const poule = new Poule({
      name,
      tournamentId,
      categoryId,
      competitors: competitors || [],
      status: status || 'pending'
    });
    
    await poule.save();
    
    return reply.code(201).send(poule);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Mettre à jour une poule
// @route   PUT /api/poules/:id
// @access  Private (Admin)
exports.updatePoule = async (request, reply) => {
  try {
    const { id } = request.params;
    const updates = request.body;
    
    const poule = await Poule.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!poule) {
      return reply.code(404).send({ error: 'Not Found', message: `Poule non trouvée avec l'ID: ${id}` });
    }
    
    return poule;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};

// @desc    Supprimer une poule
// @route   DELETE /api/poules/:id
// @access  Private (Admin)
exports.deletePoule = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const poule = await Poule.findByIdAndDelete(id);
    
    if (!poule) {
      return reply.code(404).send({ error: 'Not Found', message: `Poule non trouvée avec l'ID: ${id}` });
    }
    
    return { success: true, message: 'Poule supprimée avec succès' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Server Error', message: error.message });
  }
};