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
    season: '',
  })
  const [season, setSeason] = useState();
  const [week, setWeek] = useState();
  const [price, setPrice] = useState();
  const [increment, setIncrement] = useState();

  const [players, setPlayers] = useState([]);

  const addPlayer = async (e) => {
    e.preventDefault()
    const {name, profile_pic, age, Hometown, Current_Residence, Occupation } = data
    try {
      const {data} = await axios.post('/admin/addplayer', {name, profile_pic, age, Hometown, Current_Residence, Occupation});
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
      const {data} = await axios.get('/admin/allplayers');
      setPlayers(data);
    } catch (error) {
      console.log(error);
    }
  }

  const deletePlayer = async (playerID) => {
    try {
      const { data } = await axios.delete(`/admin/deleteplayer/${playerID}`);
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
      const { data } = await axios.patch(`/admin/changeavailability/${playerID}`)
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

  const handleResetUsers = async (e) => {
    e.preventDefault()
    const { budget, initialSurvivorPrice } = data
    try {
      const { data } = await axios.post('/admin/reset-users', { budget, initialSurvivorPrice })
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('reset users successfully')
      }
    } catch (error) {
      console.log(error)
    }
  };

  const handleSeasonChange = async (e) => {
    e.preventDefault()
    const { season, initialPrice, percentageIncrement } = data;
    try {
      const { data } = await axios.post('/admin/change-season', { season, initialPrice, percentageIncrement })
      if (data.error) {
        toast.error(data.error);
      } else {
        setSeason(season)
        setWeek(0);
        setPrice(initialPrice);
        setIncrement(percentageIncrement);
        toast.success('changed season successfully')
      } 
    } catch (error) {
      console.log(error)
    }

  }

  const handleWeekChange = async (e) => {
    e.preventDefault()
    const newWeek = Number(week) + 1;
    try {
      const { data } = await axios.post('/admin/change-week', {newWeek})
      if (data.error) {
        toast.error(data.error);
      } else {
        setWeek(newWeek);
        toast.success('changed week successfully')
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleOnAirStatusChange = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.patch('/episode/changeonairstatus')
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('changed on air status successfully')
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    async function getCurrentSeason () {
      try {
        const { data: currentSeason } = await axios.get('/admin/getcurrentseason');
        setSeason(currentSeason.season);
        setWeek(currentSeason.week);
        setPrice(currentSeason.price);
        setIncrement(currentSeason.percentageIncrement);
      } catch (error) {
        console.log(error)
      }
    }
    displayPlayers();
    getCurrentSeason();
  }, [season, week]);
  
  return (
    <div className = "admin-body">
      <div className = "container">
      <h1>Admin Page</h1>
      <div className="add-players-container">
        <h2>Add Players</h2>
        <div className = "form-container">
          <form className = "admin-form" onSubmit={addPlayer}>
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

          </form>
        </div>
      </div>
      <div className="season-container">
        <h2>Season Adjustments</h2>
        <p>Season: {season}</p>
        <p>Week: {week}</p>
        <p>Price: {price}</p>
        <p>Increment: {increment}</p>
        <form onSubmit={handleSeasonChange}>
            <label>Change Season</label>
            <input 
              type="text" 
              placeholder="Enter New Season" 
              value={data.season} 
              onChange={(e) => setData({...data, season: e.target.value})} 
            />

            <input 
              type="text" 
              placeholder="Enter Initial Price" 
              value={data.initialPrice} 
              onChange={(e) => setData({...data, initialPrice: e.target.value})} 
            />

            <input 
              type="text" 
              placeholder="Enter Percentage Increment" 
              value={data.percentageIncrement} 
              onChange={(e) => setData({...data, percentageIncrement: e.target.value})} 
            />
            <button type="submit">Submit</button>
        </form>
        <form onSubmit={handleWeekChange}>
          <label>Change Week: {data.week}</label>
          <button type="submit">Next Week</button>
        </form>

      </div>

      <div clasasName="on-air-status">
        <h2>Change On Air Status</h2>
        <form onSubmit={handleOnAirStatusChange}>
          <label>Change On Air Status:</label>
          <button type="submit">Change</button>
        </form>
      </div>

      <div className="reset-users">
        <h2>Reset Users</h2>
        <form onSubmit={handleResetUsers}>
            <label>Reset Users</label>
            <input 
              type="text" 
              placeholder="Enter Budget" 
              value={data.budget} 
              onChange={(e) => setData({...data, budget: e.target.value})} 
            />

            <input 
              type="text" 
              placeholder="Enter Initial Survivor Price" 
              value={data.initialSurvivorPrice} 
              onChange={(e) => setData({...data, initialSurvivorPrice: e.target.value})} 
            />
            <button type="submit">Submit</button>
          </form>

      </div>
      <div className="players-list">
        <h2>All Players</h2>
        {players.length > 0 ? (
          players.map((player, index) => (
            <div key={index} className="player-item">
              <span>{player.name}</span>
              <span>{player.availability ? "Available" : "Unavailable"}</span> {/* Show availability */}
              <button onClick={() => deletePlayer(player._id)}>Delete</button>
              <button onClick={() => makeUnavailable(player._id)}>Change Availability</button>
            </div>
          ))
        ) : (
          <p>No players yet</p>
        )}
      </div>
    </div>
    </div>
  );
  
}
