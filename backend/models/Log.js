// backend/models/Log.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
  level: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'error', 'debug']
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: Object
  }
});

module.exports = mongoose.model('Log', LogSchema);