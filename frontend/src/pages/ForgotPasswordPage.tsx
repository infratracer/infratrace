import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";
import { useTheme } from "../hooks/useTheme";
import client from "../api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const toggle = useThemeStore((s) => s.toggle);
  const t = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await client.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
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

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: t.mode === "dark"
          ? "rgba(44, 44, 46, 0.32)"
          : "rgba(255, 255, 255, 0.42)",
        backdropFilter: "blur(80px) saturate(180%)",
        WebkitBackdropFilter: "blur(80px) saturate(180%)",
        border: `0.5px solid ${t.glassBorder}`,
        borderRadius: 22,
        boxShadow: t.glassShadow,
        padding: "44px 36px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Top specular highlight */}
        <div style={{
          position: "absolute", top: 0, left: 16, right: 16, height: 0.5,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,${t.mode === "dark" ? "0.06" : "0.4"}), transparent)`,
          borderRadius: "22px 22px 0 0",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 40 }}>
          <img
            src={t.mode === "dark" ? "/logo-dark.png" : "/logo-light.png"}
            alt="InfraTrace"
            style={{ height: 64, width: "auto", objectFit: "contain" }}
          />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: t.textPrimary, textAlign: "center", margin: "0 0 8px" }}>
          Forgot Password
        </h2>
        <p style={{ fontSize: 13, color: t.textSecondary, textAlign: "center", margin: "0 0 28px", lineHeight: 1.5 }}>
          Enter your email and we'll send you a reset link.
        </p>

        {success ? (
          <div style={{
            padding: "14px 16px",
            background: t.neonGreenDim,
            border: `1px solid ${t.neonGreen}25`,
            borderRadius: 12,
            color: t.neonGreen,
            fontSize: 13,
            textAlign: "center",
            lineHeight: 1.5,
          }}>
            If that email exists, a reset link has been sent.
          </div>
        ) : (
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
                placeholder="you@example.com"
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
                  Sending...
                </span>
              ) : "Send Reset Link"}
            </button>
          </form>
        )}

        {/* Back to login */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button onClick={() => navigate("/login")} style={{
            background: "none", border: "none", color: t.accent,
            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>
            Back to login
          </button>
        </div>

        <div style={{ marginTop: 28, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.6, margin: 0 }}>
            Blockchain-verified decision audit trail
          </p>
          <p style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
            Track decisions &middot; Monitor sensors &middot; Verify integrity
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${t.textMuted}; opacity: 0.6; }
      `}</style>
    </div>
  );
}
