// backend/models/Tournament.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TournamentSchema = new Schema({
  tournamentId: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  location: {
    type: String
  },
  organizer: {
    type: String
  },
  competitors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competitor'
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // Ajout du champ participants pour stocker les utilisateurs inscrits
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    }
  }],
  matchType: {
    type: String,
    enum: ['individual', 'team', 'mixed', 'Élimination directe', 'Poules', 'Mixte'],
    default: 'individual'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'completed'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  poules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poule'
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
TournamentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Tournament', TournamentSchema);