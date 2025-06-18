const Player = require('../models/players');
const PriceWatch = require('../models/pricewatch');
const adminSettings = require('../models/adminSettings')
const { getTotalStockCount, calculateStockPrice } = require('./transactionControllers')

const addPlayer = async (req, res) => {
    try {
        const { name, profile_pic, age, Hometown, Current_Residence, Occupation } = req.body;
        //Check if player already added
        const exist = await Player.findOne({name});
        if(exist) {
            return res.json({
                error: 'Player already added'
            });
        }

        //Create player in database
        const player = await Player.create({
            name,
            profile_pic,
            age, 
            Hometown,
            Current_Residence,
            Occupation,
        });

        return res.json(player)
    } catch (error) {
        console.log(error);
    }
}

const getAllPlayers = async (req, res) => {
    try {
      const players = await Player.find({});
      return res.json(players); 
    } catch (error) {
      console.error(error);
      return res.json({ error: 'Failed to fetch players' }); 
    }
  };

const deletePlayer = async (req, res) => {
    const {id} = req.params;
    try {
        const result = await Player.findByIdAndDelete(id);
        if(!result) {
            return res.json({error: 'player not found'});
        }

        res.json({message: 'Player deleted successfully'});
        return res.json({ error: name }); 
    } catch (error) {
        console.log(error);
    }
}

const togglePlayerAvailability = async (req, res) => {
  const { id } = req.params;

  try {
    const player = await Player.findById(id);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const total = await getTotalStockCount();
    const availablePlayerCount = await Player.countDocuments({ availability: true });
    const currentPrice = calculateStockPrice(player.count, total, availablePlayerCount);

    player.price = currentPrice;

    player.availability = !player.availability;

    await player.save();

    res.json({ 
      message: `Player availability set to ${player.availability} successfully`,
      player 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while toggling player availability' });
  }
};

const getHistoricalPrices = async (req, res) => {
    try {
        const { name } = req.params;
        const prices = await PriceWatch.find({ name }).sort({ date: 1 }); 
        res.json(prices.map(p => ({
          date: p.date.toISOString().split('T')[0], 
          price: p.price,
          week: p.week,
          season: p.season
        })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch prices' });
    }

};

const getCurrentSeason = async (req, res) => {
    console.log('in here')
    try {
        const currentSettings = await adminSettings.findById("game_settings")
        console.log(currentSettings)
        return res.json(currentSettings);
    } catch (error) {
        console.error(error);
        return res.json({error: 'Failed to fetch current season'})
    }
}




module.exports = {
    addPlayer,
    getAllPlayers,
    deletePlayer,
    togglePlayerAvailability,
    getHistoricalPrices,
    getCurrentSeason,
}