import { useState, useEffect } from "react"
import axios from 'axios';
import {toast} from 'react-hot-toast';
import Display from '../components/playerdisplay/playerdisplay';

export default function DisplayPlayers() {
    const [players, setPlayers] = useState([]);

    const displayPlayers = async () => {
        try {
          const {data} = await axios.get('/players/allplayers');
          setPlayers(data);
        } catch (error) {
          console.log(error);
        }
    }

    useEffect(() => {
        displayPlayers();
    }, []);



    return (
        <div>
            <h1>Meet the Cast</h1>
        <div className="grid-container">
  {Object.keys(players).map((key) => {
    const player = players[key];
    console.log(player);
    const { name, profile_pic, age, Hometown, Current_Residence, Occupation } = player;

    return (
      <Display
        key={key}
        name={name}
        profilePhotoUrl={profile_pic}
        age={age}
        Hometown={Hometown}
        Current_Residence={Current_Residence}
        Occupation={Occupation}
      />
    );
  })}
</div>


    </div>
    )
}
