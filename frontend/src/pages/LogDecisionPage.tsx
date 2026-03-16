import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createDecision } from "../api/decisions";
import { DECISION_TYPES, RISK_LEVELS } from "../utils/constants";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../hooks/useTheme";
import { useToastStore } from "../store/toastStore";

const decisionSchema = z.object({
  decision_type: z.string().min(1, "Required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  justification: z.string().min(20, "Justification must be at least 20 characters"),
  cost_impact: z.number().default(0),
  risk_level: z.string().optional(),
  approved_by: z.string().min(1, "Required"),
});

type SubmitPhase = "idle" | "hashing" | "chaining" | "anchoring" | "done";

export default function LogDecisionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [newDecisionId, setNewDecisionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const t = useTheme();
  const addToast = useToastStore((s) => s.addToast);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      decision_type: "",
      title: "",
      description: "",
      justification: "",
      approved_by: user?.full_name ?? "",
      cost_impact: 0,
      risk_level: "",
    },
  });

  const onSubmit = async (data: { decision_type: string; title: string; description: string; justification: string; cost_impact?: number; risk_level?: string; approved_by: string }) => {
    if (!id) return;
    setError("");

    try {
      setPhase("hashing");
      // Backend computes SHA-256 hash, links to chain, and anchors on Polygon
      const decision = await createDecision(id, data);

      setPhase("chaining");
      await new Promise((r) => setTimeout(r, 400));

      setPhase("anchoring");
      await new Promise((r) => setTimeout(r, 400));

      setPhase("done");
      setNewDecisionId(decision.id);
      addToast("Decision recorded successfully!", "success");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create decision");
      addToast("Failed to create decision.", "error");
      setPhase("idle");
    }
  };

  const glassCard = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 16,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: t.bgInput,
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 10,
    color: t.textPrimary,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  const overline = {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: t.textMuted,
  };

  const buttonStyle = {
    padding: "10px 20px",
    background: t.accent,
    border: "none",
    borderRadius: 10,
    color: "#FFF",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: t.btnShadow,
  };

  if (phase !== "idle" && phase !== "done") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ ...glassCard, textAlign: "center", maxWidth: 384, width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <StepIndicator phase={phase} />
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ ...glassCard, textAlign: "center", maxWidth: 384, width: "100%", boxShadow: `0 0 20px ${t.neonGreenDim}` }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: t.neonGreenDim,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <span style={{ fontSize: 24, color: t.neonGreen }}>{"✓"}</span>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, color: t.textPrimary }}>
            Decision Recorded
          </h2>
          <p style={{ fontSize: 12, marginBottom: 16, color: t.textSecondary }}>
            Hash chain updated and blockchain anchoring initiated.
          </p>
          <button
            style={buttonStyle}
            onClick={() => navigate(`/project/${id}/decision/${newDecisionId}`)}
          >
            View Decision
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 672 }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={glassCard}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: t.textPrimary }}>
            Decision Details
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Decision Type */}
            <div>
              <label style={{ ...overline, display: "block", marginBottom: 6 }}>Decision Type</label>
              <select
                {...register("decision_type")}
                style={{ ...inputStyle, appearance: "auto" as const }}
              >
                <option value="">Select...</option>
                {DECISION_TYPES.map((opt) => (
                  <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
                    {typeof opt === "string" ? opt : opt.label}
                  </option>
                ))}
              </select>
              {errors.decision_type?.message && (
                <p style={{ fontSize: 11, color: t.neonRed, marginTop: 4 }}>{errors.decision_type.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label style={{ ...overline, display: "block", marginBottom: 6 }}>Title</label>
              <input
                {...register("title")}
                placeholder="Brief, descriptive title"
                style={inputStyle}
              />
              {errors.title?.message && (
                <p style={{ fontSize: 11, color: t.neonRed, marginTop: 4 }}>{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={{ ...overline, display: "block", marginBottom: 6 }}>Description</label>
              <textarea
                {...register("description")}
                placeholder="Detailed description of the decision..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
              {errors.description?.message && (
                <p style={{ fontSize: 11, color: t.neonRed, marginTop: 4 }}>{errors.description.message}</p>
              )}
            </div>

            {/* Justification */}
            <div>
              <label style={{ ...overline, display: "block", marginBottom: 6 }}>Justification</label>
              <textarea
                {...register("justification")}
                placeholder="Why this decision is being made..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
              {errors.justification?.message && (
                <p style={{ fontSize: 11, color: t.neonRed, marginTop: 4 }}>{errors.justification.message}</p>
              )}
            </div>

            {/* Cost Impact + Risk Level */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ ...overline, display: "block", marginBottom: 6 }}>Cost Impact ($)</label>
                <input
                  type="number"
                  {...register("cost_impact")}
                  placeholder="0"
                  style={inputStyle}
                />
                {errors.cost_impact?.message && (
                  <p style={{ fontSize: 11, color: t.neonRed, marginTop: 4 }}>{errors.cost_impact.message}</p>
                )}
              </div>

              <div>
                <label style={{ ...overline, display: "block", marginBottom: 6 }}>Risk Level</label>
                <select
                  {...register("risk_level")}
                  style={{ ...inputStyle, appearance: "auto" as const }}
                >
                  <option value="">Select...</option>
                  {RISK_LEVELS.map((opt) => (
                    <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
                      {typeof opt === "string" ? opt : opt.label}
                    </option>
                  ))}
                </select>
                {errors.risk_level?.message && (
                  <p style={{ fontSize: 11, color: t.neonRed, marginTop: 4 }}>{errors.risk_level.message}</p>
                )}
              </div>
            </div>

            {/* Approved By */}
            <div>
              <label style={{ ...overline, display: "block", marginBottom: 6 }}>Approved By</label>
              <input
                {...register("approved_by")}
                placeholder="Name of approver"
                style={inputStyle}
              />
              {errors.approved_by?.message && (
                <p style={{ fontSize: 11, color: t.neonRed, marginTop: 4 }}>{errors.approved_by.message}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: t.neonRed,
              fontSize: 12,
              background: t.neonRedDim,
              padding: "10px 16px",
              borderRadius: 12,
            }}
          >
            {error}
          </div>
        )}

        <button type="submit" style={{ ...buttonStyle, width: "100%", padding: "14px 20px" }}>
          Record Decision
        </button>
      </form>
    </div>
  );
}

function StepIndicator({ phase }: { phase: SubmitPhase }) {
  const t = useTheme();

  const steps = [
    { key: "hashing", icon: "#", label: "Computing hash..." },
    { key: "chaining", icon: "\u26D3", label: "Linking to chain..." },
    { key: "anchoring", icon: "\uD83D\uDEE1", label: "Anchoring on Polygon..." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {steps.map((step) => {
        const isActive = step.key === phase;
        const isPast = steps.findIndex((s) => s.key === phase) > steps.findIndex((s) => s.key === step.key);

        return (
          <div
            key={step.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: isActive ? 1 : isPast ? 0.4 : 0.2,
              transition: "opacity 300ms",
            }}
          >
            <span
              style={{
                fontSize: 18,
                color: isPast ? t.neonGreen : isActive ? t.accent : t.textMuted,
              }}
            >
              {step.icon}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                fontFamily: isActive ? "monospace" : "inherit",
                color: isActive ? t.textPrimary : t.textMuted,
              }}
            >
              {isPast ? step.label.replace("...", " \u2713") : step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
