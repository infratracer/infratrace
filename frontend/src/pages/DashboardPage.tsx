import { useEffect, useState } from "react";
import { getProjects } from "../api/projects";
import { getDecisions } from "../api/decisions";
import { useProjectStore } from "../store/projectStore";
import { useSensorStore } from "../store/sensorStore";
import { useSensorSocket } from "../hooks/useSensorSocket";
import AlertStrip from "../components/dashboard/AlertStrip";
import MetricsRow from "../components/dashboard/MetricsRow";
import ProjectCardList from "../components/dashboard/ProjectCardList";
import SensorMiniGrid from "../components/dashboard/SensorMiniGrid";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import CostTrajectoryChart from "../components/dashboard/CostTrajectoryChart";
import Spinner from "../components/ui/Spinner";
import type { Project, Decision } from "../types";

export default function DashboardPage() {
  const [projects, setProjectsList] = useState<Project[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const setProjects = useProjectStore((s) => s.setProjects);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const latest = useSensorStore((s) => s.latest);
  const anomalies = useSensorStore((s) => s.anomalies);
  const updateReading = useSensorStore((s) => s.updateReading);

  useEffect(() => {
    (async () => {
      try {
        const projs = await getProjects();
        setProjectsList(projs);
        setProjects(projs);

        if (projs.length > 0) {
          const activeId = activeProjectId || projs[0].id;
          setActiveProject(activeId);

          const decs = await getDecisions(activeId);
          setDecisions(decs);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useSensorSocket(activeProjectId || undefined, updateReading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} className="text-accent" />
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="space-y-6 animate-fade-in">
      <AlertStrip anomalies={anomalies} />
      <MetricsRow
        projects={projects}
        anomalyCount={anomalies.length}
        decisionCount={decisions.length}
      />
      {activeProject && (
        <CostTrajectoryChart decisions={decisions} budget={activeProject.budget} />
      )}
      <SensorMiniGrid latest={latest} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ProjectCardList projects={projects} />
        <ActivityFeed decisions={decisions} />
      </div>
    </div>
  );
}
