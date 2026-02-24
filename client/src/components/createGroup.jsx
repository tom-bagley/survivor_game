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

      <div className="relative w-full max-w-lg mx-auto bg-gradient-to-b from-charcoal to-black-bg rounded-2xl shadow-2xl ring-1 ring-sand/20 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="logo"
                className="h-10 w-10 rounded-md object-cover ring-1 ring-sand/20"
              />
              <div>
                <h2 className="text-lg font-heading text-cream">Create Group</h2>
                <p className="text-xs text-cream/60 font-body">Invite people by email — they'll receive a join link.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => !loading && onClose()}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-black-bg/40 text-cream/60 hover:text-cream hover:bg-black-bg/70 focus:outline-none transition"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-cream/70 font-body block mb-2">Group name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black-bg/40 rounded-md px-3 py-2 text-cream placeholder:text-cream/40 border border-sand/20 focus:ring-2 focus:ring-primary outline-none transition font-body"
                placeholder="e.g. Friends League"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm text-cream/70 font-body block mb-2">Add member by email</label>
              <div className="flex gap-2">
                <input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMember(); } }}
                  className="flex-1 bg-black-bg/40 rounded-md px-3 py-2 text-cream placeholder:text-cream/40 border border-sand/20 focus:ring-2 focus:ring-primary outline-none transition font-body"
                  placeholder="member@example.com"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-primary text-black-bg font-semibold font-body disabled:opacity-60 hover:bg-accent transition"
                >
                  Add
                </button>
              </div>
              <p className="mt-2 text-xs text-cream/60 font-body">A secure join link will be sent to each email.</p>
            </div>

            <div>
              <div className="text-sm text-cream/70 font-body mb-2">Members</div>
              <div className="space-y-2">
                {emails.length === 0 && <div className="text-cream/50 text-sm font-body">No members yet</div>}
                {emails.map((m) => (
                  <div key={m} className="flex items-center bg-black-bg/40 border border-sand/20 rounded-md px-3 py-1">
                    <div className="text-sm text-cream/90 font-body mr-3 truncate max-w-[18rem]">{m}</div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m)}
                      className="ml-auto text-xs text-cream/50 hover:text-red-flame px-2 py-1 transition"
                      aria-label={`Remove ${m}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="text-red-flame text-sm font-body">{error}</div>}
            {successMessage && <div className="text-accent text-sm font-body">{successMessage}</div>}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              className="px-4 py-2 rounded-md bg-black-bg/40 text-cream/80 border border-sand/20 hover:bg-black-bg/70 font-body transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-black-bg font-semibold font-body disabled:opacity-60 hover:bg-accent transition"
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
