const User = require('../models/user');
const UserGroupGame = require('../models/userGroupGame');
const Survivor = require('../models/survivors');
const Season = require('../models/seasonSettings')
const recordStockPrices = require('../jobs/recordPricesJob');
const { startEpisode } = require('../jobs/checkEpisodeStatusJobs');
const Episode = require('../models/episodeSettings');
const Group = require('../models/groups');

const STARTING_BUDGET = 50;

const getGroupMax = (group) => {
    const acceptedCount = group.members.filter(m => m.accepted).length || 1;
    return 50 * acceptedCount;
};

// Computes the theoretical maximum budget achievable for each group this episode.
// Perfect player: correct boot prediction ($100 per voted-out survivor) +
// all shares in the highest-bonus-rate survivor (capped by group pool).
const computeMaxPossibleBudgets = async (episode, season) => { 
    try {
        const groups = await Group.find({});

        const flatten = (arr) => (arr || []).flat();
        const bonusRates = {};
        for (const name of flatten(episode.wonChallenge))        bonusRates[name] = (bonusRates[name] || 0) + 5;
        for (const name of flatten(episode.rightSideOfVote))     bonusRates[name] = (bonusRates[name] || 0) + 3;
        for (const name of flatten(episode.playedIdolCorrectly)) bonusRates[name] = (bonusRates[name] || 0) + 8;
        for (const name of flatten(episode.foundIdol))           bonusRates[name] = (bonusRates[name] || 0) + 4;

        const bestRate = Object.values(bonusRates).length > 0
            ? Math.max(...Object.values(bonusRates))
            : 0;

        // Perfect boot prediction: position 0 for each voted-out survivor → $100 each
        const bootBonus = 100 * (episode.survivorsVotedOut?.length || 0);



        const price = season.currentPrice;

        const prevEpisodeKey    = String(episode.episodeNumber - 1);
        const currentEpisodeKey = String(episode.episodeNumber);

        const groupSaves = [];
        for (const group of groups) {
            const groupMax = getGroupMax(group);

            const prevMax = group.maxPossibleBudgets.get(prevEpisodeKey) ?? STARTING_BUDGET;

            const maxAffordable = price > 0 ? Math.floor(prevMax / price) : 0;
            const maxShares = Math.min(groupMax, maxAffordable);

            const stockCost  = maxShares * price;
            const stockBonus = maxShares * bestRate;
            const newMax     = prevMax - stockCost + bootBonus + stockBonus;

            group.maxPossibleBudgets.set(currentEpisodeKey, Math.max(newMax, 0));
            groupSaves.push(group.save());
        }
        await Promise.all(groupSaves);
    } catch (err) {
        console.error('computeMaxPossibleBudgets error:', err);
    }
};

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
    const survivors = await Survivor.find();

    const defaultPortfolio = {};

    // Reset survivors
    for (const survivor of survivors) {
      survivor.price = initialSurvivorPrice;
      survivor.countStocks = 500;
      await survivor.save();
      defaultPortfolio[survivor.name] = 0;
    }

    // Reset all UserGroupGame records
    const userGroupGames = await UserGroupGame.find();
    for (const ugGame of userGroupGames) {
      ugGame.portfolio = new Map(Object.entries(defaultPortfolio));
      ugGame.budget = budget;
      ugGame.netWorth = budget;
      ugGame.bootOrders = new Map();
      ugGame.bonuses = [];
      await ugGame.save();
    }

    res.json({ message: "All users reset successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset users" });
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

const addBonuses = async (prevEpisode) => {
  try {
    const userGroupGames = await UserGroupGame.find({});
    const bulkOps = [];

    const episodeKey = String(prevEpisode.episodeNumber);

    // Helper to flatten array-of-arrays safely
    const flatten = (arr) => (arr || []).flat();

    const challengeWinners = flatten(prevEpisode.wonChallenge);
    const rightSide = flatten(prevEpisode.rightSideOfVote);
    const correctIdols = flatten(prevEpisode.playedIdolCorrectly);
    const idolFinds = flatten(prevEpisode.foundIdol);

    for (const ugGame of userGroupGames) {

      let totalBonus = 0;
      const bonusEntries = [];

      /* -----------------------------
         1️⃣ Boot Order Bonus
      ------------------------------ */

      if (ugGame.bootOrders) {
        const predictedOrder = ugGame.bootOrders.get(episodeKey);

        if (predictedOrder) {
          for (const survivorName of prevEpisode.survivorsVotedOut) {
            const position = predictedOrder.indexOf(survivorName);

            if (position !== -1) {
              const reward = Math.max(100 - position * 20, 0);

              totalBonus += reward;

              bonusEntries.push({
                type: "bootOrder",
                episode: prevEpisode.episodeNumber,
                survivor: survivorName,
                predictedPosition: position,
                bonusAmount: reward
              });
            }
          }
        }
      }

      /* -----------------------------
         2️⃣ Stock-Based Event Bonuses
      ------------------------------ */

      const portfolio = ugGame.portfolio || {};

      const shorts = ugGame.shorts || new Map();

      const awardStockBonus = (survivorName, baseAmount, eventType) => {
        const sharesOwned = portfolio.get(survivorName) || 0;
        if (sharesOwned <= 0) return;

        const reward = sharesOwned * baseAmount;

        totalBonus += reward;

        bonusEntries.push({
          type: eventType,
          episode: prevEpisode.episodeNumber,
          survivor: survivorName,
          sharesOwned,
          bonusAmount: reward
        });
      };

      const applyShortPenalty = (survivorName, penaltyRate, eventType) => {
        const shortsOwned = shorts.get(survivorName) || 0;
        if (shortsOwned <= 0) return;

        const penalty = shortsOwned * penaltyRate;
        totalBonus -= penalty;

        bonusEntries.push({
          type: "shortPenalty",
          episode: prevEpisode.episodeNumber,
          survivor: survivorName,
          sharesOwned: shortsOwned,
          bonusAmount: -penalty
        });
      };

      // Long bonuses
      for (const name of challengeWinners) {
        awardStockBonus(name, 5, "challengeWin");
      }
      for (const name of rightSide) {
        awardStockBonus(name, 3, "rightSideVote");
      }
      for (const name of correctIdols) {
        awardStockBonus(name, 8, "playedIdolCorrectly");
      }
      for (const name of idolFinds) {
        awardStockBonus(name, 4, "foundIdol");
      }

      // Short penalties (survivor performed well — bad for short holders)
      for (const name of challengeWinners) {
        applyShortPenalty(name, 5, "challengeWin");
      }
      for (const name of rightSide) {
        applyShortPenalty(name, 3, "rightSideVote");
      }
      for (const name of correctIdols) {
        applyShortPenalty(name, 8, "playedIdolCorrectly");
      }
      for (const name of idolFinds) {
        applyShortPenalty(name, 4, "foundIdol");
      }

      // Short payouts (survivor voted out — short holders win)
      for (const survivorName of prevEpisode.survivorsVotedOut || []) {
        const shortsOwned = shorts.get(survivorName) || 0;
        if (shortsOwned <= 0) continue;

        const payout = shortsOwned * 10;
        totalBonus += payout;

        bonusEntries.push({
          type: "shortPayout",
          episode: prevEpisode.episodeNumber,
          survivor: survivorName,
          sharesOwned: shortsOwned,
          bonusAmount: payout
        });
      }

      /* -----------------------------
         3️⃣ Apply Updates
      ------------------------------ */

      if (totalBonus > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: ugGame._id },
            update: {
              $inc: { budget: totalBonus },
              $push: {
                bonuses: {
                  $each: bonusEntries
                }
              }
            }
          }
        });
      }

    }
    if (bulkOps.length > 0) {
      await UserGroupGame.bulkWrite(bulkOps);
    }

  } catch (err) {
    console.error("Error applying bonuses:", err);
  }
};



const changeWeek = async (req, res) => {
    try {
      const previousEpisode = await Episode.findOne({ isCurrentEpisode: true });
      await addBonuses(previousEpisode);
      await Episode.updateMany({}, { isCurrentEpisode: false });
      const season = await Season.findOne({ isCurrentSeason: true });
      const survivors = await Survivor.find({ availability: true });

      season.currentWeek = season.currentWeek + 1;


      const portfolio = {}
      survivors.forEach(survivor => {
            portfolio[survivor.name] = survivor.countStocks;
        });

      previousEpisode.finalStockTotals = portfolio;
      await computeMaxPossibleBudgets(previousEpisode, season);
      await previousEpisode.save();

      const NewEpisode = await Episode.create({
        episodeNumber: season.currentWeek,
        season: season.seasonName,
        isCurrentEpisode: true
      })
      await startEpisode();
      await season.save();
      res.status(200).json({message: 'successfully changed week'})
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

const updatePlayerEvent = async (req, res) => {
  let { field, playerName } = req.body;

  // Ensure playerName is always a plain string
  if (Array.isArray(playerName)) playerName = playerName[0];

  const allowed = ["foundIdol", "wonChallenge", "rightSideOfVote", "playedIdolCorrectly"];
  if (!allowed.includes(field)) {
    return res.status(400).json({ error: "Invalid field" });
  }

  const episode = await Episode.findOne({ isCurrentEpisode: true });
  if (!episode) return res.status(404).json({ error: "No active episode found" });

  const flat = episode[field].flat(); // flatten any existing nested arrays
  const alreadySet = flat.includes(playerName);

  episode[field] = alreadySet
    ? flat.filter((n) => n !== playerName)
    : [...flat, playerName];

  await episode.save();
  res.json(episode);
};

module.exports = {
  addSurvivor,
  resetUsers,
  changeSeason,
  changeWeek,
  getCurrentSeason,
  fetchOnAirStatus,
  toggleOnAirStatus,
  updatePlayerEvent
};