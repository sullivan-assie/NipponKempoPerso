// backend/models/Competitor.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompetitorSchema = new Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  // Référence à l'utilisateur d'origine (obligatoire)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Garantit qu'un seul compétiteur est créé par utilisateur
  },
  nationality: {
    type: String,
    default: 'France'
  },
  age: {
    type: Number
  },
  danLevel: {
    type: String
  },
  grade: {
    type: String
  },
  gender: {
    type: String,
    enum: ['Homme', 'Femme', 'Autre']
  },
  clubName: {
    type: String
  },
  registrationNumber: {
    type: String
  },
  teamId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  // Ajout des champs pour la gestion des tournois et des résultats
  weight: {
    type: Number
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // Liste des tournois auxquels le compétiteur participe
  tournaments: [{
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    results: {
      points: { type: Number, default: 0 },
      faults: { type: Number, default: 0 },
      rank: { type: Number },
      matches: [{
        opponent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Competitor'
        },
        result: {
          type: String,
          enum: ['win', 'loss', 'draw', 'disqualified', 'not_played'],
          default: 'not_played'
        },
        points: { type: Number, default: 0 },
        faults: { type: Number, default: 0 }
      }],
      status: {
        type: String,
        enum: ['registered', 'active', 'completed', 'disqualified'],
        default: 'registered'
      }
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour le champ updatedAt avant chaque sauvegarde
CompetitorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode virtuelle pour le nom complet
CompetitorSchema.virtual('fullName').get(function() {
  return `${this.firstname} ${this.lastname}`;
});

// Index pour améliorer les performances de recherche
CompetitorSchema.index({ userId: 1 });
CompetitorSchema.index({ 'tournaments.tournament': 1 });

module.exports = mongoose.model('Competitor', CompetitorSchema);