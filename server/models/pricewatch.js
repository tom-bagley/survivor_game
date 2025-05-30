const mongoose = require('mongoose')
const {Schema} = mongoose

const StockPriceEntry = new Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        default: 1,
    },
    date: {
        type: Date,
        default: Date.now,
    }

});

const PriceWatch = mongoose.model('StockPriceEntry', StockPriceEntry);
module.exports = PriceWatch;