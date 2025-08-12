const User = require('../models/user');
const Player = require('../models/players');
const PriceWatch = require('../models/pricewatch');
const episodeSettings = require('../models/episodeSettings');
const { hashPassword, comparePassword } = require('../helpers/auth');
const jwt = require('jsonwebtoken');

const test =  (req, res) => {
    console.log('rest')
    res.json('changed text twice')
}


//Register endpoint
const registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        // Check if name was entered
        if(!name) {
            return res.json({
                error: 'name is required'
            });
        }
        //Check if password is good
        if(!password || password.length < 6) {
            return res.json({
                error: 'Password is required and should be at least six characters long'
            });
        }
        // Check email
        const exist = await User.findOne({email})
        if(exist) {
            return res.json({
                error: 'Email is taken already'
            });
        }

        const players = await Player.find();

        const portfolio = {};

        players.forEach(player => {
            portfolio[player.name] = 0;
        });

        const hashedPassword = await hashPassword(password)
        //Create user in database
        const user = await User.create({
            name,
            email, 
            password: hashedPassword,
            portfolio,
            role: 'user'
        });
        jwt.sign({email: user.email, id: user._id, name: user.name, portfolio: user.portfolio, role: user.role}, process.env.JWT_SECRET, {}, (err, token) => {
            if(err) throw err;
            res.cookie('token', token).json(user)
        })
    } catch (error) {
        console.log(error)
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'No user found' });
        }

        // Compare passwords
        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Passwords do not match' });
        }

        // Get latest episode
        const episode = await episodeSettings.findById("episode_settings")
        const showAnimation = user.last_seen_episode_id !== episode.episodeId;
        console.log(showAnimation)

        // If new episode, update last_seen_episode_id
        if (showAnimation) {
            user.last_seen_episode_id = episode.episodeId;
            await user.save();
        }

        // Sign JWT
        jwt.sign(
            {
                email: user.email,
                id: user._id,
                name: user.name,
                portfolio: user.portfolio,
                role: user.role
            },
            process.env.JWT_SECRET,
            {},
            (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json({
                    ...user.toObject(),
                    showAnimation
                });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};


const getProfile = (req, res) => {
    const {token} = req.cookies
    if(token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
            if(err) throw err;
            res.json(user)
        })
    } else {
        res.json(null)
    }
}



module.exports = {
    test,
    registerUser,
    loginUser,
    getProfile,
}