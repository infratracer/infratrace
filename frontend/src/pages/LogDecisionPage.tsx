import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createDecision } from "../api/decisions";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import TextArea from "../components/ui/TextArea";
import Select from "../components/ui/Select";
import { DECISION_TYPES, RISK_LEVELS } from "../utils/constants";
import { useAuthStore } from "../store/authStore";
import { Check, Hash, Link2, Shield } from "lucide-react";

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

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!id) return;
    setError("");

    try {
      setPhase("hashing");
      await new Promise((r) => setTimeout(r, 800));

      setPhase("chaining");
      await new Promise((r) => setTimeout(r, 600));

      setPhase("anchoring");
      const decision = await createDecision(id, data as any);

      setPhase("done");
      setNewDecisionId(decision.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create decision");
      setPhase("idle");
    }
  };

  if (phase !== "idle" && phase !== "done") {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <GlassCard padding="lg" className="text-center max-w-sm w-full">
          <div className="space-y-4">
            <StepIndicator phase={phase} />
          </div>
        </GlassCard>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <GlassCard padding="lg" glow="green" className="text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-full bg-neon-green-dim flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-neon-green" />
          </div>
          <h2 className="text-[17px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Decision Recorded
          </h2>
          <p className="text-[12px] mb-4" style={{ color: "var(--text-secondary)" }}>
            Hash chain updated and blockchain anchoring initiated.
          </p>
          <Button onClick={() => navigate(`/project/${id}/decision/${newDecisionId}`)}>
            View Decision
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <GlassCard padding="lg">
          <h2 className="text-[15px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Decision Details
          </h2>

          <div className="space-y-4">
            <Select
              label="Decision Type"
              options={DECISION_TYPES}
              error={errors.decision_type?.message}
              {...register("decision_type")}
            />

            <Input
              label="Title"
              placeholder="Brief, descriptive title"
              error={errors.title?.message}
              {...register("title")}
            />

            <TextArea
              label="Description"
              placeholder="Detailed description of the decision..."
              error={errors.description?.message}
              {...register("description")}
            />

            <TextArea
              label="Justification"
              placeholder="Why this decision is being made..."
              error={errors.justification?.message}
              {...register("justification")}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cost Impact ($)"
                type="number"
                placeholder="0"
                error={errors.cost_impact?.message}
                {...register("cost_impact")}
              />

              <Select
                label="Risk Level"
                options={RISK_LEVELS}
                error={errors.risk_level?.message}
                {...register("risk_level")}
              />
            </div>

            <Input
              label="Approved By"
              placeholder="Name of approver"
              error={errors.approved_by?.message}
              {...register("approved_by")}
            />
          </div>
        </GlassCard>

        {error && (
          <div className="text-neon-red text-[12px] bg-neon-red-dim px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full">
          Record Decision
        </Button>
      </form>
    </div>
  );
}

function StepIndicator({ phase }: { phase: SubmitPhase }) {
  const steps = [
    { key: "hashing", icon: Hash, label: "Computing hash..." },
    { key: "chaining", icon: Link2, label: "Linking to chain..." },
    { key: "anchoring", icon: Shield, label: "Anchoring on Polygon..." },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const isActive = step.key === phase;
        const isPast = steps.findIndex((s) => s.key === phase) > steps.findIndex((s) => s.key === step.key);

        return (
          <div
            key={step.key}
            className={`flex items-center gap-3 transition-opacity duration-300 ${
              isActive ? "opacity-100" : isPast ? "opacity-40" : "opacity-20"
            }`}
          >
            <step.icon
              size={18}
              className={isActive ? "text-accent animate-pulse-glow" : ""}
              style={{ color: isPast ? "#00FF88" : isActive ? "#4A9EFF" : "var(--text-muted)" }}
            />
            <span
              className={`text-[13px] font-medium ${isActive ? "font-mono" : ""}`}
              style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              {isPast ? step.label.replace("...", " ✓") : step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
