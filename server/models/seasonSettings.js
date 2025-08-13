const mongoose = require('mongoose')
const {Schema} = mongoose

const seasonSchema = new Schema({
    seasonName: String,
    currentWeek: Number,
    currentPrice: Number,
    percentageIncrement: Number,
    isCurrentSeason: Boolean,
}, {timestamps: true});

const seasonSettings = mongoose.model('seasonSettings', seasonSchema);
module.exports = seasonSettings;