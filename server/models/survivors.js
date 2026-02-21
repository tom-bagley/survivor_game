const mongoose = require('mongoose')
const {Schema} = mongoose

const survivorSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        default: 5,
    },
    countStocks: {
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
    youtube_interview: {
        type: String,
    },
    age: String,
    Hometown: String,
    Current_Residence: String,
    Occupation: String,

});

const SurvivorModel = mongoose.model('Player', survivorSchema);
module.exports = SurvivorModel;