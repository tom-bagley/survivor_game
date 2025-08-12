const mongoose = require('mongoose')
const {Schema} = mongoose

const epidsodeSettingsSchema = new Schema({
    _id: {
        type: String,
        default: "episode_settings"
    },
    onAir: Boolean,
    episodeEndTime: Date,
    episodeId: {
        type: Number,
        default: 0
    },
    playersVotedOut: {
        type: Map,
        of: String,
        default: {},
    },

}, {timestamps: true});

const episodeSettings = mongoose.model('episodeSettings', epidsodeSettingsSchema);
module.exports = episodeSettings;