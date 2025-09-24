const PriceWatch = require('../models/pricewatch');
const Survivor = require('../models/survivors');
const Season = require('../models/seasonSettings');
const { getTotalStockCount, calculateStockPrice } = require('../controllers/transactionControllers')

async function recordStockPrices() {
  const stockList = await Survivor.find({ availability: true });

  for (const survivor of stockList) {
    try {
      const name = survivor.name;       
      const total = await getTotalStockCount();
      const availablePlayerCount = await Survivor.countDocuments({ availability: true });
      const season = await Season.findOne({ isCurrentSeason: true });
      const currentMedianPrice = season.currentPrice;
      const currentPrice = calculateStockPrice(survivor.count, total, availablePlayerCount, currentMedianPrice);
      
      await PriceWatch.create({
        name: name,
        price: currentPrice,
        date: new Date(),
        season: season?.seasonName || 'Unknown Season',
        week: season.currentWeek
      });

      // console.log(`✅ Saved ${name} at $${currentPrice}`);
    } catch (err) {
      console.error(`❌ Error fetching ${survivor.name}:`, err.message);
    }
  }
}

module.exports = recordStockPrices;