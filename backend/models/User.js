// backend/models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  name: String, // Pour compatibilité avec le code existant
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  clubName: {
    type: String,
    required: false, // Modification pour rendre le champ non obligatoire
    default: ''
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: false
  },
  isClubCoach: {
    type: Boolean,
    default: false
  },
  fighterNumber: {
    type: String,
    required: function() { return this.role === 'user'; }, // Obligatoire seulement pour les utilisateurs standards
    unique: true,
    sparse: true // Permet d'avoir des valeurs null pour les admins
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  status: {
    type: Boolean,
    default: true
  },
  RGPDConsent: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  address: {
    type: String,
    required: false,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);
