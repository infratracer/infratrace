import client from "./client";
import type { Project } from "../types";

export async function getProjects(): Promise<Project[]> {
  const res = await client.get("/projects");
  return res.data;
}

export async function getProject(id: string): Promise<Project> {
  const res = await client.get(`/projects/${id}`);
  return res.data;
}

export async function createProject(data: {
  name: string;
  description: string;
  budget: number;
  currency?: string;
}): Promise<Project> {
  const res = await client.post("/projects", data);
  return res.data;
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, "name" | "description" | "status" | "risk_level">>
): Promise<Project> {
  const res = await client.put(`/projects/${id}`, data);
  return res.data;
}
