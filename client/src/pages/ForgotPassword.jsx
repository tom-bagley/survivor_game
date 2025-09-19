import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = email.trim();

    if (!value) return toast.error("Please enter your email.");
    // (Optional) tiny email sanity check
    if (!/^\S+@\S+\.\S+$/.test(value)) return toast.error("Enter a valid email.");

    try {
      setSubmitting(true);
      const res = await axios.post("/auth/forgot-password", { email: value });
      if (res.data?.error) return toast.error(res.data.error);

      setSent(true);
      toast.success("Reset instructions sent (check your inbox).");
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error("Couldn’t send reset email. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black-bg text-white">
      <div className="mx-auto max-w-lg px-5 sm:px-8 lg:px-10 py-12">
        <header className="mb-8 text-center">
          <h1 className="font-heading text-4xl lg:text-5xl tracking-tight">
            Forgot <span className="text-accent">Password</span>
          </h1>
          <p className="mt-3 text-white/70">
            Enter your email and we’ll send you instructions to reset your password.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl p-6"
        >
          <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg bg-black/40 border border-white/20 text-white px-4 py-2
                       focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="mt-4 w-full rounded-lg bg-primary text-black font-semibold py-2
                       hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary
                       disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send Reset Instructions"}
          </button>

          {sent && (
            <p className="mt-3 text-sm text-white/70">
              If an account exists for that email, you’ll receive a message with a reset link. This may take a few minutes.
            </p>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-white/70">
          Remembered it?{" "}
          <Link to="/login" className="text-primary hover:text-accent font-semibold">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
