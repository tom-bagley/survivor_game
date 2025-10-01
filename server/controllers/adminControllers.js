const User = require('../models/user');
const Survivor = require('../models/survivors');
const Season = require('../models/seasonSettings')
const recordStockPrices = require('../jobs/recordPricesJob');
const { startEpisode } = require('../jobs/checkEpisodeStatusJobs');
const Episode = require('../models/episodeSettings');

const addSurvivor = async (req, res) => {
    try {
        const { name, profile_pic, age, Hometown, Current_Residence, Occupation, Link } = req.body;
        //Check if Survivor already added
        const exist = await Survivor.findOne({name});
        if(exist) {
            return res.json({
                error: 'Survivor already added'
            });
        }

        //Create Survivor in database
        const survivor = await Survivor.create({
            name,
            profile_pic,
            age, 
            Hometown,
            Current_Residence,
            Occupation,
            youtube_interview: Link,
        });

        return res.json(survivor)
    } catch (error) {
        console.log(error);
    }
}

const resetUsers = async (req, res) => {
  const { budget, initialSurvivorPrice } = req.body;
  try {
    const users = await User.find();
    const survivors = await Survivor.find();

    const defaultPortfolio = {};
    for (const survivor of survivors) {
      survivor.price = initialSurvivorPrice;
      survivor.count = 500;
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
        isCurrentEpisode: true
      });
      res.json({message: 'Season Changed Successfully'});
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to create season '})
    }
}

const changeWeek = async (req, res) => {
    try {
      const previousEpisode = await Episode.findOne({ isCurrentEpisode: true });
      await Episode.updateMany({}, { isCurrentEpisode: false });
      const season = await Season.findOne({ isCurrentSeason: true });
      const survivors = await Survivor.find({ availability: true });
      
      season.currentWeek = season.currentWeek + 1;
      const price = season.currentPrice;
      const percentageIncrement = season.percentageIncrement;
      const newPrice = price * (1 + percentageIncrement);
      season.currentPrice = newPrice;

      const portfolio = {}
      survivors.forEach(survivor => {
            portfolio[survivor.name] = survivor.count;
        });

      previousEpisode.finalStockTotals = portfolio;
      previousEpisode.finalClosingPrice = price;
      await previousEpisode.save();
      
      const NewEpisode = await Episode.create({
        episodeNumber: season.currentWeek,
        season: season.seasonName,
        isCurrentEpisode: true
      })
      await recordStockPrices();
      await startEpisode();
      await season.save();
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
  addSurvivor,
  resetUsers,
  changeSeason,
  changeWeek,
  getCurrentSeason,
  fetchOnAirStatus,
  toggleOnAirStatus
};