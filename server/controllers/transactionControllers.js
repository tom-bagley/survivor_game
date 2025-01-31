const User = require('../models/user');
const Player = require('../models/players');

// Reusable function to calculate stock prices
// Reusable function to calculate stock prices
const calculatePrices = async () => {
    try {
        const totalPlayerCount = await getTotalStockCount(); // Ensure this function works correctly
        const players = await Player.find({});
        const response = players.reduce((acc, player) => {
            const price = calculateStockPrice(player.count, totalPlayerCount);
            acc[player.name] = price;
            return acc; // Ensure the accumulator is returned
        }, {});
        return response; // Return the response for further use
    } catch (error) {
        console.error("Error occurred while calculating prices:", error);
        throw error; // Throw error so it can be handled by the caller
    }
};




// HTTP handler that uses the reusable function
const getPrices = async (req, res) => {
    try {
        const response = await calculatePrices(); // Call the reusable function
        res.json(response); // Send the response as JSON
    } catch (error) {
        res.status(500).json({ message: error.message }); // Send error response
    }
};

const getProfile = async (req, res) => {
    try {
        const players = await Player.find({});
        const response = players.reduce((acc, player) => {
            const profile = player.profile_pic
            acc[player.name] = profile;
            return acc; // Ensure the accumulator is returned
        }, {});
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message }); // Send error response
    }
};


function calculateStockPrice(currentPlayerCount, totalPlayerCount) {
    try {
        let result = 1 + (13.28771237 * Math.log(1 + (currentPlayerCount / totalPlayerCount)));
        return result;
    } catch (error) {
        return 1;
    }
}

async function getTotalStockCount() {
    const totalStockCount = await Player.aggregate([
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
    const { userId, stock, action } = req.body;

    try {
        const user = await User.findById(userId);
        const player = await Player.findOne({ name: stock });
        if (!user || !player) {
            return res.status(404).json({ error: 'User or player not found' });
        }

        const currentUserPlayerCount = user.portfolio.get(stock) || 0;
        const currentBudget = user.budget;

        const total = await getTotalStockCount();
        const currentPrice = calculateStockPrice(player.count, total);
        if (action === 'buy') {
            if (currentBudget < currentPrice) {
                return res.json({ error: 'Not enough funds' });
            }
            await handleBuy(user, player, stock, currentPrice);
        } else if (action === 'sell') {
            if (currentUserPlayerCount <= 0) {
                return res.json({ error: 'No stock to sell' });
            }
            await handleSell(user, player, stock);
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
const handleSell = async (user, player, stock) => {
    user.portfolio.set(stock, user.portfolio.get(stock) - 1);
    player.count -= 1;
    const total = await getTotalStockCount();
    const currentPrice = calculateStockPrice(player.count, total);
    user.budget += currentPrice;
    
};

// Helper function to calculate net worth
const calculateNetWorth = async (user) => {
    const stockPrices = await calculatePrices();
    return [...user.portfolio.entries()].reduce(
        (netWorth, [stock, quantity]) => netWorth + (stockPrices[stock] || 0) * quantity,
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
        const players = await Player.find({ availability: true });
        const playerNames = players.map(player => player.name); // Extract the names of players
        for (let [key] of user.portfolio) {
            if (!playerNames.includes(key)) {
              user.portfolio.delete(key);
            }
          }

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
}