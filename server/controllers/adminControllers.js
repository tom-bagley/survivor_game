const User = require('../models/user');
const Player = require('../models/players');
const adminSettings = require('../models/adminSettings')
const recordStockPrices = require('../jobs/recordPricesJob');

const resetUsers = async (req, res) => {
  const { budget, initialSurvivorPrice } = req.body;
  try {
    const users = await User.find();
    const players = await Player.find();

    const defaultPortfolio = {};
    for (const player of players) {
      player.price = initialSurvivorPrice;
      player.count = 0;
      await player.save();
      defaultPortfolio[player.name] = 0;
    }

    for (const user of users) {
      user.portfolio = defaultPortfolio;
      user.budget = budget;
      user.netWorth = budget; 
      await user.save();
    }

    res.json({ message: 'All users reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset users' });
  }
};

const changeSeason = async (req, res) => {
    const { season, initialPrice, percentageIncrement } = req.body;
    try {
      const settings = await adminSettings.findById("game_settings")
      settings.season = season;
      settings.week = 0;
      settings.price = initialPrice;
      settings.percentageIncrement = percentageIncrement;
      await settings.save();

      res.json({message: 'Season Changed Successfully'});
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to create season '})
    }
}

const changeWeek = async (req, res) => {
    const { newWeek } = req.body;
    try {
      const settings = await adminSettings.findById("game_settings")
      settings.week = newWeek;
      price = settings.price;
      percentageIncrement = settings.percentageIncrement;
      newPrice = price * (1 + percentageIncrement);
      settings.price = newPrice;
      recordStockPrices()
      await settings.save();

      res.json({message: 'Week Created Successfully'});
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to create season '})
    }
}

const getCurrentSeason = async (req, res) => {
    try {
        const currentSettings = await adminSettings.findById("game_settings")
        return res.json(currentSettings);
    } catch (error) {
        console.error(error);
        return res.json({error: 'Failed to fetch current season'})
    }
}

module.exports = {
  resetUsers,
  changeSeason,
  changeWeek,
  getCurrentSeason
};