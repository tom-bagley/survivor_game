import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";

export default function Register() {
  const { user,setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // useEffect(() => {
  //   console.log(user)
  // }, [user]);

  const onChange = (field) => (e) => setData((s) => ({ ...s, [field]: e.target.value.trimStart() }));

  const registerUser = async (e) => {
    e.preventDefault();
    const { name, email, password } = data;
    console.log(user)

    // Tiny client-side checks
    if (!name || !email || !password) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare guest data if available
      let guestData = {};
      
        guestData = {
          portfolio: user.portfolio,
          budget: user.budget,
          netWorth: user.netWorth,
          last_seen_episode_id: user.last_seen_episode_id,
          prevNetWorth: user.prevNetWorth,
        };
      
      console.log(guestData)
      const portfolio = guestData.portfolio
      const budget = guestData.budget

      // Send registration + guest state to backend
      const res = await axios.post("/auth/register", {
        name,
        email,
        password,
        portfolio,
        budget
      });

      if (res.data?.error) {
        toast.error(res.data.error);
        return;
      }

      toast.success("Register successful. Welcome!");

      // Replace guest in context with real user returned by backend
      const profileRes = await axios.get("/auth/profile");
      setUser(profileRes.data);

      // Clear guest storage
      if (user?.isGuest) {
        sessionStorage.removeItem("guest_user");

        // Clear user from context before navigating
        if (typeof replaceUser === "function") replaceUser(null);
        else if (typeof setUser === "function") setUser(null);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-black-bg text-white grid place-items-center px-4 py-10">
      <form
        onSubmit={registerUser}
        className="w-full max-w-md rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-6 shadow-xl"
      >
        <h2 className="font-heading text-2xl tracking-tight">Create your account</h2>
        <p className="text-white/70 text-sm mt-1">Join the Survivor Stock Game.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-white/80 mb-1">Username</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your username"
              value={data.name}
              onChange={onChange("name")}
              className="w-full rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-primary/70"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-white/80 mb-1">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={data.email}
              onChange={onChange("email")}
              className="w-full rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-primary/70"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white/80 mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="At least 6 characters"
                value={data.password}
                onChange={onChange("password")}
                className="w-full rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2
                           pr-12 focus:outline-none focus:ring-2 focus:ring-primary/70"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded-md text-xs text-white/80 hover:bg-white/10"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-primary text-black
                     font-semibold px-4 py-2.5 hover:bg-accent transition-colors
                     focus:outline-none focus:ring-2 focus:ring-primary/70 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-white/70">
          Already have an account?{" "}
          <a href="/login" className="text-accent font-semibold hover:underline">Log in</a>
        </p>
      </form>
    </div>
  );
}

