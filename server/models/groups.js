const mongoose = require('mongoose')
const {Schema} = mongoose

const groupSchema = new Schema({
  name: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      accepted: { type: Boolean , default: false },
      joinedAt: { type: Date }
    }
  ],
  inviteTokenHash: { type: String },
  inviteTokenExpiresAt: { type: Date },
  maxSharesPerPlayer: { type: Number, default: 50 },
  sharesUsed: { type: Map, of: Number, default: {} },
  // Max possible budget per episode (episodeNumber string → maxBudget)
  maxPossibleBudgets: { type: Map, of: Number, default: {} },
  // Detailed log of how the max was achieved (episodeNumber string → log object)
  maxPossibleLog: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
});

const Group = mongoose.model("Group", groupSchema);
module.exports = Group
