import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useTheme } from "../hooks/useTheme";
import client from "../api/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const toggle = useThemeStore((s) => s.toggle);
  const t = useTheme();

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
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      background: t.bg,
      backgroundImage: t.bgGradientMesh,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      transition: "background 0.5s ease",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow orbs */}
      <div style={{
        position: "absolute",
        width: 400, height: 400,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${t.accent}08 0%, transparent 70%)`,
        top: "10%", left: "15%",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 350, height: 350,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${t.teal}06 0%, transparent 70%)`,
        bottom: "15%", right: "20%",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      {/* Theme toggle */}
      <div style={{ position: "fixed", top: 24, right: 24, zIndex: 10 }}>
        <button onClick={toggle} style={{
          width: 44, height: 24, borderRadius: 12,
          border: `1px solid ${t.glassBorder}`,
          background: t.bgCard,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          cursor: "pointer",
          position: "relative",
          display: "flex", alignItems: "center", padding: "0 3px",
          transition: "all 0.3s ease",
          boxShadow: t.glassShadow,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            background: t.mode === "dark" ? t.accent : t.neonAmber,
            transform: t.mode === "dark" ? "translateX(0)" : "translateX(18px)",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 12px ${t.mode === "dark" ? t.accent + "50" : t.neonAmber + "50"}`,
          }} />
        </button>
      </div>

      {/* Login card — iOS Liquid Glass */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: t.mode === "dark"
          ? "rgba(18, 28, 48, 0.35)"
          : "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(80px) saturate(200%) brightness(1.05)",
        WebkitBackdropFilter: "blur(80px) saturate(200%) brightness(1.05)",
        border: `1px solid ${t.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"}`,
        borderRadius: 28,
        boxShadow: t.mode === "dark"
          ? "0 12px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(255,255,255,0.02)"
          : "0 12px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(255,255,255,0.4)",
        padding: "48px 40px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Top specular highlight */}
        <div style={{
          position: "absolute", top: 0, left: 20, right: 20, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,${t.mode === "dark" ? "0.08" : "0.5"}), transparent)`,
          borderRadius: "28px 28px 0 0",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 40 }}>
          <img
            src={t.mode === "dark" ? "/logo-dark.png" : "/logo-light.png"}
            alt="InfraTrace"
            style={{ height: 64, width: "auto", objectFit: "contain" }}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: focusedField === "email" ? t.accent : t.textMuted,
              marginBottom: 8, transition: "color 0.2s",
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@infratrace.dev"
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={{
                width: "100%",
                padding: "13px 16px",
                background: t.bgInput,
                border: `1px solid ${focusedField === "email" ? t.accent + "40" : t.glassBorder}`,
                borderRadius: 12,
                color: t.textPrimary,
                fontSize: 14,
                outline: "none",
                transition: "all 0.25s ease",
                boxSizing: "border-box",
                boxShadow: focusedField === "email" ? `0 0 0 3px ${t.accent}12` : "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: focusedField === "password" ? t.accent : t.textMuted,
              marginBottom: 8, transition: "color 0.2s",
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              style={{
                width: "100%",
                padding: "13px 16px",
                background: t.bgInput,
                border: `1px solid ${focusedField === "password" ? t.accent + "40" : t.glassBorder}`,
                borderRadius: 12,
                color: t.textPrimary,
                fontSize: 14,
                outline: "none",
                transition: "all 0.25s ease",
                boxSizing: "border-box",
                boxShadow: focusedField === "password" ? `0 0 0 3px ${t.accent}12` : "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 16px",
              background: t.neonRedDim,
              border: `1px solid ${t.neonRed}25`,
              borderRadius: 12,
              color: t.neonRed,
              fontSize: 13,
              marginBottom: 20,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>{"\u26A0"}</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? t.accent + "80" : `linear-gradient(135deg, ${t.accent}, ${t.teal})`,
              border: "none",
              borderRadius: 16,
              color: "#FFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: loading ? "none" : t.btnShadow,
              letterSpacing: "0.02em",
              fontFamily: "inherit",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{
                  width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#FFF", borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  display: "inline-block",
                }} />
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        <p style={{
          textAlign: "center",
          fontSize: 11,
          color: t.textMuted,
          marginTop: 28,
          marginBottom: 0,
          letterSpacing: "0.02em",
          lineHeight: 1.5,
        }}>
          Decision Audit Trail for Infrastructure Projects
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${t.textMuted}; opacity: 0.6; }
      `}</style>
    </div>
  );
}
