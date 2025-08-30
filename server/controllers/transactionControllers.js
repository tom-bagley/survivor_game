const User = require('../models/user');
const Survivor = require('../models/survivors');
const PriceWatch = require('../models/pricewatch');
const Season = require('../models/seasonSettings');
const Episode = require('../models/episodeSettings')

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
        return 0.01;
    }
    try {
        let result = currentMedianPrice + (((availableSurvivorCount * (currentSurvivorCount / totalSurvivorCount)) - 1) * currentMedianPrice);
        result = Math.max(0.01, Math.min(result, currentMedianPrice * 2));
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
    if (totalStockCount.length === 0) {
        return 1
    };
    const total = totalStockCount[0].total;
    return total;
}



const updatePortfolio = async (req, res) => {
    const { userId, survivorPlayer, amount, action } = req.body;
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
        const currentMedianPrice = season.currentPrice;

        const total = await getTotalStockCount();
        const currentPrice = calculateStockPrice(survivor.count, total, availableSurvivorCount, currentMedianPrice);
        if (action === 'buy') {
            if (currentBudget < (currentPrice*amount)) {
                return res.json({ error: 'Not enough funds' });
            }
            await handleBuy(user, survivor, survivorPlayer, currentPrice, amount);
        } else if (action === 'sell') {
            if (currentUserSurvivorCount === 0) {
                return res.json({ error: 'No stock to sell' });
            }
            else if ((currentUserSurvivorCount - amount) < 0) {
                return res.json({error: 'Not enough stock to sell'})
            }

            await handleSell(user, survivor, survivorPlayer, availableSurvivorCount, currentMedianPrice, amount);
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
const handleBuy = async (user, survivor, stock, currentPrice, amount) => {
    user.portfolio.set(stock, (user.portfolio.get(stock) || 0) + amount);
    user.budget -= (currentPrice*amount);
    survivor.count += amount;
};

// Helper function to handle selling logic
const handleSell = async (user, survivor, stock, availableSurvivorCount, currentMedianPrice, amount) => {
    user.portfolio.set(stock, user.portfolio.get(stock) - amount);
    survivor.count -= amount;
    const total = await getTotalStockCount();
    const currentPrice = calculateStockPrice(survivor.count, total, availableSurvivorCount, currentMedianPrice);
    user.budget += (currentPrice*amount);
    
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
    const { userId, survivorPlayer, action, amount } = req.body;
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
            price,
            amount
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
const handlePreseasonTransaction = (budget, userStockCount, survivorStockCount, action, price, amount) => {
    const stockPrice = price; // Fixed preseason price

    if (action === 'buy') {
        if ((amount * stockPrice) > budget) {
            return { updatedBudget: null }; // Not enough funds
        }
        return {
            updatedSurvivorCount: survivorStockCount + amount,
            updatedBudget: budget - (stockPrice * amount),
            updatedUserSurvivorCount: userStockCount + amount
        };
    } else if (action === 'sell') {
        if (userStockCount < amount) {
            return { updatedBudget: null }; // No stock to sell
        }
        return {
            updatedSurvivorCount: survivorStockCount - amount,
            updatedBudget: budget + (stockPrice * amount),
            updatedUserSurvivorCount: userStockCount - amount
        };
    }
    return { updatedBudget: null }; // Invalid action
};

const calculatePrevNetWorth = async (user) => {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    const episodeNumber = episode.episodeNumber

    if (episodeNumber === 1) {
        return 500
    }

    const lastEpisode = await Episode.findOne({
        season: episode.season,
        episodeNumber: episodeNumber - 1,
    });
    if (!lastEpisode) {
        return user.netWorth;
    }
    
    const totalStockCount = Array.from(lastEpisode.finalStockTotals.values())
        .reduce((sum, count) => sum + count, 0);
    
    const length = lastEpisode.finalStockTotals.size;

    const survivorPlayerPrices = {};

    

    for (const [name, total] of lastEpisode.finalStockTotals.entries()) {
        const price = calculateStockPrice(
            total,
            totalStockCount,
            length,
            lastEpisode.finalClosingPrice
        );
        survivorPlayerPrices[name] = price;
    }


    return [...user.portfolio.entries()].reduce(
        (netWorth, [survivor, quantity]) => netWorth + (survivorPlayerPrices[survivor] || 0) * quantity,
        user.budget
    );
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
        prevNetWorth = await calculatePrevNetWorth(user);
        await user.save(); 

        res.json({
            user,
            prevNetWorth
        });
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