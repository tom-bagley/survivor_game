const PriceWatch = require('../models/pricewatch');
const Player = require('../models/players');
const adminSettings = require('../models/adminSettings');
const { getTotalStockCount, calculateStockPrice } = require('../controllers/transactionControllers')

async function recordStockPrices() {
  const stockList = await Player.find({ availability: true });

  for (const player of stockList) {
    try {
      const name = player.name;       
      const total = await getTotalStockCount();
      const availablePlayerCount = await Player.countDocuments({ availability: true });
      const currentSettings = await adminSettings.findById("game_settings");
      const currentMedianPrice = currentSettings.price;
      const currentPrice = calculateStockPrice(player.count, total, availablePlayerCount, currentMedianPrice);
      
      await PriceWatch.create({
        name: name,
        price: currentPrice,
        date: new Date(),
        season: currentSettings?.season || 'Unknown Season',
        week: currentSettings.week
      });

      // console.log(`✅ Saved ${name} at $${currentPrice}`);
    } catch (err) {
      console.error(`❌ Error fetching ${player.name}:`, err.message);
    }
  }
}

module.exports = recordStockPrices;