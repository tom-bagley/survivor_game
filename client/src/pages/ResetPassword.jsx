import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams(); 

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill out both fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      console.log(token)
      const res = await axios.post(`/auth/reset-password/${token}`, {
        password,
      });

      if (res.data?.error) {
        toast.error(res.data.error);
        return;
      }
      toast.success("Password has been reset.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black-bg text-white">
      <div className="mx-auto max-w-lg px-5 sm:px-8 lg:px-10 py-12">
        <header className="mb-8 text-center">
          <h1 className="font-heading text-4xl lg:text-5xl tracking-tight">
            Reset <span className="text-accent">Password</span>
          </h1>
          <p className="mt-3 text-white/70">
            Enter your new password below.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl p-6"
        >
          <label className="block text-sm font-medium text-white/80 mb-2" htmlFor="password">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full rounded-lg bg-black/40 border border-white/20 text-white px-4 py-2
                       focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label className="block text-sm font-medium text-white/80 mt-4 mb-2" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full rounded-lg bg-black/40 border border-white/20 text-white px-4 py-2
                       focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-primary text-black font-semibold py-2
                       hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary
                       disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
