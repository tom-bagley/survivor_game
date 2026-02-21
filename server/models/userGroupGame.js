const mongoose = require('mongoose')
const {Schema} = mongoose

const userGroupGameSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },

    budget: {
        type: Number,
        default: 50
    },
    lockedBudget: {
        type: Number,
        default: null,
    },
    netWorth: {
        type: Number,
        default: 500
    },
    portfolio: {
        type: Map,
        of: Number,
        default: {},
    },
    shorts: {
        type: Map,
        of: Number,
        default: {},
    },
    bootOrders: {
        type: Map,
        of: [String],
        default: {}
    },
    bonuses: [
      {
        episode: {
            type: Number,
            required: true
        },

        type: {
            type: String,
            enum: [
            "bootOrder",
            "challengeWin",
            "rightSideVote",
            "playedIdolCorrectly",
            "foundIdol",
            "shortPayout",
            "shortPenalty",
            "challengeLoss",
            "wrongSideVote",
            "shortBonus",
            "finalistBonus"
            ],
            required: true
        },

        survivor: {
            type: String,
            required: true
        },

        sharesOwned: {
            type: Number,
            default: null // only used for stock bonuses
        },

        predictedPosition: {
            type: Number,
            default: null // only used for bootOrder
        },

        bonusAmount: {
            type: Number,
            required: true
        },

        awardedAt: {
            type: Date,
            default: Date.now
        }
      }
    ]
})

const UserGroupGame = mongoose.model('UserGroupGame', userGroupGameSchema);
module.exports = UserGroupGame;