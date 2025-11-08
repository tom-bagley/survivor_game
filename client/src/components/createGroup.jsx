// components/groups/CreateGroupModal.jsx
import { useState } from "react";
import axios from "axios";

/**
 * CreateGroupModal
 *
 * Props:
 * - isOpen (bool)
 * - onClose (fn)
 * - currentUserId (string)  // optional: will be auto-added as a member if present
 * - onCreated (fn) // optional: receives created group
 */
export default function CreateGroupModal({ isOpen, onClose, currentUser, onCreated }) {
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
      const payload = { name: name.trim(), currentUserId: currentUser.id, emails: emails };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative w-full max-w-lg mx-4 bg-charcoal/90 rounded-2xl shadow-xl ring-1 ring-white/10 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold">Create Group</h2>
            <button
              type="button"
              onClick={() => !loading && onClose()}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-white/70 block mb-1">Group name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 rounded-md px-3 py-2 text-white outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm text-white/70 block mb-1">Add member by email</label>
              <div className="flex gap-2">
                <input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  className="flex-1 bg-black/20 rounded-md px-3 py-2 text-white outline-none"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={loading}
                  className="px-3 py-2 rounded-md bg-primary text-white disabled:opacity-60"
                >
                  Add
                </button>
              </div>
              <p>
                  A link will be sent for members to join
                </p>
            </div>

            <div>
              <div className="text-sm text-white/70 mb-2">Members</div>
              <div className="flex flex-wrap gap-2">
                {emails.length === 0 && (
                  <div className="text-white/60 text-sm">No members yet</div>
                )}
                {emails.map((m) => (
                  <div
                    key={m}
                    className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full text-sm"
                  >
                    <span className="font-mono text-xs text-white/90">{m}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m)}
                      className="text-white/50 hover:text-white text-xs"
                      disabled={loading}
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}
            {successMessage && <div className="text-green-400 text-sm">{successMessage}</div>}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              className="px-4 py-2 rounded-md bg-black/20 text-white/80"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-white font-semibold disabled:opacity-60"
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
