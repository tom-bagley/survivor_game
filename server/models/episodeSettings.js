const mongoose = require('mongoose')
const {Schema} = mongoose

const episodeSettingsSchema = new Schema({
  onAir: {
    type: Boolean,
    default: false,
  },
  episodeEndTime: {
    type: Date,
    default: null,
  },
  episodeNumber: {
    type: Number,
    default: 0,
  },
  survivorsVotedOut: {
    type: [String],
    default: [],
  },
  season: {
    type: String,
    default: null,
  },
  isCurrentEpisode: {
    type: Boolean,
    default: false,
  },
  finalStockTotals: {
    type: Map,
    of: Number,
    default: {},
  },
  finalClosingPrice: {
    type: Number,
  },
  // --- Player event tracking ---
  foundIdol: {
    type: [{ type: [String] }],
    default: [],
  },
  wonChallenge: {
    type: [{ type: [String] }],
    default: [],
  },
  rightSideOfVote: {
    type: [{ type: [String] }],
    default: [],
  },
  playedIdolCorrectly: {
    type: [{ type: [String] }],
    default: [],
  },
}, { timestamps: true });

const episodeSettings = mongoose.model('episodeSettings', episodeSettingsSchema);
module.exports = episodeSettings;