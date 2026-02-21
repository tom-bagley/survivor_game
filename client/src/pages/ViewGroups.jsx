import { useContext, useEffect, useState } from "react";
import CreateGroupModal from "../components/createGroup";
import ScoreEfficiencyBar from "../components/ScoreEfficiencyBar";
import { UserContext } from "../../context/userContext";
import axios from "axios";

function groupDisplayName(group) {
    if (group.name.startsWith("solo_")) return "Your Own Game";
    return group.name;
}

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
        <div className="min-h-screen bg-black-bg text-white px-4 py-8">
        <div>
            {user.isGuest && (
                <div className="text-center text-white/60">
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
                groups.map(group => {
                  const isSolo = group.name.startsWith("solo_");
                  const displayName = groupDisplayName(group);
                  const acceptedMembers = group.members.filter(m => m.accepted);

                  return (
                    <div
                      key={group._id}
                      className="bg-charcoal/80 ring-1 ring-white/10 p-6 rounded-2xl shadow-xl"
                    >
                      <h2 className="text-xl font-semibold mb-1">{displayName}</h2>
                      {!isSolo && (
                        <p className="text-xs text-white/40 mb-4">
                          {acceptedMembers.length} member{acceptedMembers.length !== 1 ? "s" : ""}
                        </p>
                      )}

                      <div className="space-y-3">
                        {acceptedMembers.map(member => {
                          const hasScore = member.netWorth != null && group.maxPossibleBudget != null && group.maxPossibleBudget > 0;

                          return (
                            <div key={member._id} className="rounded-xl bg-black/30 ring-1 ring-white/10 px-4 py-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{member.user.name}</div>
                                  {!isSolo && (
                                    <div className="text-xs text-white/50">{member.user.email}</div>
                                  )}
                                </div>
                                {member.netWorth != null && (
                                  <div className="text-right">
                                    <div className="text-sm font-semibold text-primary">
                                      ${member.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-white/40">net worth</div>
                                  </div>
                                )}
                              </div>

                              {hasScore && (
                                <ScoreEfficiencyBar
                                  netWorth={member.netWorth}
                                  maxPossibleBudget={group.maxPossibleBudget}
                                />
                              )}
                            </div>
                          );
                        })}

                        {/* Pending members (non-solo groups only) */}
                        {!isSolo && group.members.filter(m => !m.accepted).map(member => (
                          <div
                            key={member._id}
                            className="flex justify-between items-center rounded-xl bg-black/20 ring-1 ring-white/5 px-4 py-3 opacity-50"
                          >
                            <div>
                              <div className="font-medium">{member.user?.name ?? "—"}</div>
                              <div className="text-xs text-white/50">{member.user?.email}</div>
                            </div>
                            <div className="text-xs text-white/40 italic">Pending</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            </div>
    );
}
