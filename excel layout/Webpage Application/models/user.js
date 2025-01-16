const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },  // Store hashed password
  balance: { type: Number, default: 10000 },  // Starting balance for a user
  portfolio: [
    {
      stockId: { type: Schema.Types.ObjectId, ref: 'Stock' },  // Reference to Stock schema
      quantity: { type: Number, default: 0 }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
