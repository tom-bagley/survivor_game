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
      const {data} = await axios.post('/addplayer', {name});
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
      const {data} = await axios.get('/allplayers');
      setPlayers(data);
    } catch (error) {
      console.log(error);
    }
  }

  const deletePlayer = async (playerID) => {
    try {
      const { data } = await axios.delete(`/deleteplayer/${playerID}`);
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

  useEffect(() => {
    displayPlayers();
  }, []);
  
  return (
    <div>
      <h1>Survivor Season 48 Players</h1>
      <form onSubmit={addPlayer}>
        <label>Add Player</label>
        <input type="text" placeholder="enter name" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} />
        <button type = 'submit'>Submit</button>
      </form>
      <h2>All Players</h2>
      <ul>
        {players.length > 0 ? (
          players.map((player, index) => (
            <li key={index}>
              {player.name}
              <button onClick={() => deletePlayer(player._id)}>Delete</button>
              </li>
          ))
        ) : (
          <p>No players yet</p>
        )}
      </ul>
    </div>
  )
}