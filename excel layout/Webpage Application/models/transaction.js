const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stockId: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },  // Price at the time of the transaction
    type: { type: String, enum: ['buy', 'sell'], required: true },
    timestamp: { type: Date, default: Date.now }
});
  
module.exports = mongoose.model('Transaction', transactionSchema);
  