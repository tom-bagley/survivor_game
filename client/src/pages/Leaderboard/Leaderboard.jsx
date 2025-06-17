import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../context/userContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Leaderboard.css';

export default function Leaderboard() {
  const { user, loading } = useContext(UserContext);
  const [leaders, setLeaders] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    if (loading || !user?.id) return;

    async function fetchLeaders() {
      try {
        const { data } = await axios.get("/leaderboard/getleaderboard");
        const { data: leaderboardRank } = await axios.get(`/leaderboard/getleaderboard/${user.id}`);

        if (data && data.entries) {
          setLeaders(data.entries);
        }
        setLeaderboard(leaderboardRank); // Assuming leaderboardRank is an object with user info including rank
      } catch (error) {
        console.log("Error fetching leaderboard:", error);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    fetchLeaders();
  }, [loading, user]);

  if (loadingLeaderboard) {
    return <div className="body" style={{ textAlign: "center", padding: "2rem", color: "white" }}>Loading leaderboard...</div>;
  }

  // Get top 10 leaders
  const topTen = leaders.slice(0, 10);

  // Check if current user is in top 10
  const isUserInTopTen = leaderboard <= 10;

  // Find current user's entry if not in top 10
  const myEntry = !isUserInTopTen
    ? leaders.find((leader) => leader.user_id === user.id)
    : null;

  return (
    <div className="body">
      <div className="leaderboard-container">
        <h1 className="leaderboard-title">Leaderboard</h1>

        {topTen.map((leader) => (
          <div
            key={leader.user_id}
            className={`leader ${leader.user_id === user.id ? "highlight" : ""}`}
          >
            <span className="leader-rank">#{leader.rank}</span>
            <span className="leader-name">{leader.username}</span>
            <span className="leader-net-worth">
              ${leader.net_worth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}

        {/* Show current user if not in top 10 */}
        {myEntry && (
          <>
            <hr style={{ margin: "24px 0", borderColor: "rgba(255,255,255,0.1)" }} />
            <div className="leader highlight" key={myEntry.user_id}>
              <span className="leader-rank">#{myEntry.rank}</span>
              <span className="leader-name">{myEntry.username}</span>
              <span className="leader-net-worth">
                ${myEntry.net_worth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

