const Survivor = require('../models/survivors');
const Season = require('../models/seasonSettings')
const Episode = require('../models/episodeSettings')
const { getTotalStockCount, calculateStockPrice } = require('./transactionControllers')

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

const getAllSurvivors = async (req, res) => {
    try {
      const survivors = await Survivor.find({});
      return res.json(survivors); 
    } catch (error) {
      console.error(error);
      return res.json({ error: 'Failed to fetch survivors' }); 
    }
  };

const deleteSurvivor = async (req, res) => {
    const {id} = req.params;
    try {
        const result = await Survivor.findByIdAndDelete(id);
        if(!result) {
            return res.json({error: 'survivor not found'});
        }

        res.json({message: 'Survivor deleted successfully'});
    } catch (error) {
        console.log(error);
    }
}

const toggleSurvivorAvailability = async (req, res) => {
  const { id } = req.params;

//   try {
    const survivor = await Survivor.findById(id);
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    const season = await Season.findOne({ isCurrentSeason: true });

    if (!survivor) {
      return res.status(404).json({ error: 'survivor not found' });
    }

    const total = await getTotalStockCount();
    const availableSurvivorCount = await Survivor.countDocuments({ availability: true });
    const currentPrice = 2

    survivor.price = currentPrice;

    survivor.availability = !survivor.availability;

    if (!episode.survivorsVotedOut) {
        episode.survivorsVotedOut = [];
    }

    if (!survivor.availability) {
      episode.survivorsVotedOut.push(survivor.name);
    }

    await survivor.save();
    await episode.save();

    res.json({ 
      message: `survivor availability set to ${survivor.availability} successfully`,
      survivor 
    });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'An error occurred while toggling survivor availability' });
//   }
};


const getCurrentSeason = async (req, res) => {
    try {
        const season = await Season.findOne({ isCurrentSeason: true });
        return res.json(season);
    } catch (error) {
        console.error(error);
        return res.json({error: 'Failed to fetch current season'})
    }
}




module.exports = {
    addSurvivor,
    getAllSurvivors,
    deleteSurvivor,
    toggleSurvivorAvailability,
    getCurrentSeason,
}