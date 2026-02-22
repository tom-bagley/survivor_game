const User = require('../models/user');
const UserGroupGame = require('../models/userGroupGame');
const Group = require('../models/groups');
const Survivor = require('../models/survivors');
const Season = require('../models/seasonSettings');
const Episode = require('../models/episodeSettings')

// Total shares/shorts available for a survivor = 50 × accepted member count
const getGroupMax = (group) => {
    if (!group) return 50;
    const acceptedCount = group.members.filter(m => m.accepted).length || 1;
    return 50 * acceptedCount;
};

// Tiered purchase price based on how full the group's pool is for a survivor.
// Pool is split into 5 equal bands: $1 / $2 / $3 / $4 / $5
const calculateTierPrice = (sharesUsed, groupMax) => {
    const pct = sharesUsed / groupMax;
    if (pct < 0.2) return 1;
    if (pct < 0.4) return 2;
    if (pct < 0.6) return 3;
    if (pct < 0.8) return 4;
    return 5;
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

const getProfile = async (req, res) => {
    try {
        const survivors = await Survivor.find({}, 'name profile_pic availability');
        res.json(survivors);
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
        const [userGameData, survivor, group] = await Promise.all([
            UserGroupGame.findOne({ userId, groupId }),
            Survivor.findOne({ name: survivorPlayer }),
            Group.findById(groupId),
        ]);

        if (!userGameData || !survivor) {
            return res.status(404).json({ error: 'User game data or player not found' });
        }

        const currentUserSurvivorCount = userGameData.portfolio.get(survivorPlayer) || 0;
        const currentBudget = userGameData.budget;

        const groupMax = getGroupMax(group);
        const sharesUsed = group ? (group.sharesUsed.get(survivorPlayer) || 0) : 0;
        const currentPrice = calculateTierPrice(sharesUsed, groupMax);

        if (action === 'buy') {
            if (currentBudget < (currentPrice * amount)) {
                return res.json({ error: 'Not enough funds' });
            }
            // Enforce group share limit
            if (group) {
                const available = groupMax - sharesUsed;
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
            await handleSell(userGameData, survivor, survivorPlayer, currentPrice, amount);
        } else {
            return res.json({ error: 'Invalid action' });
        }

        // Update group sharesUsed
        if (group) {
            const currentUsed = group.sharesUsed.get(survivorPlayer) || 0;
            group.sharesUsed.set(survivorPlayer, Math.max(0, currentUsed + (action === 'buy' ? amount : -amount)));
        }

        const updatedNetWorth = await calculateNetWorth(userGameData, group);
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
const handleSell = async (userGameData, survivor, stock, currentPrice, amount) => {
    userGameData.portfolio.set(stock, userGameData.portfolio.get(stock) - amount);
    survivor.countStocks -= amount;
    userGameData.budget += (currentPrice*amount);
};

// Helper function to calculate net worth using group-specific tier pricing
const calculateNetWorth = async (userGameData, group) => {
    const availableSurvivors = await Survivor.find({ availability: true });
    const groupMax = getGroupMax(group);

    const survivorPlayerPrices = {};
    for (const survivor of availableSurvivors) {
        const sharesUsed = group ? (group.sharesUsed.get(survivor.name) || 0) : 0;
        survivorPlayerPrices[survivor.name] = calculateTierPrice(sharesUsed, groupMax);
    }
    return [...userGameData.portfolio.entries()].reduce(
        (netWorth, [survivor, quantity]) => netWorth + (survivorPlayerPrices[survivor] || 0) * quantity,
        userGameData.budget
    );
};



const updatePortfolioPreseason = async (req, res) => {
    const { userId, groupId, survivorPlayer, action, amount } = req.body;
    try {
        const [userGameData, survivor, season, group, episode] = await Promise.all([
            UserGroupGame.findOne({ userId, groupId }),
            Survivor.findOne({ name: survivorPlayer }),
            Season.findOne({ isCurrentSeason: true }),
            Group.findById(groupId),
            Episode.findOne({ isCurrentEpisode: true }),
        ]);
        const fixedShortPrice = season.currentPrice; // shorts keep the fixed price
        const isOnAir = episode?.onAir ?? false;
        const isTribalCouncil = episode?.tribalCouncil ?? false;

        if (!userGameData || !survivor) {
            return res.json({ error: 'User game data or player not found' });
        }

        // Tribal council: all trading locked
        if (isTribalCouncil && (action === 'buy' || action === 'short')) {
            return res.json({ error: 'Trading locked — tribal council in progress' });
        }

        const currentUserSurvivorCount = userGameData.portfolio.get(survivorPlayer) || 0;
        const currentBudget = userGameData.budget;
        const currentSurvivorCount = survivor.countStocks;

        // During on-air, only bonus money (above the locked snapshot) can be spent
        const bonusBalance = (isOnAir && userGameData.lockedBudget != null)
            ? Math.max(0, currentBudget - userGameData.lockedBudget)
            : null;

        const groupMax = getGroupMax(group);
        const sharesUsed = group ? (group.sharesUsed.get(survivorPlayer) || 0) : 0;
        const tierPrice = calculateTierPrice(sharesUsed, groupMax);

        // Enforce group share limit on buy
        if (action === 'buy' && group) {
            const available = groupMax - sharesUsed;
            if (amount > available) {
                return res.json({ error: `Only ${available} share${available === 1 ? '' : 's'} of ${survivorPlayer} available in this group` });
            }
        }

        if (action === 'short' || action === 'cover') {
            const currentUserShortCount = userGameData.shorts ? (userGameData.shorts.get(survivorPlayer) || 0) : 0;

            if (action === 'short') {
                const cost = amount * fixedShortPrice;
                if (bonusBalance !== null ? cost > bonusBalance : cost > currentBudget) {
                    return res.json({ error: bonusBalance !== null ? 'Not enough bonus funds' : 'Not enough funds' });
                }
                if (group) {
                    const shortsUsed = group.shortsUsed.get(survivorPlayer) || 0;
                    const availableShorts = groupMax - shortsUsed;
                    if (amount > availableShorts) {
                        return res.json({ error: `Only ${availableShorts} short${availableShorts === 1 ? '' : 's'} of ${survivorPlayer} available in this group` });
                    }
                    group.shortsUsed.set(survivorPlayer, shortsUsed + amount);
                }
                userGameData.shorts.set(survivorPlayer, currentUserShortCount + amount);
                userGameData.budget -= fixedShortPrice * amount;
            } else {
                // cover
                if (currentUserShortCount < amount) {
                    return res.json({ error: 'Not enough shorts to cover' });
                }
                userGameData.shorts.set(survivorPlayer, currentUserShortCount - amount);
                userGameData.budget += fixedShortPrice * amount;
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

        // During on-air, buying is limited to bonus balance only
        if (action === 'buy' && bonusBalance !== null && tierPrice * amount > bonusBalance) {
            return res.json({ error: 'Not enough bonus funds' });
        }

        // Handle buy or sell logic
        const { updatedSurvivorCount, updatedBudget, updatedUserSurvivorCount } = handlePreseasonTransaction(
            currentBudget,
            currentUserSurvivorCount,
            currentSurvivorCount,
            action,
            tierPrice,
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
        userGameData.netWorth = await calculateNetWorth(userGameData, group);
        prevNetWorth = await calculatePrevNetWorth(userGameData);
        await userGameData.save();

        const maxShares = getGroupMax(group);
        const availableShares = {};
        const availableShorts = {};
        const currentPrices = {};
        survivors.forEach(s => {
            const used = group ? (group.sharesUsed.get(s.name) || 0) : 0;
            availableShares[s.name] = Math.max(0, maxShares - used);
            const shortsUsed = group ? (group.shortsUsed.get(s.name) || 0) : 0;
            availableShorts[s.name] = Math.max(0, maxShares - shortsUsed);
            currentPrices[s.name] = calculateTierPrice(used, maxShares);
        });

        const currentEpisode = await Episode.findOne({ isCurrentEpisode: true });
        const episodeKey = String(currentEpisode?.episodeNumber - 1 ?? '');
        const maxPossibleBudget = group?.maxPossibleBudgets?.get(episodeKey) ?? null;
        const maxPossibleLog    = group?.maxPossibleLog?.get(episodeKey) ?? null;

        const liveBonusBalance = (currentEpisode?.onAir && userGameData.lockedBudget != null)
            ? Math.max(0, userGameData.budget - userGameData.lockedBudget)
            : null;

        res.json({
            groupId,
            maxSharesPerPlayer: maxShares,
            availableShares,
            availableShorts,
            currentPrices,
            maxPossibleBudget,
            maxPossibleLog,
            user: {
                budget: userGameData.budget,
                netWorth: userGameData.netWorth,
                portfolio: userGameData.portfolio,
                shorts: userGameData.shorts,
                bootOrders: userGameData.bootOrders,
                bonuses: userGameData.bonuses,
                last_seen_episode_id: user ? user.last_seen_episode_id : 0,
                liveBonusBalance,
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