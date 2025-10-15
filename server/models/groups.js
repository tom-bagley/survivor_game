const mongoose = require('mongoose')
const {Schema} = mongoose

const groupSchema = new Schema({
  name: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // reference to User model
    }
  ],
  inviteTokenHash: { type: String, required: true },
  inviteTokenExpiresAt: { type: Date }
});

const Group = mongoose.model("Group", groupSchema);
module.exports = Group
