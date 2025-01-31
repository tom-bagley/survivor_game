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
    profile_pic: {
        type: String,
    },
    age: String,
    Hometown: String,
    Current_Residence: String,
    Occupation: String,

});

const PlayerModel = mongoose.model('Player', playerSchema);
module.exports = PlayerModel;