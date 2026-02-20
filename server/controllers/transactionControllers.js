const User = require('../models/user');
const UserGroupGame = require('../models/userGroupGame');
const Group = require('../models/groups');
const Survivor = require('../models/survivors');
const PriceWatch = require('../models/pricewatch');
const Season = require('../models/seasonSettings');
const Episode = require('../models/episodeSettings')

// Total shares/shorts available for a survivor = 50 × accepted member count
const getGroupMax = (group) => {
    if (!group) return 50;
    const acceptedCount = group.members.filter(m => m.accepted).length || 1;
    return 50 * acceptedCount;
};

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
            const price = calculateStockPrice(survivor.countStocks, totalSurvivorCount, availableSurvivorCount, currentMedianPrice);
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
        total: { $sum: "$countStocks" }
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
    const { userId, groupId, survivorPlayer, amount, action } = req.body;
    try {
        const [userGameData, survivor, season, group] = await Promise.all([
            UserGroupGame.findOne({ userId, groupId }),
            Survivor.findOne({ name: survivorPlayer }),
            Season.findOne({ isCurrentSeason: true }),
            Group.findById(groupId),
        ]);

        if (!userGameData || !survivor) {
            return res.status(404).json({ error: 'User game data or player not found' });
        }

        const currentUserSurvivorCount = userGameData.portfolio.get(survivorPlayer) || 0;
        const currentBudget = userGameData.budget;
        const availableSurvivorCount = await Survivor.countDocuments({ availability: true });
        const currentMedianPrice = season.currentPrice;

        const total = await getTotalStockCount();
        const currentPrice = calculateStockPrice(survivor.countStocks, total, availableSurvivorCount, currentMedianPrice);

        if (action === 'buy') {
            if (currentBudget < (currentPrice * amount)) {
                return res.json({ error: 'Not enough funds' });
            }
            // Enforce group share limit
            if (group) {
                const used = group.sharesUsed.get(survivorPlayer) || 0;
                const available = getGroupMax(group) - used;
                if (amount > available) {
                    return res.json({ error: `Only ${available} share${available === 1 ? '' : 's'} of ${survivorPlayer} available in this group` });
                }
            }
            await handleBuy(userGameData, survivor, survivorPlayer, currentPrice, amount);
        } else if (action === 'sell') {
            if (currentUserSurvivorCount === 0) {
                return res.json({ error: 'No stock to sell' });
            } else if ((currentUserSurvivorCount - amount) < 0) {
                return res.json({ error: 'Not enough stock to sell' });
            }
            await handleSell(userGameData, survivor, survivorPlayer, availableSurvivorCount, currentMedianPrice, amount);
        } else {
            return res.json({ error: 'Invalid action' });
        }

        // Update group sharesUsed
        if (group) {
            const currentUsed = group.sharesUsed.get(survivorPlayer) || 0;
            group.sharesUsed.set(survivorPlayer, Math.max(0, currentUsed + (action === 'buy' ? amount : -amount)));
        }

        const updatedNetWorth = await calculateNetWorth(userGameData);
        userGameData.netWorth = updatedNetWorth;

        const saves = [userGameData.save(), survivor.save()];
        if (group) saves.push(group.save());
        await Promise.all(saves);

        res.json(userGameData);
    } catch (error) {
        console.error(error);
        res.json({ error: 'An error occurred while updating the portfolio' });
    }
};

// Helper function to handle buying logic
const handleBuy = async (userGameData, survivor, stock, currentPrice, amount) => {
    userGameData.portfolio.set(stock, (userGameData.portfolio.get(stock) || 0) + amount);
    userGameData.budget -= (currentPrice*amount);
    survivor.countStocks += amount;
};

// Helper function to handle selling logic
const handleSell = async (userGameData, survivor, stock, availableSurvivorCount, currentMedianPrice, amount) => {
    userGameData.portfolio.set(stock, userGameData.portfolio.get(stock) - amount);
    survivor.countStocks -= amount;
    const total = await getTotalStockCount();
    const currentPrice = calculateStockPrice(survivor.countStocks, total, availableSurvivorCount, currentMedianPrice);
    userGameData.budget += (currentPrice*amount);

};

// Helper function to calculate net worth
const calculateNetWorth = async (userGameData) => {
    const totalSurvivorCount = await getTotalStockCount();

    const availableSurvivors = await Survivor.find({ availability: true });
    const availableSurvivorCount = availableSurvivors.length;
    const season = await Season.findOne({ isCurrentSeason: true });
    const currentMedianPrice = season.currentPrice;

    const survivorPlayerPrices = {};

    for (const survivor of availableSurvivors) {
        const price = calculateStockPrice(survivor.countStocks, totalSurvivorCount, availableSurvivorCount, currentMedianPrice);
        survivorPlayerPrices[survivor.name] = price;
    }
    return [...userGameData.portfolio.entries()].reduce(
        (netWorth, [survivor, quantity]) => netWorth + (survivorPlayerPrices[survivor] || 0) * quantity,
        userGameData.budget
    );
};



const updatePortfolioPreseason = async (req, res) => {
    const { userId, groupId, survivorPlayer, action, amount } = req.body;
    try {
        const [userGameData, survivor, season, group] = await Promise.all([
            UserGroupGame.findOne({ userId, groupId }),
            Survivor.findOne({ name: survivorPlayer }),
            Season.findOne({ isCurrentSeason: true }),
            Group.findById(groupId),
        ]);
        const price = season.currentPrice;

        if (!userGameData || !survivor) {
            return res.json({ error: 'User game data or player not found' });
        }

        const currentUserSurvivorCount = userGameData.portfolio.get(survivorPlayer) || 0;
        const currentBudget = userGameData.budget;
        const currentSurvivorCount = survivor.countStocks;

        // Enforce group share limit on buy
        if (action === 'buy' && group) {
            const used = group.sharesUsed.get(survivorPlayer) || 0;
            const available = getGroupMax(group) - used;
            if (amount > available) {
                return res.json({ error: `Only ${available} share${available === 1 ? '' : 's'} of ${survivorPlayer} available in this group` });
            }
        }

        if (action === 'short' || action === 'cover') {
            const currentUserShortCount = userGameData.shorts ? (userGameData.shorts.get(survivorPlayer) || 0) : 0;

            if (action === 'short') {
                if ((amount * price) > currentBudget) {
                    return res.json({ error: 'Not enough funds' });
                }
                if (group) {
                    const shortsUsed = group.shortsUsed.get(survivorPlayer) || 0;
                    const availableShorts = getGroupMax(group) - shortsUsed;
                    if (amount > availableShorts) {
                        return res.json({ error: `Only ${availableShorts} short${availableShorts === 1 ? '' : 's'} of ${survivorPlayer} available in this group` });
                    }
                    group.shortsUsed.set(survivorPlayer, shortsUsed + amount);
                }
                userGameData.shorts.set(survivorPlayer, currentUserShortCount + amount);
                userGameData.budget -= price * amount;
            } else {
                // cover
                if (currentUserShortCount < amount) {
                    return res.json({ error: 'Not enough shorts to cover' });
                }
                userGameData.shorts.set(survivorPlayer, currentUserShortCount - amount);
                userGameData.budget += price * amount;
                if (group) {
                    const shortsUsed = group.shortsUsed.get(survivorPlayer) || 0;
                    group.shortsUsed.set(survivorPlayer, Math.max(0, shortsUsed - amount));
                }
            }

            const saves = [userGameData.save()];
            if (group) saves.push(group.save());
            await Promise.all(saves);
            return res.json(userGameData);
        }

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
        userGameData.portfolio.set(survivorPlayer, updatedUserSurvivorCount);
        userGameData.budget = updatedBudget;

        // Update the player's stock count
        survivor.countStocks = updatedSurvivorCount;

        // Update group sharesUsed
        if (group) {
            const currentUsed = group.sharesUsed.get(survivorPlayer) || 0;
            group.sharesUsed.set(survivorPlayer, Math.max(0, currentUsed + (action === 'buy' ? amount : -amount)));
        }

        // Save the updated data
        const saves = [userGameData.save(), survivor.save()];
        if (group) saves.push(group.save());
        await Promise.all(saves);

        res.json(userGameData);
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

const calculatePrevNetWorth = async (userGameData) => {
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
        return userGameData.netWorth;
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


    return [...userGameData.portfolio.entries()].reduce(
        (netWorth, [survivor, quantity]) => netWorth + (survivorPlayerPrices[survivor] || 0) * quantity,
        userGameData.budget
    );
};


const getPortfolio = async (req, res) => {
    const { userId } = req.query;
    let { groupId } = req.query;
    try {
        // If no groupId, find or create a personal solo group for this user
        if (!groupId) {
            let soloGroup = await Group.findOne({ name: `solo_${userId}` });
            if (!soloGroup) {
                soloGroup = await Group.create({
                    name: `solo_${userId}`,
                    owner: userId,
                    members: [{ user: userId, accepted: true, joinedAt: new Date() }],
                });
            }
            groupId = soloGroup._id;
        }

        const group = await Group.findById(groupId);

        let userGameData = await UserGroupGame.findOne({ userId, groupId });
        if (!userGameData) {
            userGameData = await UserGroupGame.create({ userId, groupId });
        }

        const user = await User.findById(userId);
        const survivors = await Survivor.find();
        const survivorNames = survivors.map(survivor => survivor.name);
        for (let [key] of userGameData.portfolio) {
            if (!survivorNames.includes(key)) {
              userGameData.portfolio.delete(key);
            }
          }
        userGameData.netWorth = await calculateNetWorth(userGameData);
        prevNetWorth = await calculatePrevNetWorth(userGameData);
        await userGameData.save();

        const maxShares = getGroupMax(group);
        const availableShares = {};
        const availableShorts = {};
        survivors.forEach(s => {
            const used = group ? (group.sharesUsed.get(s.name) || 0) : 0;
            availableShares[s.name] = Math.max(0, maxShares - used);
            const shortsUsed = group ? (group.shortsUsed.get(s.name) || 0) : 0;
            availableShorts[s.name] = Math.max(0, maxShares - shortsUsed);
        });

        const currentEpisode = await Episode.findOne({ isCurrentEpisode: true });
        const episodeKey = String(currentEpisode?.episodeNumber - 1 ?? '');
        const maxPossibleBudget = group?.maxPossibleBudgets?.get(episodeKey) ?? null;

        res.json({
            groupId,
            maxSharesPerPlayer: maxShares,
            availableShares,
            availableShorts,
            maxPossibleBudget,
            user: {
                budget: userGameData.budget,
                netWorth: userGameData.netWorth,
                portfolio: userGameData.portfolio,
                shorts: userGameData.shorts,
                bootOrders: userGameData.bootOrders,
                bonuses: userGameData.bonuses,
                last_seen_episode_id: user ? user.last_seen_episode_id : 0
            },
            prevNetWorth
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the portfolio' });
    }
}

const saveBootOrder = async (req, res) => {
    const { order, userId, groupId, episodeNumber } = req.body;

    try {
        await UserGroupGame.findOneAndUpdate(
            { userId, groupId },
            {
                $set: {
                    [`bootOrders.${episodeNumber}`]: order
                }
            }
        );

        res.status(200).json({ message: "Boot order saved!" });
    } catch (err) {
        console.error("Error saving", err);
        res.status(500).json({ message: "Error saving boot order" });
    }
};



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
    saveBootOrder
}