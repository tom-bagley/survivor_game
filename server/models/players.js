const mongoose = require('mongoose')
const {Schema} = mongoose

const playerSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        default: 1,
    },
    count: {
        type: Number,
        default: 0,
    },
    availability: {
        type: Boolean,
        default: true,
    },
});

const PlayerModel = mongoose.model('Player', playerSchema);
module.exports = PlayerModel;