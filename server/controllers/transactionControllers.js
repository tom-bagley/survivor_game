const User = require('../models/user');
const Player = require('../models/players');
const PriceWatch = require('../models/pricewatch');
const adminSettings = require('../models/adminSettings');

const calculatePrices = async () => {
    try {
        const totalPlayerCount = await getTotalStockCount();
        const availablePlayers = await Player.find({ availability: true });
        const unavailablePlayers = await Player.find({ availability: false });

        const availablePlayerCount = availablePlayers.length;
        const currentSettings = await adminSettings.findById("game_settings");
        const currentMedianPrice = currentSettings.price;

        const response = {};

        for (const player of availablePlayers) {
            const price = calculateStockPrice(player.count, totalPlayerCount, availablePlayerCount, currentMedianPrice);
            response[player.name] = price;
        }

            for (const player of unavailablePlayers) {
            response[player.name] = player.price; 
        }
        return response; 
    } catch (error) {
        console.error("Error occurred while calculating prices:", error);
        throw error; 
    }
};

const getPrices = async (req, res) => {
    try {
        const response = await calculatePrices(); 
        res.json(response); 
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
};

const fetchHistoricalPrices = async (name) => {
    const prices = await PriceWatch.find({ name }).sort({ date: 1 });
    return prices.map(p => ({
        date: p.date.toISOString().split('T')[0],
        price: p.price,
        week: p.week,
        season: p.season
    }));
};

const getProfile = async (req, res) => {
    try {
        const players = await Player.find({});
        const response = [];

        for (const player of players) {
            const historicalprices = await fetchHistoricalPrices(player.name);
            response.push({
                name: player.name,
                profile_pic: player.profile_pic,
                availability: player.availability,
                historicalprices
            });
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


function calculateStockPrice (currentPlayerCount, totalPlayerCount, availablePlayerCount, currentMedianPrice) {
    if (currentPlayerCount === 0) {
        return 0;
    }
    try {
        let result = currentMedianPrice + (((availablePlayerCount * (currentPlayerCount / totalPlayerCount)) - 1) * currentMedianPrice);
        result = Math.max(0, Math.min(result, currentMedianPrice * 2));
        return result;
    } catch (error) {
        return 1;
    }
}

async function getTotalStockCount() {
    const totalStockCount = await Player.aggregate([
    {
        $match: {
        availability: true
        }
    },
    {
        $group: {
        _id: null,
        total: { $sum: "$count" }
        }
    }
    ]);
    const total = totalStockCount[0].total;
    return total;
}



const updatePortfolio = async (req, res) => {
    const { userId, survivorPlayer, action } = req.body;
    try {
        const user = await User.findById(userId);
        const player = await Player.findOne({ name: survivorPlayer });
        if (!user || !player) {
            return res.status(404).json({ error: 'User or player not found' });
        }

        const currentUserPlayerCount = user.portfolio.get(survivorPlayer) || 0;
        const currentBudget = user.budget;
        const availablePlayerCount = await Player.countDocuments({ availability: true });
        const currentSettings = await adminSettings.findById("game_settings");
        const currentMedianPrice = currentSettings.price;

        const total = await getTotalStockCount();
        const currentPrice = calculateStockPrice(player.count, total, availablePlayerCount, currentMedianPrice);
        if (action === 'buy') {
            if (currentBudget < currentPrice) {
                return res.json({ error: 'Not enough funds' });
            }
            await handleBuy(user, player, survivorPlayer, currentPrice);
        } else if (action === 'sell') {
            if (currentUserPlayerCount <= 0) {
                return res.json({ error: 'No stock to sell' });
            }
            await handleSell(user, player, survivorPlayer, availablePlayerCount, currentMedianPrice);
        } else {
            return res.json({ error: 'Invalid action' });
        }

        const updatedNetWorth = await calculateNetWorth(user);
        user.netWorth = updatedNetWorth;

        await Promise.all([user.save(), player.save()]);

        res.json(user);
    } catch (error) {
        console.error(error);
        res.json({ error: 'An error occurred while updating the portfolio' });
    }
};

// Helper function to handle buying logic
const handleBuy = async (user, player, stock, currentPrice) => {
    user.portfolio.set(stock, (user.portfolio.get(stock) || 0) + 1);
    user.budget -= currentPrice;
    player.count += 1;
};

// Helper function to handle selling logic
const handleSell = async (user, player, stock, availablePlayerCount, currentMedianPrice) => {
    user.portfolio.set(stock, user.portfolio.get(stock) - 1);
    player.count -= 1;
    const total = await getTotalStockCount();
    const currentPrice = calculateStockPrice(player.count, total, availablePlayerCount, currentMedianPrice);
    user.budget += currentPrice;
    
};

// Helper function to calculate net worth
const calculateNetWorth = async (user) => {
    const totalPlayerCount = await getTotalStockCount();

    const availablePlayers = await Player.find({ availability: true });
    const availablePlayerCount = availablePlayers.length;
    const currentSettings = await adminSettings.findById("game_settings");
    const currentMedianPrice = currentSettings.price;

    const survivorPlayerPrices = {};

    for (const player of availablePlayers) {
        const price = calculateStockPrice(player.count, totalPlayerCount, availablePlayerCount, currentMedianPrice);
        survivorPlayerPrices[player.name] = price;
    }
    return [...user.portfolio.entries()].reduce(
        (netWorth, [player, quantity]) => netWorth + (survivorPlayerPrices[player] || 0) * quantity,
        user.budget
    );
};



const updatePortfolioPreseason = async (req, res) => {
    const { userId, stock, action } = req.body;

    try {
        const user = await User.findById(userId);
        const player = await Player.findOne({ name: stock });

        if (!user || !player) {
            return res.json({ error: 'User or player not found' });
        }

        const currentUserPlayerCount = user.portfolio.get(stock) || 0;
        const currentBudget = user.budget;
        const currentPlayerCount = player.count;

        // Handle buy or sell logic
        const { updatedPlayerCount, updatedBudget, updatedUserPlayerCount } = handlePreseasonTransaction(
            currentBudget,
            currentUserPlayerCount,
            currentPlayerCount,
            action
        );

        if (updatedBudget === null) {
            return res.json({
                error: action === 'buy' ? 'Not enough funds' : 'No stock to sell'
            });
        }

        // Update the user's portfolio and budget
        user.portfolio.set(stock, updatedUserPlayerCount);
        user.budget = updatedBudget;

        // Update the player's stock count
        player.count = updatedPlayerCount;

        // Save the updated data
        await Promise.all([user.save(), player.save()]);

        res.json(user);
    } catch (error) {
        console.error(error);
        res.json({ error: 'An error occurred while updating the portfolio' });
    }
};

// Helper function for preseason transactions
const handlePreseasonTransaction = (budget, userStockCount, playerStockCount, action) => {
    const stockPrice = 1; // Fixed preseason price

    if (action === 'buy') {
        if (budget <= 0) {
            return { updatedBudget: null }; // Not enough funds
        }
        return {
            updatedPlayerCount: playerStockCount + 1,
            updatedBudget: budget - stockPrice,
            updatedUserPlayerCount: userStockCount + 1
        };
    } else if (action === 'sell') {
        if (userStockCount <= 0) {
            return { updatedBudget: null }; // No stock to sell
        }
        return {
            updatedPlayerCount: playerStockCount - 1,
            updatedBudget: budget + stockPrice,
            updatedUserPlayerCount: userStockCount - 1
        };
    }
    return { updatedBudget: null }; // Invalid action
};


const getPortfolio = async (req, res) => {
    const {userId} = req.query;
    try {
        const user = await User.findById(userId);
        const players = await Player.find();
        const playerNames = players.map(player => player.name);
        for (let [key] of user.portfolio) {
            if (!playerNames.includes(key)) {
              user.portfolio.delete(key);
            }
          }
        user.netWorth = await calculateNetWorth(user);
        await user.save(); 

        res.json(user);
    } catch (error) {
        console.log(error);
    }
}
  

module.exports = {
    updatePortfolio,
    getPortfolio,
    getPrices,
    updatePortfolioPreseason,
    getProfile,
    getTotalStockCount,
    calculateStockPrice,
    calculateNetWorth,
    calculatePrices,
}