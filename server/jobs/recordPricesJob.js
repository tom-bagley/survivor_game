const PriceWatch = require('../models/pricewatch');
const Player = require('../models/players');
const { getTotalStockCount, calculateStockPrice } = require('../controllers/transactionControllers')

async function recordStockPrices() {
  const stockList = await Player.find({ availability: true });

  for (const player of stockList) {
    try {
      const name = player.name;       
      const total = await getTotalStockCount();
      const currentPrice = calculateStockPrice(player.count, total);
      
      await PriceWatch.create({
        name: name,
        price: currentPrice,
        date: new Date(),
      });

      console.log(`✅ Saved ${name} at $${currentPrice}`);
    } catch (err) {
      console.error(`❌ Error fetching ${player.name}:`, err.message);
    }
  }
}

module.exports = recordStockPrices;