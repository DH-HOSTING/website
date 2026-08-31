"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../Topbar";

const VALID_USERNAME = "Ducker";
const VALID_PASSWORD = "bertiem2011";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      router.push("/dashboard");
      return;
    }

    setError("Incorrect username or password.");
    setSubmitting(false);
  };

  return (
    <main className="relative min-h-screen bg-black text-white">
      {/* Same continuous grid background as the homepage */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
        }}
      />

      <Topbar />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="w-full max-w-sm rounded-2xl border border-violet-700/50 bg-violet-900/10 p-8 shadow-lg shadow-black/40">
          <h1 className="text-2xl font-bold text-center">Log In</h1>
          <p className="mt-2 text-sm text-white/60 text-center">
            Enter your details to access your dashboard.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-white/70 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-violet-700/50 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors duration-200 focus:border-violet-500"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/70 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-violet-700/50 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors duration-200 focus:border-violet-500"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-lg bg-violet-800 px-6 py-2.5 font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform duration-300 ease-out hover:scale-[1.02] hover:bg-violet-700 disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}