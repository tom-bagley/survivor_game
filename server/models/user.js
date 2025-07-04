const mongoose = require('mongoose')
const {Schema} = mongoose

const userSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    portfolio: {
        type: Map,
        of: Number,
        default: {},
    },
    budget: {
        type: Number,
        default: 10000
    },
    netWorth: {
        type: Number,
        default: 10000
    },
    role: {
        type: String,
        default: 'user'
    }
})

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;