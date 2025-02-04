import { useState, useEffect } from "react"
import axios from 'axios';
import {toast} from 'react-hot-toast';


export default function Players() {
  const [data, setData] = useState({
    name: '',
    profile_pic: '',
    age: '',
    Hometown: '',
    Current_Residence: '',
    Occupation: '',
  })

  const [players, setPlayers] = useState([]);

  const addPlayer = async (e) => {
    e.preventDefault()
    const {name, profile_pic, age, Hometown, Current_Residence, Occupation } = data
    try {
      const {data} = await axios.post('/players/addplayer', {name, profile_pic, age, Hometown, Current_Residence, Occupation});
      if(data.error) {
        toast.error(data.error)
      } else {
        setData({
          name: '',
          profile_pic: '',
          age: '',
          Hometown: '',
          Current_Residence: '',
          Occupation: '',
        })
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

          <input 
            type="text" 
            placeholder="Enter profile photo URL" 
            value={data.profile_pic} 
            onChange={(e) => setData({ ...data, profile_pic: e.target.value })} 
          />

          <input 
            type="text" 
            placeholder="Enter age" 
            value={data.age} 
            onChange={(e) => setData({ ...data, age: e.target.value  })} 
          />

          <input 
            type="text" 
            placeholder="Enter hometown" 
            value={data.Hometown} 
            onChange={(e) => setData({ ...data, Hometown: e.target.value })} 
          />

          <input 
            type="text" 
            placeholder="Enter current residence" 
            value={data.Current_Residence} 
            onChange={(e) => setData({ ...data, Current_Residence: e.target.value })} 
          />

          <input 
            type="text" 
            placeholder="Enter occupation" 
            value={data.Occupation} 
            onChange={(e) => setData({ ...data, Occupation: e.target.value })} 
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
