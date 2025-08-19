import Login from '../components/logindisplay/Login';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black-bg text-white grid place-items-center px-4 py-10">
          {/* Left: Login Card */}
          <section
            className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl p-6 lg:p-8"
            aria-labelledby="login-title"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="inline-flex items-center rounded-full bg-primary/20 text-primary px-3 py-1 text-xs font-semibold">
                Free to join
              </span>
            </div>
            <Login />
          </section>
          </div>
  );
}