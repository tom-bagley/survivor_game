import { useState, useEffect } from "react"
import axios from 'axios';
import {toast} from 'react-hot-toast';


export default function Players() {
  const [data, setData] = useState({
    name: '',
  })

  const [players, setPlayers] = useState([]);

  const addPlayer = async (e) => {
    e.preventDefault()
    const {name} = data
    try {
      const {data} = await axios.post('/players/addplayer', {name});
      if(data.error) {
        toast.error(data.error)
      } else {
        setData({})
        displayPlayers();
        toast.success('Player added successfully')
      }
    } catch (error) {
      console.log(error)
    }

  }

  const displayPlayers = async () => {
    try {
      const {data} = await axios.get('/players/allplayers');
      setPlayers(data);
    } catch (error) {
      console.log(error);
    }
  }

  const deletePlayer = async (playerID) => {
    try {
      const { data } = await axios.delete(`/players/deleteplayer/${playerID}`);
      if (data.error) {
        toast.error(data.error);
      } else {
        displayPlayers();
        toast.success('Player deleted successfully')
      }
    } catch (error) {
      console.log(error);
    }
  }

  const makeUnavailable = async (playerID) => {
    try {
      const { data } = await axios.patch(`/players/changeavailability/${playerID}`)
      if (data.error) {
        toast.error(data.error);
      } else {
        displayPlayers();
        toast.success('availability changed successfully')
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    displayPlayers();
  }, []);
  
  return (
    <div className="players-container">
      <h1>Survivor Season 48 Players</h1>
      <div className="form-container">
        <form onSubmit={addPlayer}>
          <label>Add Player</label>
          <input 
            type="text" 
            placeholder="Enter name" 
            value={data.name} 
            onChange={(e) => setData({...data, name: e.target.value})} 
          />
          <button type="submit">Submit</button>
        </form>
      </div>
  
      <h2>All Players</h2>
      <div className="players-list">
        {players.length > 0 ? (
          players.map((player, index) => (
            <div key={index} className="player-item">
              <span>{player.name}</span>
              <span>{player.availability ? "Available" : "Unavailable"}</span> {/* Show availability */}
              <button onClick={() => deletePlayer(player._id)}>Delete</button>
              <button onClick={() => makeUnavailable(player._id)}>Make Unavailable</button>
            </div>
          ))
        ) : (
          <p>No players yet</p>
        )}
      </div>

    </div>
  );
  
}
