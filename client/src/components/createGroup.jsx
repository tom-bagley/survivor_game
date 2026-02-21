// components/groups/CreateGroupModal.jsx
import { useState } from "react";
import axios from "axios";

/**
 * CreateGroupModal
 *
 * Props:
 * - isOpen (bool)
 * - onClose (fn)
 * - currentUser (object)  // optional: will be auto-added as a member if present
 * - onCreated (fn) // optional: receives created group
 */
export default function CreateGroupModal({ isOpen, onClose, currentUser = {}, onCreated }) {
  const [emails, setEmails] = useState(currentUser.email ? [currentUser.email] : []);
  const [name, setName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  function handleAddMember() {
    const trimmed = (memberInput || "").trim();
    if (!trimmed) return;
    if (emails.includes(trimmed)) {
      setError("That email is already added.");
      return;
    }
    setEmails((m) => [...m, trimmed]);
    setMemberInput("");
    setError(null);
  }

  function handleRemoveMember(email) {
    setEmails((m) => m.filter((x) => x !== email));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }
    if (emails.length === 0) {
      setError("Add at least one member (you can add yourself).");
      return;
    }

    setLoading(true);
    try {
      const payload = { name: name.trim(), currentUserId: currentUser.id, emails: emails, inviteUserUsername: currentUser.name };
      const { data } = await axios.post("/leaderboard/creategroup", payload);

      setSuccessMessage("Group created!");
      setName("");
      setMemberInput("");
      setEmails(currentUser.email ? [currentUser.email] : []);

      if (onCreated) onCreated(data);

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Create group error:", err);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "There was an error creating the group.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative w-full max-w-lg mx-auto bg-gradient-to-b from-[#0f1112] to-[#121214] rounded-2xl shadow-2xl ring-1 ring-white/6 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* logo — local file path (replace with /logo.png in prod) */}
              <img
                src="/mnt/data/logo.jpg"
                alt="logo"
                className="h-10 w-10 rounded-md object-cover ring-1 ring-white/8"
              />
              <div>
                <h2 className="text-lg font-semibold">Create Group</h2>
                <p className="text-xs text-white/60">Invite people by email — they'll receive a join link.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => !loading && onClose()}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/20 text-white/60 hover:text-white hover:bg-white/6 focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-white/70 block mb-2">Group name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 rounded-md px-3 py-2 text-white placeholder:text-white/40 border border-white/6 focus:ring-2 focus:ring-primary outline-none transition"
                placeholder="e.g. Friends League"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm text-white/70 block mb-2">Add member by email</label>
              <div className="flex gap-2">
                <input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMember(); } }}
                  className="flex-1 bg-black/20 rounded-md px-3 py-2 text-white placeholder:text-white/40 border border-white/6 focus:ring-2 focus:ring-primary outline-none transition"
                  placeholder="member@example.com"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-primary text-black font-semibold disabled:opacity-60 hover:bg-accent transition"
                >
                  Add
                </button>
              </div>
              <p className="mt-2 text-xs text-white/60">A secure join link will be sent to each email.</p>
            </div>

            <div>
              <div className="text-sm text-white/70 mb-2">Members</div>
              <div className="flex flex-wrap gap-2">
                {emails.length === 0 && <div className="text-white/60 text-sm">No members yet</div>}
                {/* Members list — full-width rows */}
<div className="space-y-2">
  {emails.length === 0 && <div className="text-white/60 text-sm">No members yet</div>}

<div className="flex flex-wrap gap-2">
  {emails.map((m) => (
    <div key={m} className="flex items-center bg-black/20 border border-white/6 rounded-md px-3 py-1">
      <div className="text-sm text-white/90 mr-3 truncate max-w-[18rem]">{m}</div>
      <button
        onClick={() => handleRemoveMember(m)}
        className="text-xs text-white/60 hover:text-white/80 px-2 py-1"
        aria-label={`Remove ${m}`}
      >
        ✕
      </button>
    </div>
  ))}
</div>


</div>

              </div>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}
            {successMessage && <div className="text-green-400 text-sm">{successMessage}</div>}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              className="px-4 py-2 rounded-md bg-black/10 text-white/80 hover:bg-black/20 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-black font-semibold disabled:opacity-60 hover:bg-accent transition"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

