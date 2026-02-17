import { useContext, useEffect, useState } from "react";
import CreateGroupModal from "../components/createGroup";
import { UserContext } from "../../context/userContext";
import axios from "axios";

export default function ViewGroups() {
    const { user, loading } = useContext(UserContext);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if(loading || !user) return;
        async function fetchUserGroups() {
            try {
                const { data } = await axios.get("/leaderboard/fetchusergroups", {params: {id: user.id}})
                setGroups(data.groups);
            } catch (err) {
                console.error("Error fetching groups", err)
            } finally {
                setLoadingGroups(false);
            }
        }
        fetchUserGroups();
    }, [user, loading])

    if (loadingGroups) {
        return (
        <div className="min-h-screen bg-black-bg text-white grid place-items-center">
            <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
            <span className="text-white/80">Loading groups…</span>
            </div>
        </div>
        );
    }

    return (
        <div>
        <div>
            {user.isGuest && (
                <div>
                    Must be logged in to view groups
                </div>
            )}
        </div>

        <div>
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
            <div className="max-w-3xl mx-auto space-y-6">
    {groups.length === 0 ? (
        <div className="text-center text-white/60">
            No groups yet.
        </div>
    ) : (
        groups.map(group => (
            <div
                key={group._id}
                className="bg-zinc-900 p-6 rounded-xl shadow"
            >
                <h2 className="text-xl font-semibold mb-4">
                    {group.name}
                </h2>

                <div className="space-y-2">
                    {group.members.map(member => (
                        <div
                            key={member._id}
                            className="flex justify-between bg-zinc-800 px-3 py-2 rounded-md"
                        >
                            <span>
                                {member.user}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        ))
    )}
</div>
            </div>
    );
}