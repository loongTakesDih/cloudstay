import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import MarketplaceHeader from "../../components/MarketplaceHeader";
import { useAuth } from "../../context/useAuth";

function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle, register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setError("");
      setLoading(true);

      try {
        const redirectPath = await loginWithGoogle(credential);
        navigate(redirectPath);
      } catch (err) {
        setError(err.response?.data?.message || "Google sign-up failed.");
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, navigate],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const redirectPath = await register(username, email, password);
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
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
            Create your CloudStay account
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Book unique stays first. Start hosting whenever you're ready.
          </p>
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">
              One account, two ways to travel
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Everyone starts as a guest. Hosting is an added capability you can
              turn on from your dashboard later.
            </p>
          </div>
        </section>

        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-normal text-slate-950">
              Sign up
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Join CloudStay to save trips, book homes, and unlock hosting
              later.
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
                Username
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cloudguest"
                required
              />
            </div>

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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold uppercase text-slate-400">
              or
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleSignInButton
            disabled={loading}
            onCredential={handleGoogleCredential}
            onError={setError}
            text="signup_with"
          />

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-rose-500">
              Log in
            </Link>
          </p>
        </section>
      </div>
      </main>
    </div>
  );
}

export default Register;
