const mongoose = require('mongoose')
const {Schema} = mongoose

const adminSettingsSchema = new Schema({
    _id: {
        type: String,
        default: "game_settings"
    },
    season: String,
    week: Number,
    price: Number,
    percentageIncrement: Number,
}, {timestamps: true});

const adminSettings = mongoose.model('adminSettings', adminSettingsSchema);
module.exports = adminSettings;