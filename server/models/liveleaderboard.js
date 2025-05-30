const mongoose = require('mongoose')
const {Schema} = mongoose

const LeaderboardEntrySchema = new Schema({
  user_id: String,
  username: String,
  net_worth: Number,
  rank: Number
}, { _id: false });

const LiveLeaderboardSchema = new Schema({
  _id: { 
    type: String,
    default: "live_leaderboard"
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  entries: {
    type: [LeaderboardEntrySchema],
    required: true
  }
});

const LiveLeaderboardCache = mongoose.model('LiveLeaderboard', LiveLeaderboardSchema);
module.exports = LiveLeaderboardCache;