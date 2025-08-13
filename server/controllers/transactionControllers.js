const User = require('../models/user');
const Survivor = require('../models/survivors');
const PriceWatch = require('../models/pricewatch');
const Season = require('../models/seasonSettings');

const calculatePrices = async () => {
    try {
        const totalSurvivorCount = await getTotalStockCount();
        const availableSurvivors = await Survivor.find({ availability: true });
        const unavailableSurvivors = await Survivor.find({ availability: false });

        const availableSurvivorCount = availableSurvivors.length;
        const season = await Season.findOne({ isCurrentSeason: true });
        const currentMedianPrice = season.currentPrice;

        const response = {};

        for (const survivor of availableSurvivors) {
            const price = calculateStockPrice(survivor.count, totalSurvivorCount, availableSurvivorCount, currentMedianPrice);
            response[survivor.name] = price;
        }

            for (const survivor of unavailableSurvivors) {
            response[survivor.name] = survivor.price; 
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
        const survivors = await Survivor.find({});
        const response = [];

        for (const survivor of survivors) {
            const historicalprices = await fetchHistoricalPrices(survivor.name);
            response.push({
                name: survivor.name,
                profile_pic: survivor.profile_pic,
                availability: survivor.availability,
                historicalprices
            });
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


function calculateStockPrice (currentSurvivorCount, totalSurvivorCount, availableSurvivorCount, currentMedianPrice) {
    if (currentSurvivorCount === 0) {
        return 0;
    }
    try {
        let result = currentMedianPrice + (((availableSurvivorCount * (currentSurvivorCount / totalSurvivorCount)) - 1) * currentMedianPrice);
        result = Math.max(0, Math.min(result, currentMedianPrice * 2));
        return result;
    } catch (error) {
        return 1;
    }
}

async function getTotalStockCount() {
    const totalStockCount = await Survivor.aggregate([
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
        const survivor = await Survivor.findOne({ name: survivorPlayer });
        if (!user || !survivor) {
            return res.status(404).json({ error: 'User or player not found' });
        }

        const currentUserSurvivorCount = user.portfolio.get(survivorPlayer) || 0;
        const currentBudget = user.budget;
        const availableSurvivorCount = await Survivor.countDocuments({ availability: true });
        const season = await Season.findOne({ isCurrentSeason: true });
        const currentMedianPrice = season.price;

        const total = await getTotalStockCount();
        const currentPrice = calculateStockPrice(survivor.count, total, availableSurvivorCount, currentMedianPrice);
        if (action === 'buy') {
            if (currentBudget < currentPrice) {
                return res.json({ error: 'Not enough funds' });
            }
            await handleBuy(user, survivor, survivorPlayer, currentPrice);
        } else if (action === 'sell') {
            if (currentUserSurvivorCount <= 0) {
                return res.json({ error: 'No stock to sell' });
            }
            await handleSell(user, survivor, survivorPlayer, availableSurvivorCount, currentMedianPrice);
        } else {
            return res.json({ error: 'Invalid action' });
        }

        const updatedNetWorth = await calculateNetWorth(user);
        user.netWorth = updatedNetWorth;

        await Promise.all([user.save(), survivor.save()]);

        res.json(user);
    } catch (error) {
        console.error(error);
        res.json({ error: 'An error occurred while updating the portfolio' });
    }
};

// Helper function to handle buying logic
const handleBuy = async (user, survivor, stock, currentPrice) => {
    user.portfolio.set(stock, (user.portfolio.get(stock) || 0) + 1);
    user.budget -= currentPrice;
    survivor.count += 1;
};

// Helper function to handle selling logic
const handleSell = async (user, survivor, stock, availableSurvivorCount, currentMedianPrice) => {
    user.portfolio.set(stock, user.portfolio.get(stock) - 1);
    survivor.count -= 1;
    const total = await getTotalStockCount();
    const currentPrice = calculateStockPrice(survivor.count, total, availableSurvivorCount, currentMedianPrice);
    user.budget += currentPrice;
    
};

// Helper function to calculate net worth
const calculateNetWorth = async (user) => {
    const totalSurvivorCount = await getTotalStockCount();

    const availableSurvivors = await Survivor.find({ availability: true });
    const availableSurvivorCount = availableSurvivors.length;
    const season = await Season.findOne({ isCurrentSeason: true });
    const currentMedianPrice = season.currentPrice;

    const survivorPlayerPrices = {};

    for (const survivor of availableSurvivors) {
        const price = calculateStockPrice(survivor.count, totalSurvivorCount, availableSurvivorCount, currentMedianPrice);
        survivorPlayerPrices[survivor.name] = price;
    }
    return [...user.portfolio.entries()].reduce(
        (netWorth, [survivor, quantity]) => netWorth + (survivorPlayerPrices[survivor] || 0) * quantity,
        user.budget
    );
};



const updatePortfolioPreseason = async (req, res) => {
    const { userId, survivorPlayer, action } = req.body;
    try {
        const user = await User.findById(userId);
        const survivor = await Survivor.findOne({ name: survivorPlayer });
        const season = await Season.findOne({ isCurrentSeason: true });
        const price = season.currentPrice;

        if (!user || !survivor) {
            return res.json({ error: 'User or player not found' });
        }

        const currentUserSurvivorCount = user.portfolio.get(survivorPlayer) || 0;
        const currentBudget = user.budget;
        const currentSurvivorCount = survivor.count;

        // Handle buy or sell logic
        const { updatedSurvivorCount, updatedBudget, updatedUserSurvivorCount } = handlePreseasonTransaction(
            currentBudget,
            currentUserSurvivorCount,
            currentSurvivorCount,
            action,
            price
        );

        if (updatedBudget === null) {
            return res.json({
                error: action === 'buy' ? 'Not enough funds' : 'No stock to sell'
            });
        }

        // Update the user's portfolio and budget
        user.portfolio.set(survivorPlayer, updatedUserSurvivorCount);
        user.budget = updatedBudget;

        // Update the player's stock count
        survivor.count = updatedSurvivorCount;

        // Save the updated data
        await Promise.all([user.save(), survivor.save()]);

        res.json(user);
    } catch (error) {
        console.error(error);
        res.json({ error: 'An error occurred while updating the portfolio' });
    }
};

// Helper function for preseason transactions
const handlePreseasonTransaction = (budget, userStockCount, survivorStockCount, action, price) => {
    const stockPrice = price; // Fixed preseason price

    if (action === 'buy') {
        if (budget <= 0) {
            return { updatedBudget: null }; // Not enough funds
        }
        return {
            updatedSurvivorCount: survivorStockCount + 1,
            updatedBudget: budget - stockPrice,
            updatedUserSurvivorCount: userStockCount + 1
        };
    } else if (action === 'sell') {
        if (userStockCount <= 0) {
            return { updatedBudget: null }; // No stock to sell
        }
        return {
            updatedSurvivorCount: survivorStockCount - 1,
            updatedBudget: budget + stockPrice,
            updatedUserSurvivorCount: userStockCount - 1
        };
    }
    return { updatedBudget: null }; // Invalid action
};


const getPortfolio = async (req, res) => {
    const {userId} = req.query;
    try {
        const user = await User.findById(userId);
        const survivors = await Survivor.find();
        const survivorNames = survivors.map(survivor => survivor.name);
        for (let [key] of user.portfolio) {
            if (!survivorNames.includes(key)) {
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