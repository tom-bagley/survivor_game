const mongoose = require('mongoose')
const {Schema} = mongoose

const episodeSettingsSchema = new Schema({
  onAir: {
    type: Boolean,
    default: false,
  },
  tribalCouncil: {
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
  lastEpisodeVotedOut: {
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
  lostChallenge: {
    type: [{ type: [String] }],
    default: [],
  },
  wrongSideOfVote: {
    type: [{ type: [String] }],
    default: [],
  },
  finalists: {
    type: [String],
    default: [],
  },
  liveIdolEvents: {
    type: [{
      survivorName: { type: String, required: true },
      appliedAt:    { type: Date, default: Date.now },
      bonusPerShare: { type: Number, default: 0.50 },
    }],
    default: [],
  },
  liveEventBonuses: {
    type: [{
      survivorName: { type: String, required: true },
      field:        { type: String, required: true },
      appliedAt:    { type: Date, default: Date.now },
    }],
    default: [],
  },
  liveChallengeEvents: {
    type: [{
      challengeType: { type: String, required: true }, // 'team' | 'reward' | 'individual'
      winners:  { type: [String], default: [] },
      losers:   { type: [String], default: [] },
      appliedAt: { type: Date, default: Date.now },
    }],
    default: [],
  },
  liveVoteEvents: {
    type: [{
      rightSide: { type: [String], default: [] },
      wrongSide: { type: [String], default: [] },
      appliedAt: { type: Date, default: Date.now },
    }],
    default: [],
  },
}, { timestamps: true });

const episodeSettings = mongoose.model('episodeSettings', episodeSettingsSchema);
module.exports = episodeSettings;