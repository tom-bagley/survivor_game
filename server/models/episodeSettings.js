const mongoose = require('mongoose')
const {Schema} = mongoose

const epidsodeSettingsSchema = new Schema({
    onAir: {
        type: Boolean,
        default: false,
    },
    episodeEndTime: {
        type: Date,
        default: null,
    },
    episodeNumber: {
        type: Number,
        default: 0
    },
    survivorsVotedOut: {
        type: Array,
        of: String,
        default: [],
    },
    season: {
        type: String,
        default: null,
    },
    isCurrentEpisode: {
        type: Boolean,
        default: false,
    },
    finalStockTotals: {
        type: Map,
        of: Number,
        default: {},
    },
    finalClosingPrice: {
        type: Number
    }

}, {timestamps: true});

const episodeSettings = mongoose.model('episodeSettings', epidsodeSettingsSchema);
module.exports = episodeSettings;