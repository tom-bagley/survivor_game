import { useEffect, useState } from "react";
import axios from "axios";

export default function Episode_Airing() {
  const [timeLeft, setTimeLeft] = useState(3 * 60); // fallback 3 min
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeLeft() {
      try {
        const res = await axios.get("/episode/episode-end-time");
        const endTime = new Date(res.data).getTime();
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(secondsLeft);
      } catch (e) {
        // if fetch fails, we just keep the fallback timer
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeLeft();
  }, []);

  useEffect(() => {
    if (timeLeft == null || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const formatTimeParts = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h.toString().padStart(2, "0"),
      m.toString().padStart(2, "0"),
      s.toString().padStart(2, "0"),
    ];
  };

  const [hours, minutes, seconds] = formatTimeParts(timeLeft ?? 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black-bg text-white grid place-items-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
          <span className="text-white/80">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-bg text-white relative overflow-hidden">
      {/* subtle background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-accent blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-[48rem] px-6 py-16">
        <h1 className="font-heading text-3xl sm:text-4xl text-center tracking-tight">
          Episode is Airing. Return in…
        </h1>

        {/* timer */}
        <div
          className="mt-8 sm:mt-10 rounded-2xl bg-black/30 ring-1 ring-white/10 p-6 sm:p-8 shadow-xl"
          role="timer"
          aria-live="polite"
        >
          <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
            <TimerUnit value={hours} label="Hours" />
            <TimerUnit value={minutes} label="Minutes" />
            <TimerUnit value={seconds} label="Seconds" />
          </div>

          {/* progress bar (optional visual) */}
          <ProgressBar totalSeconds={Math.max(timeLeft, 1)} />
        </div>

        {/* done state */}
        {timeLeft === 0 && (
          <p className="mt-6 text-center text-white/80">
            The episode should be over. You can head back to your{" "}
            <a href="/dashboard" className="text-accent font-semibold hover:underline">
              dashboard
            </a>
            .
          </p>
        )}
      </main>
    </div>
  );
}

function TimerUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="tabular-nums font-mono text-4xl sm:text-6xl font-semibold leading-none tracking-tight">
        {value}
      </div>
      <div className="text-xs sm:text-sm uppercase tracking-wide text-white/70">{label}</div>
    </div>
  );
}

// Simple shrinking progress line based on remaining time (not exact percentage of original end)
// If you want exact, pass the initial total as a prop and compute (remaining/initial)
function ProgressBar({ totalSeconds }) {
  // map remaining seconds to a width between 10% and 100% for a nice visual
  const widthPercent = Math.max(10, Math.min(100, (totalSeconds / 3600) * 100)); // assumes up to ~1h
  return (
    <div className="mt-6">
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}
