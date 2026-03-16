import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/authStore";

interface WelcomeBannerProps {
  onCreateProject: () => void;
}

export default function WelcomeBanner({ onCreateProject }: WelcomeBannerProps) {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);

  const glass: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(60px) saturate(150%)",
    WebkitBackdropFilter: "blur(60px) saturate(150%)",
    border: `0.5px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: t.glassShadow,
  };

  const steps = [
    { num: 1, text: "Create a project", action: true },
    { num: 2, text: "Configure sensors for your project", action: false },
    { num: 3, text: "Add team members", action: false },
    { num: 4, text: "Start logging decisions", action: false },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div style={{ ...glass, maxWidth: 460, width: "100%", padding: "36px 32px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary, margin: "0 0 6px" }}>
          Welcome to InfraTrace{user?.full_name ? `, ${user.full_name}` : ""}!
        </h2>
        <p style={{ fontSize: 13, color: t.textSecondary, margin: "0 0 24px", lineHeight: 1.5 }}>
          Here's how to get started:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((step) => (
            <div key={step.num} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: t.accentDim,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: t.accent,
                flexShrink: 0,
              }}>
                {step.num}
              </div>
              <span style={{ fontSize: 14, color: t.textPrimary, flex: 1 }}>
                {step.text}
              </span>
              {step.action && (
                <button
                  onClick={onCreateProject}
                  style={{
                    padding: "7px 16px",
                    background: `linear-gradient(135deg, ${t.accent}, ${t.teal})`,
                    border: "none",
                    borderRadius: 10,
                    color: "#FFF",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: t.btnShadow,
                    whiteSpace: "nowrap",
                  }}
                >
                  Create Project
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24,
          padding: "12px 16px",
          background: t.bgInput,
          borderRadius: 12,
          border: `0.5px solid ${t.glassBorder}`,
        }}>
          <p style={{ fontSize: 12, color: t.textMuted, margin: 0, lineHeight: 1.5 }}>
            Need help? Check our documentation or reach out to your team admin.
          </p>
        </div>
      </div>
    </div>
  );
}
