// src/pages/joinGroup.jsx
import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import { Check, X, Users, User } from "lucide-react";
import { motion } from "framer-motion";

export default function JoinGroup() {
  const { user, loading, inviteToken } = useContext(UserContext);
  const navigate = useNavigate();

  // Strings not arrays
  const [groupName, setGroupName] = useState("");
  const [owner, setOwner] = useState("");
  const [fetching, setFetching] = useState(false);

  const isGuest = user && user.isGuest;

  useEffect(() => {
    // wait until we have user and inviteToken and we're not loading
    if (loading || !user || !inviteToken) return;

    let cancelled = false;

    async function getGroupName() {
      setFetching(true);
      try {
        const { data } = await axios.get("/leaderboard/fetchGroupName", {
          params: { inviteToken },
        });
        if (cancelled) return;
        // defensive: ensure strings
        setGroupName(typeof data.groupName === "string" ? data.groupName : String(data.groupName ?? ""));
        // support object owner e.g. { name: "Tom" } or a string
        if (data.owner && typeof data.owner === "object") {
          setOwner(data.owner.name ?? JSON.stringify(data.owner));
        } else {
          setOwner(typeof data.owner === "string" ? data.owner : String(data.owner ?? ""));
        }
        console.log("fetch group data:", data);
      } catch (err) {
        console.error("Failed to fetch group name:", err);
        toast.error("Failed to fetch invitation details.");
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    getGroupName();

    return () => {
      cancelled = true;
    };
  }, [user, loading, inviteToken]);

  const acceptInvitation = async () => {
    if (!user || isGuest) {
      toast.error("You must be signed in (not a guest) to accept invitations.");
      return;
    }
    try {
      await axios.put("/leaderboard/addToGroup", {
        email: user.email,
        token: inviteToken,
      });
      toast.success("You have been added to the group successfully");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Adding to group failed. Please try again");
    }
  };

  const declineInvitation = () => {
    navigate("/dashboard");
    toast.success("You have not been added to the group");
  };

  if (!user) {
    return <p>Loading user...</p>;
  }

  if (loading) {
    return <p>loading</p>;
  }

  if (!loading && user.isGuest) {
    return (
      <div className="min-h-screen bg-black-bg text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-charcoal/70 backdrop-blur rounded-2xl p-6 border border-white/10 shadow-xl text-center">

          <h2 className="font-heading text-2xl sm:text-3xl mb-4">
            Join the Group
          </h2>

          <p className="text-white/80 text-lg mb-6">
            To join this group you must{" "}
            <Link to="/register" className="text-accent underline hover:text-primary">
              sign up
            </Link>
            .  
            If you already have an account, you can{" "}
            <Link to="/login" className="text-accent underline hover:text-primary">
              log in
            </Link>{" "}
            instead.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold"
            >
              Log In
            </Link>

            <Link
              to="/register"
              className="px-5 py-2 rounded-lg bg-primary text-black font-semibold hover:bg-accent transition-colors"
            >
              Sign Up
            </Link>
          </div>

        </div>
      </div>
    );
  }


  return (
  <div className="min-h-screen bg-black-bg text-white flex items-center justify-center px-4">
    <div className="max-w-xl w-full bg-charcoal/70 backdrop-blur rounded-2xl p-8 border border-white/10 shadow-xl">
      
      {/* Title */}
      <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-center mb-4">
        {user ? (
          user.isGuest ? (
            "You've been invited!"
          ) : (
            <>
              <span className="text-accent">{owner}</span> invited you to join{" "}
              <span className="text-accent">{groupName}</span>
            </>
          )
        ) : (
          "Welcome to the site!"
        )}
      </h1>

      {/* Subtitle */}
      <p className="text-center text-white/80 text-lg mb-8">
        Would you like to join this group?
      </p>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={acceptInvitation}
          className="inline-flex items-center justify-center rounded-lg bg-primary text-black font-semibold px-6 py-2 text-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70"
        >
          Yes
        </button>

        <button
          onClick={declineInvitation}
          className="inline-flex items-center justify-center rounded-lg bg-white/10 text-white font-semibold px-6 py-2 text-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70"
        >
          No
        </button>
      </div>

    </div>
  </div>
);

}
