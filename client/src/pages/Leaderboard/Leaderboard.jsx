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
    async function fetchLeaders() {
      try {
        const { data } = await axios.get("/leaderboard/getleaderboard");
        if (data && data.entries) {
          setLeaders(data.entries);
        }

        // If user is logged in, fetch their specific rank
        if (user?.id) {
          const { data: leaderboardRank } = await axios.get(`/leaderboard/getleaderboard/${user.id}`);
          setLeaderboard(leaderboardRank); // e.g. { user_id, rank, username, ... }
        }
      } catch (error) {
        console.log("Error fetching leaderboard:", error);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    fetchLeaders();
  }, [user]);

  if (loadingLeaderboard) {
    return (
      <div className="body" style={{ textAlign: "center", padding: "2rem", color: "white" }}>
        Loading leaderboard...
      </div>
    );
  }

  // Get top 10
  const topTen = leaders.slice(0, 10);

  // Is user in top 10?
  const isUserInTopTen = leaderboard <= 10;

  // Find user's entry if not in top 10
  const myEntry = user && leaderboard && !isUserInTopTen
    ? leaders.find((leader) => leader.user_id === user.id)
    : null;

  return (
    <div className="body">
      <div className="leaderboard-container">
        <h1 className="leaderboard-title">Leaderboard</h1>

        {topTen.map((leader) => (
          <div
            key={leader.user_id}
            className={`leader ${user && leader.user_id === user.id ? "highlight" : ""}`}
          >
            <span className="leader-rank">#{leader.rank}</span>
            <span className="leader-name">{leader.username}</span>
            <span className="leader-net-worth">
              ${leader.net_worth.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}

        {/* If user not in top 10, show them separately */}
        {myEntry && (
          <>
            <hr style={{ margin: "24px 0", borderColor: "rgba(255,255,255,0.1)" }} />
            <div className="leader highlight" key={myEntry.user_id}>
              <span className="leader-rank">#{myEntry.rank}</span>
              <span className="leader-name">{myEntry.username}</span>
              <span className="leader-net-worth">
                ${myEntry.net_worth.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

