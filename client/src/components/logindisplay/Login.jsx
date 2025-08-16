import { useContext, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../../../context/userContext";

const Login = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [data, setData] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const { email, password } = data;
      const response = await axios.post("/auth/login", { email, password });

      if (response?.data?.error) {
        toast.error(response.data.error);
        setSubmitting(false);
        return;
      }

      const profileRes = await axios.get("/auth/profile");
      setUser(profileRes.data);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={loginUser} className="w-full">
      <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 shadow-xl p-6 sm:p-8">
        <h2 className="font-heading text-2xl text-white mb-6">Login</h2>

        {/* Email */}
        <label htmlFor="email" className="block text-sm text-white/80 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={(e) => setData((s) => ({ ...s, email: e.target.value }))}
          className="w-full rounded-lg bg-charcoal/70 text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/70 px-3 py-2 mb-4"
          autoComplete="email"
          required
        />

        {/* Password */}
        <label htmlFor="password" className="block text-sm text-white/80 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={data.password}
          onChange={(e) => setData((s) => ({ ...s, password: e.target.value }))}
          className="w-full rounded-lg bg-charcoal/70 text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary/70 px-3 py-2"
          autoComplete="current-password"
          required
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex items-center justify-center w-full rounded-lg bg-primary text-black font-semibold px-4 py-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Signing in..." : "Login"}
        </button>

        {/* Helpers */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-white/70">
            Forgot{" "}
            <a href="#" className="text-accent hover:underline">
              password?
            </a>
          </div>
          <div className="text-white/70">
            New to the game?{" "}
            <Link to="/register" className="text-accent hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Login;
