const mongoose = require('mongoose')
const {Schema} = mongoose

const userSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    portfolio: {
        type: Map,
        of: Number,
        default: {},
    },
    budget: {
        type: Number,
        default: 500
    },
    netWorth: {
        type: Number,
        default: 500
    },
    role: {
        type: String,
        default: 'user'
    },
    last_seen_episode_id: {
        type: Number,
        default: 0
    },
    isGuest: {
        type: Boolean,
        default: false
    }
})

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;