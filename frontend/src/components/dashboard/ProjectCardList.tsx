import { useNavigate } from "react-router-dom";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import ProgressBar from "../ui/ProgressBar";
import { formatCurrency, formatDate } from "../../utils/format";
import { riskBadgeVariant } from "../../utils/risk";
import { useProjectStore } from "../../store/projectStore";
import type { Project } from "../../types";

interface ProjectCardListProps {
  projects: Project[];
}

export default function ProjectCardList({ projects }: ProjectCardListProps) {
  const navigate = useNavigate();
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const handleClick = (project: Project) => {
    setActiveProject(project.id);
    navigate(`/project/${project.id}/timeline`);
  };

  return (
    <div className="space-y-3">
      <h2
        className="text-[9px] uppercase tracking-widest font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        Projects
      </h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const spentPct = p.budget > 0 ? (p.spent / p.budget) * 100 : 0;
          return (
            <GlassCard
              key={p.id}
              hover
              onClick={() => handleClick(p)}
              padding="md"
            >
              <div className="flex items-start justify-between mb-3">
                <h3
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {p.name}
                </h3>
                <Badge variant={riskBadgeVariant(p.risk_level as import("../../types").RiskLevel)}>
                  {p.risk_level}
                </Badge>
              </div>

              <p
                className="text-[12px] line-clamp-2 mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
                {p.description}
              </p>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  {formatCurrency(p.spent)} / {formatCurrency(p.budget)}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {spentPct.toFixed(0)}%
                </span>
              </div>
              <ProgressBar value={spentPct} />

              <p className="text-[10px] mt-3" style={{ color: "var(--text-muted)" }}>
                Created {formatDate(p.created_at)}
              </p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
