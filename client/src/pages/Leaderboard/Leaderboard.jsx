import { useContext, useEffect, useState } from "react";
import CreateGroupModal from "../../components/createGroup";
import { UserContext } from "../../../context/userContext";
import axios from "axios";

export default function Leaderboard() {
  const { user, loading } = useContext(UserContext);
  const [leaders, setLeaders] = useState([]);
  const [myRank, setMyRank] = useState(null); 
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {

    if (loading || !user) return;
    async function fetchLeaders() {
      try {
        // all entries
        const { data } = await axios.get("/leaderboard/getleaderboard");
        if (data?.entries) setLeaders(data.entries);

        // my rank (if logged in)
        if (user?.id) {
          const { data: rankData } = await axios.get(`/leaderboard/getleaderboard/${user.id}`);
          // handle both shapes: number or { rank, ... }
          const rank =
            typeof rankData === "number"
              ? rankData
              : typeof rankData?.rank === "number"
              ? rankData.rank
              : null;
          setMyRank(rank);
        } else {
          setMyRank(null);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    fetchLeaders();
  }, [user, loading]);

  if (loadingLeaderboard) {
    return (
      <div className="min-h-screen bg-black-bg text-white grid place-items-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
          <span className="text-white/80">Loading leaderboard…</span>
        </div>
      </div>
    );
  }

  const topTen = leaders.slice(0, 10);
  const isUserInTopTen = typeof myRank === "number" ? myRank <= 10 : false;
  const myEntry =
    user?.id && !isUserInTopTen
      ? leaders.find((l) => l.user_id === user.id) || (typeof myRank === "number"
          ? { user_id: user.id, rank: myRank, username: user.name, net_worth: 0 }
          : null)
      : null;
return (
  <div className="min-h-screen bg-black-bg text-white">
    <div className="mx-auto max-w-[48rem] px-5 sm:px-8 lg:px-10 py-10">
      {/* Header with title and Create Group button */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight">Leaderboard</h1>
          <p className="text-white/60 mt-1">Top players by net worth.</p>
        </div>
      </header>

      {/* Table/card list */}
      <div className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[72px_1fr_auto] gap-3 px-4 py-3 bg-black/30 text-white/70 text-xs uppercase tracking-wide">
          <div>#</div>
          <div>Player</div>
          <div className="text-right">Net Worth</div>
        </div>

        {/* Top 10 leaderboard entries */}
        <ul className="divide-y divide-white/10">
          {topTen.map((leader) => {
            const isMe = user && leader.user_id === user.id;
            return (
              <li
                key={leader.user_id}
                className={[
                  "grid grid-cols-[72px_1fr_auto] gap-3 px-4 py-3",
                  isMe ? "bg-primary/10 ring-1 ring-primary/40" : "",
                ].join(" ")}
              >
                <div className="tabular-nums font-semibold text-white/90">#{leader.rank}</div>
                <div className="truncate">
                  <span className="font-semibold">{leader.username}</span>
                </div>
                <div className="tabular-nums text-right">
                  ${Number(leader.net_worth || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </li>
            );
          })}
        </ul>

        {/* My row if not in Top 10 */}
        {myEntry && (
          <>
            <div className="h-px bg-white/10 mx-4" />
            <div className="px-4 py-3 bg-black/20 text-white/60 text-xs">Your position</div>
            <div className="grid grid-cols-[72px_1fr_auto] gap-3 px-4 py-3 bg-primary/10 ring-1 ring-primary/40">
              <div className="tabular-nums font-semibold text-white/90">#{myEntry.rank}</div>
              <div className="truncate">
                <span className="font-semibold">
                  {myEntry.username || user?.name || "You"}
                </span>
              </div>
              <div className="tabular-nums text-right">
                ${Number(myEntry.net_worth || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    {!user.isGuest && (
      <>
      <div className="mb-6 flex items-center justify-center">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-md bg-primary text-white"
        >
          Create Group
        </button>
      </div>
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={user}
        onCreated={""}
      />
      </>
    )}
  </div>
);
}


