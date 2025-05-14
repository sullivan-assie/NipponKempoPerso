// backend/models/Match.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MatchSchema = new Schema({
  // Référence au tournoi auquel appartient le match
  tournament: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  
  // Référence à la catégorie du match
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  
  // Type de match (poule, bracket, finale, etc.)
  type: {
    type: String,
    enum: ['poule', 'bracket', 'finale'],
    required: true
  },
  
  // Numéro de round pour les brackets
  round: {
    type: Number,
    default: 0
  },
  
  // Index du match dans le round
  matchIndex: {
    type: Number,
    default: 0
  },
  
  // Référence à la poule (si type='poule')
  poule: {
    type: Schema.Types.ObjectId,
    ref: 'Poule'
  },
  
  // Compétiteur 1
  competitor1: {
    type: Schema.Types.ObjectId,
    ref: 'Competitor'
  },
  
  // Compétiteur 2
  competitor2: {
    type: Schema.Types.ObjectId,
    ref: 'Competitor'
  },
  
  // Scores
  score1: {
    type: Number,
    default: 0
  },
  
  score2: {
    type: Number,
    default: 0
  },
  
  // Fautes/Pénalités
  fouls1: {
    type: Number,
    default: 0
  },
  
  fouls2: {
    type: Number,
    default: 0
  },
  
  // ID du gagnant
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'Competitor'
  },
  
  // Statut du match
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Durée prévue du match (en minutes)
  duration: {
    type: Number,
    default: 3
  },
  
  // Numéro du tatami ou de la zone
  tatami: {
    type: Number
  },
  
  // Notes de l'arbitre
  notes: {
    type: String
  },
  
  // Match suivant (pour les brackets)
  nextMatch: {
    type: Schema.Types.ObjectId,
    ref: 'Match'
  },
  
  // Horodatage
  scheduledTime: {
    type: Date
  },
  
  startTime: {
    type: Date
  },
  
  endTime: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', MatchSchema);