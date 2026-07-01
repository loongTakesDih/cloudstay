import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MarketplaceHeader from "../../components/MarketplaceHeader";
import { useAuth } from "../../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const redirectPath = await login(email, password);
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <MarketplaceHeader />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-8.75rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-500">
            CloudStay
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
            Welcome back to CloudStay
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Continue your trips, bookings, and hosting journey from one calm,
            beautifully organized place.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              Curated stays
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              Simple booking
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              Hosting ready
            </div>
          </div>
        </section>

        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-normal text-slate-950">
              Log in
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Access trips, saved stays, and hosting tools with your CloudStay
              account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password123!"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to CloudStay?{" "}
            <Link to="/register" className="font-semibold text-rose-500">
              Create an account
            </Link>
          </p>
        </section>
      </div>
      </main>
    </div>
  );
}

export default Login;
