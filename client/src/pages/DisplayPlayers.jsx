import { useEffect, useState } from "react";
import axios from "axios";
import Introduction from "../components/playerintroduction/playerintroduction";

export default function DisplayPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlayers() {
      try {
        const { data } = await axios.get("/players/allplayers");
        if (!cancelled) setPlayers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlayers();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black-bg text-white grid place-items-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
          <span className="text-white/80">Loading cast…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-bg text-white">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-10 py-10">
        <header className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight">Meet the Cast</h1>
        </header>

        {players.length === 0 ? (
          <div className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-6 text-center text-white/70">
            No players found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((p) => (
              <Introduction
                key={p._id || p.name}               
                name={p.name}
                profilePhotoUrl={p.profile_pic}
                age={p.age}
                Hometown={p.Hometown}
                Current_Residence={p.Current_Residence}
                Occupation={p.Occupation}
                Link={p.youtube_interview}
                homepage={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

