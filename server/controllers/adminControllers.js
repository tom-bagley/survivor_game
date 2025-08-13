const User = require('../models/user');
const Survivor = require('../models/survivors');
const Season = require('../models/seasonSettings')
const recordStockPrices = require('../jobs/recordPricesJob');
const Episode = require('../models/episodeSettings');

const resetUsers = async (req, res) => {
  const { budget, initialSurvivorPrice } = req.body;
  try {
    const users = await User.find();
    const survivors = await Survivor.find();

    const defaultPortfolio = {};
    for (const survivor of survivors) {
      survivor.price = initialSurvivorPrice;
      survivor.count = 0;
      await survivor.save();
      defaultPortfolio[survivor.name] = 0;
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
    const { seasonName, initialPrice, percentageIncrement } = req.body;
    console.log(seasonName)
    try{
      await Episode.updateMany({}, { isCurrentEpisode: false });
      await Season.updateMany({}, { isCurrentSeason: false });
      const season = await Season.create({
        seasonName: seasonName,
        currentWeek: 0,
        currentPrice: initialPrice,
        percentageIncrement: percentageIncrement,
        isCurrentSeason: true
      });
      const episode = await Episode.create({
        season: seasonName,
        episodeNumber: 0,
        isCurrentEpisode: true,
      });
      res.json({message: 'Season Changed Successfully'});
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to create season '})
    }
}

const changeWeek = async (req, res) => {
    const { newWeek } = req.body;
    try {
      await Episode.updateMany({}, { isCurrentEpisode: false });
      const season = await Season.findOne({ isCurrentSeason: true });
      
      season.currentWeek = newWeek;
      const price = season.currentPrice;
      const percentageIncrement = season.percentageIncrement;
      const newPrice = price * (1 + percentageIncrement);
      season.currentPrice = newPrice;
      
      const episode = await Episode.create({
        episodeNumber: newWeek,
        season: season.seasonName,
        isCurrentEpisode: true
      })
      await recordStockPrices()
      await season.save();

      res.json({message: 'Week Created Successfully'});
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to create season '})
    }
}

const getCurrentSeason = async (req, res) => {
    try {
        const season = await Season.findOne({ isCurrentSeason: true });
        return res.json(season);
    } catch (error) {
        console.error(error);
        return res.json({error: 'Failed to fetch current season'})
    }
}

const fetchOnAirStatus = async (req, res) => {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    const onAirStatus = episode.onAir;
    return res.json(onAirStatus);
  } catch (error) {
    return res.json({error: 'Failed to fetch on air status'})
  }
}

const toggleOnAirStatus = async (req, res) => {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    episode.onAir = !episode.onAir;
    await episode.save()
    return res.json({ onAir: episode.onAir });
  } catch (error) {
    return res.json({error: 'Failed to fetch on air status'})
  }
}

module.exports = {
  resetUsers,
  changeSeason,
  changeWeek,
  getCurrentSeason,
  fetchOnAirStatus,
  toggleOnAirStatus
};