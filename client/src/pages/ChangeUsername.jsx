import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { UserContext } from "../../context/userContext";

export default function ChangeUsername() {
  const { user, loading, updateUser } = useContext(UserContext);
  const [newUsername, setNewUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = newUsername.trim();

    if (!value) return toast.error("Please enter a username.");
    if (value === user?.name) return toast("That’s already your username.");

    try {
      setSubmitting(true);
      const res = await axios.post("/auth/change-username", { newUsername: value, id: user.id });
      if (res.data?.error) return toast.error(res.data.error);

      toast.success("Username updated");

      updateUser({ name: value });

      setNewUsername("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to change username");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center text-white">Loading...</div>;
  if (!user?.id)
    return (
      <div className="min-h-screen bg-black-bg text-white grid place-items-center px-4">
        <p className="text-white/80">You need to be logged in to change your username.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-black-bg text-white">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8 text-center">
          <h1 className="font-heading text-4xl lg:text-5xl tracking-tight">
            Change <span className="text-accent">Username</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-white/70">
            Current username:{" "}
            <span className="text-primary font-semibold">{user?.name || "—"}</span>
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-charcoal/80 ring-1 ring-white/10 rounded-2xl p-6 shadow-xl"
        >
          <label
            htmlFor="username"
            className="block text-sm font-medium text-white/80 mb-2"
          >
            New Username
          </label>
          <input
            id="username"
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username"
            className="w-full rounded-lg bg-black/40 border border-white/20 text-white px-4 py-2
                       focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={submitting || !newUsername.trim()}
            className="mt-4 w-full rounded-lg bg-primary text-black font-semibold py-2
                       hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary
                       disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}




