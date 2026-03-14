import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import client from "../api/client";
import ThemeToggle from "../components/layout/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await client.post("/auth/login", { email, password });
      const { access_token } = res.data;
      const meRes = await client.get("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setAuth(access_token, meRes.data);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="glass-card w-full max-w-[400px] p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm">
            IT
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              InfraTrace
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>
              Audit Platform
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-[11px] font-medium uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-glass-border text-[13px] outline-none focus:border-accent transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
              placeholder="admin@infratrace.dev"
            />
          </div>

          <div>
            <label
              className="block text-[11px] font-medium uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-glass-border text-[13px] outline-none focus:border-accent transition-colors"
              style={{
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="text-neon-red text-[12px] bg-neon-red-dim px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          Decision Audit Trail for Infrastructure Projects
        </p>
      </div>
    </div>
  );
}
