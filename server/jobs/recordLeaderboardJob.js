const LiveLeaderboardCache = require('../models/liveleaderboard');
const User = require('../models/user');
const { getTotalStockCount, calculateStockPrice, calculateNetWorth, calculatePrices } = require('../controllers/transactionControllers')

async function updateLiveLeaderboard() {
  const userList = await User.find();
  const leaderboardEntries = [];

  for (const user of userList) {
    try {
      const networth = await calculateNetWorth(user);
      
      leaderboardEntries.push({
        user_id: user._id.toString(),
        username: user.name,
        net_worth: networth
      })
      
    } catch (err) {
      console.error(`❌ Error calculating net worth for ${user.username}:`, err.message);
    }
  }

  leaderboardEntries.sort((a, b) => b.net_worth - a.net_worth);

  leaderboardEntries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  await LiveLeaderboardCache.findByIdAndUpdate(
    'live_leaderboard',
    {
      timestamp: new Date(),
      entries: leaderboardEntries
    },
    { upsert: true }
  );

  console.log('✅ Live leaderboard updated successfully');

}

module.exports = updateLiveLeaderboard;