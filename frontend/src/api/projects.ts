import client from "./client";
import type { Project } from "../types";

function normalizeProject(p: any): Project {
  const budget = p.original_budget ?? p.budget ?? 0;
  const spent = p.current_budget ?? p.spent ?? 0;
  const drift = budget > 0 ? ((spent - budget) / budget) * 100 : 0;
  const risk_level = drift > 15 ? "critical" : drift > 5 ? "medium" : "low";
  return { ...p, budget, spent, risk_level };
}

export async function getProjects(): Promise<Project[]> {
  const res = await client.get("/projects");
  return res.data.map(normalizeProject);
}

export async function getProject(id: string): Promise<Project> {
  const res = await client.get(`/projects/${id}`);
  return normalizeProject(res.data);
}

export async function createProject(data: {
  name: string;
  description: string;
  original_budget: number;
}): Promise<Project> {
  const res = await client.post("/projects", data);
  return normalizeProject(res.data);
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, "name" | "description" | "status">>
): Promise<Project> {
  const res = await client.put(`/projects/${id}`, data);
  return normalizeProject(res.data);
}
