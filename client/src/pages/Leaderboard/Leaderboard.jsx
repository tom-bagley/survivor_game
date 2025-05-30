import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const { data } = await axios.get("/leaderboard/getleaderboard");
        if (data && data.entries) {
          setLeaders(data.entries);
        }
      } catch (error) {
        console.log("Error fetching leaderboard:", error);
      }
    }

    fetchLeaders();
  }, []);

  return (
    <div>
      <h1>Leaderboard</h1>
      {leaders.map((leader, index) => (
        <div key={leader.user_id} style={{ marginBottom: "10px" }}>
          <strong>#{leader.rank}</strong> – {leader.username} (${leader.net_worth.toLocaleString()})
        </div>
      ))}
    </div>
  );
}
