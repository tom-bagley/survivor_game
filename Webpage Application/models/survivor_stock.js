const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stockSchema = new Schema({
    name: { type: String, required: true },
    symbol: { type: String, required: true, unique: true },  // E.g., AAPL for Apple
    price: { type: Number, required: true },  // Current price
    available: { type: Boolean, default: true }  // Whether the stock is available for purchase
});
  
module.exports = mongoose.model('Stock', stockSchema);
  