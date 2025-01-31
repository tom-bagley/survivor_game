const Player = require('../models/players');

const addPlayer = async (req, res) => {
    try {
        console.log(req.body);
        const { name, profile_pic, age, Hometown, Current_Residence, Occupation } = req.body;
        console.log(age);
        console.log(name);
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
        // Find the player by ID
        const player = await Player.findById(id);

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Toggle availability to false
        player.availability = false;

        // Save the updated player
        await player.save();

        res.json({ message: 'Player availability set to false successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating player availability' });
    }
};




module.exports = {
    addPlayer,
    getAllPlayers,
    deletePlayer,
    togglePlayerAvailability,
}