const User = require('../models/user');
const UserGroupGame = require('../models/userGroupGame');
const Survivor = require('../models/survivors');
const Season = require('../models/seasonSettings')
const recordStockPrices = require('../jobs/recordPricesJob');
const { startEpisode } = require('../jobs/checkEpisodeStatusJobs');
const Episode = require('../models/episodeSettings');
const Group = require('../models/groups');

const STARTING_BUDGET = 100;

// Per-share bonus for challenge winners, tiered by challenge type
const CHALLENGE_WIN_RATES = {
  individual: 2.50,
  team:       1.50,
  reward:     0.50,
};

const getGroupMax = (group) => {
    const acceptedCount = group.members.filter(m => m.accepted).length || 1;
    return STARTING_BUDGET * acceptedCount;
};

// Returns a list of event label strings for a given survivor this episode.
const getEventLabels = (name, episode) => {
    const flat = (arr) => (arr || []).flat();
    const labels = [];
    if (flat(episode.wonChallenge).includes(name))        labels.push('Won Challenge');
    if (flat(episode.lostChallenge).includes(name))       labels.push('Lost Challenge');
    if (flat(episode.rightSideOfVote).includes(name))     labels.push('Right Side Vote');
    if (flat(episode.wrongSideOfVote).includes(name))     labels.push('Wrong Side Vote');
    if (flat(episode.foundIdol).includes(name))           labels.push('Found Idol');
    if (flat(episode.playedIdolCorrectly).includes(name)) labels.push('Played Idol');
    return labels;
};

// Computes the theoretical maximum budget achievable for each group this episode.
// Simulates a perfect player: correct boot order + greedy stock allocation
// across all positive-bonus survivors, sorted by bonus-per-dollar.
const computeMaxPossibleBudgets = async (episode, season) => {
    try {
        const groups = await Group.find({});
        const flat = (arr) => (arr || []).flat();

        // --- Per-player net bonus rate (long shares) ---
        const bonusRates = {};
        const add = (names, rate) => { for (const n of flat(names)) bonusRates[n] = (bonusRates[n] || 0) + rate; };
        // Challenge wins: use per-type rates from liveChallengeEvents
        for (const event of (episode.liveChallengeEvents || [])) {
            const rate = CHALLENGE_WIN_RATES[event.challengeType] ?? 1.00;
            for (const name of (event.winners || [])) {
                bonusRates[name] = (bonusRates[name] || 0) + rate;
            }
        }
        add(episode.rightSideOfVote,     0.50);
        add(episode.foundIdol,           2.50);
        add(episode.playedIdolCorrectly, 10.00);

        // Voted-out survivors: their long stock becomes worthless this episode — skip them
        for (const name of (episode.survivorsVotedOut || [])) delete bonusRates[name];

        // --- Boot order bonus: perfect prediction = $40 per voted-out survivor ---
        const votedOut = episode.survivorsVotedOut || [];
        const bootOrderBonus = votedOut.length * 20;

        // --- Stock pricing from finalStockTotals ---
        const stockTotals = episode.finalStockTotals || new Map();
        const totalShares = [...stockTotals.values()].reduce((a, b) => a + b, 0);
        const numSurvivors = stockTotals.size;
        const medianPrice  = episode.finalClosingPrice || season.currentPrice || 5;

        const getPrice = (survivorName) => {
            const survivorShares = stockTotals.get(survivorName) || 0;
            if (survivorShares === 0 || totalShares === 0) return medianPrice;
            const p = medianPrice + (((numSurvivors * (survivorShares / totalShares)) - 1) * medianPrice);
            return Math.max(0.01, Math.min(p, medianPrice * 2));
        };

        // --- Candidates: positive net bonus only, sorted by bonus-per-dollar desc ---
        const candidates = Object.entries(bonusRates)
            .filter(([, rate]) => rate > 0)
            .map(([name, rate]) => {
                const price = getPrice(name);
                return { name, rate, price, bonusPerDollar: rate / price, events: getEventLabels(name, episode) };
            })
            .sort((a, b) => b.bonusPerDollar - a.bonusPerDollar);

        const episodeKey     = String(episode.episodeNumber);
        const prevEpisodeKey = String(episode.episodeNumber - 1);

        const groupSaves = [];
        for (const group of groups) {
            const poolPerSurvivor = getGroupMax(group); // 50 × accepted members
            const prevMax = group.maxPossibleBudgets.get(prevEpisodeKey) ?? STARTING_BUDGET;

            let availableBudget = prevMax;
            let totalStockBonus = 0;
            const stockAllocations = [];

            for (const { name, rate, price, events } of candidates) {
                if (availableBudget < price) break;

                const maxByBudget = Math.floor(availableBudget / price);
                const sharesToBuy = Math.min(maxByBudget, poolPerSurvivor);
                if (sharesToBuy <= 0) continue;

                const cost  = sharesToBuy * price;
                const bonus = sharesToBuy * rate;
                availableBudget  -= cost;
                totalStockBonus  += bonus;

                stockAllocations.push({
                    survivor:     name,
                    shares:       sharesToBuy,
                    pricePerShare: parseFloat(price.toFixed(4)),
                    bonusPerShare: rate,
                    totalBonus:   parseFloat(bonus.toFixed(4)),
                    events,
                });
            }

            // Stocks are treated as recovered at purchase price (simplified model).
            // Net budget change = only the bonuses earned.
            const endBudget = prevMax + bootOrderBonus + totalStockBonus;

            const log = {
                episodeNumber:    episode.episodeNumber,
                startBudget:      parseFloat(prevMax.toFixed(4)),
                bootOrderBonus:   bootOrderBonus,
                votedOut:         votedOut.map(name => ({ survivor: name, bonus: 10 })),
                stockAllocations,
                totalStockBonus:  parseFloat(totalStockBonus.toFixed(4)),
                endBudget:        parseFloat(endBudget.toFixed(4)),
            };

            group.maxPossibleBudgets.set(episodeKey, endBudget);
            group.maxPossibleLog.set(episodeKey, log);
            group.markModified('maxPossibleLog');
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

    // Reset group share usage so tier pricing starts fresh
    const groups = await Group.find();
    for (const group of groups) {
      group.sharesUsed = new Map();
      await group.save();
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
    const challengeLosers = flatten(prevEpisode.lostChallenge);
    const rightSide = flatten(prevEpisode.rightSideOfVote);
    const wrongSide = flatten(prevEpisode.wrongSideOfVote);
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
          const positiveRewards = [20, 5, 3, 1, 0.5];

          for (const survivorName of prevEpisode.survivorsVotedOut) {
            const position = predictedOrder.indexOf(survivorName);

            if (position !== -1) {
              let reward = 0;
              if (position < positiveRewards.length) {
                reward = positiveRewards[position];
              }

              if (reward !== 0) {
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
      }

      /* -----------------------------
         2️⃣ Finale Order Bonus
         (only scores when prevEpisode.finalists is populated,
          i.e. the finale has resolved — finalists[0] = winner, etc.)
      ------------------------------ */

      if (ugGame.finaleOrders && prevEpisode.finalists?.length > 0) {
        const predictedOrder = ugGame.finaleOrders.get(episodeKey);

        if (predictedOrder) {
          const finaleRewards = [10, 5, 2.5, 1.5, 1, 0.5];

          prevEpisode.finalists.forEach((survivorName, actualPosition) => {
            const predictedPosition = predictedOrder.indexOf(survivorName);

            if (predictedPosition !== -1 && predictedPosition === actualPosition) {
              const reward = finaleRewards[actualPosition] ?? 0;
              if (reward !== 0) {
                totalBonus += reward;
                bonusEntries.push({
                  type: "finaleOrder",
                  episode: prevEpisode.episodeNumber,
                  survivor: survivorName,
                  predictedPosition,
                  bonusAmount: reward
                });
              }
            }
          });
        }
      }

      /* -----------------------------
         3️⃣ Stock-Based Event Bonuses
      ------------------------------ */

      const portfolio = ugGame.portfolio || {};

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

      // Build lookup of events already applied live (skip them here)
      const liveEventSet = new Set(
        (prevEpisode.liveEventBonuses || []).map(e => `${e.survivorName}:${e.field}`)
      );
      const notLive = (name, field) => !liveEventSet.has(`${name}:${field}`);

      // Long bonuses — challenge wins use per-type rates from liveChallengeEvents
      // Build a winner→rate map; fall back to 1.00 for any not covered by a batch event
      const challengeWinnerRates = {};
      for (const event of (prevEpisode.liveChallengeEvents || [])) {
        const rate = CHALLENGE_WIN_RATES[event.challengeType] ?? 1.00;
        for (const name of (event.winners || [])) {
          challengeWinnerRates[name] = Math.max(challengeWinnerRates[name] || 0, rate);
        }
      }
      for (const name of challengeWinners) {
        if (!(name in challengeWinnerRates)) challengeWinnerRates[name] = 0.50;
      }
      for (const [name, rate] of Object.entries(challengeWinnerRates)) {
        if (notLive(name, 'wonChallenge')) awardStockBonus(name, rate, "challengeWin");
      }
      for (const name of rightSide) {
        if (notLive(name, 'rightSideOfVote')) awardStockBonus(name, 0.50, "rightSideVote");
      }
      for (const name of correctIdols) {
        if (notLive(name, 'playedIdolCorrectly')) awardStockBonus(name, 10.00, "playedIdolCorrectly");
      }
      const liveIdolApplied = new Set((prevEpisode.liveIdolEvents || []).map(e => e.survivorName));
      for (const name of idolFinds) {
        if (liveIdolApplied.has(name)) continue; // bonus already applied live during episode
        awardStockBonus(name, 2.50, "foundIdol");
      }

      /* -----------------------------
         4️⃣ Apply Updates
      ------------------------------ */

      if (totalBonus !== 0 || bonusEntries.length > 0) {
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



// Core week-advance logic shared by manual route and auto toggle-off.
// Does NOT start the new episode (onAir stays false on the new episode record).
const doChangeWeek = async () => {
    const previousEpisode = await Episode.findOne({ isCurrentEpisode: true });
    await addBonuses(previousEpisode);
    await Episode.updateMany({}, { isCurrentEpisode: false });
    const season = await Season.findOne({ isCurrentSeason: true });
    const survivors = await Survivor.find({ availability: true });

    season.currentWeek = season.currentWeek + 1;

    const portfolio = {};
    survivors.forEach(survivor => { portfolio[survivor.name] = survivor.countStocks; });

    previousEpisode.finalStockTotals = portfolio;
    await computeMaxPossibleBudgets(previousEpisode, season);
    await previousEpisode.save();

    await Episode.create({
        episodeNumber: season.currentWeek,
        season: season.seasonName,
        isCurrentEpisode: true,
        lastEpisodeVotedOut: previousEpisode.survivorsVotedOut || [],
        // onAir defaults to false — admin will toggle on when ready
    });
    await season.save();
    return season.currentWeek;
};

const changeWeek = async (req, res) => {
    try {
      const newWeek = await doChangeWeek();
      res.status(200).json({ message: 'successfully changed week', week: newWeek });
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
    const wasOnAir = episode.onAir;

    if (wasOnAir) {
      // Turning OFF → advance the week
      episode.onAir = false;
      episode.episodeEndTime = null;
      await episode.save();
      const newWeek = await doChangeWeek();
      return res.json({ onAir: false, weekAdvanced: true, newWeek });
    } else {
      // Turning ON → snapshot each user's current net worth before the episode airs
      const { calculateNetWorth } = require('./transactionControllers');
      const [allGames, allGroups] = await Promise.all([
        UserGroupGame.find({}),
        Group.find({}),
      ]);
      const groupMap = new Map(allGroups.map(g => [String(g._id), g]));
      await Promise.all(allGames.map(async (game) => {
        const grp = groupMap.get(String(game.groupId)) || null;
        const nw = await calculateNetWorth(game, grp);
        game.netWorth = nw;
        game.prevNetWorthSnapshot = nw;
        game.episodeSnapshotId = episode.episodeNumber;
        return game.save();
      }));

      episode.onAir = true;
      await episode.save();
      return res.json({ onAir: true, weekAdvanced: false });
    }
  } catch (error) {
    console.error('toggleOnAirStatus error:', error);
    return res.json({ error: 'Failed to toggle on air status' });
  }
}

const applyChallengeBatch = async (req, res) => {
  try {
    const { challengeType, winners = [], losers = [] } = req.body;

    if (!challengeType) return res.status(400).json({ error: 'challengeType is required' });
    if (winners.length === 0 && losers.length === 0) {
      return res.status(400).json({ error: 'Select at least one winner or loser' });
    }

    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (!episode) return res.status(404).json({ error: 'No active episode found' });

    const isOnAir = episode.onAir ?? false;
    const flat = (arr) => (arr || []).flat();

    // Prevent re-applying players already submitted for THIS challenge type
    const existingForType = (episode.liveChallengeEvents || []).filter(e => e.challengeType === challengeType);
    const alreadyWonInType  = new Set(existingForType.flatMap(e => e.winners || []));
    const alreadyLostInType = new Set(existingForType.flatMap(e => e.losers  || []));

    const newWinners = winners.filter(n => !alreadyWonInType.has(n));
    const newLosers  = losers.filter(n => !alreadyLostInType.has(n));

    if (isOnAir && (newWinners.length > 0 || newLosers.length > 0)) {
      const allGames = await UserGroupGame.find({});
      const bulkOps = [];

      const wonRates  = { longRate: CHALLENGE_WIN_RATES[challengeType] ?? 0.50, longType: 'challengeWin'  };
      const lostRates = { longRate: 0, longType: 'challengeLoss' };

      for (const ugGame of allGames) {
        let totalBonus = 0;
        const bonusEntries = [];

        const applyRates = (survivorName, rates) => {
          const sharesOwned = (ugGame.portfolio || new Map()).get(survivorName) || 0;
          if (sharesOwned > 0 && rates.longRate !== 0) {
            const reward = sharesOwned * rates.longRate;
            totalBonus += reward;
            bonusEntries.push({ type: rates.longType, episode: episode.episodeNumber, survivor: survivorName, sharesOwned, bonusAmount: reward });
          }
        };

        for (const name of newWinners) applyRates(name, wonRates);
        for (const name of newLosers)  applyRates(name, lostRates);

        if (totalBonus !== 0 || bonusEntries.length > 0) {
          bulkOps.push({
            updateOne: {
              filter: { _id: ugGame._id },
              update: {
                $inc: { budget: totalBonus },
                $push: { bonuses: { $each: bonusEntries } },
              },
            },
          });
        }
      }

      if (bulkOps.length > 0) await UserGroupGame.bulkWrite(bulkOps);
    }

    // Record winners/losers in episode arrays
    const existingWon  = flat(episode.wonChallenge);
    const existingLost = flat(episode.lostChallenge);
    for (const n of winners) { if (!existingWon.includes(n))  episode.wonChallenge  = [...flat(episode.wonChallenge),  n]; }
    for (const n of losers)  { if (!existingLost.includes(n)) episode.lostChallenge = [...flat(episode.lostChallenge), n]; }

    // Mark in liveEventBonuses so addBonuses skips them at episode end
    const newEventBonusEntries = [
      ...newWinners.map(n => ({ survivorName: n, field: 'wonChallenge',  appliedAt: new Date() })),
      ...newLosers.map(n  => ({ survivorName: n, field: 'lostChallenge', appliedAt: new Date() })),
    ];
    if (newEventBonusEntries.length > 0) {
      episode.liveEventBonuses = [...(episode.liveEventBonuses || []), ...newEventBonusEntries];
    }

    // One combined challenge notification entry
    episode.liveChallengeEvents = [
      ...(episode.liveChallengeEvents || []),
      { challengeType, winners, losers, appliedAt: new Date() },
    ];

    await episode.save();
    res.json(episode);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const applyVoteBatch = async (req, res) => {
  try {
    const { rightSide = [], wrongSide = [] } = req.body;

    if (rightSide.length === 0 && wrongSide.length === 0) {
      return res.status(400).json({ error: 'Select at least one player' });
    }

    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (!episode) return res.status(404).json({ error: 'No active episode found' });

    const isOnAir = episode.onAir ?? false;
    const flat = (arr) => (arr || []).flat();

    // Deduplicate against already-applied liveEventBonuses entries
    const alreadyRight = new Set((episode.liveEventBonuses || []).filter(e => e.field === 'rightSideOfVote').map(e => e.survivorName));
    const alreadyWrong = new Set((episode.liveEventBonuses || []).filter(e => e.field === 'wrongSideOfVote').map(e => e.survivorName));
    const newRight = rightSide.filter(n => !alreadyRight.has(n));
    const newWrong = wrongSide.filter(n => !alreadyWrong.has(n));

    if (isOnAir && (newRight.length > 0 || newWrong.length > 0)) {
      const allGames = await UserGroupGame.find({});
      const bulkOps = [];

      const rightRates = { longRate: +0.50, longType: 'rightSideVote' };
      const wrongRates = { longRate: 0,     longType: 'wrongSideVote' };

      for (const ugGame of allGames) {
        let totalBonus = 0;
        const bonusEntries = [];

        const applyRates = (survivorName, rates) => {
          const sharesOwned = (ugGame.portfolio || new Map()).get(survivorName) || 0;
          if (sharesOwned > 0 && rates.longRate !== 0) {
            const reward = sharesOwned * rates.longRate;
            totalBonus += reward;
            bonusEntries.push({ type: rates.longType, episode: episode.episodeNumber, survivor: survivorName, sharesOwned, bonusAmount: reward });
          }
        };

        for (const name of newRight) applyRates(name, rightRates);
        for (const name of newWrong) applyRates(name, wrongRates);

        if (totalBonus !== 0 || bonusEntries.length > 0) {
          bulkOps.push({
            updateOne: {
              filter: { _id: ugGame._id },
              update: {
                $inc: { budget: totalBonus },
                $push: { bonuses: { $each: bonusEntries } },
              },
            },
          });
        }
      }

      if (bulkOps.length > 0) await UserGroupGame.bulkWrite(bulkOps);
    }

    // Record in episode arrays for end-of-episode bonus tracking
    const existingRight = flat(episode.rightSideOfVote);
    const existingWrong = flat(episode.wrongSideOfVote);
    for (const n of rightSide) { if (!existingRight.includes(n)) episode.rightSideOfVote = [...existingRight, n]; }
    for (const n of wrongSide) { if (!existingWrong.includes(n)) episode.wrongSideOfVote = [...existingWrong, n]; }

    // Mark in liveEventBonuses so addBonuses skips them at episode end
    const newEventBonusEntries = [
      ...newRight.map(n => ({ survivorName: n, field: 'rightSideOfVote', appliedAt: new Date() })),
      ...newWrong.map(n => ({ survivorName: n, field: 'wrongSideOfVote', appliedAt: new Date() })),
    ];
    if (newEventBonusEntries.length > 0) {
      episode.liveEventBonuses = [...(episode.liveEventBonuses || []), ...newEventBonusEntries];
    }

    // One combined vote notification entry
    episode.liveVoteEvents = [
      ...(episode.liveVoteEvents || []),
      { rightSide, wrongSide, appliedAt: new Date() },
    ];

    await episode.save();
    res.json(episode);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Rates applied immediately when admin marks an event during a live episode.
// foundIdol is handled separately via applyLiveIdolBonus.
const LIVE_EVENT_RATES = {
  wonChallenge:        { longRate: +0.50,  longType: 'challengeWin'       },
  lostChallenge:       { longRate: 0,      longType: 'challengeLoss'       },
  rightSideOfVote:     { longRate: +0.50,  longType: 'rightSideVote'       },
  wrongSideOfVote:     { longRate: 0,      longType: 'wrongSideVote'       },
  playedIdolCorrectly: { longRate: +10.00, longType: 'playedIdolCorrectly' },
};

const updatePlayerEvent = async (req, res) => {
  let { field, playerName } = req.body;

  // Ensure playerName is always a plain string
  if (Array.isArray(playerName)) playerName = playerName[0];

  const allowed = ["foundIdol", "wonChallenge", "rightSideOfVote", "playedIdolCorrectly", "lostChallenge", "wrongSideOfVote"];
  if (!allowed.includes(field)) {
    return res.status(400).json({ error: "Invalid field" });
  }

  const episode = await Episode.findOne({ isCurrentEpisode: true });
  if (!episode) return res.status(404).json({ error: "No active episode found" });

  const flat = episode[field].flat();
  const alreadySet = flat.includes(playerName);
  const rates = LIVE_EVENT_RATES[field]; // undefined for foundIdol
  const isOnAir = episode.onAir ?? false;

  if (alreadySet) {
    // Toggling OFF — block if bonus was already applied live
    const alreadyApplied = (episode.liveEventBonuses || []).some(
      e => e.survivorName === playerName && e.field === field
    );
    if (alreadyApplied) {
      // Already in the desired state — return success idempotently
      return res.json(episode);
    }
    episode[field] = flat.filter(n => n !== playerName);
  } else {
    // Toggling ON
    episode[field] = [...flat, playerName];

    // Apply bonus immediately when on-air and this event has rates
    if (isOnAir && rates) {
      const userGroupGames = await UserGroupGame.find({});
      const bulkOps = [];
      const episodeNumber = episode.episodeNumber;

      for (const ugGame of userGroupGames) {
        let totalBonus = 0;
        const bonusEntries = [];

        // Long position
        if (rates.longRate !== 0) {
          const sharesOwned = (ugGame.portfolio || new Map()).get(playerName) || 0;
          if (sharesOwned > 0) {
            const reward = sharesOwned * rates.longRate;
            totalBonus += reward;
            bonusEntries.push({
              type: rates.longType,
              episode: episodeNumber,
              survivor: playerName,
              sharesOwned,
              bonusAmount: reward,
            });
          }
        }

        if (totalBonus !== 0 || bonusEntries.length > 0) {
          bulkOps.push({
            updateOne: {
              filter: { _id: ugGame._id },
              update: {
                $inc: { budget: totalBonus },
                $push: { bonuses: { $each: bonusEntries } },
              },
            },
          });
        }
      }

      if (bulkOps.length > 0) {
        await UserGroupGame.bulkWrite(bulkOps);
      }

      // Record so addBonuses skips this at episode end
      episode.liveEventBonuses = [
        ...(episode.liveEventBonuses || []),
        { survivorName: playerName, field, appliedAt: new Date() },
      ];
    }
  }

  await episode.save();
  res.json(episode);
};

const setFinalist = async (req, res) => {
  try {
    const { place, playerName } = req.body; // place: 0 (1st), 1 (2nd), 2 (3rd)
    if (![0, 1, 2].includes(Number(place))) {
      return res.status(400).json({ error: "place must be 0, 1, or 2" });
    }

    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (!episode) return res.status(404).json({ error: "No active episode found" });

    const finalists = [...(episode.finalists || [])];
    while (finalists.length <= Number(place)) finalists.push("");
    finalists[Number(place)] = playerName || "";

    episode.finalists = finalists;
    await episode.save();
    res.json(episode);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to set finalist" });
  }
};

const awardFinalistBonuses = async (req, res) => {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (!episode) return res.status(404).json({ error: "No active episode found" });

    const finalists = (episode.finalists || []).filter(Boolean);
    if (finalists.length === 0) return res.status(400).json({ error: "No finalists set on the current episode" });

    const rates = [25.00, 5.00, 2.50]; // 1st, 2nd, 3rd

    const userGroupGames = await UserGroupGame.find({});
    const bulkOps = [];

    for (const ugGame of userGroupGames) {
      let totalBonus = 0;
      const bonusEntries = [];
      const portfolio = ugGame.portfolio || {};

      finalists.forEach((survivorName, placeIndex) => {
        const rate = rates[placeIndex];
        if (!rate) return;
        const sharesOwned = portfolio.get(survivorName) || 0;
        if (sharesOwned <= 0) return;

        const reward = sharesOwned * rate;
        totalBonus += reward;

        bonusEntries.push({
          type: "finalistBonus",
          episode: episode.episodeNumber,
          survivor: survivorName,
          sharesOwned,
          bonusAmount: reward,
        });
      });

      if (totalBonus > 0 || bonusEntries.length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: ugGame._id },
            update: {
              $inc: { budget: totalBonus },
              $push: { bonuses: { $each: bonusEntries } },
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await UserGroupGame.bulkWrite(bulkOps);
    }

    res.json({ success: true, finalists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to award finalist bonuses" });
  }
};

const applyLiveIdolBonus = async (req, res) => {
  try {
    let { survivorName } = req.body;
    if (Array.isArray(survivorName)) survivorName = survivorName[0];
    if (!survivorName) return res.status(400).json({ error: "survivorName required" });

    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (!episode) return res.status(404).json({ error: "No active episode found" });

    const alreadyApplied = (episode.liveIdolEvents || []).some(e => e.survivorName === survivorName);
    if (alreadyApplied) return res.status(400).json({ error: "Bonus already applied for this survivor" });

    const bonusPerShare = 2.50;
    const episodeNumber = episode.episodeNumber;

    const userGroupGames = await UserGroupGame.find({});
    const bulkOps = [];

    for (const ugGame of userGroupGames) {
      const sharesOwned = (ugGame.portfolio || new Map()).get(survivorName) || 0;
      if (sharesOwned <= 0) continue;

      const bonusAmount = sharesOwned * bonusPerShare;
      bulkOps.push({
        updateOne: {
          filter: { _id: ugGame._id },
          update: {
            $inc: { budget: bonusAmount },
            $push: {
              bonuses: {
                type: "foundIdol",
                episode: episodeNumber,
                survivor: survivorName,
                sharesOwned,
                bonusAmount,
              },
            },
          },
        },
      });
    }

    if (bulkOps.length > 0) {
      await UserGroupGame.bulkWrite(bulkOps);
    }

    // Record live event and ensure foundIdol flag is set
    episode.liveIdolEvents = [
      ...(episode.liveIdolEvents || []),
      { survivorName, appliedAt: new Date(), bonusPerShare },
    ];
    const flat = episode.foundIdol.flat();
    if (!flat.includes(survivorName)) {
      episode.foundIdol = [...flat, survivorName];
    }
    await episode.save();

    res.json({ success: true, survivorName, liveIdolEvents: episode.liveIdolEvents });
  } catch (err) {
    console.error("applyLiveIdolBonus error:", err);
    res.status(500).json({ error: "Failed to apply live idol bonus" });
  }
};

const toggleTribalCouncil = async (req, res) => {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (!episode) return res.status(404).json({ error: 'No active episode found' });
    episode.tribalCouncil = !episode.tribalCouncil;
    await episode.save();
    return res.json({ tribalCouncil: episode.tribalCouncil });
  } catch (error) {
    console.error('toggleTribalCouncil error:', error);
    return res.status(500).json({ error: 'Failed to toggle tribal council' });
  }
};

const toggleTradingFrozen = async (req, res) => {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (!episode) return res.status(404).json({ error: 'No active episode found' });
    episode.tradingFrozen = !episode.tradingFrozen;
    await episode.save();
    return res.json({ tradingFrozen: episode.tradingFrozen });
  } catch (error) {
    console.error('toggleTradingFrozen error:', error);
    return res.status(500).json({ error: 'Failed to toggle trading freeze' });
  }
};

module.exports = {
  addSurvivor,
  resetUsers,
  changeSeason,
  changeWeek,
  getCurrentSeason,
  fetchOnAirStatus,
  toggleOnAirStatus,
  toggleTribalCouncil,
  toggleTradingFrozen,
  updatePlayerEvent,
  applyChallengeBatch,
  applyVoteBatch,
  setFinalist,
  awardFinalistBonuses,
  applyLiveIdolBonus,
};